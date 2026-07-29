import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { fetchAllSpawnData } from "./api";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function mapsPayload(spawnChance: number) {
  return {
    data: {
      maps: {
        customs: {
          id: "customs",
          name: "Customs",
          normalizedName: "customs",
          bosses: [
            {
              mob: "bossBully",
              spawnChance,
              spawnLocations: [{ name: "Dorms", chance: 1 }],
            },
          ],
        },
      },
      mobs: {
        bossBully: {
          normalizedName: "reshala",
        },
      },
    },
  };
}

describe("spawn data cache synchronization", () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  });

  test("force refresh does not reuse a stale browser HTTP response", async () => {
    let upstreamChance = 0.75;
    const browserHttpCache = new Map<string, string>();

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const bypassesHttpCache = init?.cache === "no-store";

      let body = bypassesHttpCache ? undefined : browserHttpCache.get(url);
      if (!body) {
        body = JSON.stringify(mapsPayload(upstreamChance));
        browserHttpCache.set(url, body);
      }

      return new Response(body, {
        headers: { "Cache-Control": "max-age=691200" },
        status: 200,
      });
    }) as typeof fetch;

    const firstLoad = await fetchAllSpawnData({ forceRefresh: true });
    expect(firstLoad.regular[0].bosses[0].spawnChance).toBe(0.75);

    upstreamChance = 1;

    const refreshed = await fetchAllSpawnData({ forceRefresh: true });
    expect(refreshed.regular[0].bosses[0].spawnChance).toBe(1);
  });
});
