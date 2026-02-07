import express from "express"
import * as line from "@line/bot-sdk"
import ExcelJS from "exceljs"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = 3000

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
}

app.post("/webhook", line.middleware(config), async (req, res) => {
  console.log("📩 Webhook received:", JSON.stringify(req.body))
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).end())
})


const client = new line.Client(config)
const filePath = "./data/expense.xlsx"

/* ===== HANDLE MESSAGE ===== */
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return null
  }

  const text = event.message.text.trim()

  // รูปแบบ: ข้าว 50
  const parts = text.split(" ")
  if (parts.length !== 2 || isNaN(parts[1])) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "❌ กรุณาพิมพ์รูปแบบ\nข้าว 50"
    })
  }

  const item = parts[0]
  const price = Number(parts[1])

  const { date, time, total } = await saveExpense(item, price)

  const replyText = `
📅 วันที่: ${date}
⏰ เวลา: ${time}
🍽 รายการ: ${item}
💸 ราคา: ${price} บาท
📊 รวมวันนี้: ${total} บาท
  `.trim()

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: replyText
  })
}

/* ===== SAVE TO EXCEL ===== */
async function saveExpense(item, price) {
  const workbook = new ExcelJS.Workbook()
  let sheet

  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath)
    sheet = workbook.getWorksheet("Expenses")
  } else {
    sheet = workbook.addWorksheet("Expenses")
    sheet.addRow(["Date", "Time", "Item", "Price"])
  }

  const now = new Date()
  const date = now.toLocaleDateString("th-TH")
  const time = now.toLocaleTimeString("th-TH")

  sheet.addRow([date, time, item, price])

  // คำนวณยอดรวมวันนี้
  let total = 0
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    if (row.getCell(1).value === date) {
      total += Number(row.getCell(4).value)
    }
  })

  await workbook.xlsx.writeFile(filePath)

  return { date, time, total }
}

/* ===== WEB VIEW ===== */
app.get("/expenses", async (req, res) => {
  if (!fs.existsSync(filePath)) {
    return res.send("ยังไม่มีข้อมูล")
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const sheet = workbook.getWorksheet("Expenses")

  let html = `
  <h2>📊 รายการค่าใช้จ่าย</h2>
  <table border="1" cellpadding="8">
    <tr>
      <th>วันที่</th>
      <th>เวลา</th>
      <th>รายการ</th>
      <th>ราคา</th>
    </tr>
  `

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    html += `
      <tr>
        <td>${row.getCell(1).value}</td>
        <td>${row.getCell(2).value}</td>
        <td>${row.getCell(3).value}</td>
        <td>${row.getCell(4).value}</td>
      </tr>
    `
  })

  html += "</table>"
  res.send(html)
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
