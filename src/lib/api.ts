import { SpawnData } from "@/types";
import { DataChange } from "./diff";

const CACHE_VERSION = 4;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Change to use the cultistcircle API
const CHANGES_API_URL = "https://bossdata.cultistcircle.workers.dev/changes";

// If environment variable is not set, use the cultistcircle API as fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || CHANGES_API_URL;

// Type for the cultistcircle API response

export async function fetchSpawnData(
  gameMode: "regular" | "pve"
): Promise<SpawnData[]> {
  const CACHE_KEY = `maps_${gameMode}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check cache version and clear if outdated
  const cacheVersion = localStorage.getItem("cache_version");
  if (!cacheVersion || parseInt(cacheVersion) < CACHE_VERSION) {
    // Clear only map-related cached data
    localStorage.removeItem(`maps_regular`);
    localStorage.removeItem(`maps_pve`);
    localStorage.removeItem(`maps_regular_previous`);
    localStorage.removeItem(`maps_pve_previous`);
    // Set new version
    localStorage.setItem("cache_version", CACHE_VERSION.toString());
  }

  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (data?.maps && new Date().getTime() - timestamp < CACHE_DURATION) {
        return data.maps;
      }
    } catch (error) {
      console.error("Error parsing cached data:", error);
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
          maps(gameMode: ${gameMode}) {
            name
            bosses {
              boss {
                name
                health
                {
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
            }
          }
        }
      `,
    }),
  });

  const result = await response.json();

  if (!result.data) {
    // If API fails, try to use cached data even if expired
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        if (data?.maps) {
          return data.maps;
        }
      } catch (error) {
        console.error("Error parsing cached data:", error);
      }
    }
    throw new Error("Failed to fetch data");
  }

  // Transform Knight to Goons in the response data
  const transformedData = {
    ...result.data,
    maps: result.data.maps.map((map: any) => ({
      ...map,
      bosses: map.bosses.map((boss: any) => ({
        ...boss,
        boss: {
          ...boss.boss,
          name: boss.boss.name === "Knight" ? "Goons" : boss.boss.name,
        },
      })),
    })),
  };

  // Update cache with transformed data
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data: transformedData,
      timestamp: new Date().getTime(),
    })
  );

  return transformedData.maps;
}

export async function fetchChanges(): Promise<DataChange[]> {
  try {
    // Check cache first
    const cached = localStorage.getItem('changes_data');
    const timestamp = parseInt(localStorage.getItem('changes_timestamp') || '0', 10);
    const now = Date.now();

    if (cached && now - timestamp < CACHE_DURATION) {
      return JSON.parse(cached);
    }

    const url = new URL(CHANGES_API_URL);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch changes:', response.status, response.statusText);
      // If fetch fails but we have cached data, return it even if expired
      if (cached) {
        return JSON.parse(cached);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Invalid response format:', data);
      if (cached) {
        return JSON.parse(cached);
      }
      return [];
    }

    // Transform and validate the API response
    const transformedData = data
      .filter(change =>
        // Basic validation of required fields
        change.map &&
        change.boss &&
        change.field &&
        change.old_value &&
        change.new_value &&
        typeof change.timestamp === 'number'
      )
      .map(change => ({
        map: change.map,
        boss: change.boss,
        field: change.field,
        oldValue: change.old_value,
        newValue: change.new_value,
        timestamp: change.timestamp,
        gameMode: change.game_mode === 'regular' ? 'PvP' : 'PvE'
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

    // Update cache
    localStorage.setItem('changes_data', JSON.stringify(transformedData));
    localStorage.setItem('changes_timestamp', now.toString());

    return transformedData;
  } catch (error) {
    console.error('Error fetching changes:', error);
    // If there's an error and we have cached data, return it even if expired
    const cached = localStorage.getItem('changes_data');
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
