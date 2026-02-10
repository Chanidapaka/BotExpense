const input = document.getElementById("textInput")
const list = document.getElementById("list")
const totalEl = document.getElementById("total")
const nowEl = document.getElementById("now")

async function loadNow() {
  const res = await fetch("/api/now")
  const data = await res.json()
  nowEl.textContent = `📅 ${data.date} ⏰ ${data.time}`
}

async function loadTotal() {
  const res = await fetch("/api/total")
  const data = await res.json()
  totalEl.textContent = `${data.total} บาท`
}

async function loadList() {
  const res = await fetch("/api/today")
  const data = await res.json()

  list.innerHTML = ""
  data.forEach(e => {
    const div = document.createElement("div")
    div.className = "item"
    div.innerHTML = `
      <div>
        <div>${e.item}</div>
        <div class="meta">${e.date} • ${e.time}</div>
      </div>
      <div class="price">${e.price}฿</div>
    `
    list.appendChild(div)
  })
}

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    await fetch("/api/add-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.value })
    })
    input.value = ""
    refresh()
  }
})

async function deleteLast() {
  await fetch("/api/delete-last", { method: "DELETE" })
  refresh()
}

function refresh() {
  loadNow()
  loadTotal()
  loadList()
}

refresh()
setInterval(loadNow, 1000)
