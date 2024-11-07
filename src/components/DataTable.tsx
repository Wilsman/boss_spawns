import { SpawnData, DataMode, Boss } from "@/types";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

interface DataTableProps {
  data: SpawnData[] | null;
  mode: DataMode;
  filters: {
    map: string;
    boss: string;
    search: string;
  };
}

type SortField =
  | "map"
  | "boss"
  | "regularChance"
  | "pveChance"
  | "spawnChance"
  | "location"
  | "locationChance";
type SortDirection = "asc" | "desc";

type GroupBy = "none" | "map" | "boss" | "location";

function getInfectedBossName(spawnChance: number) {
  // If spawn chance is under 100%, it's Tagilla(Infected)
  // Otherwise it's regular Infected (Zombies)
  return spawnChance < 1 ? "Infected(Tagilla)" : "Infected(Zombie)";
}

function normalizeInfectedBossNames(data: SpawnData[]) {
  return data.map((map) => ({
    ...map,
    bosses: map.bosses.map((boss) => ({
      ...boss,
      boss: {
        ...boss.boss,
        normalizedName:
          boss.boss.normalizedName === "infected"
            ? getInfectedBossName(boss.spawnChance)
            : boss.boss.normalizedName,
      },
    })),
  }));
}

function getLocationClasses(location: string, chance: number) {
  if (location === "Unknown" || chance === 0) {
    return "text-gray-500 italic opacity-75"
  }
  return "text-gray-400"
}

