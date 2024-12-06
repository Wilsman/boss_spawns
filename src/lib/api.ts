import { SpawnData } from "@/types";

const CACHE_VERSION = 3; // Add version number

export async function fetchSpawnData(
  gameMode: "regular" | "pve"
): Promise<SpawnData[]> {
  const CACHE_KEY = `maps_${gameMode}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check cache version and clear if outdated
  const cacheVersion = localStorage.getItem("cache_version");
  if (!cacheVersion || parseInt(cacheVersion) < CACHE_VERSION) {
    // Clear all cached data
    localStorage.removeItem(`maps_regular`);
    localStorage.removeItem(`maps_pve`);
    localStorage.removeItem(`maps_regular_previous`);
    localStorage.removeItem(`maps_pve_previous`);
    localStorage.removeItem(`spawn_changes_history`);
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
              }
              spawnLocations {
                name
                chance
              }
              spawnChance
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
