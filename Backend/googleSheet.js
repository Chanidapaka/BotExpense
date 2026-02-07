import { google } from "googleapis"

// 🔥 แก้: ใช้ Service Account จาก ENV
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
)

const sheets = google.sheets({ version: "v4", auth })
const SHEET_NAME = "Sheet1" // 🔁 แก้ให้ตรงชื่อ sheet จริง

// 🔥 เพิ่ม: บันทึกรายการ
export async function appendToSheet({ date, time, item, price }) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:D`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[date, time, item, price]]
    }
  })
}

// 🔥 เพิ่ม: รวมยอดวันนี้
export async function getTodayTotal(today) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:D`
  })

  const rows = res.data.values || []
  const data = rows.slice(1) // ตัด header

  let total = 0
  for (const row of data) {
    const rowDate = row[0]
    const price = Number(row[3])

    if (rowDate === today && !isNaN(price)) {
      total += price
    }
  }

  return total
}
