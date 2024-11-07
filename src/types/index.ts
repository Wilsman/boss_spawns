export interface SpawnData {
  name: string;
  bosses: Boss[];
}

export interface Boss {
  boss: {
    name: string;
  };
  spawnLocations: SpawnLocation[];
  spawnChance: number;
}

export interface SpawnLocation {
  name: string;
  chance: number;
}

export type DataMode = "regular" | "pve" | "compare";

// ... rest of types remain the same 