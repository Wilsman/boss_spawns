import { Boss, Escort, Health, SpawnData, SpawnLocation } from "@/types";
import { DataChange } from "./diff";
import tempBossDataFromFile from "./temp-bosses.json"; // Added import for temp bosses
import { BOSS_OVERRIDES, ENABLE_OVERRIDES } from "@/config/boss-overrides";
import {
  readChangeStorageNumber,
  readChangeStorageRaw,
  writeChangeStorage,
} from "@/lib/change-storage";


export type { SpawnData };

const CACHE_VERSION = 11;
const CHANGES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for changes data (can be adjusted independently)
const DEFAULT_CHANGES_API_BASE_URL = "https://bossdata.cultistcircle.workers.dev";
const CHANGES_API_PATH = "/api/changes";
const CHANGES_API_LIMIT = 1000;
const TARKOV_JSON_API_BASE_URL = "https://json.tarkov.dev";

type GameMode = "regular" | "pve";

interface TarkovJsonResponse {
  data?: {
    maps?: Record<string, TarkovJsonMap>;
    mobs?: Record<string, TarkovJsonMob>;
  };
}

interface TarkovJsonMap {
  wiki?: string | null;
  normalizedName?: string | null;
  nameId?: string | null;
  bosses?: TarkovJsonBoss[];
}

interface TarkovJsonBoss {
  mob?: string | null;
  spawnChance?: number | null;
  spawnLocations?: TarkovJsonSpawnLocation[];
  escorts?: TarkovJsonEscort[];
}

interface TarkovJsonSpawnLocation {
  name?: string | null;
  chance?: number | null;
}

interface TarkovJsonEscort {
  amount?: Array<{
    count?: number | null;
  }>;
  mob?: string | null;
}

interface TarkovJsonMob {
  normalizedName?: string | null;
  imagePortraitLink?: string | null;
  health?: Health[] | null;
}

const MAP_NAME_OVERRIDES: Record<string, string> = {
  factory: "Factory",
  customs: "Customs",
  woods: "Woods",
  lighthouse: "Lighthouse",
  shoreline: "Shoreline",
  reserve: "Reserve",
  interchange: "Interchange",
  "streets-of-tarkov": "Streets of Tarkov",
  "night-factory": "Night Factory",
  "the-lab": "The Lab",
  "ground-zero": "Ground Zero",
  "ground-zero-21": "Ground Zero 21+",
  "the-labyrinth": "The Labyrinth",
  terminal: "Terminal",
  icebreaker: "Icebreaker",
};

