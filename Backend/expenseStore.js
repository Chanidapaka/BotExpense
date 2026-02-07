import fs from "fs"
import path from "path"

const dataPath = path.resolve("Backend/data/expense.json")

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
