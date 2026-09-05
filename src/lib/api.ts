import {
  Boss,
  Escort,
  GameMode,
  Health,
  MobCatalog,
  MobEquipmentPoolItem,
  SpawnApiData,
  SpawnData,
  SpawnLocation,
  GoonReport,
} from "@/types";
import { DataChange } from "./diff";
import tempBossDataFromFile from "./temp-bosses.json"; // Added import for temp bosses
import { BOSS_OVERRIDES, ENABLE_OVERRIDES } from "@/config/boss-overrides";
import {
  readChangeStorageNumber,
  readChangeStorageRaw,
  removeChangeStorage,
  writeChangeStorage,
  writeChangeStorageNumber,
} from "@/lib/change-storage";


export type { SpawnData };

const CACHE_VERSION = 14;
const CHANGES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for changes data (can be adjusted independently)
const CHANGES_CACHE_VERSION = 2;
const CHANGES_FAILURE_RETRY_DELAY = 60 * 60 * 1000;
const CHANGES_QUOTA_RESET_GRACE = 5 * 60 * 1000;
const DEFAULT_CHANGES_API_BASE_URL = "https://bossdata.cultistcircle.workers.dev";
const CHANGES_API_PATH = "/api/changes";
const CHANGES_HEALTH_API_PATH = "/api/health";
const CHANGES_API_LIMIT = 1000;
const TARKOV_JSON_API_BASE_URL = "https://json.tarkov.dev";

export type ChangeGameModeLabel = "PvP" | "PvE" | "Season";

export type ChangeMonitorGameMode = "regular" | "pve" | "pvp-season";

export interface ChangeMonitorModeHealth {
  gameMode: ChangeMonitorGameMode;
  stale: boolean;
  lastAttemptAt: number | null;
  lastSuccessAt: number | null;
  lastError: string | null;
  lastDurationMs: number | null;
  lastChangeCount: number;
  lastResult: string | null;
}

export interface ChangeMonitorHealth {
  healthy: boolean;
  now: number;
  staleAfterMs: number;
  modes: ChangeMonitorModeHealth[];
}

export function getChangeGameModeLabel(
  gameMode: unknown
): ChangeGameModeLabel | null {
  switch (gameMode) {
    case "regular":
      return "PvP";
    case "pve":
      return "PvE";
    case "pvp-season":
      return "Season";
    default:
      return null;
  }
}

interface TarkovJsonResponse {
  data?: {
    maps?: Record<string, TarkovJsonMap>;
    mobs?: Record<string, TarkovJsonMob>;
    goonReports?: GoonReport[];
  };
}

interface TarkovJsonMap {
  id?: string | null;
  wiki?: string | null;
  normalizedName?: string | null;
  nameId?: string | null;
  enemies?: string[];
  raidDuration?: number | null;
  players?: string | null;
  minPlayerLevel?: number | null;
  maxPlayerLevel?: number | null;
  bosses?: TarkovJsonBoss[];
}

interface TarkovJsonBoss {
  mob?: string | null;
  spawnChance?: number | null;
  spawnLocations?: TarkovJsonSpawnLocation[];
  escorts?: TarkovJsonEscort[];
  supports?: string[];
  spawnTime?: number | null;
  spawnTimeRandom?: boolean;
  spawnTrigger?: string | null;
  switch_id?: string | null;
}

interface TarkovJsonSpawnLocation {
  name?: string | null;
  chance?: number | null;
  spawnKey?: string | null;
}

interface TarkovJsonEscort {
  amount?: Array<{
    count?: number | null;
    chance?: number | null;
  }>;
  mob?: string | null;
}

interface TarkovJsonMob {
  normalizedName?: string | null;
  imagePortraitLink?: string | null;
  health?: Health[] | null;
  equipment?: TarkovJsonEquipment[];
  items?: TarkovJsonMobLootItem[];
}

interface TarkovJsonEquipment {
  item?: string | null;
  attributes?: {
    slot?: string | null;
  };
  contains?: Array<{
    item?: string | null;
    attributes?: {
      slotNameId?: string | null;
    };
  }>;
}

