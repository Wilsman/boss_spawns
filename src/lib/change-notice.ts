import type { DataChange } from "@/lib/diff";
import { getCanonicalBossName } from "@/lib/boss-aliases";

export interface LatestChangeNotice {
  badgeLabel: string;
  bossDisplayName: string;
  changedAt: number;
  maps: string[];
  mapsWithValues: string[];
  modes: string[];
  statusLine: string;
  title: string;
  updateLine: string;
}

const CLUSTER_WINDOW_MS = 2 * 60 * 60 * 1000;

function uniquePreservingOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

function titleCaseSegment(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBossName(name: string): string {
  const canonicalName = getCanonicalBossName(name);

  return canonicalName
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => titleCaseSegment(part.toLowerCase()))
    .join(" ");
}

function formatMapName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (/^\d+$/.test(part)) {
        return `(${part})`;
      }

      return titleCaseSegment(part.toLowerCase());
    })
    .join(" ")
    .replace("Of", "of");
}

function joinHumanList(values: string[]): string {
  if (!values.length) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function getBadgeLabel(change: DataChange): string {
  if (change.field === "bossAdded") {
    return "New event detected";
  }

  if (change.field === "bossRemoved") {
    return "Event ended";
  }

  return "Spawn changes detected";
}

function getStatusLine(change: DataChange, modes: string[]): string {
  const bossDisplayName = formatBossName(change.boss);
  const modesLabel = joinHumanList(modes);

  if (change.field === "bossAdded") {
    return `${bossDisplayName} was added due to an event in ${modesLabel}.`;
  }

  if (change.field === "bossRemoved") {
    return `${bossDisplayName} was removed after an event change in ${modesLabel}.`;
  }

  if (change.field === "spawnChance") {
    return `${bossDisplayName} spawn rates changed in ${modesLabel}.`;
  }

  return `${bossDisplayName} changed in ${modesLabel}.`;
}

export function getLatestChangeNotice(changes: DataChange[]): LatestChangeNotice | null {
  if (!changes.length) {
    return null;
  }

  const latestChange = [...changes].sort((left, right) => right.timestamp - left.timestamp)[0];

  const clusterChanges = changes.filter(
    (change) =>
      change.boss === latestChange.boss &&
      change.field === latestChange.field &&
      change.oldValue === latestChange.oldValue &&
      change.newValue === latestChange.newValue &&
      Math.abs(change.timestamp - latestChange.timestamp) <= CLUSTER_WINDOW_MS
  );

  const maps = uniquePreservingOrder(
    clusterChanges.map((change) => formatMapName(change.map))
  );
  const mapsWithValues = uniquePreservingOrder(
    clusterChanges.map(
      (change) => `${formatMapName(change.map)} (${change.newValue})`
    )
  );
  const modes = uniquePreservingOrder(clusterChanges.map((change) => change.gameMode));
  const bossDisplayName = formatBossName(latestChange.boss);
  const statusLine = getStatusLine(latestChange, modes);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(latestChange.timestamp);

  return {
    badgeLabel: getBadgeLabel(latestChange),
    bossDisplayName,
    changedAt: latestChange.timestamp,
    maps,
    mapsWithValues,
    modes,
    statusLine,
    title:
      latestChange.field === "bossAdded"
        ? `${bossDisplayName} Event Detected`
        : "Boss Spawn Update",
    updateLine: `(${formattedDate}): ${statusLine}`,
  };
}
