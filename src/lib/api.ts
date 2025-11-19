import { SpawnData } from "@/types";
import { DataChange } from "./diff";
import tempBossDataFromFile from "./temp-bosses.json"; // Added import for temp bosses
import { BOSS_OVERRIDES, ENABLE_OVERRIDES } from "@/config/boss-overrides";


export type { SpawnData };

const CACHE_VERSION = 8;
const CHANGES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for changes data (can be adjusted independently)

// Change to use the cultistcircle API
const CHANGES_API_URL = "https://bossdata.cultistcircle.workers.dev/changes";

// If environment variable is not set, use the cultistcircle API as fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || CHANGES_API_URL;

// Type for the cultistcircle API response

// Cast the imported JSON to the correct type
const tempBossData: SpawnData[] = tempBossDataFromFile as SpawnData[];

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

  // Before fetching new data, store current data as previous
  const currentData = localStorage.getItem(CACHE_KEY);
  if (currentData) {
    localStorage.setItem(`${CACHE_KEY}_previous`, currentData);
  }

  // Fetch fresh data
  const response = await fetch("https://api.tarkov.dev/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `
        query {
          regular: maps(gameMode: regular) {
            name
            wiki
            bosses {
              boss {
                name
                health {
                  bodyPart
                  max
                }
                imagePortraitLink
              }
              spawnChance
              spawnLocations {
                name
                chance
              }
              escorts
              {
               amount{
                count
               }
                boss{
                  name
                  imagePortraitLink
                  health{
                    max
                  }
                }
              }
            }
          }
          pve: maps(gameMode: pve) {
            name
            wiki
            bosses {
              boss {
                name
                health {
                  bodyPart
                  max
                }
                imagePortraitLink
              }
              spawnChance
              spawnLocations {
                name
                chance
              }
              escorts
              {
               amount{
                count
               }
                boss{
                  name
                  imagePortraitLink
                  health{
                    max
                  }
                }
              }
            }
          }
        }
      `,
    }),
  });

  const result = await response.json();

  if (!result.data) {
    console.log("API fetch failed");
    // If API fails, try to use cached data even if expired
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        if (data?.regular && data?.pve) {
          console.log("Using cached data");
          return {
            regular: applyLocalData(data.regular, "regular"),
            pve: applyLocalData(data.pve, "pve"),
          };
        }
      } catch (error) {
        console.error("Error parsing cached data:", error);
      }
    }
    throw new Error("Failed to fetch data");
  }
  console.log("API fetch successful");

  // Process regular and PVE data
  const processMaps = (maps: any[]) =>
    maps.map((map: any) => ({
      ...map,
      bosses: map.bosses.map((boss: any) => ({
        ...boss,
        boss: {
          ...boss.boss,
          name: boss.boss.name === "Knight" ? "Goons" : boss.boss.name,
        },
      })),
    }));

  const regularData = processMaps(result.data.regular || []);
  const pveData = processMaps(result.data.pve || []);

  const finalData = {
    regular: applyLocalData(regularData, "regular"),
    pve: applyLocalData(pveData, "pve"),
  };

  // Update cache with transformed data
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data: finalData,
      timestamp: new Date().getTime(),
    })
  );

  return finalData;
}

export async function fetchChanges(): Promise<DataChange[]> {
  try {
    // Check cache first
    const cached = localStorage.getItem("changes_data");
    const timestamp = parseInt(
      localStorage.getItem("changes_timestamp") || "0",
      10
    );
    const now = Date.now();

    if (cached && now - timestamp < CHANGES_CACHE_DURATION) {
      return JSON.parse(cached);
    }

    const url = new URL(CHANGES_API_URL);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch changes:",
        response.status,
        response.statusText
      );
      // If fetch fails but we have cached data, return it even if expired
      if (cached) {
        return JSON.parse(cached);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Invalid response format:", data);
      if (cached) {
        return JSON.parse(cached);
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

    // Update cache
    localStorage.setItem("changes_data", JSON.stringify(transformedData));
    localStorage.setItem("changes_timestamp", now.toString());

    return transformedData;
  } catch (error) {
    console.error("Error fetching changes:", error);
    // If there's an error and we have cached data, return it even if expired
    const cached = localStorage.getItem("changes_data");
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}

export async function submitChanges(changes: DataChange[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/changes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });

  if (!response.ok) {
    throw new Error("Failed to submit changes");
  }
}
