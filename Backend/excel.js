import ExcelJS from "exceljs";

const FILE = "expenses.xlsx";

export async function saveExpense(title, amount) {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(FILE);
  } catch {
    wb.addWorksheet("Expenses");
  }

  const ws = wb.getWorksheet("Expenses");
  if (ws.rowCount === 0) {
    ws.addRow(["Date", "Title", "Amount"]);
  }

  ws.addRow([new Date(), title, amount]);
  await wb.xlsx.writeFile(FILE);
}
