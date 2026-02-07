import express from "express"
import dotenv from "dotenv"
import { middleware, Client } from "@line/bot-sdk"

// 🔥 แก้: import เพิ่ม getTodayTotal
import { appendToSheet, getTodayTotal } from "./googleSheet.js"

dotenv.config()

const app = express()

const lineConfig = {
  // 🔥 แก้: ใช้ชื่อ ENV ให้ตรง
  CHANNEL_SECRET: process.env.CHANNEL_SECRET,
  CHANNEL_ACCESS_TOKEN: process.env.CHANNEL_ACCESS_TOKEN
}

const client = new Client(lineConfig)

// webhook
app.post("/webhook", middleware(lineConfig), async (req, res) => {
  try {
    const event = req.body.events[0]

    if (event.type !== "message" || event.message.type !== "text") {
      return res.status(200).end()
    }

    const text = event.message.text.trim()

    // parse: "ข้าวหมูกรอบ 60"
    const parts = text.split(" ")
    const price = Number(parts[parts.length - 1])
    const item = parts.slice(0, -1).join(" ")

    if (!item || isNaN(price)) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "❌ รูปแบบไม่ถูกต้อง\nตัวอย่าง: ข้าวหมูกรอบ 60"
      })
      return res.status(200).end()
    }

    const now = new Date()
    const date = now.toLocaleDateString("th-TH")
    const time = now.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit"
    })

    // 🔥 แก้: บันทึก Google Sheet
    await appendToSheet({ date, time, item, price })

    // 🔥 แก้: รวมยอดวันนี้
    const todayTotal = await getTodayTotal(date)

    // 🔥 แก้: reply ใหม่ มีรวมวันนี้
    await client.replyMessage(event.replyToken, {
      type: "text",
      text:
`📅 วันที่: ${date}
⏰ เวลา: ${time}
🍽 รายการ: ${item}
💸 ราคา: ${price} บาท
📊 รวมวันนี้: ${todayTotal} บาท`
    })

    res.status(200).end()
  } catch (err) {
    console.error("❌ webhook error:", err)
    res.status(500).end()
  }
})

// health check
app.get("/", (req, res) => {
  res.send("LINE Bot is running 🚀")
})

// 🔥 แก้: ใช้ PORT จาก Render
const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT)
})
