import { DataChange } from "./diff"

const CHANGES_STORAGE_KEY = "spawn_changes_history"
const MAX_CHANGES = 1000 // Limit the number of changes we store

export function saveChanges(newChanges: DataChange[]): void {
  const existingChanges = getStoredChanges()
  
  // Combine existing and new changes, remove duplicates based on all properties
  const allChanges = [...newChanges, ...existingChanges]
  const uniqueChanges = allChanges.filter((change, index, self) => 
    index === self.findIndex(c => 
      c.map === change.map &&
      c.boss === change.boss &&
      c.field === change.field &&
      c.oldValue === change.oldValue &&
      c.newValue === change.newValue &&
      c.gameMode === change.gameMode &&
      // Consider changes within 1 minute to be duplicates
      Math.abs(c.timestamp - change.timestamp) < 60000
    )
  )

  // Sort by timestamp (newest first) and limit the number of stored changes
  const sortedChanges = uniqueChanges
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_CHANGES)

  localStorage.setItem(CHANGES_STORAGE_KEY, JSON.stringify(sortedChanges))
}

export function getStoredChanges(): DataChange[] {
  try {
    return JSON.parse(localStorage.getItem(CHANGES_STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

export function clearChangesHistory(): void {
  localStorage.removeItem(CHANGES_STORAGE_KEY)
}

export function exportChanges(): void {
  const changes = getStoredChanges()
  const blob = new Blob([JSON.stringify(changes, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `tarkov-spawn-changes-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function importChanges(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const importedChanges = JSON.parse(e.target?.result as string) as DataChange[]
        
        // Validate the imported data structure
        if (!Array.isArray(importedChanges) || !importedChanges.every(isValidChange)) {
          throw new Error("Invalid changes data format")
        }

        saveChanges(importedChanges)
        resolve()
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

function isValidChange(change: any): change is DataChange {
  return (
    typeof change === "object" &&
    typeof change.map === "string" &&
    typeof change.boss === "string" &&
    ["spawnChance", "location", "status"].includes(change.field) &&
    typeof change.oldValue === "string" &&
    typeof change.newValue === "string" &&
    typeof change.timestamp === "number" &&
    ["PvP", "PvE"].includes(change.gameMode)
  )
} 