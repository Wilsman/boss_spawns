import { SpawnData, Boss, DataMode, Health, SpawnLocation } from "@/types";
import { useMemo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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

  return (
    <div className="space-y-6">
      {sortedMapNames.map((mapName) => {
        const items = groupedByMap[mapName];

        return (
          <div key={mapName} className="space-y-2">
            {/* Map Name Header center and stands out */}
            <h3 className="text-lg font-bold text-white text-center px-2 capitalize bg-gray-800 py-2 rounded-lg">
              {mapName}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-700 -mx-2 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-800">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 w-1/4">
                      Boss
                    </th>
                    {mode === "compare" ? (
                      <>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-red-300 w-1/2">
                          PVP Chance
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-green-300 w-1/2">
                          PVE Chance
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300 w-1/6">
                          Spawn Chance
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 w-1/3">
                          Location
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300 w-1/6">
                          Location Chance
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={mode === "compare" ? 3 : 4}
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
                    const rowCount = Math.max(sortedLocations.length, 1);

                    if (sortedLocations.length === 0) {
                      return (
                        <tr key={`${bossGroup.boss}-no-location`}>
                          <td className="px-4 py-2">
                            <BossCell boss={bossGroup} />
                          </td>
                          <td className="px-4 py-2 text-center text-gray-400">
                            {(bossGroup.spawnChance * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-2 italic text-gray-500">
                            (No specific location)
                          </td>
                          <td className="px-4 py-2 text-center text-gray-400">
                            -
                          </td>
                        </tr>
                      );
                    }

                    return sortedLocations.map((location, locIndex) => {
                      const isFirstRow = locIndex === 0;

                      return (
                        <tr
                          key={`${bossGroup.boss}-${location.name}`}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          {isFirstRow && (
                            <td
                              rowSpan={rowCount}
                              className="px-4 py-2 align-top border-r border-gray-700"
                            >
                              <BossCell boss={bossGroup} />
                            </td>
                          )}
                          {isFirstRow && (
                            <td
                              rowSpan={rowCount}
                              className="px-4 py-2 text-center align-top border-r border-gray-700 text-gray-400"
                            >
                              {(bossGroup.spawnChance * 100).toFixed(0)}%
                            </td>
                          )}
                          <td
                            className={`px-4 py-2 ${getLocationClasses(
                              location.name,
                              location.chance
                            )}`}
                          >
                            {location.name}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-400">
                            {location.chance > 0
                              ? `${(location.chance * 100).toFixed(0)}%`
                              : "-"}
                          </td>
                        </tr>
                      );
                    });
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
      <span className="font-medium text-gray-200 hover:text-purple-400 cursor-pointer border-b border-dotted">
        {boss.boss}
      </span>
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
