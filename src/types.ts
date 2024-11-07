export type DataMode = "regular" | "pve" | "compare" | "changes";

export interface SpawnLocation {
  name: string;
  chance: number;
}

export interface Boss {
  boss: {
    name: string;
  };
  spawnLocations: SpawnLocation[];
  spawnChance: number;
}

export interface SpawnData {
  name: string;
  bosses: Boss[];
}

export interface ActionResponse<T = unknown> {
  data?: T;
  error?: string;
}
