import { saveExpense } from "./excel.js";

export async function handleEvent(event) {
  if (event.type !== "message") return;

  if (event.message.type === "text") {
    const text = event.message.text;
    const amount = text.match(/\d+/)?.[0];

    if (amount) {
      await saveExpense("Text", amount);
    }
  }
}
