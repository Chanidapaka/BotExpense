import { google } from "googleapis";

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

export async function saveExpense(item, price) {
  const now = new Date();
  const date = now.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" });
  const time = now.toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: "Expenses!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[date, time, item, price]],
    },
  });

  return { date, time };
}
