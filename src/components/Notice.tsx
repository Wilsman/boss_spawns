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
const SANITAR_PORTRAIT_URL = "https://assets.tarkov.dev/sanitar-portrait.png";
const ARENA_FIGHTER_PORTRAIT_URL =
  "https://assets.tarkov.dev/arenafighter-portrait.webp";
const CUSTOMS_GANG_EVENT_END = Date.UTC(2026, 4, 12, 7, 0, 0);
const CUSTOMS_GANG_EVENT_STATUS =
  "Glukhar is raiding Customs after Reshala's crew hit Reserve. PvP/PvE until May 12, 08:00 BST / 03:00 EST. Player Scavs reduced.";
const CUSTOMS_GANG_EVENT_MAP_ROWS = [
  {
    bossName: "Reshala",
    locations: "Customs Warehouse, Stronghold",
    mapName: "Customs",
    value: "100%",
  },
  {
    bossName: "Glukhar",
    locations: "Dorms, New Gas Station",
    mapName: "Customs",
    value: "100%",
  },
];
const CURRENT_EVENT_UPDATE_STATUS =
  "Latest Shoreline update: Sanitar moved from 75% to 70%. He now splits between Pier and Greenhouses at 50% each.";
const ICEBREAKER_SANITAR_EVENT_STATUS =
  "Icebreaker event update: Sanitar is now spawning on Shoreline at Pier and Greenhouses.";
const ICEBREAKER_SANITAR_EVENT_MAP_ROWS = [
  {
    bossName: "Sanitar",
    mapName: "Shoreline",
    value: "70%",
    locations: "Pier 50%, Greenhouses 50%",
  },
];
const TARKOV_HOSPITALITY_EVENT_STATUS =
  "Tarkov Hospitality event: Arena Fighter is now spawning at 100% on Customs, Woods, and Shoreline in PvP and PvE.";
