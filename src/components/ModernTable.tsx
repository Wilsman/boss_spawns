import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, ChevronDown, ChevronRight, ChevronUp, Info, X } from "lucide-react";
import { SpawnData, Boss, DataMode, Health, Escort, GameMode, MobCatalog } from "@/types";
import { bossMatchesQuery, getCanonicalBossName } from "@/lib/boss-aliases";
import { mergeSpawnLocations } from "@/lib/spawn-location-utils";
import { BossDetailsPanel } from "@/components/BossDetailsPanel";
import { buildBossComparisons } from "@/lib/compare";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type CompareData = Record<GameMode, SpawnData[]>;
type NormalizedData = SpawnData[] | CompareData;

interface DataTableProps {
  data: NormalizedData | null;
  mode: DataMode;
  filters: { map: string; boss: string; search: string };
  catalog?: MobCatalog;
}

function getLocationClasses(location: string, chance: number) {
  if (location === "Unknown" || chance === 0)
    return "text-gray-500 italic opacity-75";
  return "text-gray-200";
}

function groupData<T extends Record<string, any>>(
  data: T[],
  key: keyof T
): Record<string, T[]> {
  return data.reduce((acc: Record<string, T[]>, item) => {
    const k = String(item[key]);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

interface Location {
  name: string;
  chance: number;
  spawnKey?: string | null;
  regularChance?: number | null;
  pveChance?: number | null;
  seasonChance?: number | null;
}
interface BossEntry {
  map: string;
  boss: string;
  spawnChance: number;
  locations: Location[];
  health: Health[] | null;
  imagePortraitLink: string | null;
  escorts: Escort[] | null;
  encounters: Boss[];
}

function getComparisonRate(entry: BossEntry, mode: GameMode): number | null {
  const location = entry.locations[0];
  if (!location) return null;
  if (mode === "regular") return location.regularChance ?? null;
  if (mode === "pve") return location.pveChance ?? null;
  return location.seasonChance ?? null;
}

const HOVER_CARD_CLASS =
  "w-[350px] overflow-hidden rounded-xl border border-white/[0.12] bg-[#0c0c0d]/95 p-2 text-gray-100 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-xl";

function getEscortCount(escort: Escort): number {
  return Math.max(0, ...escort.amount.map((amount) => amount.count));
}

function formatEscortRange(escort: Escort): string {
  const counts = escort.amount.map((amount) => amount.count);
  if (!counts.length) return "×0";
  const minimum = Math.min(...counts);
  const maximum = Math.max(...counts);
  return minimum === maximum ? `×${maximum}` : `×${minimum}–${maximum}`;
}

function mergeEscorts(escorts: Escort[]): Escort[] {
  return escorts.reduce((uniqueEscorts: Escort[], escort) => {
    const existingIndex = uniqueEscorts.findIndex(
      (existing) => existing.boss.name === escort.boss.name
    );

    if (existingIndex === -1) {
      uniqueEscorts.push(escort);
    } else if (
      getEscortCount(escort) > getEscortCount(uniqueEscorts[existingIndex])
    ) {
      uniqueEscorts[existingIndex] = escort;
    }

    return uniqueEscorts;
  }, []);
}

export function ModernTable({ data, mode, filters, catalog = {} }: DataTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isCompare = mode === "compare";
  const urlSort = searchParams.get("sort") || (isCompare ? "pvp" : "spawn");
  const urlDir = (searchParams.get("dir") as "asc" | "desc") || "desc";
  const [sortKey, setSortKey] = useState<string>(urlSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(urlDir);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedByMap, setExpandedByMap] = useState<Record<string, string | null>>({});

  const toggleSort = (key: string) => {
    const nextDir =
      sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc";
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
      className={`inline-flex items-center gap-1 text-gray-200 hover:text-white transition-colors ${
        align === "left"
          ? "justify-start"
          : align === "right"
          ? "justify-end"
          : "justify-center"
      } w-full`}
    >
      <span>{label}</span>
      {sortKey === columnKey ? (
        sortDir === "asc" ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <ArrowUpDown size={14} className="opacity-60" />
      )}
    </button>
  );

  const normalizedData = useMemo<NormalizedData | null>(() => {
    if (!data) return null;
    if (
      mode === "compare" &&
      (!("regular" in data) || !("pve" in data) || !("pvp-season" in data))
    )
      return null;
    return data;
  }, [data, mode]);

  const { processedData, groupedByMap } = useMemo(() => {
    if (!normalizedData)
      return {
        processedData: [] as BossEntry[],
        groupedByMap: {} as Record<string, BossEntry[]>,
      };
    let processedData: BossEntry[] = [];

    if (mode === "compare") {
      const compareData = normalizedData as CompareData;
      processedData = buildBossComparisons(compareData).map((row) => ({
        map: row.map,
        boss: row.boss,
        spawnChance: 0,
        locations: [
          {
            name: row.map,
            chance: 0,
            regularChance: row.rates.regular,
            pveChance: row.rates.pve,
            seasonChance: row.rates["pvp-season"],
          },
        ],
        health: row.representative.boss.health || null,
        imagePortraitLink: row.representative.boss.imagePortraitLink || null,
        escorts: row.representative.escorts || null,
        encounters: [row.representative],
      })).filter((entry) => {
        if (
          filters.map &&
          entry.map.toLowerCase() !== filters.map.toLowerCase()
        )
          return false;
        if (
          filters.boss &&
          !bossMatchesQuery(entry.boss, filters.boss)
        )
          return false;
        if (filters.search) {
          const s = filters.search.toLowerCase();
          return (
            entry.map.toLowerCase().includes(s) ||
            bossMatchesQuery(entry.boss, s)
          );
        }
        return true;
      });
    } else {
      processedData = (normalizedData as SpawnData[]).flatMap((map) => {
        if (
          !map.bosses ||
          (filters.map &&
            map.name.toLowerCase() !== filters.map.toLowerCase())
        )
          return [];
        const byKey = new Map<string, BossEntry>();
        map.bosses.forEach((b) => {
          const bossName = getCanonicalBossName(b.boss.name, b.spawnChance);
          if (
            filters.boss &&
            !bossMatchesQuery(b.boss.name, filters.boss, b.spawnChance)
          )
            return;
          if (filters.search) {
            const s = filters.search.toLowerCase();
            const matchMap = map.name.toLowerCase().includes(s);
            const matchBoss = bossMatchesQuery(b.boss.name, s, b.spawnChance);
            const matchLoc = b.spawnLocations?.some((loc) =>
              loc.name.toLowerCase().includes(s)
            );
            if (!matchMap && !matchBoss && !matchLoc) return;
          }
          const key = `${map.name}-${bossName}`;
          const existing = byKey.get(key);
          const locs = (b.spawnLocations || []).filter(
            (l) => l.name !== "Unknown" || l.chance > 0
          );
          if (!existing) {
            byKey.set(key, {
              map: map.name,
              boss: bossName,
              spawnChance: b.spawnChance,
              locations: locs.map((l) => ({ ...l })),
              health: b.boss.health ?? null,
              imagePortraitLink: b.boss.imagePortraitLink ?? null,
              escorts: mergeEscorts(b.escorts ?? []),
              encounters: [b],
            });
          } else {
            const mergedLocations = mergeSpawnLocations(existing.locations, locs);

            const uniqueEscorts = mergeEscorts([
              ...(existing.escorts ?? []),
              ...(b.escorts ?? []),
            ]);

            byKey.set(key, {
              ...existing,
              spawnChance: Math.max(existing.spawnChance, b.spawnChance),
              locations: mergedLocations,
              health: existing.health ?? b.boss.health ?? null,
              imagePortraitLink:
                existing.imagePortraitLink ?? b.boss.imagePortraitLink ?? null,
              escorts: uniqueEscorts,
              encounters: [...existing.encounters, b],
            });
          }
        });
        return Array.from(byKey.values());
      });
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
          ? "No differences found between PVP, PVE, and Season modes."
          : `No results found for "${filters.search}".`}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedMapNames.map((mapName) => {
        const items = groupedByMap[mapName];
        const mapDetails = !isCompare
          ? (normalizedData as SpawnData[]).find((map) => map.name === mapName)
          : undefined;
        const isCollapsed = collapsed[mapName] ?? false;
        return (
          <section
            key={mapName}
            className="overflow-visible rounded-xl border border-white/[0.09] bg-[#0a0a0b]"
          >
            <div
              className={`flex items-center rounded-t-xl bg-[#101011] ${
                isCollapsed ? "rounded-b-xl" : ""
              }`}
            >
              <button
                onClick={() =>
                  setCollapsed((p) => ({ ...p, [mapName]: !isCollapsed }))
                }
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 hover:bg-white/[0.025] transition-colors"
                aria-expanded={!isCollapsed}
              >
                <span className="text-base sm:text-lg font-bold text-white capitalize">
                  {mapName}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {items.length} {items.length === 1 ? "boss" : "bosses"}
                </span>
                <ChevronDown
                  size={18}
                  className={`transition-transform ${isCollapsed ? "" : "rotate-180"}`}
                />
              </button>
              {mapDetails && <MapInfo map={mapDetails} />}
            </div>
            {!isCollapsed && (
              <div className="p-3 sm:p-4">
                <div className="hidden sm:grid grid-cols-12 rounded-md border border-white/[0.045] bg-[#0d0d0e] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <div className={mode === "compare" ? "col-span-3" : "col-span-5"}>
                    <SortLabel label="Boss" columnKey="boss" align="left" />
                  </div>
                  {mode === "compare" ? (
                    <>
                      <div className="col-span-3 text-center text-red-300">
                        <SortLabel label="PvP" columnKey="pvp" />
                      </div>
                      <div className="col-span-3 text-center text-green-300">
                        <SortLabel label="PvE" columnKey="pve" />
                      </div>
                      <div className="col-span-3 text-center text-violet-300">
                        <SortLabel label="Season" columnKey="season" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-3 text-center">
                        <SortLabel label="Spawn" columnKey="spawn" />
                      </div>
                      <div className="col-span-4">
                        <SortLabel
                          label="Locations"
                          columnKey="location"
                          align="left"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-2 divide-y divide-white/[0.06]">
                  {[...items]
                    .sort((a, b) => {
                      if (mode === "compare") {
                        const sortMode: GameMode | null =
                          sortKey === "pvp"
                            ? "regular"
                            : sortKey === "pve"
                            ? "pve"
                            : sortKey === "season"
                            ? "pvp-season"
                            : null;
                        if (!sortMode) {
                          return sortDir === "asc"
                            ? a.boss.localeCompare(b.boss)
                            : b.boss.localeCompare(a.boss);
                        }
                        const va = getComparisonRate(a, sortMode);
                        const vb = getComparisonRate(b, sortMode);
                        if (va === null && vb === null) return 0;
                        if (va === null) return 1;
                        if (vb === null) return -1;
                        const difference = va - vb;
                        return sortDir === "asc" ? difference : -difference;
                      }
                      let va: number | string = 0,
                        vb: number | string = 0;
                      switch (sortKey) {
                        case "spawn":
                          va = a.spawnChance;
                          vb = b.spawnChance;
                          break;
                        case "location":
                          return sortDir === "asc"
                            ? (a.locations[0]?.name || "").localeCompare(
                                b.locations[0]?.name || ""
                              )
                            : (b.locations[0]?.name || "").localeCompare(
                                a.locations[0]?.name || ""
                              );
                        case "boss":
                        default:
                          return sortDir === "asc"
                            ? a.boss.localeCompare(b.boss)
                            : b.boss.localeCompare(a.boss);
                      }
                      const d = Number(va) - Number(vb);
                      return sortDir === "asc" ? d : -d;
                    })
                    .map((row) => {
                      if (mode === "compare") {
                        const rateCells = [
                          {
                            key: "pvp",
                            value: getComparisonRate(row, "regular"),
                            track: "bg-red-900/20",
                            fill: "bg-red-500/40",
                            text: "text-red-300",
                          },
                          {
                            key: "pve",
                            value: getComparisonRate(row, "pve"),
                            track: "bg-green-900/20",
                            fill: "bg-green-500/40",
                            text: "text-green-300",
                          },
                          {
                            key: "season",
                            value: getComparisonRate(row, "pvp-season"),
                            track: "bg-violet-900/20",
                            fill: "bg-violet-500/40",
                            text: "text-violet-300",
                          },
                        ];
                        return (
                          <div
                            key={row.boss}
                            className="grid grid-cols-12 gap-3 items-center px-3 py-3 hover:bg-gray-800/30 rounded-md"
                          >
                            <div className="col-span-12 sm:col-span-3">
                              <BossCell boss={row} />
                            </div>
                            {rateCells.map((cell) => (
                              <div key={cell.key} className="col-span-4 sm:col-span-3">
                                <div className={`relative h-5 rounded ${cell.track}`}>
                                  {cell.value !== null && (
                                    <div
                                      className={`absolute left-0 top-0 h-full ${cell.fill}`}
                                      style={{
                                        width: `${Math.max(
                                          0,
                                          Math.min(100, cell.value * 100)
                                        )}%`,
                                      }}
                                    />
                                  )}
                                  <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${cell.text}`}>
                                    {cell.value === null
                                      ? "—"
                                      : `${(cell.value * 100).toFixed(0)}%`}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      const locs = [...row.locations].sort(
                        (a: any, b: any) => b.chance - a.chance
                      );
                      const isExpanded = expandedByMap[mapName] === row.boss;
                      const toggleExpanded = () =>
                        setExpandedByMap((current) => ({
                          ...current,
                          [mapName]: current[mapName] === row.boss ? null : row.boss,
                        }));
                      return (
                        <div key={row.boss} className="rounded-md overflow-hidden">
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`${isExpanded ? "Close" : "Open"} ${row.boss} details`}
                            aria-expanded={isExpanded}
                            onClick={toggleExpanded}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleExpanded();
                              }
                            }}
                            className={`group relative grid cursor-pointer grid-cols-12 items-center gap-3 rounded-md px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30 ${
                              isExpanded
                                ? "bg-white/[0.045]"
                                : "hover:bg-white/[0.025]"
                            }`}
                          >
                            <div className="col-span-12 pr-20 sm:col-span-5 sm:pr-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                                    isExpanded
                                      ? "border-white/[0.2] bg-white/[0.08] text-white"
                                      : "border-white/[0.1] bg-[#121214] text-gray-500 group-hover:border-white/[0.18] group-hover:text-gray-200"
                                  }`}
                                >
                                  <ChevronRight
                                    size={14}
                                    className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                  />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <BossCell boss={row} hoverDisabled={isExpanded} />
                                </div>
                              </div>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                              <div className="relative h-5 overflow-hidden rounded bg-[#151517]">
                                <div
                                  className="absolute left-0 top-0 h-full bg-blue-500/55"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(100, row.spawnChance * 100)
                                    )}%`,
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-slate-100 text-sm">
                                  {(row.spawnChance * 100).toFixed(0)}%
                                </div>
                              </div>
                            </div>
                            <div className="col-span-6 flex flex-wrap gap-1 sm:col-span-4 sm:pr-20">
                              {locs.length === 0 ? (
                                <span className="italic text-gray-500">
                                  (No specific location)
                                </span>
                              ) : (
                                locs.map((l, idx) => (
                                  <span
                                    key={`${l.name}-${idx}`}
                                    className={`rounded bg-[#171719] px-2 py-1 text-gray-200 ring-1 ring-white/[0.09] ${getLocationClasses(
                                      l.name,
                                      l.chance
                                    )}`}
                                  >
                                    {l.name}
                                    <span className="ml-1 text-gray-400">
                                      {l.chance > 0
                                        ? `${(l.chance * 100).toFixed(0)}%`
                                        : "-"}
                                    </span>
                                  </span>
                                ))
                              )}
                            </div>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none absolute right-3 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all top-3 sm:top-1/2 sm:-translate-y-1/2 ${
                                isExpanded
                                  ? "border-white/[0.2] bg-white/[0.08] text-white"
                                  : "border-white/[0.1] bg-[#171719] text-gray-500 group-hover:border-white/[0.18] group-hover:bg-white/[0.05] group-hover:text-gray-200"
                              }`}
                            >
                              {isExpanded ? "Hide" : "Details"}
                              <ChevronRight
                                size={13}
                                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </span>
                          </div>
                          {row.escorts && row.escorts.length > 0 && (
                            <EscortRows escorts={row.escorts} />
                          )}
                          {isExpanded && (
                            <BossDetailsPanel
                              bossName={row.boss}
                              encounters={row.encounters}
                              catalog={catalog}
                              mode={mode as GameMode}
                              raidDurationMinutes={mapDetails?.raidDuration}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

const EscortRows = ({ escorts }: { escorts: Escort[] }) => (
  <div className="border-t border-dashed border-gray-800/80 py-1">
    {escorts.map((escort) => {
      return (
        <HoverCard key={escort.boss.name}>
          <HoverCardTrigger>
            <div className="grid cursor-help grid-cols-12 items-center gap-3 rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800/20">
              <div className="col-span-12 sm:col-span-5 flex items-center gap-2 pl-7">
                <span aria-hidden="true" className="text-gray-600">
                  ↳
                </span>
                {escort.boss.imagePortraitLink && (
                  <img
                    src={escort.boss.imagePortraitLink}
                    alt={escort.boss.name}
                    className="h-6 w-6 rounded-full object-cover opacity-85"
                  />
                )}
                <span className="border-b border-dotted border-gray-600">
                  {escort.boss.name}
                </span>
                <span className="text-gray-500">
                  {formatEscortRange(escort)}
                </span>
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            align="start"
            className={HOVER_CARD_CLASS}
          >
            <BossInfo
              name={escort.boss.name}
              health={escort.boss.health ?? null}
              imagePortraitLink={escort.boss.imagePortraitLink ?? null}
            />
          </HoverCardContent>
        </HoverCard>
      );
    })}
  </div>
);

const BossInfo = ({
  name,
  health,
  imagePortraitLink,
}: {
  name: string;
  health: Health[] | null;
  imagePortraitLink: string | null;
}) => {
  const totalHealth = health?.reduce((total, part) => total + part.max, 0) ?? 0;

  return (
    <div className="space-y-3">
      <div className="relative min-h-32 overflow-hidden rounded-lg border border-white/[0.09] bg-gradient-to-br from-[#1a1a1d] via-[#101011] to-[#0b0b0c] px-4 py-3">
        <div className="absolute -left-8 -top-10 h-28 w-28 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="relative z-10 flex h-full max-w-[62%] flex-col justify-end gap-2">
          <h3 className="text-xl font-bold tracking-tight text-white">{name}</h3>
          {health && (
            <span className="w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 font-mono text-xs font-bold text-sky-100">
              TOTAL HP {totalHealth}
            </span>
          )}
        </div>
        {imagePortraitLink && (
          <>
            <div className="absolute inset-y-0 right-0 w-3/5 bg-gradient-to-r from-[#0b0b0c] via-transparent to-transparent" />
            <img
              src={imagePortraitLink}
              alt={name}
              className="absolute inset-y-0 right-0 h-full w-[52%] object-cover object-top opacity-85"
            />
          </>
        )}
      </div>

      {health && (
        <div className="rounded-lg border border-white/[0.08] bg-black/30 p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Health profile
            </span>
            <span className="h-px w-16 bg-gradient-to-r from-sky-300/40 to-transparent" />
          </div>
          <ul className="grid grid-cols-2 gap-1">
            {health.map((part) => (
              <li
                key={part.bodyPart}
                className="flex items-center justify-between rounded-md bg-white/[0.045] px-2 py-1.5 text-xs"
              >
                <span className="capitalize text-slate-400">{part.bodyPart}</span>
                <span className="font-mono font-bold text-slate-100">{part.max}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const MapInfo = ({ map }: { map: SpawnData }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative mr-2 ${open ? "z-50" : "z-10"}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-2 text-gray-500 hover:bg-white/[0.06] hover:text-blue-200"
        aria-label={`${map.name} raid information`}
        aria-expanded={open}
      >
        <Info size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-white/[0.12] bg-[#0c0c0d]/95 p-3 text-left shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Raid information</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
              aria-label="Close map information"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-xs">
            <span className="rounded bg-slate-800/80 px-2 py-1.5"><b className="block text-white">{map.raidDuration ?? "?"} min</b>Duration</span>
            <span className="rounded bg-slate-800/80 px-2 py-1.5"><b className="block text-white">{map.players ?? "?"}</b>Players</span>
            <span className="rounded bg-slate-800/80 px-2 py-1.5"><b className="block text-white">{map.minPlayerLevel ?? "?"}–{map.maxPlayerLevel ?? "?"}</b>Levels</span>
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">AI roster</p>
          <div className="mt-1 flex max-h-40 flex-wrap gap-1 overflow-auto">
            {(map.enemies ?? []).map((enemy) => (
              <span key={enemy.key} className="rounded bg-slate-800/70 px-2 py-1 text-xs text-slate-300">
                {enemy.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Boss hover cell (duplicated to keep component self-contained)
const BossCell = ({
  boss,
  hoverDisabled = false,
}: {
  boss: BossEntry;
  hoverDisabled?: boolean;
}) => {
  const getImageUrl = (boss: BossEntry) => {
    if (boss.boss === "Shadow of Tagilla")
      return "/Shadow_Tagilla_Long_crop.webp";
    if (boss.boss === "Vengeful Killa") return "/killa-portrait.webp";
    if (boss.boss === "BEAR") return "/BEAR.webp";
    if (boss.boss === "USEC") return "/USEC.webp";
    if (boss.boss === "Labyrinthian") return "/SCAV.webp";
    return boss.imagePortraitLink || undefined;
  };
  const imageUrl = getImageUrl(boss);

  const bossCell = (
    <div className="flex items-center gap-2">
      {boss.imagePortraitLink && (
        <img
          src={imageUrl}
          alt={boss.boss}
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
      <span className="font-medium text-gray-200 hover:text-blue-400 cursor-pointer border-b border-dotted">
        {boss.boss}
      </span>
    </div>
  );

  if (hoverDisabled) return bossCell;

  return (
    <HoverCard>
      <HoverCardTrigger>{bossCell}</HoverCardTrigger>
      <HoverCardContent
        align="start"
        className={HOVER_CARD_CLASS}
      >
        <div className="flex flex-col gap-3">
          <BossInfo
            name={boss.boss}
            health={boss.health}
            imagePortraitLink={imageUrl ?? null}
          />

          {boss.escorts && boss.escorts.length > 0 && (
            <div className="rounded-lg border border-white/[0.08] bg-black/30 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  Escort detail
                </span>
                <span className="font-mono text-[10px] text-sky-300/70">
                  {boss.escorts.length} UNIT{boss.escorts.length === 1 ? "" : "S"}
                </span>
              </div>
              <div className="space-y-1">
                {boss.escorts.map((escort: Escort, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-md bg-white/[0.045] px-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {escort.boss.imagePortraitLink && (
                        <img
                          src={escort.boss.imagePortraitLink}
                          alt={escort.boss.name}
                          className="h-6 w-6 rounded-full border border-slate-400/20 object-cover"
                        />
                      )}
                      <div>
                        <span className="font-medium text-slate-200">
                          {escort.boss.name}
                        </span>
                        {escort.boss.health && (
                          <div className="font-mono text-[10px] text-slate-500">
                            HP:{" "}
                            {escort.boss.health.reduce(
                              (acc: number, part: Health) => acc + part.max,
                              0
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sky-200/70">
                      {escort.amount[0]?.count > 1
                        ? `×${escort.amount[0]?.count}`
                        : ""}
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

export default ModernTable;
