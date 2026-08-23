import { describe, expect, test } from "bun:test";
import type { Boss } from "@/types";
import {
  formatElapsedRaidTime,
  getEncounterTimingLabels,
  summarizeSpawnTiming,
} from "./spawn-timing";

function encounter(overrides: Partial<Boss> = {}): Boss {
  return {
    boss: { name: "Test boss" },
    spawnChance: 0.5,
    spawnLocations: [],
    ...overrides,
  };
}

describe("boss spawn timing", () => {
  test("formats elapsed raid time", () => {
    expect(formatElapsedRaidTime(300)).toBe("5:00");
    expect(formatElapsedRaidTime(450)).toBe("7:30");
  });

  test("sorts and deduplicates seasonal Lab Black Division waves", () => {
    const summary = summarizeSpawnTiming(
      [300, 450, 600, 600, 800, 900, 1200].map((spawnTime) =>
        encounter({ spawnTime })
      ),
      30
    );

    expect(summary.elapsedSeconds).toEqual([300, 450, 600, 800, 900, 1200]);
    expect(summary.hasMeaningfulTiming).toBe(true);
  });

  test("keeps Partisan's delayed spawn and randomized Goon timing", () => {
    expect(summarizeSpawnTiming([encounter({ spawnTime: 900 })], 45)).toMatchObject({
      elapsedSeconds: [900],
      randomized: false,
      triggered: false,
    });
    expect(
      summarizeSpawnTiming(
        [encounter({ spawnTime: -1, spawnTimeRandom: true })],
        45
      )
    ).toMatchObject({
      elapsedSeconds: [],
      randomized: true,
      hasMeaningfulTiming: true,
    });
  });

  test("summarizes mixed timed and switch-triggered encounters", () => {
    const summary = summarizeSpawnTiming(
      [
        encounter({ spawnTime: 600 }),
        encounter({
          spawnTime: -1,
          spawnTrigger: "Switch",
          switchId: "autoId_00632_EXFIL",
        }),
      ],
      30
    );

    expect(summary).toEqual({
      elapsedSeconds: [600],
      randomized: false,
      triggered: true,
      hasMeaningfulTiming: true,
    });
    expect(
      getEncounterTimingLabels(
        encounter({ spawnTrigger: "Switch", switchId: "autoId_00632_EXFIL" }),
        30
      )
    ).toEqual(["Switch-triggered"]);
  });

  test("suppresses Cultist defaults, sentinels, and times beyond the raid", () => {
    const summary = summarizeSpawnTiming(
      [
        encounter({ boss: { name: "Cultist Priest" }, spawnTime: -1 }),
        encounter({ spawnTime: 9999 }),
        encounter({ spawnTime: 1801 }),
      ],
      30
    );

    expect(summary).toEqual({
      elapsedSeconds: [],
      randomized: false,
      triggered: false,
      hasMeaningfulTiming: false,
    });
  });
});
