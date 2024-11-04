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
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-grow">
        <div className="relative flex-1">
          <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={mapFilter}
            onChange={(e) => onMapFilterChange(e.target.value)}
            className="bg-gray-800 text-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm w-full"
          >
            <option value="">All Maps</option>
            {Array.from(maps).sort().map(map => (
              <option key={map} value={map}>{map}</option>
            ))}
          </select>
        </div>
        
        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={bossFilter}
            onChange={(e) => onBossFilterChange(e.target.value)}
            className="bg-gray-800 text-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm w-full"
          >
            <option value="">All Bosses</option>
            {Array.from(bosses).sort().map(boss => (
              <option key={boss} value={boss}>{boss}</option>
            ))}
          </select>
        </div>
        
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search..."
            className="bg-gray-800 text-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm w-full"
          />
        </div>
      </div>
      
      <button
        onClick={onExport}
        className="hidden sm:block bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors w-full sm:w-auto"
      >
        Export CSV
      </button>
    </div>
  )
} 