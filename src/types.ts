export type DataMode = "regular" | "pve" | "compare" | "changes";

export interface SpawnLocation {
  name: string;
  chance: number;
}

// Define the Health interface based on your API fetch
export interface Health {
  bodyPart: string;
  max: number;
}

// Define the Escort interface for boss escorts
export interface Escort {
  amount: {
    count: number;
  }[];
  boss: {
    name: string;
    health?: Health[] | null;
    imagePortraitLink?: string | null;
  };
}

export interface Boss {
  boss: {
    name: string;
    // Add the new properties from the API fetch
    health?: Health[] | null; // Health is an array
    imagePortraitLink?: string | null; // Make optional
  };
  spawnLocations: SpawnLocation[];
  spawnChance: number;
  escorts?: Escort[] | null; // Add escorts array
}

export interface SpawnData {
  name: string;
  bosses: Boss[];
}

export interface ActionResponse<T = unknown> {
  data?: T;
  error?: string;
}
