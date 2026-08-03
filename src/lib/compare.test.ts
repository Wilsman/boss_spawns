import { describe, expect, test } from "bun:test";
import { buildBossComparisons } from "./compare";
import type { GameMode, SpawnData } from "@/types";

function modeData(
  entries: Array<{ map: string; boss: string; chance: number }>
): SpawnData[] {
  return entries.map((entry) => ({
    name: entry.map,
    bosses: [
      {
        boss: { name: entry.boss },
        spawnChance: entry.chance,
        spawnLocations: [],
      },
    ],
  }));
}

function comparisonData(
  regular: SpawnData[],
  pve: SpawnData[],
  season: SpawnData[]
): Record<GameMode, SpawnData[]> {
  return { regular, pve, "pvp-season": season };
}

describe("three-mode boss comparison", () => {
  test("omits rows whose rates are equal in all three modes", () => {
    const same = modeData([{ map: "Customs", boss: "Reshala", chance: 0.3 }]);

    expect(buildBossComparisons(comparisonData(same, same, same))).toEqual([]);
  });

  test("keeps all three rates when any mode differs", () => {
    const rows = buildBossComparisons(comparisonData(
      modeData([{ map: "Customs", boss: "Reshala", chance: 0.2 }]),
      modeData([{ map: "Customs", boss: "Reshala", chance: 0.3 }]),
      modeData([{ map: "Customs", boss: "Reshala", chance: 0.4 }])
    ));

    expect(rows).toHaveLength(1);
    expect(rows[0].rates).toEqual({
      regular: 0.2,
      pve: 0.3,
      "pvp-season": 0.4,
    });
  });

  test("represents a boss missing from a mode with null", () => {
    const rows = buildBossComparisons(comparisonData(
      modeData([{ map: "Woods", boss: "Shturman", chance: 0.25 }]),
      [],
      modeData([{ map: "Woods", boss: "Shturman", chance: 0.5 }])
    ));

    expect(rows[0].rates).toEqual({
      regular: 0.25,
      pve: null,
      "pvp-season": 0.5,
    });
  });
});
