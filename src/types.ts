export type DataMode = "regular" | "pve" | "compare";

export interface SpawnLocation {
  name: string;
  chance: number;
}

export interface Boss {
  boss: {
    normalizedName: string;
  };
  spawnLocations: SpawnLocation[];
  spawnChance: number;
}

export interface SpawnData {
  normalizedName: string;
  bosses: Boss[];
}

export interface ActionResponse<T = unknown> {
  data?: T;
  error?: string;
}
