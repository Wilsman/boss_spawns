import type { Boss, GameMode, SpawnData } from "@/types";
import { getCanonicalBossName } from "@/lib/boss-aliases";

export const COMPARISON_MODES: GameMode[] = ["regular", "pve", "pvp-season"];

export interface BossComparison {
  map: string;
  boss: string;
  rates: Record<GameMode, number | null>;
  representative: Boss;
}

export function buildBossComparisons(
  data: Record<GameMode, SpawnData[]>
): BossComparison[] {
  const rows = new Map<string, BossComparison>();

  for (const mode of COMPARISON_MODES) {
    for (const map of data[mode]) {
      for (const encounter of map.bosses ?? []) {
        const boss = getCanonicalBossName(
          encounter.boss.name,
          encounter.spawnChance
        );
        const key = `${map.name}\u0000${boss}`;
        const existing = rows.get(key) ?? {
          map: map.name,
          boss,
          rates: {
            regular: null,
            pve: null,
            "pvp-season": null,
          },
          representative: encounter,
        };
        const currentRate = existing.rates[mode];

        if (currentRate === null || encounter.spawnChance > currentRate) {
          existing.rates[mode] = encounter.spawnChance;
          if (!existing.representative.boss.imagePortraitLink) {
            existing.representative = encounter;
          }
        }

        rows.set(key, existing);
      }
    }
  }

  return Array.from(rows.values()).filter((row) => {
    const rates = COMPARISON_MODES.map((mode) => row.rates[mode]);
    return new Set(rates).size > 1;
  });
}
