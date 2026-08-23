import type { Boss } from "@/types";

const SPAWN_TIME_SENTINEL = 9999;

export interface EncounterTiming {
  elapsedSeconds: number | null;
  randomized: boolean;
  triggered: boolean;
}

export interface SpawnTimingSummary {
  elapsedSeconds: number[];
  randomized: boolean;
  triggered: boolean;
  hasMeaningfulTiming: boolean;
}

function isElapsedSpawnTime(
  seconds: number | null | undefined,
  raidDurationMinutes?: number
): seconds is number {
  if (
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds <= 0 ||
    seconds >= SPAWN_TIME_SENTINEL
  ) {
    return false;
  }

  return !raidDurationMinutes || seconds <= raidDurationMinutes * 60;
}

export function formatElapsedRaidTime(seconds: number): string {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function getEncounterTiming(
  encounter: Boss,
  raidDurationMinutes?: number
): EncounterTiming {
  return {
    elapsedSeconds: isElapsedSpawnTime(
      encounter.spawnTime,
      raidDurationMinutes
    )
      ? encounter.spawnTime
      : null,
    randomized: encounter.spawnTimeRandom === true,
    triggered: Boolean(encounter.spawnTrigger?.trim() || encounter.switchId?.trim()),
  };
}

export function getEncounterTimingLabels(
  encounter: Boss,
  raidDurationMinutes?: number
): string[] {
  const timing = getEncounterTiming(encounter, raidDurationMinutes);
  const labels: string[] = [];

  if (timing.elapsedSeconds !== null) {
    labels.push(`${formatElapsedRaidTime(timing.elapsedSeconds)} into raid`);
  }
  if (timing.randomized) labels.push("Randomized timing");
  if (timing.triggered) labels.push("Switch-triggered");

  return labels;
}

export function summarizeSpawnTiming(
  encounters: Boss[],
  raidDurationMinutes?: number
): SpawnTimingSummary {
  const timings = encounters.map((encounter) =>
    getEncounterTiming(encounter, raidDurationMinutes)
  );
  const elapsedSeconds = Array.from(
    new Set(
      timings.flatMap((timing) =>
        timing.elapsedSeconds === null ? [] : [timing.elapsedSeconds]
      )
    )
  ).sort((left, right) => left - right);
  const randomized = timings.some((timing) => timing.randomized);
  const triggered = timings.some((timing) => timing.triggered);

  return {
    elapsedSeconds,
    randomized,
    triggered,
    hasMeaningfulTiming: elapsedSeconds.length > 0 || randomized || triggered,
  };
}
