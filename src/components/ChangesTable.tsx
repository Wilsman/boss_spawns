import { DataChange } from "@/lib/diff"
import { getRelativeTime } from "@/lib/utils"
import { ArrowUpDown, Download, Upload, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { clearChangesHistory, exportChanges, importChanges } from "@/lib/changes"

interface ChangesTableProps {
  changes: DataChange[]
  filters: {
    map: string
    boss: string
    search: string
  }
  onChangesUpdate: () => void
}

type SortField = "map" | "boss" | "field" | "oldValue" | "newValue" | "timestamp" | "gameMode"
type SortDirection = "asc" | "desc"
type GroupBy = "none" | "day" | "week"
type DateRange = "all" | "24h" | "7d" | "30d"

export function ChangesTable({ changes, filters, onChangesUpdate }: ChangesTableProps) {
  const [sortField, setSortField] = useState<SortField>("timestamp")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [groupBy, setGroupBy] = useState<GroupBy>("none")
  const [dateRange, setDateRange] = useState<DateRange>("all")
  const [, forceUpdate] = useState({})

  // Force update every minute to refresh relative times
  useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-6 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:bg-gray-700/50"
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown
          className={`h-4 w-4 transition-colors ${
            sortField === field ? "text-purple-400" : "text-gray-500"
          }`}
        />
      </div>
    </th>
  )

  // Apply filters
  let filteredChanges = changes.filter(change => {
    if (filters.map && !change.map.toLowerCase().includes(filters.map.toLowerCase()))
      return false
    if (filters.boss && !change.boss.toLowerCase().includes(filters.boss.toLowerCase()))
      return false
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        change.map.toLowerCase().includes(search) ||
        change.boss.toLowerCase().includes(search) ||
        change.oldValue.toLowerCase().includes(search) ||
        change.newValue.toLowerCase().includes(search)
      )
    }
    return true
  })

  // Apply sorting
  filteredChanges.sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1
    switch (sortField) {
      case "map":
        return a.map.localeCompare(b.map) * direction
      case "boss":
        return a.boss.localeCompare(b.boss) * direction
      case "field":
        return a.field.localeCompare(b.field) * direction
      case "oldValue":
        return a.oldValue.localeCompare(b.oldValue) * direction
      case "newValue":
        return a.newValue.localeCompare(b.newValue) * direction
      case "timestamp":
        return (a.timestamp - b.timestamp) * direction
      case "gameMode":
        return a.gameMode.localeCompare(b.gameMode) * direction
      default:
        return 0
    }
  })

  // Apply date range filter
  filteredChanges = filteredChanges.filter(change => {
    const now = Date.now()
    const changeTime = change.timestamp
    const diff = now - changeTime

    switch (dateRange) {
      case "24h":
        return diff <= 24 * 60 * 60 * 1000
      case "7d":
        return diff <= 7 * 24 * 60 * 60 * 1000
      case "30d":
        return diff <= 30 * 24 * 60 * 60 * 1000
      default:
        return true
    }
  })

  // Group changes if needed
  const groupedChanges = groupBy === "none" ? null : groupChangesByDate(filteredChanges, groupBy)

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await importChanges(file)
      onChangesUpdate()
    } catch (error) {
      console.error("Failed to import changes:", error)
      // You might want to add proper error handling/notification here
    }
  }

  function renderTable(changes: DataChange[]) {
    if (!changes.length) {
      return (
        <div className="text-center py-12 text-gray-400">
          No changes detected in the current dataset
        </div>
      )
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800">
              <SortHeader field="timestamp">Time</SortHeader>
              <SortHeader field="gameMode">Mode</SortHeader>
              <SortHeader field="map">Map</SortHeader>
              <SortHeader field="boss">Boss</SortHeader>
              <SortHeader field="field">Change Type</SortHeader>
              <SortHeader field="oldValue">Previous Value</SortHeader>
              <SortHeader field="newValue">New Value</SortHeader>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, index) => (
              <tr
                key={`${change.map}-${change.boss}-${change.field}-${index}`}
                className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                  {getRelativeTime(change.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-orange-300">
                  {change.gameMode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-purple-300">
                  {change.map}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-300">
                  {change.boss}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {change.field}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-red-400">
                  {change.oldValue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-green-400">
                  {change.newValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 p-4 bg-gray-800/50 rounded-lg">
        {/* Date Range Filter */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="px-3 py-2 text-sm bg-gray-800 rounded-md border border-gray-700"
        >
          <option value="all">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        {/* Grouping Options */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-3 py-2 text-sm bg-gray-800 rounded-md border border-gray-700"
        >
          <option value="none">No Grouping</option>
          <option value="day">Group by Day</option>
          <option value="week">Group by Week</option>
        </select>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => exportChanges()}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 rounded-md hover:bg-gray-700"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-800 rounded-md hover:bg-gray-700 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear all change history?")) {
                clearChangesHistory()
                onChangesUpdate()
              }
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-900/50 rounded-md hover:bg-red-900/75"
          >
            <Trash2 className="w-4 h-4" /> Clear History
          </button>
        </div>
      </div>

      {/* Existing table code... */}
      {groupedChanges ? (
        Object.entries(groupedChanges).map(([date, changes]) => (
          <div key={date} className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-300">{date}</h3>
            {renderTable(changes)}
          </div>
        ))
      ) : (
        renderTable(filteredChanges)
      )}
    </div>
  )
}

function groupChangesByDate(changes: DataChange[], grouping: "day" | "week"): Record<string, DataChange[]> {
  const grouped: Record<string, DataChange[]> = {}

  changes.forEach(change => {
    const date = new Date(change.timestamp)
    let key: string

    if (grouping === "day") {
      key = date.toLocaleDateString()
    } else {
      // Get start of week
      const startOfWeek = new Date(date)
      startOfWeek.setDate(date.getDate() - date.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      key = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`
    }

    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(change)
  })

  return grouped
} 