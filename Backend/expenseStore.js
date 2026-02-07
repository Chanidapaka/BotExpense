import fs from "fs"
import path from "path"

const dataPath = path.resolve("data/expense.json")

function readData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]")
  }
  const raw = fs.readFileSync(dataPath)
  return JSON.parse(raw)
}

function writeData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

export function addExpense(expense) {
  const data = readData()
  data.push(expense)
  writeData(data)
}

export function getTodayTotal(date) {
  const data = readData()
  return data
    .filter(e => e.date === date)
    .reduce((sum, e) => sum + e.price, 0)
}

export function deleteLastExpense(date) {
  const data = readData()

  // หา index ล่าสุดของวันนี้
  const index = [...data]
    .reverse()
    .findIndex(e => e.date === date)

  if (index === -1) return null

  // คำนวณ index จริง
  const realIndex = data.length - 1 - index
  const removed = data.splice(realIndex, 1)[0]

  writeData(data)
  return removed
}

