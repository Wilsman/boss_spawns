import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { SpawnData, Boss, DataMode, Health, Escort } from "@/types";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type CompareData = { regular: SpawnData[]; pve: SpawnData[] };
type NormalizedData = SpawnData[] | CompareData;

interface DataTableProps {
  data: NormalizedData | null;
  mode: DataMode;
  filters: { map: string; boss: string; search: string };
}

function getLocationClasses(location: string, chance: number) {
  if (location === "Unknown" || chance === 0) return "text-gray-500 italic opacity-75";
  return "text-gray-200";
}

function groupData<T extends Record<string, any>>(data: T[], key: keyof T): Record<string, T[]> {
  return data.reduce((acc: Record<string, T[]>, item) => {
    const k = String(item[key]);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

interface Location { name: string; chance: number; regularChance?: number; pveChance?: number; hasDifference?: boolean }
interface BossEntry { 
  map: string; 
  boss: string; 
  spawnChance: number; 
  locations: Location[]; 
  health: Health[] | null; 
  imagePortraitLink: string | null;
  escorts: Escort[] | null;
}

export function ModernTable({ data, mode, filters }: DataTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isCompare = mode === "compare";
  const urlSort = searchParams.get("sort") || (isCompare ? "delta" : "spawn");
  const urlDir = (searchParams.get("dir") as "asc" | "desc") || "desc";
  const [sortKey, setSortKey] = useState<string>(urlSort);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(urlDir);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSort = (key: string) => {
    const nextDir = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : "desc";
    setSortKey(key);
    setSortDir(nextDir);
    const params = new URLSearchParams(searchParams);
    params.set("sort", key);
    params.set("dir", nextDir);
    setSearchParams(params);
  };

  const SortLabel = ({ label, columnKey, align = "center" }: { label: string; columnKey: string; align?: "left" | "center" | "right" }) => (
    <button
      onClick={() => toggleSort(columnKey)}
      className={`inline-flex items-center gap-1 text-gray-200 hover:text-white transition-colors ${
        align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center"
      } w-full`}
    >
      <span>{label}</span>
      {sortKey === columnKey ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ArrowUpDown size={14} className="opacity-60" />}
    </button>
  );

  const normalizedData = useMemo<NormalizedData | null>(() => {
    if (!data) return null;
    if (mode === "compare" && (!("regular" in data) || !("pve" in data))) return null;
    return data;
  }, [data, mode]);

  const { processedData, groupedByMap } = useMemo(() => {
    if (!normalizedData) return { processedData: [] as BossEntry[], groupedByMap: {} as Record<string, BossEntry[]> };
    let processedData: BossEntry[] = [];

    if (mode === "compare") {
      const compareData = normalizedData as CompareData;
      const regularData = Array.isArray(compareData.regular) ? compareData.regular : [];
      const pveData = Array.isArray(compareData.pve) ? compareData.pve : [];
      const unique = new Map<string, BossEntry>();

      regularData.forEach((rMap: SpawnData) => {
        const pMap = pveData.find((m) => m.name === rMap.name);
        if (!pMap) return;
        rMap.bosses.forEach((rBoss: Boss) => {
          const pBoss = pMap.bosses.find((b) => b.boss.name === rBoss.boss.name);
          if (!pBoss) return;
          const r = rBoss.spawnChance;
          const p = pBoss.spawnChance;
          if (r !== p) {
            const bossName = rBoss.boss.name === "infected" ? "Infected(Zombie)" : rBoss.boss.name;
            const key = `${rMap.name}-${bossName}`;
            unique.set(key, {
              map: rMap.name,
              boss: bossName,
              spawnChance: 0,
              locations: [{ name: rMap.name, chance: 0, regularChance: r, pveChance: p, hasDifference: true }],
              health: rBoss.boss.health || null,
              imagePortraitLink: rBoss.boss.imagePortraitLink || null,
              escorts: rBoss.escorts || null,
            });
          }
        });
      });

      processedData = Array.from(unique.values()).filter((entry) => {
        if (filters.map && entry.map.toLowerCase() !== filters.map.toLowerCase()) return false;
        if (filters.boss && entry.boss.toLowerCase() !== filters.boss.toLowerCase()) return false;
        if (filters.search) {
          const s = filters.search.toLowerCase();
          return entry.map.toLowerCase().includes(s) || entry.boss.toLowerCase().includes(s);
        }
        return true;
      });
    } else {
      processedData = (normalizedData as SpawnData[]).flatMap((map) => {
        if (!map.bosses || (filters.map && !map.name.toLowerCase().includes(filters.map.toLowerCase()))) return [];
        const byKey = new Map<string, BossEntry>();
        map.bosses.forEach((b) => {
          const bossName = b.boss.name;
          if (filters.boss && !bossName.toLowerCase().includes(filters.boss.toLowerCase())) return;
          if (filters.search) {
            const s = filters.search.toLowerCase();
            const matchMap = map.name.toLowerCase().includes(s);
            const matchBoss = bossName.toLowerCase().includes(s);
            const matchLoc = b.spawnLocations?.some((loc) => loc.name.toLowerCase().includes(s));
            if (!matchMap && !matchBoss && !matchLoc) return;
          }
          const key = `${map.name}-${bossName}`;
          const existing = byKey.get(key);
          const locs = (b.spawnLocations || []).filter((l) => l.name !== "Unknown" || l.chance > 0);
          if (!existing) {
            byKey.set(key, {
              map: map.name,
              boss: bossName,
              spawnChance: b.spawnChance,
              locations: locs.map((l) => ({ name: l.name, chance: l.chance })),
              health: b.boss.health ?? null,
              imagePortraitLink: b.boss.imagePortraitLink ?? null,
              escorts: b.escorts ?? null,
            });
          } else {
            // Merge escorts from duplicate entries
            const existingEscorts = existing.escorts || [];
            const newEscorts = b.escorts || [];
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
            
            byKey.set(key, {
              ...existing,
              escorts: uniqueEscorts,
            });
          }
        });
        return Array.from(byKey.values());
      });
    }

    const groupedByMap = groupData(processedData, "map");
    return { processedData, groupedByMap };
  }, [normalizedData, mode, filters]);

  const sortedMapNames = useMemo(() => Object.keys(groupedByMap).sort(), [groupedByMap]);

  if (!data) return null;
  if (processedData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {mode === "compare" ? "No differences found between PVP and PVE modes." : `No results found for "${filters.search}".`}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedMapNames.map((mapName) => {
        const items = groupedByMap[mapName];
        const isCollapsed = collapsed[mapName] ?? false;
        return (
          <section key={mapName} className="rounded-xl border border-gray-700/60 overflow-hidden bg-[#0c1117]/60">
            <button onClick={() => setCollapsed((p) => ({ ...p, [mapName]: !isCollapsed }))} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900/40 hover:bg-gray-900/60 transition-colors" aria-expanded={!isCollapsed}>
              <span className="text-base sm:text-lg font-bold text-white capitalize">{mapName}</span>
              <span className="ml-auto text-xs text-gray-400">{items.length} bosses</span>
              <ChevronDown size={18} className={`transition-transform ${isCollapsed ? "" : "rotate-180"}`} />
            </button>
            {!isCollapsed && (
              <div className="p-3 sm:p-4">
                <div className="hidden sm:grid grid-cols-12 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-300 bg-gray-900/50 rounded-md">
                  <div className="col-span-5"><SortLabel label="Boss" columnKey="boss" align="left" /></div>
                  {mode === "compare" ? (
                    <>
                      <div className="col-span-3 text-center text-red-300"><SortLabel label="PvP" columnKey="pvp" /></div>
                      <div className="col-span-3 text-center text-green-300"><SortLabel label="PvE" columnKey="pve" /></div>
                      <div className="col-span-1 text-center"><SortLabel label="Delta" columnKey="delta" /></div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-3 text-center"><SortLabel label="Spawn" columnKey="spawn" /></div>
                      <div className="col-span-4"><SortLabel label="Locations" columnKey="location" align="left" /></div>
                    </>
                  )}
                </div>

                <div className="mt-2 divide-y divide-gray-800">
                  {[...items]
                    .sort((a, b) => {
                      if (mode === "compare") {
                        const aReg = Math.max(...a.locations.map((l: any) => l.regularChance || 0));
                        const aPve = Math.max(...a.locations.map((l: any) => l.pveChance || 0));
                        const bReg = Math.max(...b.locations.map((l: any) => l.regularChance || 0));
                        const bPve = Math.max(...b.locations.map((l: any) => l.pveChance || 0));
                        const aDelta = aPve - aReg;
                        const bDelta = bPve - bReg;
                        let va = 0, vb = 0;
                        switch (sortKey) {
                          case "pvp": va = aReg; vb = bReg; break;
                          case "pve": va = aPve; vb = bPve; break;
                          case "delta": va = aDelta; vb = bDelta; break;
                          case "boss": default:
                            return sortDir === "asc" ? a.boss.localeCompare(b.boss) : b.boss.localeCompare(a.boss);
                        }
                        const d = va - vb;
                        return sortDir === "asc" ? d : -d;
                      }
                      let va: number | string = 0, vb: number | string = 0;
                      switch (sortKey) {
                        case "spawn": va = a.spawnChance; vb = b.spawnChance; break;
                        case "location":
                          return sortDir === "asc"
                            ? (a.locations[0]?.name || "").localeCompare(b.locations[0]?.name || "")
                            : (b.locations[0]?.name || "").localeCompare(a.locations[0]?.name || "");
                        case "boss": default:
                          return sortDir === "asc" ? a.boss.localeCompare(b.boss) : b.boss.localeCompare(a.boss);
                      }
                      const d = Number(va) - Number(vb);
                      return sortDir === "asc" ? d : -d;
                    })
                    .map((row) => {
                      if (mode === "compare") {
                        const reg = Math.max(...row.locations.map((l: any) => l.regularChance || 0));
                        const pve = Math.max(...row.locations.map((l: any) => l.pveChance || 0));
                        const delta = pve - reg;
                        const deltaPct = (delta * 100).toFixed(0);
                        const deltaColor = delta > 0 ? "text-green-300" : delta < 0 ? "text-red-300" : "text-gray-300";
                        return (
                          <div key={row.boss} className="grid grid-cols-12 gap-3 items-center px-3 py-3 hover:bg-gray-800/30 rounded-md">
                            <div className="col-span-12 sm:col-span-5"><BossCell boss={row} /></div>
                            <div className="col-span-6 sm:col-span-3">
                              <div className="relative h-5 rounded bg-red-900/20">
                                <div className="absolute left-0 top-0 h-full bg-red-500/40" style={{ width: `${Math.max(0, Math.min(100, reg * 100))}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center text-red-300 text-sm font-medium">{(reg * 100).toFixed(0)}%</div>
                              </div>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                              <div className="relative h-5 rounded bg-green-900/20">
                                <div className="absolute left-0 top-0 h-full bg-green-500/40" style={{ width: `${Math.max(0, Math.min(100, pve * 100))}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center text-green-300 text-sm font-medium">{(pve * 100).toFixed(0)}%</div>
                              </div>
                            </div>
                            <div className="col-span-12 sm:col-span-1 text-center font-semibold"><span className={deltaColor}>{delta > 0 ? "+" : delta < 0 ? "-" : "0"} {deltaPct}%</span></div>
                          </div>
                        );
                      }

                      const locs = [...row.locations].sort((a: any, b: any) => b.chance - a.chance);
                      const top = locs.slice(0, 4);
                      const more = locs.length - top.length;
                      return (
                        <div key={row.boss} className="grid grid-cols-12 gap-3 items-center px-3 py-3 hover:bg-gray-800/30 rounded-md">
                          <div className="col-span-12 sm:col-span-5"><BossCell boss={row} /></div>
                          <div className="col-span-6 sm:col-span-3">
                            <div className="relative h-5 rounded bg-slate-900/40">
                              <div className="absolute left-0 top-0 h-full bg-slate-400/50" style={{ width: `${Math.max(0, Math.min(100, row.spawnChance * 100))}%` }} />
                              <div className="absolute inset-0 flex items-center justify-center text-slate-100 text-sm">{(row.spawnChance * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                          <div className="col-span-6 sm:col-span-4 flex flex-wrap gap-1">
                            {top.length === 0 ? (
                              <span className="italic text-gray-500">(No specific location)</span>
                            ) : (
                              top.map((l) => (
                                <span key={l.name} className={`px-2 py-1 rounded bg-slate-800/70 ring-1 ring-slate-700/50 text-slate-100 ${getLocationClasses(l.name, l.chance)}`}>
                                  {l.name}
                                  <span className="ml-1 text-gray-400">{l.chance > 0 ? `${(l.chance * 100).toFixed(0)}%` : '-'}</span>
                                </span>
                              ))
                            )}
                            {more > 0 && <span className="px-2 py-1 rounded bg-slate-800/70 ring-1 ring-slate-700/50 text-gray-300">+{more} more</span>}
                          </div>
                          
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

// Boss hover cell (duplicated to keep component self-contained)
const BossCell = ({ boss }: { boss: BossEntry }) => {
  const getImageUrl = (boss: BossEntry) => {
    if (boss.boss === "Shadow of Tagilla") return "/Shadow_Tagilla_Long_crop.webp";
    if (boss.boss === "Vengeful Killa") return "/killa-portrait.webp";
    if (boss.boss === "BEAR") return "/BEAR.webp";
    if (boss.boss === "USEC") return "/USEC.webp";
    if (boss.boss === "Labyrinthian") return "/SCAV.webp";
    return boss.imagePortraitLink;
  };
  const imageUrl = getImageUrl(boss);
  
  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="flex items-center gap-2">
          {boss.imagePortraitLink && (
            <img src={imageUrl} alt={boss.boss} className="w-8 h-8 rounded-full object-cover" />
          )}
          <span className="font-medium text-gray-200 hover:text-purple-400 cursor-pointer border-b border-dotted">
            {boss.boss}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-[320px] bg-gray-800 border-gray-700">
        <div className="flex flex-col gap-3">
          <h1 className="font-semibold text-gray-200">{boss.boss}</h1>
          {boss.imagePortraitLink && (
            <img src={imageUrl} alt={boss.boss} className="w-full h-32 object-cover rounded-lg" />
          )}
          
          {boss.health && (
            <div className="text-sm text-gray-400">
              <div className="flex justify-between">
                <span className="font-bold text-gray-200 mb-1">Health:</span>
                <span className="font-bold text-gray-200">
                  Total: {boss.health.reduce((acc: number, part: Health) => acc + part.max, 0)}
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

export default ModernTable;
