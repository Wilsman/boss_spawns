import { SpawnData, Boss, DataMode, Health, SpawnLocation, Escort } from "@/types";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

type CompareData = {
  regular: SpawnData[];
  pve: SpawnData[];
};

type NormalizedData = SpawnData[] | CompareData;
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface DataTableProps {
  data: NormalizedData | null;
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

function groupData<T extends Record<string, any>>(
  data: T[],
  key: keyof T
): Record<string, T[]> {
  return data.reduce((acc: Record<string, T[]>, item) => {
    const groupKey = String(item[key]);
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
  escorts: Escort[] | null;
}

export function DataTable({ data, mode, filters }: DataTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const isCompare = mode === "compare";
  const urlSort = searchParams.get("sort") || (isCompare ? "delta" : "spawn");
  const urlDir = (searchParams.get("dir") as "asc" | "desc") || "desc";
  const [sortKey, setSortKey] = useState<string>(urlSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(urlDir);

  const toggleSort = (key: string) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc";
    setSortKey(key);
    setSortDir(nextDir);
    const params = new URLSearchParams(searchParams);
    params.set("sort", key);
    params.set("dir", nextDir);
    setSearchParams(params);
  };

  const SortLabel = ({
    label,
    columnKey,
    align = "center",
  }: {
    label: string;
    columnKey: string;
    align?: "left" | "center" | "right";
  }) => (
    <button
      onClick={() => toggleSort(columnKey)}
      className={`inline-flex items-center gap-1 text-gray-300 hover:text-white transition-colors ${
        align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center"
      } w-full`}
    >
      <span>{label}</span>
      {sortKey === columnKey ? (
        sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      ) : (
        <ArrowUpDown size={14} className="opacity-60" />
      )}
    </button>
  );
  const normalizedData = useMemo<NormalizedData | null>(() => {
    if (!data) return null;

    // If we're in compare mode, ensure we have the correct data structure
    if (mode === "compare" && (!("regular" in data) || !("pve" in data))) {
      console.error("Invalid data structure for compare mode");
      return null;
    }

    return data;
  }, [data, mode]);

  const { processedData, groupedByMap } = useMemo<{
    processedData: BossEntry[];
    groupedByMap: Record<string, BossEntry[]>;
  }>(() => {
    if (!normalizedData) return { processedData: [], groupedByMap: {} };

    let processedData: BossEntry[] = [];

    if (mode === "compare") {
      if (
        !normalizedData ||
        !("regular" in normalizedData) ||
        !("pve" in normalizedData)
      ) {
        console.error("Invalid data structure for compare mode");
        return { processedData: [], groupedByMap: {} };
      }

      const compareData = normalizedData as CompareData;
      const regularData = Array.isArray(compareData.regular)
        ? compareData.regular
        : [];
      const pveData = Array.isArray(compareData.pve) ? compareData.pve : [];

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
              escorts: regularBoss.escorts || null,
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
    } else if (Array.isArray(normalizedData)) {
      processedData = normalizedData.flatMap((map: SpawnData) => {
        // Skip if no bosses or map filter doesn't match
        if (
          !map.bosses ||
          (filters.map &&
            !map.name.toLowerCase().includes(filters.map.toLowerCase()))
        ) {
          return [];
        }

        const uniqueBossEntries = new Map<string, BossEntry>();

        map.bosses.forEach((bossEntry: Boss) => {
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
            const matchesLocation = bossEntry.spawnLocations?.some((loc: SpawnLocation) =>
              loc.name.toLowerCase().includes(search)
            );
            if (!matchesMap && !matchesBoss && !matchesLocation) return;
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
              escorts: bossEntry.escorts ?? null,
            });
          } else {
            const updatedLocations = existingEntry.locations.map(
              (loc: Location): Location => {
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

            // Merge escorts from duplicate entries
            const existingEscorts = existingEntry.escorts || [];
            const newEscorts = bossEntry.escorts || [];
            const allEscorts = [...existingEscorts, ...newEscorts];
            
            // Remove duplicates by escort boss name
            const uniqueEscorts = allEscorts.reduce((acc: Escort[], escort: Escort) => {
              const existingIndex = acc.findIndex(e => e.boss.name === escort.boss.name);
              if (existingIndex === -1) {
                acc.push(escort);
              } else {
                // If escort already exists, update the count to the higher value
                const existingCount = acc[existingIndex].amount[0]?.count || 0;
                const newCount = escort.amount[0]?.count || 0;
                if (newCount > existingCount) {
                  acc[existingIndex] = escort;
                }
              }
              return acc;
            }, []);

            uniqueBossEntries.set(key, {
              ...existingEntry,
              locations: updatedLocations,
              escorts: uniqueEscorts,
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
            <div className="overflow-x-auto rounded-lg border border-gray-700 shadow-sm -mx-2 sm:mx-0">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 w-1/4">
                      <SortLabel label="Boss" columnKey="boss" align="left" />
                    </th>
                    {mode === "compare" ? (
                      <>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-red-300 w-1/5">
                          PvP
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-green-300 w-1/5">
                          PvE
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300 w-1/5">
                          Δ (PvE − PvP)
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300 w-1/6">
                          <SortLabel label="Spawn Chance" columnKey="spawn" />
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300 w-1/3">
                          <SortLabel label="Location" columnKey="location" align="left" />
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-300 w-1/6">
                          <SortLabel label="Location Chance" columnKey="locationChance" />
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={mode === "compare" ? 4 : 4}
                        className="text-center text-gray-500 py-4"
                      >
                        No bosses found for this map with the current filter.
                      </td>
                    </tr>
                  )}
                  {[...items]
                    .sort((a, b) => {
                      if (mode === "compare") {
                        const aReg = Math.max(
                          ...(a.locations.map((l: Location) => l.regularChance || 0))
                        );
                        const aPve = Math.max(
                          ...(a.locations.map((l: Location) => l.pveChance || 0))
                        );
                        const bReg = Math.max(
                          ...(b.locations.map((l: Location) => l.regularChance || 0))
                        );
                        const bPve = Math.max(
                          ...(b.locations.map((l: Location) => l.pveChance || 0))
                        );
                        const aDelta = aPve - aReg;
                        const bDelta = bPve - bReg;

                        let valA = 0;
                        let valB = 0;
                        switch (sortKey as any) {
                          case "pvp":
                            valA = aReg;
                            valB = bReg;
                            break;
                          case "pve":
                            valA = aPve;
                            valB = bPve;
                            break;
                          case "delta":
                            valA = aDelta;
                            valB = bDelta;
                            break;
                          case "boss":
                          default:
                            return sortDir === "asc"
                              ? a.boss.localeCompare(b.boss)
                              : b.boss.localeCompare(a.boss);
                        }
                        const diff = valA - valB;
                        return sortDir === "asc" ? diff : -diff;
                      }

                      // Regular/PvE modes
                      let valA: number | string = 0;
                      let valB: number | string = 0;
                      switch (sortKey as any) {
                        case "spawn":
                          valA = a.spawnChance;
                          valB = b.spawnChance;
                          break;
                        case "locationChance":
                          valA = Math.max(...a.locations.map((l) => l.chance));
                          valB = Math.max(...b.locations.map((l) => l.chance));
                          break;
                        case "location":
                          valA = a.locations[0]?.name || "";
                          valB = b.locations[0]?.name || "";
                          return sortDir === "asc"
                            ? String(valA).localeCompare(String(valB))
                            : String(valB).localeCompare(String(valA));
                        case "boss":
                        default:
                          return sortDir === "asc"
                            ? a.boss.localeCompare(b.boss)
                            : b.boss.localeCompare(a.boss);
                      }
                      const diff = Number(valA) - Number(valB);
                      return sortDir === "asc" ? diff : -diff;
                    })
                    .map((bossGroup) => {
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
                      const delta = pveChance - regularChance;
                      const deltaPct = (delta * 100).toFixed(0);
                      const deltaColor =
                        delta > 0
                          ? "text-green-300"
                          : delta < 0
                          ? "text-red-300"
                          : "text-gray-300";

                      return (
                        <tr
                          key={bossGroup.boss}
                          className="hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-2">
                            <BossCell boss={bossGroup} />
                          </td>
                          <td className="px-4 py-2 text-center bg-red-700/20">
                            <div className="relative h-5 rounded overflow-hidden bg-red-900/20">
                              <div
                                className="absolute left-0 top-0 h-full bg-red-500/40"
                                style={{ width: `${Math.max(0, Math.min(100, regularChance * 100))}%` }}
                              />
                              <span className="relative z-10 text-red-300 font-medium">
                                {(regularChance * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center bg-green-700/20">
                            <div className="relative h-5 rounded overflow-hidden bg-green-900/20">
                              <div
                                className="absolute left-0 top-0 h-full bg-green-500/40"
                                style={{ width: `${Math.max(0, Math.min(100, pveChance * 100))}%` }}
                              />
                              <span className="relative z-10 text-green-300 font-medium">
                                {(pveChance * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`font-semibold ${deltaColor}`}>
                              {delta > 0 ? "▲" : delta < 0 ? "▼" : "–"} {deltaPct}%
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

// TODO: Remove this after API returns correct images
const BossCell = ({ boss }: { boss: BossEntry }) => {
  const getImageUrl = (boss: BossEntry) => {
    // Temporary fix for specific boss images
    if (boss.boss === "Shadow of Tagilla") {
      return "/Shadow_Tagilla_Long_crop.webp";
    }
    if (boss.boss === "Vengeful Killa") {
      return "/killa-portrait.webp";
    }
    if (boss.boss === "BEAR") {
      return "/BEAR.webp";
    }
    if (boss.boss === "USEC") {
      return "/USEC.webp";
    }
    if (boss.boss === "Labyrinthian") {
      return "/SCAV.webp";
    }
    return boss.imagePortraitLink;
  };

  const imageUrl = getImageUrl(boss);

  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="flex items-center gap-2">
          {boss.imagePortraitLink && (
            <img
              src={imageUrl}
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
        className="w-[320px] bg-gray-800 border-gray-700"
      >
        <div className="flex flex-col gap-3">
          <h1 className="font-semibold text-gray-200">{boss.boss}</h1>
          {boss.imagePortraitLink && (
            <img
              src={imageUrl}
              alt={boss.boss}
              className="w-full h-32 object-cover rounded-lg"
            />
          )}
          
          {boss.health && (
            <div className="text-sm text-gray-400">
              <div className="flex justify-between">
                <span className="font-bold text-gray-200 mb-1">Health:</span>
                <span className="font-bold text-gray-200">
                  Total:{" "}
                  {boss.health.reduce(
                    (acc: number, part: Health) => acc + part.max,
                    0
                  )}
                </span>
              </div>
              <ul className="space-y-1">
                {boss.health.map((part: Health) => (
                  <li key={part.bodyPart} className="flex justify-between">
                    <span className="capitalize">{part.bodyPart}</span>
                    <span>{part.max}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {boss.escorts && boss.escorts.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="font-bold text-gray-200 mb-2 block">Escorts:</span>
              <div className="space-y-2">
                {boss.escorts.map((escort: Escort, index: number) => (
                  <div key={index} className="flex items-start justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {escort.boss.imagePortraitLink && (
                        <img 
                          src={escort.boss.imagePortraitLink} 
                          alt={escort.boss.name} 
                          className="w-5 h-5 rounded-full object-cover" 
                        />
                      )}
                      <div>
                        <span className="text-gray-300">{escort.boss.name}</span>
                        {escort.boss.health && (
                          <div className="text-gray-500 text-xs">
                            HP: {escort.boss.health.reduce((acc: number, part: Health) => acc + part.max, 0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-500">
                      {escort.amount[0]?.count > 1 ? `×${escort.amount[0]?.count}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