const DISPLAY_NAME_TRANSLATIONS: Record<string, string> = {
  blackDivision: "Black Division",
  bossBoar: "Kaban",
  bossBoarSniper: "Kaban Guard (Sniper)",
  bossBully: "Reshala",
  bossBullyBlackDiv: "Black Div. Boss",
  bossGluhar: "Glukhar",
  bossKilla: "Killa",
  bossKillaAgro: "Vengeful Killa",
  bossKnight: "Knight (Goons)",
  bossKojaniy: "Shturman",
  bossKolontay: "Kollontay",
  bossPartisan: "Partisan",
  bossSanitar: "Sanitar",
  bossTagilla: "Tagilla",
  bossTagillaAgro: "Shadow of Tagilla",
  bossWedge: "The Wedge",
  bossZryachiy: "Zryachiy",
  ExUsec: "Rogue",
  followerBigPipe: "Big Pipe",
  followerBirdEye: "Birdeye",
  followerBoar: "Kaban Guard",
  followerBoarClose1: "Basmach",
  followerBoarClose2: "Gus",
  followerBully: "Reshala Guard",
  followerBullyBlackDiv: "Black Div. Guard",
  followerGluharAssault: "Glukhar Guard (Assault)",
  followerGluharScout: "Glukhar Guard (Scout)",
  followerGluharSecurity: "Glukhar Guard (Security)",
  followerKojaniy: "Shturman Guard",
  followerKolontayAssault: "Kollontay Guard (Assault)",
  followerKolontaySecurity: "Kollontay Guard (Security)",
  followerSanitar: "Sanitar Guard",
  followerZryachiy: "Zryachiy Guard",
  PmcBot: "Raider",
  pmcBEAR: "BEAR",
  pmcBotBlackDiv: "Black Div. Raider",
  pmcUSEC: "USEC",
  sectantPriest: "Cultist Priest",
  sectantWarrior: "Cultist Warrior",
  Sentry: "Arena Fighter",
  tagillaHelperAgro: "Labyrinth Guard",
  vsRF: "Arena Fighter",
  vsRFSniper: "Arena Fighter Sniper",
  BotZone: "Any scav spawn",
  BotZoneBasement: "Basement",
  BotZoneFloor1: "First Floor",
  BotZoneFloor2: "Second Floor",
  BotZoneGate1: "Hangar Gate",
  BotZoneGate2: "Parking Gate",
  eger_barracks_area_1: "White Pawn",
  eger_barracks_area_2: "Black Pawn",
  killCam: "Industrial Plant",
  Killnewoil: "New Gas Station",
  Killoldoil: "Old Gas Station",
  meh_44_eastLight_kill: "Lighthouse Island",
  place_merch_022_1: "Inside ULTRA Mall",
  place_merch_022_2: "Inside ULTRA Mall",
  place_merch_022_3: "Inside ULTRA Mall",
  place_merch_022_4: "Inside ULTRA Mall",
  place_merch_022_5: "Inside ULTRA Mall",
  place_merch_022_6: "Inside ULTRA Mall",
  place_merch_022_7: "Inside ULTRA Mall",
  prapor_27_1: "Stronghold (Customs)",
  prapor_27_2: "Medical Camp (Woods)",
  prapor_27_3: "Inside Resort",
  prapor_27_4: "Inside Resort",
  q14_10_kill: "Smuggler's Base",
  quest_st_10_area: "Car Dealership",
  quest_zone_find_2st_mech: "Chek.13 marked room",
  quest_zone_keeper6_kiba_kill: "Around Kiba Arms store",
  Zone_Island: "Island",
  Zone_Blockpost: "Water Treatment Southwest Gate",
  Zone_Chalet: "Chalet",
  ZoneForestTruck: "Truck west of resort",
  Zone_Hellicopter: "Water Treatment Helicopter",
  Zone_OldHouse: "Rundown village island",
  Zone_TreatmentBeach: "Water Treatment West Building",
  Zone_TreatmentContainers: "Water Treatment North Building",
  Zone_TreatmentRocks: "Water Treatment East Building",
  Zone_RoofBeach: "Water Treatment West Building Roof",
  Zone_RoofContainers: "Water Treatment North Building Roof",
  Zone_RoofRocks: "Water Treatment East Building Roof",
  ZoneBarrack: "Barracks",
  ZoneBigRocks: "Woods Mountain",
  ZoneBrokenVill: "Rundown Village",
  ZoneCarShowroom: "Car Dealership",
  ZoneCarShowroom_main_roof: "Car Dealership Roof",
  ZoneCenter: "Center",
  ZoneCenterBot: "Center",
  ZoneClearVill: "Village",
  ZoneClimova: "Klimov Shopping Mall",
  ZoneCrossRoad: "West Bank Crossroads",
  ZoneCustoms: "Customs Warehouse",
  ZoneDormitory: "Dorms",
  ZoneFactoryCenter: "Construction",
  ZoneForestGasStation: "Gas Station Forest",
  ZoneForestSpawn: "Northeast of Sunken Village",
  ZoneGasStation: "New Gas Station",
  ZoneGoshan: "Goshan",
  ZoneGreenHouses: "Greenhouses",
  ZoneHotel_1: "Pinewood Hotel",
  ZoneHotel_2: "Pinewood Hotel",
  ZoneIDEA: "IDEA",
  ZoneIDEAPark: "IDEA Parking Garage",
  ZoneMeteoStation: "Weather Station",
  ZoneMiniHouse: "West of Lumber Mill",
  ZoneMvd: "Ministry of the Interior Academy",
  ZoneOldAZS: "Old Gas Station",
  ZoneOLI: "OLI",
  ZoneOLIPark: "OLI Parking Garage",
  ZonePort: "Pier",
  ZonePowerStation: "Hydroelectric Power Station",
  ZonePTOR1: "Black Knight",
  ZonePTOR2: "White Knight",
  ZoneRailStrorage: "K Buildings",
  ZoneRoad: "Scav House/Checkpoint Road",
  ZoneSanatorium1: "West Wing",
  ZoneSanatorium2: "East Wing",
  ZoneSandbox: "Any scav spawn",
  ZoneScavBase: "Stronghold",
  ZoneScavBase2: "Northwest Scav Bunker",
  ZoneSmuglers: "Smuggler's Depot",
  ZoneStartVillage: "Village",
  ZoneSubCommand: "Command Bunker",
  ZoneSubStorage: "Storage Bunker",
  ZoneSW00: "Zmejskij Alley Block",
  ZoneSW01: "Zmejskij Alley Block",
  ZoneTankSquare: "Construction",
  ZoneTagilla: "Tagilla",
  ZoneWoodCutter: "Lumber Mill",
};

