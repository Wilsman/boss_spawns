import { expect, test } from "bun:test";
import type { SpawnData } from "../types";
import { isExactBossFilter } from "./boss-aliases";
import { filterMapBosses, getSpawnPins } from "./map-spawns";

const point = { x: 12, y: 3, z: 24 };
const data: SpawnData = {
  name: "Customs",
  bosses: [
    {
      mobKey: "bossKnight",
      boss: { name: "Knight (Goons)" },
      spawnChance: 0.2,
      spawnLocations: [
        {
          name: "Stronghold",
          chance: 1,
          positions: [point, { x: 40, y: 4, z: 80 }],
        },
      ],
    },
    {
      mobKey: "bossKnight",
      boss: { name: "Knight (Goons)" },
      spawnChance: 0.4,
      spawnLocations: [{ name: "Stronghold", chance: 0.5, positions: [point] }],
    },
    {
      mobKey: "bossPartisan",
      boss: { name: "Partisan" },
      spawnChance: 0.15,
      spawnLocations: [],
    },
  ],
};
test("same boss and coordinates retain encounter identity and per-encounter chances", () => {
  const pins = getSpawnPins(data);
  expect(pins).toHaveLength(3);
  expect(new Set(pins.map((p) => p.id)).size).toBe(3);
  expect(pins[0].encounter.spawnChance).toBe(0.2);
  expect(pins[2].encounter.spawnChance).toBe(0.4);
  expect(pins[2].locationChance).toBe(0.5);
  expect(pins[0].position).toEqual(point);
});
test("map filtering preserves boss aliases, location search and bosses without pins", () => {
  expect(filterMapBosses(data, "goons", "stronghold").bosses).toHaveLength(2);
  expect(filterMapBosses(data, "Partisan", "").bosses).toHaveLength(1);
  expect(getSpawnPins(filterMapBosses(data, "Partisan", ""))).toEqual([]);
  expect(filterMapBosses(data, "", "no match").bosses).toEqual([]);
});

test("an exact boss filter excludes bosses whose names only contain it", () => {
  const blackDiv: SpawnData = {
    name: "Terminal",
    bosses: ["Black Div", "Black Division", "Black Div. Raider"].map((name) => ({
      boss: { name },
      spawnChance: 1,
      spawnLocations: [],
    })),
  };
  const names = (map: SpawnData) => map.bosses.map((b) => b.boss.name);
  expect(isExactBossFilter("Black Div", blackDiv.bosses.map((b) => b.boss))).toBe(true);
  expect(names(filterMapBosses(blackDiv, "Black Div", "", true))).toEqual(["Black Div"]);
  expect(isExactBossFilter("raider", blackDiv.bosses.map((b) => b.boss))).toBe(false);
  expect(names(filterMapBosses(blackDiv, "raider", "", false))).toEqual([
    "Black Div. Raider",
  ]);
});
