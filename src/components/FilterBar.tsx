import { Search, FileDown, Map, User } from 'lucide-react'
import { SpawnData } from '@/types'

interface FilterBarProps {
  mapFilter: string
  bossFilter: string
  searchQuery: string
  onMapFilterChange: (value: string) => void
  onBossFilterChange: (value: string) => void
  onSearchQueryChange: (value: string) => void
  onExport: () => void
  data: SpawnData[] | null
}

export function FilterBar({
  mapFilter,
  bossFilter,
  searchQuery,
  onMapFilterChange,
  onBossFilterChange,
  onSearchQueryChange,
  onExport,
  data
}: FilterBarProps) {
  const maps = new Set(data?.map(map => map.normalizedName))
  const bosses = new Set(
    data?.flatMap(map => 
      map.bosses.map(boss => boss.boss.normalizedName)
    )
  )

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center">
      <div className="relative">
        <Map className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <select
          value={mapFilter}
          onChange={(e) => onMapFilterChange(e.target.value)}
          className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Maps</option>
          {Array.from(maps).sort().map(map => (
            <option key={map} value={map}>{map}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <select
          value={bossFilter}
          onChange={(e) => onBossFilterChange(e.target.value)}
          className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Bosses</option>
          {Array.from(bosses).sort().map(boss => (
            <option key={boss} value={boss}>{boss}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search..."
          className="pl-10 pr-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      <button
        onClick={onExport}
        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200"
      >
        <FileDown className="w-5 h-5" />
        <span>Export CSV</span>
      </button>
    </div>
  )
} 