function normalizeChangesApiBaseUrl(rawValue?: string): string {
  const candidate = rawValue?.trim();

  if (!candidate || candidate.includes("[your-subdomain]")) {
    return DEFAULT_CHANGES_API_BASE_URL;
  }

  const normalized = candidate
    .replace(/\/$/, "")
    .replace(/\/api\/changes$/, "")
    .replace(/\/changes$/, "");

  if (normalized.startsWith("/")) {
    return normalized;
  }

  try {
    return new URL(normalized).toString().replace(/\/$/, "");
  } catch (error) {
    console.warn(
      "Invalid changes API base URL, falling back to default:",
      normalized,
      error
    );
    return DEFAULT_CHANGES_API_BASE_URL;
  }
}

const CHANGES_API_BASE_URL = normalizeChangesApiBaseUrl(
  import.meta.env.VITE_CHANGES_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    DEFAULT_CHANGES_API_BASE_URL
);

// Cast the imported JSON to the correct type
const tempBossData: SpawnData[] = tempBossDataFromFile as SpawnData[];

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word.length <= 3 && word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getTranslatedName(rawName?: string | null): string {
  if (!rawName) {
    return "Unknown";
  }

  return DISPLAY_NAME_TRANSLATIONS[rawName] ?? titleCase(rawName);
}

function getMapDisplayName(map: TarkovJsonMap): string {
  const normalizedName = map.normalizedName?.trim();

  if (normalizedName) {
    return MAP_NAME_OVERRIDES[normalizedName] ?? titleCase(normalizedName);
  }

  return titleCase(map.nameId || "Unknown Map");
}

function getMobDisplayName(mobKey?: string | null, mob?: TarkovJsonMob): string {
  if (mobKey && DISPLAY_NAME_TRANSLATIONS[mobKey]) {
    return DISPLAY_NAME_TRANSLATIONS[mobKey];
  }

  if (mob?.normalizedName) {
    return getTranslatedName(mob.normalizedName);
  }

  return getTranslatedName(mobKey);
}

function getBodyPartDisplayName(bodyPart?: string | null): string {
  if (!bodyPart) {
    return "Unknown";
  }

  const rawName = bodyPart.split("/").filter(Boolean).pop() ?? bodyPart;
  return titleCase(rawName);
}

function normalizeHealth(health?: Health[] | null): Health[] | null {
  if (!health?.length) {
    return null;
  }

  return health.map((part) => ({
    ...part,
    bodyPart: getBodyPartDisplayName(part.bodyPart),
  }));
}

