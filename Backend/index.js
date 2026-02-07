import express from "express";
import * as line from "@line/bot-sdk";
import dotenv from "dotenv";
import { saveExpense } from "./googleSheet.js";

dotenv.config();

const app = express();
app.use(express.json()); // ⭐ สำคัญมาก

const PORT = process.env.PORT || 3000;

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const client = new line.Client(config);

app.post("/webhook", line.middleware(config), async (req, res) => {
  console.log("📩 Webhook received:", JSON.stringify(req.body));
  await Promise.all(req.body.events.map(handleEvent));
  res.status(200).end();
});

async function handleEvent(event) {
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

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: `📅 วันที่: ${date}\n⏰ เวลา: ${time}\n🍽 รายการ: ${item}\n💸 ราคา: ${price} บาท`,
  });
}

app.get("/", (req, res) => {
  res.send("LINE Expense Bot is running ✅");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
