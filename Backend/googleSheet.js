// googleSheet.js
import { google } from "googleapis";

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.SPREADSHEET_ID;

// ➕ เพิ่มข้อมูลลง Sheet
export async function appendToSheet(date, time, item, price) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[date, time, item, price]],
    },
  });
}

// ➕ รวมยอดของ "วันนี้"
export async function getTodayTotal(date) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A:D",
  });

  const rows = res.data.values || [];
  let total = 0;

  // ข้าม header แถวแรก
  for (let i = 1; i < rows.length; i++) {
    const rowDate = rows[i][0];
    const price = Number(rows[i][3]);

    if (rowDate === date && !isNaN(price)) {
      total += price;
    }
  }

  return total;
}
