import type { GameMode, GoonReport } from "@/types";

const MAP_NAMES: Record<string, string> = {
  "5704e554d2720bac5b8b456e": "Shoreline",
  "5704e3c2d2720bac5b8b4567": "Woods",
  "56f40101d2720b2a4d8b45d6": "Customs",
};

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

function ReportPopover({ reports }: { reports: GoonReport[] }) {
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
                <span className="truncate text-zinc-300">{MAP_NAMES[item.map] ?? "Unknown map"}</span>
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

export function GoonTracker({ reports }: { reports?: Record<GameMode, GoonReport[]> }) {
  const modes: GameMode[] = ["regular", "pve", "pvp-season"];
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
                {mode === "pvp-season" ? (
                  <span className="rounded border border-amber-300/20 px-1 py-px text-[8px] uppercase tracking-wide text-amber-300/70">
                    Soon
                  </span>
                ) : null}
              </div>
              {report ? (
                <>
                  <div className="truncate text-xs text-zinc-200">{MAP_NAMES[report.map] ?? "Unknown map"}</div>
                  <div className="mt-0.5 truncate text-[10px] text-zinc-500" title={formatReportTime(report.timestamp) ?? undefined}>
                    {formatReportTime(report.timestamp)} · {formatAge(report.timestamp)}
                  </div>
                </>
              ) : (
                <div className="truncate text-xs text-zinc-500">Awaiting reports</div>
              )}
              <ReportPopover reports={reports?.[mode] ?? []} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
