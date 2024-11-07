import { Search, FileDown, Map, User } from "lucide-react";
import { SpawnData } from "@/types";

// Import the helper function from DataTable or move it to a shared utils file
function getInfectedBossName(spawnChance: number) {
  return spawnChance < 1 ? "Infected(Tagilla)" : "Infected(Zombie)";
}

interface FilterBarProps {
  mapFilter: string;
  bossFilter: string;
  searchQuery: string;
  onMapFilterChange: (value: string) => void;
  onBossFilterChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onExport: () => void;
  data: SpawnData[] | null;
}

export function FilterBar({
  mapFilter,
  bossFilter,
  searchQuery,
  onMapFilterChange,
  onBossFilterChange,
  onSearchQueryChange,
  onExport,
  data,
}: FilterBarProps) {
  const maps = new Set(data?.map((map) => map.name));
  const bosses = new Set(
    data?.flatMap((map) =>
      map.bosses.map((boss) =>
        boss.boss.name === "infected"
          ? getInfectedBossName(boss.spawnChance)
          : boss.boss.name
      )
    )
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
      <div className="flex flex-col flex-grow gap-2 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Map className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <select
            value={mapFilter}
            onChange={(e) => onMapFilterChange(e.target.value)}
            className="w-full py-2 pr-3 text-sm text-gray-300 bg-gray-800 rounded-lg pl-9"
          >
            <option value="">All Maps</option>
            {Array.from(maps)
              .sort()
              .map((map) => (
                <option key={`map-${map}`} value={map}>
                  {map}
                </option>
              ))}
          </select>
        </div>

        <div className="relative flex-1">
          <User className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <select
            value={bossFilter}
            onChange={(e) => onBossFilterChange(e.target.value)}
            className="w-full py-2 pr-3 text-sm text-gray-300 bg-gray-800 rounded-lg pl-9"
          >
            <option value="">All Bosses</option>
            {Array.from(bosses)
              .sort()
              .map((boss) => (
                <option key={`boss-${boss}`} value={boss}>
                  {boss}
                </option>
              ))}
          </select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search..."
            className="w-full py-2 pr-3 text-sm text-gray-300 bg-gray-800 rounded-lg pl-9"
          />
        </div>
      </div>

      <button
        onClick={onExport}
        className="hidden w-full px-4 py-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg sm:flex sm:items-center sm:gap-2 hover:bg-purple-700 sm:w-auto"
      >
        <FileDown className="hidden w-4 h-4 sm:block" />
        Export CSV
      </button>
    </div>
  );
}
