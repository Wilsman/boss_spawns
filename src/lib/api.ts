import { SpawnData } from "@/types";

export async function fetchSpawnData(
  gameMode: "regular" | "pve"
): Promise<SpawnData[]> {
  const CACHE_KEY = `maps_${gameMode}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (new Date().getTime() - timestamp < CACHE_DURATION) {
      return data.maps;
    }
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
            normalizedName
            bosses {
              boss {
                normalizedName
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
    throw new Error("Failed to fetch data");
  }

  // Update cache
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data: result.data,
      timestamp: new Date().getTime(),
    })
  );

  return result.data.maps;
}