function normalizeSpawnLocations(
  locations?: TarkovJsonSpawnLocation[]
): SpawnLocation[] {
  return (locations ?? []).map((location) => ({
    name: getTranslatedName(location.name),
    chance: location.chance ?? 0,
  }));
}

function normalizeEscorts(
  escorts: TarkovJsonEscort[] | undefined,
  mobs: Record<string, TarkovJsonMob>
): Escort[] {
  return (escorts ?? [])
    .filter((escort) => Boolean(escort.mob))
    .map((escort) => {
      const escortMob = mobs[escort.mob!];

      return {
        amount: (escort.amount ?? []).map((amount) => ({
          count: amount.count ?? 0,
        })),
        boss: {
          name: getMobDisplayName(escort.mob, escortMob),
          health: normalizeHealth(escortMob?.health),
          imagePortraitLink: escortMob?.imagePortraitLink ?? null,
        },
      };
    });
}

function normalizeBoss(
  boss: TarkovJsonBoss,
  mobs: Record<string, TarkovJsonMob>
): Boss {
  const mob = boss.mob ? mobs[boss.mob] : undefined;

  return {
    boss: {
      name: getMobDisplayName(boss.mob, mob),
      health: normalizeHealth(mob?.health),
      imagePortraitLink: mob?.imagePortraitLink ?? null,
    },
    spawnChance: boss.spawnChance ?? 0,
    spawnLocations: normalizeSpawnLocations(boss.spawnLocations),
    escorts: normalizeEscorts(boss.escorts, mobs),
  };
}

function normalizeMapsPayload(payload: TarkovJsonResponse): SpawnData[] {
  const maps = payload.data?.maps;
  const mobs = payload.data?.mobs;

  if (!maps || !mobs) {
    throw new Error("Invalid tarkov.dev JSON maps response");
  }

  return Object.values(maps).map((map) => ({
    name: getMapDisplayName(map),
    wiki: map.wiki ?? undefined,
    bosses: (map.bosses ?? []).map((boss) => normalizeBoss(boss, mobs)),
  }));
}

async function fetchJsonMaps(mode: GameMode): Promise<SpawnData[]> {
  const response = await fetch(`${TARKOV_JSON_API_BASE_URL}/${mode}/maps`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `tarkov.dev JSON ${mode} maps fetch failed: ${response.status}`
    );
  }

  const result = (await response.json()) as TarkovJsonResponse;
  return normalizeMapsPayload(result);
}

function getExpiredCachedData(
  cached: string | null
): { regular: SpawnData[]; pve: SpawnData[] } | null {
  if (!cached) {
    return null;
  }

  try {
    const { data } = JSON.parse(cached);

    if (data?.regular && data?.pve) {
      return {
        regular: applyLocalData(data.regular, "regular"),
        pve: applyLocalData(data.pve, "pve"),
      };
    }
  } catch (error) {
    console.error("Error parsing cached data:", error);
  }

  return null;
}

