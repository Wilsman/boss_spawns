import type { SpawnData, Boss, GamePosition } from "../types";
import { bossMatchesQuery, getCanonicalBossName } from "./boss-aliases";

export interface SpawnPin {
  id: string;
  bossName: string;
  encounter: Boss;
  location: string;
  locationChance: number;
  position: GamePosition;
}
export function getSpawnPins(map: SpawnData): SpawnPin[] {
  return map.bosses.flatMap((encounter, bi) =>
    encounter.spawnLocations.flatMap((location, li) =>
      (location.positions ?? [])
        .filter((p) => [p.x, p.y, p.z].every(Number.isFinite))
        .map((position, pi) => ({
          id: `${bi}:${li}:${pi}`,
          bossName: getCanonicalBossName(
            encounter.boss.name,
            encounter.spawnChance,
          ),
          encounter,
          location: location.name,
          locationChance: location.chance,
          position,
        })),
    ),
  );
}
export function filterMapBosses(
  map: SpawnData,
  boss: string,
  search: string,
): SpawnData {
  const query = search.trim().toLowerCase();
  return {
    ...map,
    bosses: map.bosses.filter(
      (b) =>
        (!boss || bossMatchesQuery(b.boss.name, boss, b.spawnChance)) &&
        (!query ||
          map.name.toLowerCase().includes(query) ||
          bossMatchesQuery(b.boss.name, query, b.spawnChance) ||
          b.spawnLocations.some((l) => l.name.toLowerCase().includes(query))),
    ),
  };
}

/** Pixel offset for one pin. */
export interface MarkerOffset {
  dx: number;
  dy: number;
}

/**
 * Spread pins that share the exact same game position onto a small pixel
 * circle so stacked bosses are all visible and clickable. Offsets are in
 * screen pixels, so separation holds at any zoom without touching the true
 * game coordinates.
 */
export function layoutOverlappingMarkers(pins: SpawnPin[]): MarkerOffset[] {
  const groups = new Map<string, number[]>();
  pins.forEach((pin, index) => {
    const key = `${pin.position.x},${pin.position.z}`;
    const group = groups.get(key);
    if (group) group.push(index);
    else groups.set(key, [index]);
  });
  const offsets: MarkerOffset[] = pins.map(() => ({ dx: 0, dy: 0 }));
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    const radius = indices.length <= 3 ? 16 : 20;
    indices.forEach((pinIndex, k) => {
      const angle = (2 * Math.PI * k) / indices.length - Math.PI / 2;
      offsets[pinIndex] = {
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius,
      };
    });
  }
  return offsets;
}
