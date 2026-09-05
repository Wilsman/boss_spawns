import type { GameMode, GoonReport, SpawnData } from "@/types";

const MAP_NAMES: Record<string, string> = {
  "55f2d3fd4bdc2d5f408b4567": "Factory",
  "56f40101d2720b2a4d8b45d6": "Customs",
  "5704e3c2d2720bac5b8b4567": "Woods",
  "5704e4dad2720bb55b8b4567": "Lighthouse",
  "5704e554d2720bac5b8b456e": "Shoreline",
  "5704e5fad2720bc05b8b4567": "Reserve",
  "5714dbc024597771384a510d": "Interchange",
  "5714dc692459777137212e12": "Streets of Tarkov",
  "59fc81d786f774390775787e": "Night Factory",
  "5b0fc42d86f7744a585f9105": "The Lab",
  "653e6760052c01c1c805532f": "Ground Zero",
  "65b8d6f5cdde2479cb2a3125": "Ground Zero 21+",
  "65cc8f81a9aac3e77d0cfd3e": "Terminal",
  "6733700029c367a3d40b02af": "The Labyrinth",
  "68236e8153654e8c1200798a": "Ground Zero Tutorial",
  "69af492a4819ea4ba10a69c5": "Icebreaker",
  "6a294a5b5eb5f9a1700417b": "Dark Labs",
  // Normalized-name fallbacks in case the API ever returns a slug instead of an ID.
  factory: "Factory",
  customs: "Customs",
  woods: "Woods",
  lighthouse: "Lighthouse",
  shoreline: "Shoreline",
  reserve: "Reserve",
  interchange: "Interchange",
  "streets-of-tarkov": "Streets of Tarkov",
  "night-factory": "Night Factory",
  "the-lab": "The Lab",
  "ground-zero": "Ground Zero",
  "ground-zero-21": "Ground Zero 21+",
  terminal: "Terminal",
  "the-labyrinth": "The Labyrinth",
  icebreaker: "Icebreaker",
  "the-lab-dark": "Dark Labs",
};

function resolveMapName(
  mapId: string,
  dynamicLookup?: Map<string, string>,
): string {
  return dynamicLookup?.get(mapId) ?? MAP_NAMES[mapId] ?? "Unknown map";
}

function buildMapLookup(
  spawnData?: Partial<Record<GameMode, SpawnData[]>>,
): Map<string, string> | undefined {
  if (!spawnData) return undefined;
  const lookup = new Map<string, string>();
  for (const maps of Object.values(spawnData)) {
    for (const map of maps ?? []) {
      if (map.id && map.name) lookup.set(map.id, map.name);
      if (map.normalizedName && map.name) {
        lookup.set(map.normalizedName, map.name);
        lookup.set(map.normalizedName.toLowerCase(), map.name);
      }
      if (map.nameId && map.name) lookup.set(map.nameId, map.name);
    }
  }
  return lookup.size ? lookup : undefined;
}

function modeLabel(mode: GameMode) {
  return mode === "regular" ? "PvP" : mode === "pve" ? "PvE" : "Season";
}

function formatReportTime(timestamp: string) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatAge(timestamp: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - Number(timestamp)) / 60000));
  if (elapsedMinutes < 1) return "just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ReportPopover({
  reports,
  mapLookup,
}: {
  reports: GoonReport[];
  mapLookup?: Map<string, string>;
}) {
  return (
    <div className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-hover:opacity-100 group-focus-within:opacity-100">
      <div className="rounded-md border border-white/[0.12] bg-[#111113]/[0.98] p-2.5 shadow-2xl shadow-black/40 ring-1 ring-black/40">
        <div className="mb-2 flex items-center justify-between border-b border-white/[0.08] pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Recent reports</span>
          <span className="text-[10px] text-zinc-600">{Math.min(reports.length, 15)}</span>
        </div>
        {reports.length ? (
          <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
            {reports.slice(0, 15).map((item, index) => (
              <div key={`${item.map}-${item.timestamp}-${index}`} className="flex items-center justify-between gap-2 text-[10px]">
                <span className="truncate text-zinc-300">{resolveMapName(item.map, mapLookup)}</span>
                <span className="shrink-0 text-zinc-600">{formatAge(item.timestamp)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-zinc-600">No reports available yet.</p>
        )}
      </div>
    </div>
  );
}

export function GoonTracker({
  reports,
  spawnData,
}: {
  reports?: Record<GameMode, GoonReport[]>;
  spawnData?: Partial<Record<GameMode, SpawnData[]>>;
}) {
  const modes: GameMode[] = ["regular", "pve", "pvp-season"];
  const mapLookup = buildMapLookup(spawnData);
  return (
    <section className="rounded-md border border-amber-300/15 bg-[#0b0b0c] px-3 py-2.5" aria-label="Goons reports">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">Goons reports</h2>
        <span className="ml-auto text-[10px] text-zinc-600">live reports</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {modes.map((mode) => {
          const report = reports?.[mode]?.[0];
          return (
            <div key={mode} tabIndex={0} className="group relative min-w-0 cursor-help rounded border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 outline-none transition-colors hover:border-amber-300/25 focus:border-amber-300/35">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                <span>{modeLabel(mode)}</span>
              </div>
              {report ? (
                <>
                  <div className="truncate text-xs text-zinc-200">{resolveMapName(report.map, mapLookup)}</div>
                  <div className="mt-0.5 truncate text-[10px] text-zinc-500" title={formatReportTime(report.timestamp) ?? undefined}>
                    {formatReportTime(report.timestamp)} · {formatAge(report.timestamp)}
                  </div>
                </>
              ) : (
                <div className="truncate text-xs text-zinc-500">Awaiting reports</div>
              )}
              <ReportPopover reports={reports?.[mode] ?? []} mapLookup={mapLookup} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
