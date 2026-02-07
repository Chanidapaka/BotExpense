import express from "express"
import dotenv from "dotenv"
import { middleware, Client } from "@line/bot-sdk"
import { appendToSheet } from "./googlesheet.js"

dotenv.config()

const app = express()

const lineConfig = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
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
    console.log("📩 text:", text)

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

    // save to google sheet
    await appendToSheet({ date, time, item, price })
    console.log("✅ saved to google sheet")

    // reply LINE
    await client.replyMessage(event.replyToken, {
      type: "text",
      text:
`📅 วันที่: ${date}
⏰ เวลา: ${time}
🍽 รายการ: ${item}
💸 ราคา: ${price} บาท`
    })

    res.status(200).end()
  } catch (err) {
    console.error("❌ webhook error:", err)
    res.status(500).end()
  }
})

app.get("/", (req, res) => {
  res.send("LINE Bot is running")
})

app.listen(10000, () => {
  console.log("🚀 Server running on port 10000")
})
