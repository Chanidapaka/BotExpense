import express from "express"
import dotenv from "dotenv"
import { middleware, Client } from "@line/bot-sdk"
import {
  addExpense,
  getTodayTotal,
  deleteLastExpense
} from "./expenseStore.js"

dotenv.config()

const app = express()

const lineConfig = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
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

    // ===============================
    // 🔴 คำสั่งลบล่าสุด
    // ===============================
    if (text === "ลบล่าสุด") {
      const now = new Date()
      const date = now.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok"
      })

      const removed = deleteLastExpense(date)

      if (!removed) {
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: "❌ วันนี้ยังไม่มีรายการให้ลบ"
        })
        return res.status(200).end()
      }

      const total = getTodayTotal(date)

      await client.replyMessage(event.replyToken, {
        type: "text",
        text:
`🗑 ลบรายการล่าสุดแล้ว
🍽 รายการ: ${removed.item}
💸 ราคา: ${removed.price} บาท
📊 รวมวันนี้: ${total} บาท`
      })

      return res.status(200).end()
    }

    // ===============================
    // 🟢 เพิ่มค่าใช้จ่าย
    // ===============================

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

    const date = now.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok"
    })

    const time = now.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit"
    })

    // บันทึกลง JSON
    addExpense({ date, time, item, price })

    // รวมยอดวันนี้
    const todayTotal = getTodayTotal(date)

    // ตอบกลับ LINE
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

const PORT = process.env.PORT || 10000
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT)
})
