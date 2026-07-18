export type DataMode = "regular" | "pve" | "compare" | "changes";

export interface SpawnLocation {
  name: string;
  chance: number;
  spawnKey?: string | null;
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
    chance?: number;
  }[];
  mobKey?: string;
  boss: {
    name: string;
    health?: Health[] | null;
    imagePortraitLink?: string | null;
  };
}

export interface Boss {
  mobKey?: string;
  boss: {
    name: string;
    // Add the new properties from the API fetch
    health?: Health[] | null; // Health is an array
    imagePortraitLink?: string | null; // Make optional
  };
  spawnLocations: SpawnLocation[];
  spawnChance: number;
  escorts?: Escort[] | null; // Add escorts array
  supports?: string[];
  spawnTime?: number | null;
  spawnTimeRandom?: boolean;
  spawnTrigger?: string | null;
  switchId?: string | null;
}

export interface MapAiType {
  key: string;
  name: string;
  health?: Health[] | null;
  imagePortraitLink?: string | null;
}

export type GameMode = "regular" | "pve";

export interface MobEquipmentPoolItem {
  itemId: string;
  slot: string;
  ammoIds: string[];
}

export interface MobLootPoolItem {
  itemId: string;
  prevalence: number;
}

export interface MobCatalogEntry extends MapAiType {
  normalizedName?: string;
  equipment: MobEquipmentPoolItem[];
  loot: MobLootPoolItem[];
}

export type MobCatalog = Record<string, MobCatalogEntry>;

export interface ResolvedItem {
  id: string;
  name: string;
  shortName?: string | null;
  iconLink?: string | null;
  link?: string | null;
  types: string[];
  usedInTasks: Array<{ id: string; name: string }>;
  armorClass?: number | null;
  ammo?: {
    damage?: number | null;
    penetrationPower?: number | null;
    caliber?: string | null;
  } | null;
}

export interface SpawnApiData {
  regular: SpawnData[];
  pve: SpawnData[];
  catalogs: Record<GameMode, MobCatalog>;
}

export interface SpawnData {
  id?: string;
  name: string;
  normalizedName?: string;
  nameId?: string;
  wiki?: string;
  enemies?: MapAiType[];
  raidDuration?: number;
  players?: string;
  minPlayerLevel?: number;
  maxPlayerLevel?: number;
  bosses: Boss[];
}

export interface ActionResponse<T = unknown> {
  data?: T;
  error?: string;
}
