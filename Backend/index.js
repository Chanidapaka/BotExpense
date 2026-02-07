import dotenv from "dotenv";
dotenv.config(); // 🔥 ต้องอยู่บนสุด

import express from "express";
import * as line from "@line/bot-sdk";
import { saveExpense } from "./googleSheet.js";

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const client = new line.Client(config);

// ===== WEBHOOK =====
app.post("/webhook", line.middleware(config), async (req, res) => {
  console.log("📩 Webhook received");

  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).end();
  }
});

// ===== HANDLE MESSAGE =====
async function handleEvent(event) {
  console.log("👉 Event:", event);

  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const text = event.message.text.trim();
  const parts = text.split(" ");

  if (parts.length !== 2 || isNaN(parts[1])) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "❌ กรุณาพิมพ์รูปแบบ\nข้าว 50",
    });
  }

  const item = parts[0];
  const price = Number(parts[1]);

  const { date, time } = await saveExpense(item, price);

  const replyText = `
📅 วันที่: ${date}
⏰ เวลา: ${time}
🍽 รายการ: ${item}
💸 ราคา: ${price} บาท
`.trim();

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: replyText,
  });
}

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("LINE Expense Bot is running ✅");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
