"use client";
import { useEffect, useMemo, useState } from "react";
import { BellRing, Radar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataChange } from "@/lib/diff";
import { getLatestChangeNotice } from "@/lib/change-notice";
import type { SpawnData } from "@/types";
import { getCanonicalBossName } from "@/lib/boss-aliases";

interface NoticeProps {
  changes?: DataChange[];
  changesLoaded?: boolean;
  regularData?: SpawnData[] | null;
  pveData?: SpawnData[] | null;
}

const PILLAGER_PORTRAIT_URL = "https://assets.tarkov.dev/pillager-portrait.webp";

function uniquePreservingOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getLocationRows(
  bossDisplayName: string,
  mapDetails: Array<{ mapName: string; value: string }>,
  regularData?: SpawnData[] | null,
  pveData?: SpawnData[] | null,
) {
  const allMaps = [...(regularData ?? []), ...(pveData ?? [])];
  const targetBossName = getCanonicalBossName(bossDisplayName).toLowerCase();

  return mapDetails.map(({ mapName, value }) => {
    const locations = uniquePreservingOrder(
      allMaps
        .filter((map) => map.name === mapName)
        .flatMap((map) =>
          map.bosses
            .filter(
              (bossEntry) =>
                getCanonicalBossName(bossEntry.boss.name).toLowerCase() ===
                targetBossName,
            )
            .flatMap((bossEntry) =>
              bossEntry.spawnLocations.map((location) => location.name),
            ),
        ),
    );

    return {
      locations,
      mapName,
      value,
    };
  });
}

export function Notice({
  changes = [],
  changesLoaded = false,
  regularData,
  pveData,
}: NoticeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const latestNotice = useMemo(() => getLatestChangeNotice(changes), [changes]);
  const noticeImageUrl =
    latestNotice?.bossDisplayName === "Pillager" ? PILLAGER_PORTRAIT_URL : null;
  const locationRows = useMemo(
    () =>
      latestNotice
        ? getLocationRows(
            latestNotice.bossDisplayName,
            latestNotice.mapDetails,
            regularData,
            pveData,
          )
        : [],
    [latestNotice, pveData, regularData],
  );
  const changeDateLabel = latestNotice
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(latestNotice.changedAt)
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
            {latestNotice?.title ?? "Watching for boss event rollouts"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              {latestNotice?.badgeLabel ?? "Live from changes API"}
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
              {noticeImageUrl ? (
                <img
                  src={noticeImageUrl}
                  alt={`${latestNotice?.bossDisplayName} portrait`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <BellRing className="h-9 w-9" />
              )}
            </div>

            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[96px_minmax(0,1fr)]">
              {latestNotice ? (
                <>
                  <dt className="text-zinc-500">Boss</dt>
                  <dd className="text-zinc-100">{latestNotice.bossDisplayName}</dd>

                  <dt className="text-zinc-500">Status</dt>
                  <dd className="text-amber-100">{latestNotice.statusLine}</dd>

                  <dt className="text-zinc-500">Maps</dt>
                  <dd className="space-y-1 text-zinc-300">
                    {locationRows.length ? (
                      locationRows.map((row) => (
                        <div key={row.mapName}>
                          <span className="text-zinc-100">
                            {row.mapName} ({row.value})
                          </span>
                          {": "}
                          {row.locations.length
                            ? row.locations.join(", ")
                            : "locations not available"}
                        </div>
                      ))
                    ) : (
                      latestNotice.mapDetails.map((row) => (
                        <div key={row.mapName}>
                          {row.mapName} ({row.value})
                        </div>
                      ))
                    )}
                  </dd>

                  <dt className="text-zinc-500">Modes</dt>
                  <dd className="text-zinc-300">{latestNotice.modes.join(", ")}</dd>
                </>
              ) : (
                <>
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="text-amber-100">
                    {changesLoaded
                      ? "No grouped boss event changes detected in the latest API payload yet."
                      : "Loading the latest change cluster from the changes API."}
                  </dd>

                  <dt className="text-zinc-500">Monitor</dt>
                  <dd className="text-zinc-300 flex items-center gap-2">
                    <Radar className="h-4 w-4 text-amber-300" />
                    Watching for newly added, removed, or sharply changed boss spawns.
                  </dd>
                </>
              )}
            </dl>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Notice;
