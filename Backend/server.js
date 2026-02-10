import express from "express"
import sqlite3 from "sqlite3"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(express.static("public"))

/* ---------- TIME (THAI) ---------- */
function getThaiDateTime() {
  const now = new Date()

  const date = now.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok"
  })

  const time = now.toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit"
  })

  return { date, time }
}

/* ---------- DATABASE ---------- */
const db = new sqlite3.Database("expense.db")

db.run(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    time TEXT,
    item TEXT,
    price REAL,
    category TEXT
  )
`)

/* ---------- API ---------- */

// วันที่ / เวลา ปัจจุบัน
app.get("/api/now", (req, res) => {
  res.json(getThaiDateTime())
})

// เพิ่มจากข้อความเดียว เช่น "แป๊บซี่ 25"
app.post("/api/add-text", (req, res) => {
  const { text, category } = req.body
  const parts = text.trim().split(" ")
  const price = Number(parts.pop())
  const item = parts.join(" ")

  if (!item || isNaN(price)) {
    return res.status(400).json({ error: "รูปแบบไม่ถูกต้อง" })
  }

  const { date, time } = getThaiDateTime()

  db.run(
    "INSERT INTO expenses (date, time, item, price, category) VALUES (?, ?, ?, ?, ?)",
    [date, time, item, price, category || "📦 อื่นๆ"],
    () => res.json({ success: true })
  )
})

// รายการวันนี้
app.get("/api/today", (req, res) => {
  const today = getThaiDateTime().date

  db.all(
    "SELECT * FROM expenses WHERE date = ? ORDER BY id DESC",
    [today],
    (err, rows) => res.json(rows)
  )
})

// รวมยอดวันนี้
app.get("/api/total", (req, res) => {
  const today = getThaiDateTime().date

  db.get(
    "SELECT SUM(price) as total FROM expenses WHERE date = ?",
    [today],
    (err, row) => res.json({ total: row?.total || 0 })
  )
})

// ลบล่าสุด
app.delete("/api/delete-last", (req, res) => {
  db.run(
    "DELETE FROM expenses WHERE id = (SELECT MAX(id) FROM expenses)",
    () => res.json({ success: true })
  )
})

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("🚀 Web App running on port", PORT)
})
