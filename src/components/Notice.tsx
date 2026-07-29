"use client";
import { useEffect, useState } from "react";
import { BellRing, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { manualNotice } from "@/config/manualNotice";

const changeDateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
});

export function Notice() {
  const [isVisible, setIsVisible] = useState(false);

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
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            {manualNotice.badgeLabel}
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {manualNotice.events.map((event) => {
            const changeDateLabel = event.changedAt
              ? changeDateFormatter.format(new Date(event.changedAt))
              : null;
            const titleId = `notice-${event.id}-title`;

            return (
              <article
                key={event.id}
                aria-labelledby={titleId}
                className="flex h-full flex-col rounded-lg border border-amber-500/20 bg-zinc-900/40 px-3 py-3"
              >
                <div className="flex items-center gap-3 border-b border-amber-500/10 pb-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-amber-500/20 bg-zinc-950 text-amber-200">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={`${event.bossDisplayName} portrait`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BellRing className="h-8 w-8" aria-hidden="true" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        id={titleId}
                        className="text-sm font-semibold text-zinc-100"
                      >
                        {event.title}
                      </h3>
                      <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                        {event.badgeLabel}
                      </span>
                    </div>
                    {changeDateLabel && event.changedAt ? (
                      <time
                        dateTime={event.changedAt}
                        className="mt-1 block text-xs text-zinc-500"
                      >
                        Updated: {changeDateLabel}
                      </time>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-3 grid min-w-0 flex-1 grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-zinc-500">Boss</dt>
                  <dd className="min-w-0 text-zinc-100">
                    {event.bossDisplayName}
                  </dd>

                  <dt className="text-zinc-500">Status</dt>
                  <dd className="min-w-0 text-amber-100">
                    {event.statusLine}
                  </dd>

                  <dt className="text-zinc-500">Maps</dt>
                  <dd className="min-w-0 space-y-1 text-zinc-300">
                    {event.mapRows.map((row) => (
                      <div
                        key={`${row.bossName ?? event.bossDisplayName}-${row.mapName}`}
                      >
                        <span className="text-zinc-100">
                          {row.mapName} ({row.value})
                        </span>
                        {`: ${row.bossName ?? event.bossDisplayName} - ${row.locations}`}
                      </div>
                    ))}
                  </dd>

                  <dt className="text-zinc-500">Modes</dt>
                  <dd className="min-w-0 text-zinc-300">
                    {event.modes.join(", ")}
                  </dd>
                </dl>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Notice;
