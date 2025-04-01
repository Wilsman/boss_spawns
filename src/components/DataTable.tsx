import { SpawnData, Boss, DataMode, Health, SpawnLocation } from "@/types";
import { useMemo, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: SpawnData[] | null;
  mode: DataMode;
  filters: {
    map: string;
    boss: string;
    search: string;
  };
}

function getLocationClasses(location: string, chance: number) {
  if (location === "Unknown" || chance === 0) {
    return "text-gray-500 italic opacity-75";
  }
  return "text-gray-400";
}

function groupData(data: any[], key: string) {
  return data.reduce((acc: Record<string, any[]>, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
}

interface Location {
  name: string;
  chance: number;
  regularChance?: number;
  pveChance?: number;
  hasDifference?: boolean;
}

interface BossEntry {
  map: string;
  boss: string;
  spawnChance: number;
  locations: Location[];
  health: Health[] | null;
  imagePortraitLink: string | null;
}

export function DataTable({ data, mode, filters }: DataTableProps) {
  const [expandedBosses, setExpandedBosses] = useState<Set<string>>(new Set());
  const normalizedData = data;

  const { processedData, groupedByMap } = useMemo(() => {
    if (!normalizedData) return { processedData: [], groupedByMap: {} };

    let processedData = [];

    if (mode === "compare") {
      const regularData =
        JSON.parse(localStorage.getItem("maps_regular") || "{}").data?.maps ||
        [];
      const pveData =
        JSON.parse(localStorage.getItem("maps_pve") || "{}").data?.maps || [];

      const uniqueComparisons = new Map<string, BossEntry>();

      regularData.forEach((regularMap: SpawnData) => {
        const pveMap = pveData.find(
          (m: SpawnData) => m.name === regularMap.name
        );
        if (!pveMap) return;

        regularMap.bosses.forEach((regularBoss: Boss) => {
          const pveBoss = pveMap.bosses.find(
            (b: Boss) => b.boss.name === regularBoss.boss.name
          );
          if (!pveBoss) return;

          const regularChance = regularBoss.spawnChance;
          const pveChance = pveBoss.spawnChance;

          if (regularChance !== pveChance) {
            const bossName =
              regularBoss.boss.name === "infected"
                ? "Infected(Zombie)"
                : regularBoss.boss.name;
            const key = `${regularMap.name}-${bossName}`;

            const locations: Location[] = [
              {
                name: regularMap.name,
                chance: 0,
                regularChance,
                pveChance,
                hasDifference: true,
              },
            ];

            uniqueComparisons.set(key, {
              map: regularMap.name,
              boss: bossName,
              spawnChance: 0,
              locations,
              health: regularBoss.boss.health || null,
              imagePortraitLink: regularBoss.boss.imagePortraitLink || null,
            });
          }
        });
      });

      processedData = Array.from(uniqueComparisons.values()).filter((entry) => {
        if (
          filters.map &&
          entry.map.toLowerCase() !== filters.map.toLowerCase()
        )
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
    } else {
      processedData = normalizedData.flatMap((map) => {
        if (
          filters.map &&
          !map.name.toLowerCase().includes(filters.map.toLowerCase())
        )
          return [];

        const uniqueBossEntries = new Map<string, BossEntry>();

        map.bosses.forEach((bossEntry) => {
          const bossData = bossEntry.boss;
          const bossName = bossData.name;

          if (filters.boss) {
            const filterLower = filters.boss.toLowerCase();
            const bossLower = bossName.toLowerCase();
            if (!bossLower.includes(filterLower)) return;
          }

          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesMap = map.name.toLowerCase().includes(search);
            const matchesBoss = bossName.toLowerCase().includes(search);
            if (!matchesMap && !matchesBoss) return;
          }

          const key = `${map.name}-${bossName}`;
          const existingEntry = uniqueBossEntries.get(key);

          const validLocations =
            bossEntry.spawnLocations?.filter(
              (location: SpawnLocation) =>
                location.name !== "Unknown" || location.chance > 0
            ) || [];

          if (!existingEntry) {
            uniqueBossEntries.set(key, {
              map: map.name,
              boss: bossName,
              spawnChance: bossEntry.spawnChance,
              locations: validLocations.map((loc: SpawnLocation) => ({
                name: loc.name,
                chance: loc.chance,
                ...(mode === "regular"
                  ? { regularChance: bossEntry.spawnChance }
                  : {}),
                ...(mode === "pve" ? { pveChance: bossEntry.spawnChance } : {}),
              })),
              health: bossData.health ?? null,
              imagePortraitLink: bossData.imagePortraitLink ?? null,
            });
          } else {
            const updatedLocations = existingEntry.locations.map(
              (loc: Location) => {
                const matchingNewLoc = validLocations.find(
                  (newLoc: SpawnLocation) => newLoc.name === loc.name
                );
                if (matchingNewLoc) {
                  return {
                    ...loc,
                    pveChance: bossEntry.spawnChance,
                    regularChance: loc.regularChance || 0,
                    hasDifference:
                      Math.abs(
                        (loc.regularChance || 0) - bossEntry.spawnChance
                      ) > 0.001,
                  };
                }
                return loc;
              }
            );

            validLocations.forEach((newLoc: SpawnLocation) => {
              if (
                !existingEntry.locations.some(
                  (loc: Location) => loc.name === newLoc.name
                )
              ) {
                updatedLocations.push({
                  name: newLoc.name,
                  chance: newLoc.chance,
                  pveChance: bossEntry.spawnChance,
                  regularChance: 0,
                  hasDifference: true,
                });
              }
            });

            uniqueBossEntries.set(key, {
              ...existingEntry,
              locations: updatedLocations,
            });
          }
        });

        return Array.from(uniqueBossEntries.values());
      });
    }

    if (mode === "compare") {
      processedData = processedData.filter((entry) =>
        entry.locations.some((loc: Location) => loc.hasDifference)
      );
    }

    const groupedByMap = groupData(processedData, "map");

    return { processedData, groupedByMap };
  }, [normalizedData, mode, filters]);

  const sortedMapNames = useMemo(
    () => Object.keys(groupedByMap).sort(),
    [groupedByMap]
  );

  if (!data) return null;

  if (processedData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {mode === "compare"
          ? "No differences found between PVP and PVE modes."
          : `No results found for "${filters.search}".`}
      </div>
    );
  }

  // Get all possible boss keys across all maps
  const allBossKeys = Object.entries(groupedByMap).flatMap(([mapName, items]) =>
    items.map((item) => `${mapName}-${item.boss}`)
  );
  const allBossesExpanded = allBossKeys.every((key) => expandedBosses.has(key));

  const toggleAllBosses = () => {
    const newExpanded = new Set(expandedBosses);
    if (allBossesExpanded) {
      // Collapse all bosses
      allBossKeys.forEach((key) => newExpanded.delete(key));
    } else {
      // Expand all bosses
      allBossKeys.forEach((key) => newExpanded.add(key));
    }
    setExpandedBosses(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end px-2">
        <button
          onClick={toggleAllBosses}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300 font-medium"
        >
          {allBossesExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Expand All
            </>
          )}
        </button>
      </div>
      {sortedMapNames.map((mapName) => {
        const items = groupedByMap[mapName];
        const mapBossKeys = items.map((item) => `${mapName}-${item.boss}`);
        const allMapBossesExpanded = mapBossKeys.every((key) => expandedBosses.has(key));

        const toggleMapBosses = () => {
          const newExpanded = new Set(expandedBosses);
          if (allMapBossesExpanded) {
            // Collapse all bosses in this map
            mapBossKeys.forEach((key) => newExpanded.delete(key));
          } else {
            // Expand all bosses in this map
            mapBossKeys.forEach((key) => newExpanded.add(key));
          }
          setExpandedBosses(newExpanded);
        };

        return (
          <div key={mapName} className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-white capitalize bg-gray-900 py-2 px-4 rounded-lg">
                {mapName}
              </h3>
              <button
                onClick={toggleMapBosses}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300"
              >
                {allMapBossesExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expand
                  </>
                )}
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700 -mx-2 sm:mx-0">
              <table className="w-full min-w-[500px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-800">
                    <th className="w-8 px-2 py-2" /> {/* Expand/collapse column */}
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 w-[200px]">
                      Boss
                    </th>
                    {mode === "compare" ? (
                      <>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-red-300 w-[100px]">
                          PVP Chance
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-green-300 w-[100px]">
                          PVE Chance
                        </th>
                      </>
                    ) : (
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300 w-[100px]">
                        Spawn Chance
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={mode === "compare" ? 4 : 3}
                        className="text-center text-gray-500 py-4"
                      >
                        No bosses found for this map with the current filter.
                      </td>
                    </tr>
                  )}
                  {items.map((bossGroup) => {
                    if (mode === "compare") {
                      const hasDifferences = bossGroup.locations.some(
                        (loc: Location) => loc.hasDifference
                      );
                      if (!hasDifferences) return null;

                      const regularChance = Math.max(
                        ...bossGroup.locations.map(
                          (loc: Location) => loc.regularChance || 0
                        )
                      );
                      const pveChance = Math.max(
                        ...bossGroup.locations.map(
                          (loc: Location) => loc.pveChance || 0
                        )
                      );

                      return (
                        <tr
                          key={bossGroup.boss}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="w-8 px-2 py-2" />
                          <td className="px-4 py-2">
                            <BossCell boss={bossGroup} />
                          </td>
                          <td className="px-4 py-2 text-center bg-red-700/20">
                            <span className="text-red-300 font-medium">
                              {(regularChance * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center bg-green-700/20">
                            <span className="text-green-300 font-medium">
                              {(pveChance * 100).toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    const sortedLocations = [...bossGroup.locations].sort(
                      (a: Location, b: Location) => a.name.localeCompare(b.name)
                    );
                    const bossKey = `${mapName}-${bossGroup.boss}`;
                    const isExpanded = expandedBosses.has(bossKey);

                    return (
                      <>
                        <tr
                          key={bossKey}
                          className="hover:bg-gray-800/50 transition-colors group"
                        >
                          <td className="w-8 px-2 py-2">
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedBosses);
                                if (isExpanded) {
                                  newExpanded.delete(bossKey);
                                } else {
                                  newExpanded.add(bossKey);
                                }
                                setExpandedBosses(newExpanded);
                              }}
                              className="p-1 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <BossCell boss={bossGroup} />
                          </td>
                          <td className="px-4 py-2 text-center text-gray-400">
                            {(bossGroup.spawnChance * 100).toFixed(0)}%
                          </td>
                        </tr>
                        {isExpanded && sortedLocations.length > 0 && (
                          <tr className="bg-gray-800/30">
                            <td className="w-8 px-2 py-2" />
                            <td colSpan={2} className="px-4 py-2">
                              <div className="space-y-1">
                                {sortedLocations.map((location) => (
                                  <div
                                    key={location.name}
                                    className="flex items-center justify-between py-1 px-4 rounded hover:bg-gray-800/50"
                                  >
                                    <span
                                      className={cn(
                                        getLocationClasses(
                                          location.name,
                                          location.chance
                                        )
                                      )}
                                    >
                                      {location.name}
                                    </span>
                                    <span className="text-gray-400">
                                      {(location.chance * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const BossCell = ({ boss }: { boss: any }) => (
  <HoverCard>
    <HoverCardTrigger>
      <div className="flex items-center gap-2">
        {boss.imagePortraitLink && (
          <img
            src={boss.imagePortraitLink}
            alt={boss.boss}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <span className="font-medium text-gray-200 hover:text-purple-400 cursor-pointer border-b border-dotted">
          {boss.boss}
        </span>
      </div>
    </HoverCardTrigger>
    <HoverCardContent
      align="start"
      className="w-[300px] bg-gray-800 border-gray-700"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-gray-200">{boss.boss}</h1>
        {boss.imagePortraitLink && (
          <img
            src={boss.imagePortraitLink}
            alt={boss.boss}
            className="w-full h-32 object-cover rounded-lg"
          />
        )}
        <div className="space-y-1">
          {boss.health && (
            <div className="text-sm text-gray-400">
              <div className="font-bold text-gray-200 mb-1">Health:</div>
              <ul className="space-y-1">
                {boss.health.map((part: any) => (
                  <li key={part.bodyPart} className="flex justify-between">
                    <span className="capitalize">{part.bodyPart}</span>
                    <span>{part.max}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);
