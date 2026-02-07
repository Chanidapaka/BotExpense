import express from "express";
import * as line from "@line/bot-sdk";
import dotenv from "dotenv";
import { saveExpense } from "./googleSheet.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const client = new line.Client(config);

app.post("/webhook", line.middleware(config), async (req, res) => {
  await Promise.all(req.body.events.map(handleEvent));
  res.status(200).end();
});

/* ===== HANDLE MESSAGE ===== */
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const text = event.message.text.trim();

  // รูปแบบ: ข้าว 50
  const parts = text.split(" ");
  if (parts.length !== 2 || isNaN(parts[1])) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "❌ กรุณาพิมพ์รูปแบบ\nข้าว 50",
    });
  }

  const item = parts[0];
  const price = Number(parts[1]);

  // ✅ ตรงนี้แหละที่ถูก
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

app.get("/", (req, res) => {
  res.send("LINE Expense Bot is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
