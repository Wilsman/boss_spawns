import { Search, FileDown, Map, User } from "lucide-react";
import { SpawnData } from "@/types";
import { getCanonicalBossName } from "@/lib/boss-aliases";
import { cn } from "@/lib/utils";

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
        getCanonicalBossName(boss.boss.name, boss.spawnChance)
      )
    )
  );
  const activeFilterCount = [mapFilter, bossFilter, searchQuery].filter(Boolean).length;
  const activeInputClasses =
    "border-amber-400/80 bg-amber-500/10 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]";
  const inactiveInputClasses =
    "border-transparent bg-gray-800 text-gray-300 hover:border-gray-600";
  const optionClasses = "bg-gray-900 text-gray-100";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
      {/* Left: Filters */}
      <div className="flex flex-col flex-grow gap-2 sm:flex-row sm:gap-4">
        <div className="relative flex-1">
          <Map
            className={cn(
              "absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2",
              mapFilter ? "text-amber-300" : "text-gray-500"
            )}
          />
          <select
            value={mapFilter}
            onChange={(e) => onMapFilterChange(e.target.value)}
            className={cn(
              "w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors [color-scheme:dark]",
              mapFilter ? activeInputClasses : inactiveInputClasses
            )}
          >
            <option className={optionClasses} value="">
              All Maps
            </option>
            {Array.from(maps)
              .sort()
              .map((map) => (
                <option className={optionClasses} key={`map-${map}`} value={map}>
                  {map}
                </option>
              ))}
          </select>
        </div>

        <div className="relative flex-1">
          <User
            className={cn(
              "absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2",
              bossFilter ? "text-amber-300" : "text-gray-500"
            )}
          />
          <select
            value={bossFilter}
            onChange={(e) => onBossFilterChange(e.target.value)}
            className={cn(
              "w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors [color-scheme:dark]",
              bossFilter ? activeInputClasses : inactiveInputClasses
            )}
          >
            <option className={optionClasses} value="">
              All Bosses
            </option>
            {Array.from(bosses)
              .sort()
              .map((boss) => (
                <option className={optionClasses} key={`boss-${boss}`} value={boss}>
                  {boss}
                </option>
              ))}
          </select>
        </div>

        <div className="relative flex-1">
          <Search
            className={cn(
              "absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2",
              searchQuery ? "text-amber-300" : "text-gray-500"
            )}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search..."
            className={cn(
              "w-full rounded-lg border py-2 pr-3 pl-9 text-sm transition-colors placeholder:text-gray-500",
              searchQuery ? activeInputClasses : inactiveInputClasses
            )}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {(mapFilter || bossFilter || searchQuery) && (
          <button
            onClick={() => {
              onMapFilterChange("");
              onBossFilterChange("");
              onSearchQueryChange("");
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20"
          >
            Clear
            <span className="rounded-full bg-amber-300 px-1.5 text-xs font-semibold text-zinc-950">
              {activeFilterCount}
            </span>
          </button>
        )}
        <button
          onClick={onExport}
          className="hidden w-full px-4 py-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg sm:flex sm:items-center sm:gap-2 hover:bg-purple-700 sm:w-auto"
        >
          <FileDown className="hidden w-4 h-4 sm:block" />
          Export
        </button>
      </div>
    </div>
  );
}
