import { SpawnLocation } from "@/types";

export const ENABLE_OVERRIDES = true;

export interface BossOverride {
  mapName: string | string[];
  bossName: string;
  spawnChance: number; // 0 to 1 (e.g., 0.3 for 30%)
  spawnLocations?: SpawnLocation[];
  gameMode?: "regular" | "pve" | "both"; // Default to "both" if undefined
}

// Reshala	Customs	Dorms (3-story), New Gas Station, Stronghold (Fortress)
// Killa	Interchange	Roams the entire mall (especially 2nd floor & center)
// Tagilla	Factory	Roams the entire map & Interchange (50%)
// Glukhar	Reserve	"K" Buildings, Black/White Knight, Train Station
// Shturman	Woods	Lumber Mill (Sawmill)
// Sanitar	Shoreline	Health Resort, Cottages, Pier
// Zryachiy	Lighthouse	The Lighthouse Island (requires DSP transmitter to access safely)
// Kaban	Streets of Tarkov	Lexos Car Dealership
// Kollontay	Streets of Tarkov & Ground Zero

export const BOSS_OVERRIDES: BossOverride[] = [
  {
    mapName: "Interchange",
    bossName: "Killa",
    spawnChance: 0.75, // 75%
    spawnLocations: [
      { name: "Center", chance: 0.4 }, //Center40%OLI20%IDEA20%Goshan20%
      { name: "OLI", chance: 0.2 },
      { name: "IDEA", chance: 0.2 },
      { name: "Goshan", chance: 0.2 },
    ],
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Customs",
    bossName: "Reshala",
    spawnLocations: [
      { name: "Stronghold", chance: 0.4 },
      { name: "Dorms", chance: 0.2 },
      { name: "New Gas Station", chance: 0.2 },
      { name: "Dorms", chance: 0.2 },
    ],
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: ["Factory", "Night Factory"],
    bossName: "Tagilla",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Interchange",
    bossName: "Tagilla",
    spawnChance: 0.5, // 50%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Reserve",
    bossName: "Glukhar",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Woods",
    bossName: "Shturman",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Shoreline",
    bossName: "Sanitar",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Lighthouse",
    bossName: "Zryachiy",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: "Streets of Tarkov",
    bossName: "Kaban",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: ["Ground Zero", "Ground Zero 21+", "Streets of Tarkov"],
    bossName: "Kollontay",
    spawnChance: 0.75, // 75%
    gameMode: "both" // PVP & PvE
  },
  {
    mapName: ["Woods", "Customs", "Shoreline", "Lighthouse"],
    bossName: "Goons",
    spawnChance: 0.4, // 40%
    gameMode: "both"
  },
  {
    mapName: ["Woods", "Customs", "Shoreline"],
    bossName: "Cultist Priest",
    spawnChance: 0.2, // 20%
    gameMode: "both"
  }
];