const TARKOV_HOSPITALITY_EVENT_MAP_ROWS = [
  {
    bossName: "Arena Fighter",
    mapName: "Customs",
    value: "100%",
    locations: "Dorms",
  },
  {
    bossName: "Arena Fighter",
    mapName: "Woods",
    value: "100%",
    locations: "Scav House/Checkpoint Road",
  },
  {
    bossName: "Arena Fighter",
    mapName: "Shoreline",
    value: "100%",
    locations: "Smuggler's Depot",
  },
];
const CURRENT_EVENT_UPDATE_MAP_ROWS = [
  {
    bossName: "Goons",
    mapName: "Shoreline",
    value: "100%",
    locations: "off Customs, Lighthouse, and Woods",
  },
  {
    bossName: "Rogues",
    mapName: "Lighthouse, Reserve, Shoreline",
    value: "100%",
    locations: "event spawns",
  },
  {
    bossName: "Glukhar",
    mapName: "Reserve",
    value: "100%",
    locations: "event spawn",
  },
  {
    bossName: "Sanitar",
    mapName: "Shoreline",
    value: "70%",
    locations: "Pier 50%, Greenhouses 50%",
  },
];

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
  const hospitalityArenaFighterTimestamp = useMemo(() => {
    const arenaFighterChanges = changes.filter(
      (change) =>
        change.boss.toLowerCase() === "arenafighter" &&
        ["customs", "woods", "shoreline"].includes(change.map),
    );
    const latestArenaFighterChange = [...arenaFighterChanges].sort(
      (left, right) => right.timestamp - left.timestamp,
    )[0];

    if (latestArenaFighterChange?.field !== "bossAdded") {
      return null;
    }

    const eventChanges = arenaFighterChanges.filter(
      (change) => change.field === "bossAdded" && change.newValue === "100%",
    );

    return eventChanges.length
      ? Math.max(...eventChanges.map((change) => change.timestamp))
      : null;
  }, [changes]);
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
  const displayChangedAt =
    hospitalityArenaFighterTimestamp ?? latestNotice?.changedAt;
  const changeDateLabel = displayChangedAt
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(displayChangedAt)
    : null;
  const isTarkovHospitalityEvent = hospitalityArenaFighterTimestamp !== null;
  const isCustomsGangEvent =
    latestNotice &&
    Date.now() < CUSTOMS_GANG_EVENT_END &&
    latestNotice.maps.includes("Customs") &&
    latestNotice.modes.includes("PvP") &&
    latestNotice.modes.includes("PvE");
  const isCurrentEventUpdate =
    latestNotice?.bossDisplayName === "Knight" &&
    latestNotice?.badgeLabel === "Event ended";
  const isIcebreakerSanitarEvent =
    latestNotice?.bossDisplayName === "Sanitar" &&
    latestNotice?.badgeLabel === "New event detected" &&
    latestNotice?.maps.includes("Terminal");
  const noticeImageUrl = isTarkovHospitalityEvent
    ? ARENA_FIGHTER_PORTRAIT_URL
    : isIcebreakerSanitarEvent
    ? SANITAR_PORTRAIT_URL
    : latestNotice?.bossDisplayName === "Pillager"
      ? PILLAGER_PORTRAIT_URL
      : null;
  const statusLine = isCustomsGangEvent
    ? CUSTOMS_GANG_EVENT_STATUS
    : isTarkovHospitalityEvent
      ? TARKOV_HOSPITALITY_EVENT_STATUS
    : isIcebreakerSanitarEvent
      ? ICEBREAKER_SANITAR_EVENT_STATUS
    : isCurrentEventUpdate
      ? CURRENT_EVENT_UPDATE_STATUS
    : latestNotice?.statusLine;
  const bossDisplayName = isCustomsGangEvent
    ? "Reshala and Glukhar"
    : isTarkovHospitalityEvent
      ? "Arena Fighter"
    : isIcebreakerSanitarEvent
      ? "Sanitar"
    : isCurrentEventUpdate
      ? "Goons, Rogues, Glukhar, Sanitar"
    : latestNotice?.bossDisplayName;
  const badgeLabel = isTarkovHospitalityEvent
    ? "Tarkov Hospitality"
    : isIcebreakerSanitarEvent
    ? "Icebreaker event"
    : isCurrentEventUpdate
    ? "Event update"
    : latestNotice?.badgeLabel;
  const noticeTitle = isTarkovHospitalityEvent
    ? "Tarkov Hospitality: Arena Fighter Event"
    : isIcebreakerSanitarEvent
    ? "Icebreaker Event: Sanitar Spawn Update"
    : isCurrentEventUpdate
    ? "New Event Task & Boss Spawn Update"
    : latestNotice?.title;

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
            {noticeTitle ?? "Watching for boss event rollouts"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              {badgeLabel ?? "Live from changes API"}
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
                  alt={`${bossDisplayName ?? latestNotice?.bossDisplayName} portrait`}
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
                  <dd className="text-zinc-100">{bossDisplayName}</dd>

                  <dt className="text-zinc-500">Status</dt>
                  <dd className="text-amber-100">{statusLine}</dd>

                  <dt className="text-zinc-500">Maps</dt>
                  <dd className="space-y-1 text-zinc-300">
                    {isTarkovHospitalityEvent ? (
                      TARKOV_HOSPITALITY_EVENT_MAP_ROWS.map((row) => (
                        <div key={`${row.bossName}-${row.mapName}`}>
                          <span className="text-zinc-100">
                            {row.mapName} ({row.value})
                          </span>
                          {`: ${row.bossName} - ${row.locations}`}
                        </div>
                      ))
                    ) : isIcebreakerSanitarEvent ? (
                      ICEBREAKER_SANITAR_EVENT_MAP_ROWS.map((row) => (
                        <div key={`${row.bossName}-${row.mapName}`}>
                          <span className="text-zinc-100">
                            {row.mapName} ({row.value})
                          </span>
                          {`: ${row.bossName} - ${row.locations}`}
                        </div>
                      ))
                    ) : isCurrentEventUpdate ? (
                      CURRENT_EVENT_UPDATE_MAP_ROWS.map((row) => (
                        <div key={`${row.bossName}-${row.mapName}`}>
                          <span className="text-zinc-100">
                            {row.bossName} - {row.mapName} ({row.value})
                          </span>
                          {` - ${row.locations}`}
                        </div>
                      ))
                    ) : isCustomsGangEvent ? (
                      CUSTOMS_GANG_EVENT_MAP_ROWS.map((row) => (
                        <div key={row.bossName}>
                          <span className="text-zinc-100">
                            {row.mapName} ({row.value})
                          </span>
                          {` - ${row.bossName}: ${row.locations}`}
                        </div>
                      ))
                    ) : locationRows.length ? (
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
                  <dd className="text-zinc-300">
                    {isTarkovHospitalityEvent
                      ? "PvP, PvE"
                      : latestNotice.modes.join(", ")}
                  </dd>
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
