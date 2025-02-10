import { fetchChanges } from "./api"
import { DataChange } from "./diff"

export async function getStoredChanges(): Promise<DataChange[]> {
  return await fetchChanges()
}

export function exportChanges(): void {
  getStoredChanges().then(changes => {
    const csvData = generateCSV(changes)
    downloadCSV(csvData)
  })
}

function generateCSV(changes: DataChange[]): string {
  const headers = ["Time", "Mode", "Map", "Boss", "Change Type", "Previous Value", "New Value"]
  const rows = changes.map(change => [
    new Date(change.timestamp).toLocaleString(),
    change.gameMode,
    change.map,
    change.boss,
    change.field,
    change.oldValue,
    change.newValue
  ])

  return [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n")
}

function downloadCSV(csvContent: string): void {
  const blob = new Blob([csvContent], { type: "application/csv" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `tarkov-spawn-changes-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}