function clearLegacySpawnCacheSnapshots(): void {
  [
    "maps_regular_previous",
    "maps_pve_previous",
    "maps_combined_previous",
  ].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove stale cache key ${key}:`, error);
    }
  });
}

function writeSpawnCache(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    return;
  } catch (error) {
    clearLegacySpawnCacheSnapshots();

    try {
      localStorage.setItem(key, value);
      return;
    } catch (retryError) {
      console.warn(
        `Failed to persist ${key}; continuing with in-memory data:`,
        retryError
      );
    }
  }
}

// Helper function to merge spawn data with temporary boss data and apply overrides
export function applyLocalData(currentData: SpawnData[], mode: "regular" | "pve"): SpawnData[] {
  let mergedData: SpawnData[] = currentData.map((m) => ({
    ...m,
    bosses: [...m.bosses],
  })); // Deep copy to avoid mutating original cache/API data

  // 1. Merge temp bosses (existing logic)
  if (tempBossData && tempBossData.length > 0) {
    tempBossData.forEach((tempMap) => {
      const existingMap = mergedData.find(
        (map: SpawnData) => map.name === tempMap.name
      );
      if (existingMap) {
        // Map exists, merge bosses
        existingMap.bosses = existingMap.bosses.concat(tempMap.bosses);
      } else {
        // Map doesn't exist, add it
        mergedData.push(tempMap);
      }
    });
  }

  // 2. Apply config overrides
  if (ENABLE_OVERRIDES && BOSS_OVERRIDES.length > 0) {
    BOSS_OVERRIDES.forEach((override) => {
      // Check if override applies to this game mode
      const overrideMode = override.gameMode || "both";
      if (overrideMode !== "both" && overrideMode !== mode) {
        return;
      }

      // Normalize mapName to array
      const mapNames = Array.isArray(override.mapName)
        ? override.mapName
        : [override.mapName];

      mapNames.forEach((targetMapName) => {
        let mapData = mergedData.find((m) => m.name === targetMapName);

        if (!mapData) {
          // Map doesn't exist, create it
          mapData = {
            name: targetMapName,
            bosses: [],
          };
          mergedData.push(mapData);
        }

        const bossEntry = mapData.bosses.find(
          (b) => b.boss.name === override.bossName
        );

        if (bossEntry) {
          // Update existing boss
          bossEntry.spawnChance = override.spawnChance;
          if (override.spawnLocations) {
            bossEntry.spawnLocations = override.spawnLocations;
          }
        } else {
          // Add new boss entry (minimal)
          mapData!.bosses.push({
            boss: {
              name: override.bossName,
              // Add placeholders if needed, or rely on optional types
            },
            spawnChance: override.spawnChance,
            spawnLocations: override.spawnLocations || [],
          });
        }
      });
    });
  }

  return mergedData;
}

export async function fetchAllSpawnData(options?: { forceRefresh?: boolean }): Promise<{
  regular: SpawnData[];
  pve: SpawnData[];
}> {
  const CACHE_KEY = "maps_combined";

  // Check cache version and clear if outdated
  const cacheVersion = localStorage.getItem("cache_version");
  if (!cacheVersion || parseInt(cacheVersion) < CACHE_VERSION) {
    // Clear all cached data
    [
      "maps_regular",
      "maps_pve",
      "maps_regular_previous",
      "maps_pve_previous",
      "maps_combined",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.setItem("cache_version", CACHE_VERSION.toString());
  }

  const cached = localStorage.getItem(CACHE_KEY); // Moved declaration here
  if (!options?.forceRefresh) {
    // Check cache first
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const now = new Date().getTime();
        const cacheAge = now - timestamp;
        const FIVE_MINUTES = 5 * 60 * 1000;
        
        // Return cached data only if it's less than 5 minutes old
        if (data?.regular && data?.pve && cacheAge < FIVE_MINUTES) {
          return {
            regular: applyLocalData(data.regular, "regular"),
            pve: applyLocalData(data.pve, "pve"),
          };
        }
      } catch (error) {
        console.error("Error parsing cached data:", error);
      }
    }
  }

  // The app no longer reads previous spawn snapshots, and duplicating the JSON
  // cache can exceed localStorage quota on shared localhost origins.
  clearLegacySpawnCacheSnapshots();

  let regularData: SpawnData[];
  let pveData: SpawnData[];

  try {
    [regularData, pveData] = await Promise.all([
      fetchJsonMaps("regular"),
      fetchJsonMaps("pve"),
    ]);
  } catch (error) {
    console.error("API fetch failed:", error);
    const expiredCachedData = getExpiredCachedData(cached);

    if (expiredCachedData) {
      console.log("Using cached data");
      return expiredCachedData;
    }

    throw new Error("Failed to fetch data");
  }

  console.log("API fetch successful");

  const finalData = {
    regular: applyLocalData(regularData, "regular"),
    pve: applyLocalData(pveData, "pve"),
  };

  // Update cache with transformed data. Persistence is best-effort; fresh data
  // should still render if localStorage is full.
  writeSpawnCache(
    CACHE_KEY,
    JSON.stringify({
      data: finalData,
      timestamp: new Date().getTime(),
    })
  );

  return finalData;
}

function buildChangesApiUrl(since?: number): string {
  const url = CHANGES_API_BASE_URL.startsWith("/")
    ? new URL(CHANGES_API_BASE_URL, window.location.origin)
    : new URL(CHANGES_API_BASE_URL);

  url.pathname = `${url.pathname.replace(/\/$/, "")}${CHANGES_API_PATH}`;
  url.searchParams.set("limit", CHANGES_API_LIMIT.toString());

  if (typeof since === "number" && Number.isFinite(since) && since > 0) {
    url.searchParams.set("since", since.toString());
  }

  return url.toString();
}

function getCachedChanges(): DataChange[] {
  const cached = readChangeStorageRaw("cache");

  if (!cached) {
    return [];
  }

  try {
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse cached changes:", error);
    return [];
  }
}

function getLatestChangeTimestamp(changes: DataChange[]): number {
  return changes.length ? Math.max(...changes.map((change) => change.timestamp)) : 0;
}

function mergeChanges(existingChanges: DataChange[], newChanges: DataChange[]): DataChange[] {
  if (!newChanges.length) {
    return existingChanges;
  }

  const seen = new Set(
    existingChanges.map(
      (change) =>
        `${change.timestamp}|${change.gameMode}|${change.map}|${change.boss}|${change.field}|${change.oldValue}|${change.newValue}`
    )
  );

  const merged = [...existingChanges];

  for (const change of newChanges) {
    const signature = `${change.timestamp}|${change.gameMode}|${change.map}|${change.boss}|${change.field}|${change.oldValue}|${change.newValue}`;

    if (!seen.has(signature)) {
      seen.add(signature);
      merged.push(change);
    }
  }

  return merged.sort((a, b) => b.timestamp - a.timestamp);
}

export async function fetchChanges(options: { force?: boolean } = {}): Promise<DataChange[]> {
  try {
    const { force = false } = options;
    const cachedChanges = getCachedChanges();
    const timestamp = readChangeStorageNumber("cacheTimestamp");
    const now = Date.now();

    if (!force && cachedChanges.length && now - timestamp < CHANGES_CACHE_DURATION) {
      return cachedChanges;
    }

    const latestCachedTimestamp = getLatestChangeTimestamp(cachedChanges);
    const response = await fetch(buildChangesApiUrl(latestCachedTimestamp || undefined), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        writeChangeStorage("cacheTimestamp", now.toString());
        return cachedChanges;
      }

      console.error(
        "Failed to fetch changes:",
        response.status,
        response.statusText
      );
      // If fetch fails but we have cached data, return it even if expired
      if (cachedChanges.length) {
        return cachedChanges;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Invalid response format:", data);
      if (cachedChanges.length) {
        return cachedChanges;
      }
      return [];
    }

    // Transform and validate the API response
    const transformedData = data
      .filter(
        (change) =>
          // Basic validation of required fields
          change.map &&
          change.boss &&
          change.field &&
          change.old_value &&
          change.new_value &&
          typeof change.timestamp === "number"
      )
      .map((change) => ({
        map: change.map,
        boss: change.boss,
        field: change.field,
        oldValue: change.old_value,
        newValue: change.new_value,
        timestamp: change.timestamp,
        gameMode: change.game_mode === "regular" ? "PvP" : "PvE",
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

    const mergedChanges = latestCachedTimestamp
      ? mergeChanges(cachedChanges, transformedData)
      : transformedData;

    writeChangeStorage("cache", JSON.stringify(mergedChanges));
    writeChangeStorage("cacheTimestamp", now.toString());

    return mergedChanges;
  } catch (error) {
    console.error("Error fetching changes:", error);
    // If there's an error and we have cached data, return it even if expired
    const cachedChanges = getCachedChanges();
    if (cachedChanges.length) {
      return cachedChanges;
    }
    throw error;
  }
}