export function DataTable({ data, mode, filters }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>("map");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [groupBy, setGroupBy] = useState<GroupBy>("map");

  if (!data) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortHeader = ({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-6 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:bg-gray-700/50 select-none ${className}`}
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
  );

  const isNewSection = (currentRow: any, previousRow: any | null) => {
    if (!previousRow) return false;

    switch (sortField) {
      case "map":
        return currentRow.map !== previousRow.map;
      case "boss":
        return currentRow.boss !== previousRow.boss;
      case "location":
        return currentRow.location !== previousRow.location;
      case "spawnChance":
        return (
          Math.round(currentRow.spawnChance * 100) !==
          Math.round(previousRow.spawnChance * 100)
        );
      case "locationChance":
        return (
          Math.round(currentRow.locationChance * 100) !==
          Math.round(previousRow.locationChance * 100)
        );
      case "regularChance":
        return currentRow.regularChance !== previousRow.regularChance;
      case "pveChance":
        return currentRow.pveChance !== previousRow.pveChance;
      default:
        return false;
    }
  };

  function groupData(data: any[], grouping: GroupBy) {
    if (grouping === "none") return { "": data };
    
    const grouped: Record<string, any[]> = {};
    
    data.forEach(item => {
      const key = item[grouping];
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    return grouped;
  }

  if (mode === "compare") {
    const regularData = normalizeInfectedBossNames(
      JSON.parse(localStorage.getItem("maps_regular") || "{}").data?.maps ||
        ([] as SpawnData[])
    );
    const pveData = normalizeInfectedBossNames(
      JSON.parse(localStorage.getItem("maps_pve") || "{}").data?.maps ||
        ([] as SpawnData[])
    );

    const uniqueComparisons = new Map<
      string,
      {
        map: string;
        boss: string;
        regularChance: number;
        pveChance: number;
      }
    >();

    regularData.forEach((regularMap: SpawnData) => {
      const pveMap = pveData.find(
        (m: SpawnData) => m.normalizedName === regularMap.normalizedName
      );
      if (!pveMap) return;

      regularMap.bosses.forEach((regularBoss: Boss) => {
        const pveBoss = pveMap.bosses.find(
          (b: Boss) => b.boss.normalizedName === regularBoss.boss.normalizedName
        );
        if (!pveBoss) return;

        const regularChance = Math.round(regularBoss.spawnChance * 100);
        const pveChance = Math.round(pveBoss.spawnChance * 100);

        if (regularChance !== pveChance) {
          const bossName =
            regularBoss.boss.normalizedName === "infected"
              ? getInfectedBossName(regularBoss.spawnChance)
              : regularBoss.boss.normalizedName;

          const key = `${regularMap.normalizedName}-${bossName}`;
          uniqueComparisons.set(key, {
            map: regularMap.normalizedName,
            boss: bossName,
            regularChance,
            pveChance,
          });
        }
      });
    });

    let differences = Array.from(uniqueComparisons.values()).filter((entry) => {
      if (filters.map && entry.map.toLowerCase() !== filters.map.toLowerCase())
        return false;
      if (
        filters.boss &&
        entry.boss.toLowerCase() !== filters.boss.toLowerCase()
      )
        return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          entry.map.toLowerCase().includes(search) ||
          entry.boss.toLowerCase().includes(search)
        );
      }
      return true;
    });

    // Apply sorting
    differences.sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "map":
          return a.map.localeCompare(b.map) * direction;
        case "boss":
          return a.boss.localeCompare(b.boss) * direction;
        case "regularChance":
          return (a.regularChance - b.regularChance) * direction;
        case "pveChance":
          return (a.pveChance - b.pveChance) * direction;
        default:
          return 0;
      }
    });

    return (
      <>
        <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
          <p className="text-yellow-300 text-sm flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
            Note: Infected boss spawn rates may not be accurate due to their
            dynamic spawn behavior
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800">
                <SortHeader field="map" className="w-1/4">
                  <span className="text-purple-300">Map</span>
                </SortHeader>
                <SortHeader field="boss" className="w-1/4">
                  <span className="text-blue-300">Boss</span>
                </SortHeader>
                <SortHeader field="regularChance" className="w-1/4">
                  <span className="text-amber-300">PvP %</span>
                </SortHeader>
                <SortHeader field="pveChance" className="w-1/4">
                  <span className="text-amber-300">PvE %</span>
                </SortHeader>
              </tr>
            </thead>
            <tbody>
              {differences.map((row, index) => {
                const prevRow = index > 0 ? differences[index - 1] : null;
                const isNewGroup = isNewSection(row, prevRow);

                return (
                  <tr
                    key={`${row.map}-${row.boss}-${index}`}
                    className={`
                      hover:bg-gray-800/50 transition-colors duration-200
                      ${
                        isNewGroup
                          ? "border-t-2 border-gray-600"
                          : "border-t border-gray-800"
                      }
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{row.map}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{row.boss}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {row.regularChance}%
                    </td>
                    <td
                      className={`px-6 py-4 text-center whitespace-nowrap ${
                        row.pveChance > row.regularChance
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {row.pveChance}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  const normalizedData = normalizeInfectedBossNames(data);

  let filteredData = normalizedData.flatMap((map) => {
    if (
      filters.map &&
      !map.normalizedName.toLowerCase().includes(filters.map.toLowerCase())
    )
      return [];

    const uniqueBossEntries = new Map<
      string,
      {
        map: string;
        boss: string;
        spawnChance: number;
        location: string;
        locationChance: number;
      }
    >();

    map.bosses.forEach((boss) => {
      const bossName = boss.boss.normalizedName;

      if (filters.boss) {
        const filterLower = filters.boss.toLowerCase();
        const bossLower = bossName.toLowerCase();
        if (!bossLower.includes(filterLower)) return;
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesMap = map.normalizedName.toLowerCase().includes(search);
        const matchesBoss = bossName.toLowerCase().includes(search);
        if (!matchesMap && !matchesBoss) return;
      }

      const validLocations = boss.spawnLocations?.filter(
        (location) => location.name !== "Unknown" || location.chance > 0
      );

      if (validLocations?.length) {
        validLocations.forEach((location) => {
          const key = `${map.normalizedName}-${bossName}-${boss.spawnChance}-${location.name}`;
          uniqueBossEntries.set(key, {
            map: map.normalizedName,
            boss: bossName,
            spawnChance: boss.spawnChance,
            location: location.name,
            locationChance: location.chance,
          });
        });
      } else if (boss.spawnChance > 0) {
        const key = `${map.normalizedName}-${bossName}-${boss.spawnChance}-Unknown`;
        uniqueBossEntries.set(key, {
          map: map.normalizedName,
          boss: bossName,
          spawnChance: boss.spawnChance,
          location: "Unknown",
          locationChance: 0,
        });
      }
    });

    return Array.from(uniqueBossEntries.values());
  });

  console.log("Final filtered data:", filteredData);

  filteredData.sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "map":
        return a.map.localeCompare(b.map) * direction;
      case "boss":
        return a.boss.localeCompare(b.boss) * direction;
      case "spawnChance":
        return (a.spawnChance - b.spawnChance) * direction;
      case "location":
        return a.location.localeCompare(b.location) * direction;
      case "locationChance":
        return (a.locationChance - b.locationChance) * direction;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 p-4 bg-gray-800/50 rounded-lg">
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="px-3 py-2 text-sm bg-gray-800 rounded-md border border-gray-700"
        >
          <option value="map">Group by Map</option>
          <option value="boss">Group by Boss</option>
          <option value="location">Group by Location</option>
          <option value="none">No Grouping</option>
        </select>
      </div>

      {Object.entries(groupData(filteredData, groupBy)).map(([group, items]) => (
        <div key={group} className="space-y-2">
          {group && (
            <h3 className="text-lg font-semibold text-gray-300 px-2">
              {group}
            </h3>
          )}
          <div className="overflow-x-auto rounded-lg border border-gray-700 -mx-2 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800">
                  {groupBy !== "map" && (
                    <SortHeader field="map" className="w-1/4">
                      <span className="text-purple-300 text-xs sm:text-sm">Map</span>
                    </SortHeader>
                  )}
                  {groupBy !== "boss" && (
                    <SortHeader field="boss" className="w-1/4">
                      <span className="text-blue-300 text-xs sm:text-sm">Boss</span>
                    </SortHeader>
                  )}
                  <SortHeader field="spawnChance" className="w-1/4">
                    <span className="text-amber-300 text-xs sm:text-sm">
                      Spawn Chance
                    </span>
                  </SortHeader>
                  {groupBy !== "location" && (
                    <SortHeader field="location" className="w-1/6">
                      <span className="text-gray-400 text-xs sm:text-sm">Location</span>
                    </SortHeader>
                  )}
                  <SortHeader field="locationChance" className="w-1/6">
                    <span className="text-gray-400 text-xs sm:text-sm">
                      Location Chance
                    </span>
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => {
                  const prevRow = index > 0 ? items[index - 1] : null;
                  const isNewGroup = isNewSection(row, prevRow);

                  return (
                    <tr
                      key={`${row.map}-${row.boss}-${row.location}-${index}`}
                      className={`
                        hover:bg-gray-800/50 transition-colors duration-200
                        ${isNewGroup ? "border-t-2 border-gray-600" : "border-t border-gray-800"}
                      `}
                    >
                      {groupBy !== "map" && (
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-semibold text-purple-300 text-xs sm:text-base">
                          {row.map}
                        </td>
                      )}
                      {groupBy !== "boss" && (
                        <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-semibold text-blue-300 text-xs sm:text-base">
                          {row.boss}
                        </td>
                      )}
                      <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-semibold text-amber-300 text-xs sm:text-base">
                        {Math.round(row.spawnChance * 100)}%
                      </td>
                      {groupBy !== "location" && (
                        <td className={`px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-base ${getLocationClasses(row.location, row.locationChance)}`}>
                          {row.location}
                        </td>
                      )}
                      <td className={`px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-base ${getLocationClasses(row.location, row.locationChance)}`}>
                        {Math.round(row.locationChance * 100)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
