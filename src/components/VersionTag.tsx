import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { changelog, type ChangelogEntry } from "virtual:changelog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

const KIND_STYLE: Record<string, { label: string; color: string }> = {
  feat: { label: "NEW", color: "#93c5fd" },
  fix: { label: "FIX", color: "#fca5a5" },
  perf: { label: "PERF", color: "#93c5fd" },
  refactor: { label: "REFAC", color: "#a1a1aa" },
  docs: { label: "DOCS", color: "#a1a1aa" },
  test: { label: "TEST", color: "#a1a1aa" },
  chore: { label: "CHORE", color: "#a1a1aa" },
};

function KindChip({ kind }: { kind: string }) {
  const { label, color } = KIND_STYLE[kind] ?? { label: "TWEAK", color: "#a1a1aa" };
  return (
    <span
      className="inline-block w-12 shrink-0 rounded-sm px-1 py-0.5 text-center font-mono text-[9px] font-bold tracking-wider text-black"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

function Diffstat({ entry }: { entry: ChangelogEntry }) {
  if (!entry.files) return null;
  return (
    <span className="tabular-nums text-zinc-400">
      {entry.files} file{entry.files === 1 ? "" : "s"} · <span className="text-emerald-400">+{entry.insertions}</span>{" "}
      <span className="text-red-400">−{entry.deletions}</span>
    </span>
  );
}

// The same build-time, one-commit-per-release changelog used by Glitch Gauntlet.
export function VersionTag() {
  const [open, setOpen] = useState(false);
  const latest = changelog[0];
  if (!latest) return null;
  const version = `v${latest.version}${import.meta.env.DEV ? "-dev" : ""}`;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <HoverCard openDelay={120} closeDelay={80}>
        <HoverCardTrigger asChild>
          <Dialog.Trigger asChild>
            <button
              type="button"
              data-testid="version-tag"
              aria-label={`Website changelog, ${version}`}
              className="inline-flex min-h-11 items-center rounded-sm border border-blue-300/30 bg-black/60 px-2 py-1 font-mono text-[11px] font-medium tracking-wide text-blue-200 transition hover:border-blue-300 hover:text-blue-100 hover:shadow-[0_0_12px_rgba(96,165,250,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:min-h-8 motion-reduce:transition-none"
            >
              {version}
            </button>
          </Dialog.Trigger>
        </HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="end"
          className="z-[60] w-80 max-w-[calc(100vw-2rem)] border-blue-300/30 bg-[#0d0d0e] p-3 text-zinc-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono font-medium text-blue-200">v{latest.version}</span>
            <span className="font-mono text-zinc-400">{latest.hash} · {latest.date}</span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-sm leading-snug">
            <KindChip kind={latest.kind} />
            <span>{latest.title}</span>
          </div>
          {latest.body.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-0.5 overflow-hidden text-xs text-zinc-400">
              {latest.body.slice(0, 6).map((line, i) => (
                <li key={i} className="whitespace-pre-wrap break-words">{line}</li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
            <Diffstat entry={latest} />
            <span className="text-blue-200">Click for full changelog ▸</span>
          </div>
        </HoverCardContent>
      </HoverCard>
      <ChangelogDialog />
    </Dialog.Root>
  );
}

function ChangelogDialog() {
  const eras = useMemo(() => {
    const groups: { major: string; name: string | null; entries: ChangelogEntry[] }[] = [];
    for (const entry of changelog) {
      const major = entry.version.split(".")[0];
      let group = groups[groups.length - 1];
      if (!group || group.major !== major) groups.push((group = { major, name: null, entries: [] }));
      group.entries.push(entry);
      if (entry.milestone) group.name = entry.milestone;
    }
    return groups;
  }, []);
  const [expanded, setExpanded] = useState<string | null>(changelog[0]?.hash ?? null);

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/80" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-[70] flex max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-blue-300/30 bg-[#0d0d0e] text-zinc-200 shadow-2xl">
        <div className="shrink-0 border-b border-white/10 px-4 py-4 pr-16 sm:px-5 sm:pr-16">
          <Dialog.Title className="font-mono text-sm font-semibold tracking-widest text-blue-200">CHANGELOG</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            {changelog.length} website releases, one per commit. Select a release to see what changed.
          </Dialog.Description>
        </div>
        <Dialog.Close className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" aria-label="Close changelog">
          <X className="h-4 w-4" aria-hidden="true" />
        </Dialog.Close>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4" data-testid="changelog-list">
          {eras.map((era) => (
            <section key={era.major} aria-label={`Version ${era.major}`}>
              <h3 className="sticky top-0 z-10 -mx-3 border-b border-white/5 bg-[#0d0d0e]/95 px-5 py-2 font-mono text-[11px] font-medium tracking-widest text-zinc-300 backdrop-blur">
                V{era.major}
                {era.name && <span className="ml-2 font-sans text-xs tracking-normal text-zinc-400">{era.name}</span>}
              </h3>
              <ul>
                {era.entries.map((entry) => (
                  <ChangelogRow key={entry.hash} entry={entry} open={expanded === entry.hash} onToggle={() => setExpanded((cur) => cur === entry.hash ? null : entry.hash)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function ChangelogRow({ entry, open, onToggle }: { entry: ChangelogEntry; open: boolean; onToggle: () => void }) {
  const detailsId = `release-${entry.hash}`;
  return (
    <li className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={detailsId}
        className="grid min-h-11 w-full grid-cols-[5rem_3rem_minmax(0,1fr)_1rem] items-center gap-x-3 gap-y-1 rounded px-2 py-3 text-left transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-blue-300 sm:grid-cols-[5rem_3rem_minmax(0,1fr)_auto_1rem] motion-reduce:transition-none"
      >
        <span className="col-start-1 row-start-1 font-mono text-xs text-blue-200">v{entry.version}</span>
        <span className="col-start-2 row-start-1"><KindChip kind={entry.kind} /></span>
        <span className="col-span-3 col-start-1 row-start-2 min-w-0 break-words text-sm sm:col-span-1 sm:col-start-3 sm:row-start-1">{entry.title}</span>
        <time dateTime={entry.date} className="col-span-3 col-start-1 row-start-3 font-mono text-[11px] text-zinc-400 sm:col-span-1 sm:col-start-4 sm:row-start-1">{entry.date}</time>
        <ChevronDown className={cn("col-start-4 row-start-1 h-3.5 w-3.5 text-zinc-400 transition-transform sm:col-start-5 motion-reduce:transition-none", open && "rotate-180")} aria-hidden="true" />
      </button>
      <div id={detailsId} hidden={!open} className="mb-3 ml-2 mr-2 space-y-2 border-l border-blue-300/20 pl-3 text-xs sm:ml-[6.25rem]">
        {entry.milestone && <p className="font-mono text-[10px] tracking-widest text-zinc-300">★ MILESTONE · {entry.milestone}</p>}
        {entry.scope && <p className="text-zinc-400">Area: {entry.scope}</p>}
        {entry.body.length > 0 ? (
          <ul className="space-y-1 text-zinc-300">
            {entry.body.map((line, i) => <li key={i} className="whitespace-pre-wrap break-words">{line}</li>)}
          </ul>
        ) : <p className="break-words text-zinc-400">{entry.title}</p>}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-blue-200/80">{entry.hash}</span>
          <Diffstat entry={entry} />
        </p>
      </div>
    </li>
  );
}