interface TarkovJsonMobLootItem {
  id?: string | null;
  attributes?: {
    prevalence?: number | null;
  };
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
  "the-lab-dark": "Dark Labs",
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
  bossWedgeLab: "The Wedge (Dark Labs)",
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
  followerWedgeLab: "The Wedge Guard (Dark Labs)",
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
    spawnKey: location.spawnKey ?? location.name ?? null,
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
        mobKey: escort.mob!,
        amount: (escort.amount ?? []).map((amount) => ({
          count: amount.count ?? 0,
          chance: amount.chance ?? undefined,
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
    mobKey: boss.mob ?? undefined,
    boss: {
      name: getMobDisplayName(boss.mob, mob),
      health: normalizeHealth(mob?.health),
      imagePortraitLink: mob?.imagePortraitLink ?? null,
    },
    spawnChance: boss.spawnChance ?? 0,
    spawnLocations: normalizeSpawnLocations(boss.spawnLocations),
    escorts: normalizeEscorts(boss.escorts, mobs),
    supports: boss.supports ?? [],
    spawnTime: boss.spawnTime ?? null,
    spawnTimeRandom: boss.spawnTimeRandom ?? false,
    spawnTrigger: boss.spawnTrigger ?? null,
    switchId: boss.switch_id ?? null,
  };
}

function isAmmunitionContainerSlot(slotName?: string | null): boolean {
  return Boolean(slotName && /(cartridge|patron|ammo)/i.test(slotName));
}

function normalizeMobEquipment(
  equipment: TarkovJsonEquipment[] | undefined
): MobEquipmentPoolItem[] {
  const deduplicated = new Map<string, MobEquipmentPoolItem>();

  for (const option of equipment ?? []) {
    const itemId = option.item?.trim();
    const slot = option.attributes?.slot?.trim();

    if (!itemId || !slot) {
      continue;
    }

    const key = `${slot}|${itemId}`;
    const current = deduplicated.get(key) ?? { itemId, slot, ammoIds: [] };
    const ammoIds = new Set(current.ammoIds);

    for (const contained of option.contains ?? []) {
      if (
        contained.item &&
        isAmmunitionContainerSlot(contained.attributes?.slotNameId)
      ) {
        ammoIds.add(contained.item);
      }
    }

    deduplicated.set(key, { ...current, ammoIds: Array.from(ammoIds) });
  }

  return Array.from(deduplicated.values()).sort(
    (left, right) =>
      left.slot.localeCompare(right.slot) || left.itemId.localeCompare(right.itemId)
  );
}

function normalizeMobCatalog(
  mobs: Record<string, TarkovJsonMob>
): MobCatalog {
  return Object.fromEntries(
    Object.entries(mobs).map(([key, mob]) => {
      const loot = new Map<string, number>();

      for (const item of mob.items ?? []) {
        if (!item.id) {
          continue;
        }

        loot.set(
          item.id,
          Math.max(loot.get(item.id) ?? 0, item.attributes?.prevalence ?? 0)
        );
      }

      return [
        key,
        {
          key,
          name: getMobDisplayName(key, mob),
          normalizedName: mob.normalizedName ?? undefined,
          health: normalizeHealth(mob.health),
          imagePortraitLink: mob.imagePortraitLink ?? null,
          equipment: normalizeMobEquipment(mob.equipment),
          loot: Array.from(loot, ([itemId, prevalence]) => ({
            itemId,
            prevalence,
          })).sort((left, right) => right.prevalence - left.prevalence),
        },
      ];
    })
  );
}

function normalizeMapsPayload(payload: TarkovJsonResponse): {
  maps: SpawnData[];
  catalog: MobCatalog;
} {
  const maps = payload.data?.maps;
  const mobs = payload.data?.mobs;

  if (!maps || !mobs) {
    throw new Error("Invalid tarkov.dev JSON maps response");
  }

  return {
    catalog: normalizeMobCatalog(mobs),
    maps: Object.values(maps).map((map) => ({
    id: map.id ?? undefined,
    name: getMapDisplayName(map),
    normalizedName: map.normalizedName ?? undefined,
    nameId: map.nameId ?? undefined,
    wiki: map.wiki ?? undefined,
    enemies: (map.enemies ?? []).map((key) => {
      const mob = mobs[key];
      return {
        key,
        name: getMobDisplayName(key, mob),
        health: normalizeHealth(mob?.health),
        imagePortraitLink: mob?.imagePortraitLink ?? null,
      };
    }),
    raidDuration: map.raidDuration ?? undefined,
    players: map.players ?? undefined,
    minPlayerLevel: map.minPlayerLevel ?? undefined,
    maxPlayerLevel: map.maxPlayerLevel ?? undefined,
    bosses: (map.bosses ?? []).map((boss) => normalizeBoss(boss, mobs)),
    })),
  };
}

async function fetchJsonMaps(mode: GameMode): Promise<{
  maps: SpawnData[];
  catalog: MobCatalog;
  goonReports: GoonReport[];
}> {
  const response = await fetch(`${TARKOV_JSON_API_BASE_URL}/${mode}/maps`, {
    cache: "no-store",
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
  return { ...normalizeMapsPayload(result), goonReports: result.data?.goonReports ?? [] };
}

function getExpiredCachedData(
  cached: string | null
): SpawnApiData | null {
  if (!cached) {
    return null;
  }

  try {
    const { data } = JSON.parse(cached);

    if (
      data?.regular &&
      data?.pve &&
      data?.["pvp-season"] &&
      data?.catalogs?.regular &&
      data?.catalogs?.pve &&
      data?.catalogs?.["pvp-season"]
    ) {
      return {
        regular: applyLocalData(data.regular, "regular"),
        pve: applyLocalData(data.pve, "pve"),
        "pvp-season": applyLocalData(data["pvp-season"], "pvp-season"),
        goonReports: data.goonReports ?? { regular: [], pve: [], "pvp-season": [] },
        catalogs: data.catalogs,
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
    "maps_pvp-season_previous",
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
export function applyLocalData(currentData: SpawnData[], mode: GameMode): SpawnData[] {
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
      const appliesToMode =
        overrideMode === mode ||
        (overrideMode === "both" && (mode === "regular" || mode === "pve"));
      if (!appliesToMode) {
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

export async function fetchAllSpawnData(options?: {
  forceRefresh?: boolean;
}): Promise<SpawnApiData> {
  const CACHE_KEY = "maps_combined";

  // Check cache version and clear if outdated
  const cacheVersion = localStorage.getItem("cache_version");
  if (!cacheVersion || parseInt(cacheVersion) < CACHE_VERSION) {
    // Clear all cached data
    [
      "maps_regular",
      "maps_pve",
      "maps_pvp-season",
      "maps_regular_previous",
      "maps_pve_previous",
      "maps_pvp-season_previous",
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
        if (
          data?.regular &&
          data?.pve &&
          data?.["pvp-season"] &&
          data?.catalogs?.regular &&
          data?.catalogs?.pve &&
          data?.catalogs?.["pvp-season"] &&
          cacheAge < FIVE_MINUTES
        ) {
          return {
            regular: applyLocalData(data.regular, "regular"),
            pve: applyLocalData(data.pve, "pve"),
            "pvp-season": applyLocalData(data["pvp-season"], "pvp-season"),
            goonReports: data.goonReports ?? { regular: [], pve: [], "pvp-season": [] },
            catalogs: data.catalogs,
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

  let regularResult: Awaited<ReturnType<typeof fetchJsonMaps>>;
  let pveResult: Awaited<ReturnType<typeof fetchJsonMaps>>;
  let seasonResult: Awaited<ReturnType<typeof fetchJsonMaps>>;

  try {
    [regularResult, pveResult, seasonResult] = await Promise.all([
      fetchJsonMaps("regular"),
      fetchJsonMaps("pve"),
      fetchJsonMaps("pvp-season"),
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

  const cacheData: SpawnApiData = {
    regular: regularResult.maps,
    pve: pveResult.maps,
    "pvp-season": seasonResult.maps,
    goonReports: {
      regular: regularResult.goonReports,
      pve: pveResult.goonReports,
      "pvp-season": seasonResult.goonReports,
    },
    catalogs: {
      regular: regularResult.catalog,
      pve: pveResult.catalog,
      "pvp-season": seasonResult.catalog,
    },
  };

  const finalData: SpawnApiData = {
    ...cacheData,
    regular: applyLocalData(cacheData.regular, "regular"),
    pve: applyLocalData(cacheData.pve, "pve"),
    "pvp-season": applyLocalData(cacheData["pvp-season"], "pvp-season"),
  };

  // Update cache with transformed data. Persistence is best-effort; fresh data
  // should still render if localStorage is full.
  writeSpawnCache(
    CACHE_KEY,
    JSON.stringify({
      data: cacheData,
      timestamp: new Date().getTime(),
    })
  );

  return finalData;
}

function buildChangesApiEndpointUrl(path: string): URL {
  const url = CHANGES_API_BASE_URL.startsWith("/")
    ? new URL(CHANGES_API_BASE_URL, window.location.origin)
    : new URL(CHANGES_API_BASE_URL);

  url.pathname = `${url.pathname.replace(/\/$/, "")}${path}`;

  return url;
}

interface ChangesHistoryCursor {
  beforeTimestamp: number;
  beforeId: number;
}

interface ApiDataChange {
  id: number;
  map: string;
  boss: string;
  field: string;
  old_value: string;
  new_value: string;
  timestamp: number;
  game_mode: string;
}

function buildChangesApiUrl(options: {
  since?: number;
  cursor?: ChangesHistoryCursor;
} = {}): string {
  const url = buildChangesApiEndpointUrl(CHANGES_API_PATH);
  url.searchParams.set("limit", CHANGES_API_LIMIT.toString());

  if (
    typeof options.since === "number" &&
    Number.isFinite(options.since) &&
    options.since > 0
  ) {
    url.searchParams.set("since", options.since.toString());
  }

  if (options.cursor) {
    url.searchParams.set(
      "beforeTimestamp",
      options.cursor.beforeTimestamp.toString()
    );
    url.searchParams.set("beforeId", options.cursor.beforeId.toString());
  }

  return url.toString();
}

function isValidApiDataChange(change: unknown): change is ApiDataChange {
  if (!change || typeof change !== "object") {
    return false;
  }

  const candidate = change as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    Number.isSafeInteger(candidate.id) &&
    candidate.id >= 0 &&
    typeof candidate.map === "string" &&
    candidate.map.length > 0 &&
    typeof candidate.boss === "string" &&
    candidate.boss.length > 0 &&
    typeof candidate.field === "string" &&
    candidate.field.length > 0 &&
    typeof candidate.old_value === "string" &&
    candidate.old_value.length > 0 &&
    typeof candidate.new_value === "string" &&
    candidate.new_value.length > 0 &&
    typeof candidate.timestamp === "number" &&
    Number.isFinite(candidate.timestamp) &&
    getChangeGameModeLabel(candidate.game_mode) !== null
  );
}

function transformApiDataChanges(changes: ApiDataChange[]): DataChange[] {
  return changes.map((change) => ({
    map: change.map,
    boss: change.boss,
    field: change.field,
    oldValue: change.old_value,
    newValue: change.new_value,
    timestamp: change.timestamp,
    gameMode: getChangeGameModeLabel(change.game_mode) as ChangeGameModeLabel,
  }));
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isChangeMonitorModeHealth(value: unknown): value is ChangeMonitorModeHealth {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    getChangeGameModeLabel(candidate.gameMode) !== null &&
    typeof candidate.stale === "boolean" &&
    isNullableNumber(candidate.lastAttemptAt) &&
    isNullableNumber(candidate.lastSuccessAt) &&
    isNullableString(candidate.lastError) &&
    isNullableNumber(candidate.lastDurationMs) &&
    typeof candidate.lastChangeCount === "number" &&
    Number.isFinite(candidate.lastChangeCount) &&
    isNullableString(candidate.lastResult)
  );
}

function isChangeMonitorHealth(value: unknown): value is ChangeMonitorHealth {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const modes = candidate.modes;
  const expectedModes: ChangeMonitorGameMode[] = ["regular", "pve", "pvp-season"];
  return (
    typeof candidate.healthy === "boolean" &&
    typeof candidate.now === "number" &&
    Number.isFinite(candidate.now) &&
    typeof candidate.staleAfterMs === "number" &&
    Number.isFinite(candidate.staleAfterMs) &&
    Array.isArray(modes) &&
    modes.length === expectedModes.length &&
    modes.every(isChangeMonitorModeHealth) &&
    expectedModes.every(
      (gameMode) => modes.filter((mode) => mode.gameMode === gameMode).length === 1
    )
  );
}

export async function fetchChangeMonitorHealth(
  signal?: AbortSignal
): Promise<ChangeMonitorHealth> {
  const response = await fetch(
    buildChangesApiEndpointUrl(CHANGES_HEALTH_API_PATH).toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    }
  );
  const data: unknown = await response.json();

  if (!isChangeMonitorHealth(data)) {
    throw new Error(`Change monitor returned an invalid response (${response.status}).`);
  }

  return data;
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

function getNextWorkersQuotaReset(now: number): number {
  const current = new Date(now);
  return (
    Date.UTC(
      current.getUTCFullYear(),
      current.getUTCMonth(),
      current.getUTCDate() + 1,
    ) + CHANGES_QUOTA_RESET_GRACE
  );
}

function pauseChangesRequestsUntil(timestamp: number): void {
  writeChangeStorageNumber("retryAfter", timestamp);
}

async function isWorkersQuotaResponse(response: Response): Promise<boolean> {
  if (response.status === 429) {
    return true;
  }

  try {
    const body = await response.clone().text();
    return /\b1027\b|daily request limit/i.test(body);
  } catch {
    return false;
  }
}

export async function fetchChanges(options: { force?: boolean } = {}): Promise<DataChange[]> {
  const now = Date.now();

  try {
    const { force = false } = options;
    const cachedChanges = getCachedChanges();
    const cacheVersion = readChangeStorageNumber("cacheVersion");
    const requiresFullSync = cacheVersion !== CHANGES_CACHE_VERSION;
    const timestamp = readChangeStorageNumber("cacheTimestamp");
    const retryAfter = readChangeStorageNumber("retryAfter");

    if (
      !force &&
      !requiresFullSync &&
      cachedChanges.length &&
      now - timestamp < CHANGES_CACHE_DURATION
    ) {
      return cachedChanges;
    }

    if (retryAfter > now) {
      return cachedChanges;
    }

    if (retryAfter) {
      removeChangeStorage("retryAfter");
    }

    const latestCachedTimestamp = requiresFullSync
      ? 0
      : getLatestChangeTimestamp(cachedChanges);
    const isFullHistoryRequest = latestCachedTimestamp === 0;
    const apiChanges: ApiDataChange[] = [];
    let cursor: ChangesHistoryCursor | undefined;

    while (true) {
      const response = await fetch(
        buildChangesApiUrl({
          since: isFullHistoryRequest ? undefined : latestCachedTimestamp,
          cursor,
        }),
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          if (isFullHistoryRequest && apiChanges.length === 0) {
            writeChangeStorage("cache", "[]");
            writeChangeStorage("cacheTimestamp", now.toString());
            writeChangeStorageNumber("cacheVersion", CHANGES_CACHE_VERSION);
            return [];
          }

          if (isFullHistoryRequest) {
            break;
          }

          writeChangeStorage("cacheTimestamp", now.toString());
          return cachedChanges;
        }

        const quotaReached = await isWorkersQuotaResponse(response);
        pauseChangesRequestsUntil(
          quotaReached
            ? getNextWorkersQuotaReset(now)
            : now + CHANGES_FAILURE_RETRY_DELAY,
        );
        console.warn(
          quotaReached
            ? "Changes service quota reached; using cached data until the next reset."
            : `Changes service unavailable (${response.status}); using cached data.`,
        );
        return cachedChanges;
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(isValidApiDataChange)) {
        pauseChangesRequestsUntil(now + CHANGES_FAILURE_RETRY_DELAY);
        console.warn("Changes service returned invalid change data; using cached data.");
        return cachedChanges;
      }

      apiChanges.push(...data);
      if (!isFullHistoryRequest || data.length < CHANGES_API_LIMIT) {
        break;
      }

      const lastChange = data[data.length - 1];
      cursor = {
        beforeTimestamp: lastChange.timestamp,
        beforeId: lastChange.id,
      };
    }

    const transformedData = transformApiDataChanges(apiChanges).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    const mergedChanges = requiresFullSync
      ? transformedData
      : mergeChanges(cachedChanges, transformedData);

    writeChangeStorage("cache", JSON.stringify(mergedChanges));
    writeChangeStorage("cacheTimestamp", now.toString());
    writeChangeStorageNumber("cacheVersion", CHANGES_CACHE_VERSION);
    removeChangeStorage("retryAfter");

    return mergedChanges;
  } catch (error) {
    pauseChangesRequestsUntil(now + CHANGES_FAILURE_RETRY_DELAY);
    console.warn("Changes service unavailable; using cached data.", error);
    const cachedChanges = getCachedChanges();
    return cachedChanges;
  }
}
