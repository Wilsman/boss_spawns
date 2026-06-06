"use client";
import { useEffect, useState } from "react";
import { BellRing, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { manualNotice } from "@/config/manualNotice";

export function Notice() {
  const [isVisible, setIsVisible] = useState(false);
  const changeDateLabel = manualNotice.changedAt
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(manualNotice.changedAt))
    : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      className={cn(
        "mt-3 w-full rounded-lg border border-amber-500/30 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 px-4 py-4",
        "opacity-0 transition-opacity duration-200 ease-out",
        isVisible && "opacity-100",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
          <h2 className="text-base font-semibold text-zinc-100">
            {manualNotice.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              {manualNotice.badgeLabel}
            </span>
            {changeDateLabel ? (
              <span className="text-xs text-zinc-500">
                Updated: {changeDateLabel}
              </span>
            ) : null}
          </div>
        </div>

        <article className="rounded-lg border border-amber-500/20 bg-zinc-900/40 px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-amber-500/20 bg-zinc-950 text-amber-200 md:shrink-0">
              {manualNotice.imageUrl ? (
                <img
                  src={manualNotice.imageUrl}
                  alt={`${manualNotice.bossDisplayName} portrait`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BellRing className="h-9 w-9" />
              )}
            </div>

            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[96px_minmax(0,1fr)]">
              <dt className="text-zinc-500">Boss</dt>
              <dd className="text-zinc-100">{manualNotice.bossDisplayName}</dd>

              <dt className="text-zinc-500">Status</dt>
              <dd className="text-amber-100">{manualNotice.statusLine}</dd>

              <dt className="text-zinc-500">Maps</dt>
              <dd className="space-y-1 text-zinc-300">
                {manualNotice.mapRows.map((row) => (
                  <div key={`${row.bossName ?? manualNotice.bossDisplayName}-${row.mapName}`}>
                    <span className="text-zinc-100">
                      {row.mapName} ({row.value})
                    </span>
                    {`: ${row.bossName ?? manualNotice.bossDisplayName} - ${row.locations}`}
                  </div>
                ))}
              </dd>

              <dt className="text-zinc-500">Modes</dt>
              <dd className="text-zinc-300">{manualNotice.modes.join(", ")}</dd>
            </dl>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Notice;
