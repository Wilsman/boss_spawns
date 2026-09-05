import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { fetchChangeMonitorHealth, fetchChanges } from "./api";

const STORAGE_KEYS = {
  autoRefreshEnabled:
    "boss_spawns.changes.notifications.auto_refresh_enabled",
  cache: "boss_spawns.changes.cache",
  cacheTimestamp: "boss_spawns.changes.cache_timestamp",
  cacheVersion: "boss_spawns.changes.cache_version",
  retryAfter: "boss_spawns.changes.retry_after",
  lastNotifiedCount:
    "boss_spawns.changes.notifications.last_notified.count",
  lastNotifiedLatestTs:
    "boss_spawns.changes.notifications.last_notified.latest_ts",
  lastViewedAt: "boss_spawns.changes.last_viewed.at",
  lastViewedCount: "boss_spawns.changes.last_viewed.count",
  lastViewedLatestTs: "boss_spawns.changes.last_viewed.latest_ts",
  notificationsEnabled: "boss_spawns.changes.notifications.enabled",
  soundEnabled: "boss_spawns.changes.notifications.sound_enabled",
} as const;

const cachedChange = {
  boss: "black-div-raider",
  field: "bossAdded",
  gameMode: "PvP",
  map: "the-lab",
  newValue: "100%",
  oldValue: "none",
  timestamp: 1784037003317,
};

const serverChange = {
  id: 2,
  boss: "raider",
  field: "spawnChance",
  game_mode: "regular",
  map: "customs",
  new_value: "25%",
  old_value: "20%",
  timestamp: 1784038000000,
};

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

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;

function seedCache(options: { version?: number; fresh?: boolean } = {}): void {
  localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify([cachedChange]));
  localStorage.setItem(
    STORAGE_KEYS.cacheTimestamp,
    (options.fresh ? Date.now() : 0).toString(),
  );

  if (options.version !== undefined) {
    localStorage.setItem(STORAGE_KEYS.cacheVersion, options.version.toString());
  }
}

function successfulResponse(changes = [serverChange]): Response {
  return new Response(JSON.stringify(changes), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

describe("changes cache synchronization", () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
  });

  test("an unversioned browser replaces a fresh stale cache without losing preferences", async () => {
    seedCache({ fresh: true });
    localStorage.setItem(STORAGE_KEYS.notificationsEnabled, "true");
    localStorage.setItem(STORAGE_KEYS.soundEnabled, "false");
    localStorage.setItem(STORAGE_KEYS.autoRefreshEnabled, "true");
    localStorage.setItem(STORAGE_KEYS.lastNotifiedCount, "54");
    localStorage.setItem(STORAGE_KEYS.lastNotifiedLatestTs, "1784037003317");
    localStorage.setItem(STORAGE_KEYS.lastViewedAt, "1784037003317");
    localStorage.setItem(STORAGE_KEYS.lastViewedCount, "54");
    localStorage.setItem(STORAGE_KEYS.lastViewedLatestTs, "1784037003317");
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = input.toString();
      return successfulResponse();
    };

    const changes = await fetchChanges();

    expect(requestedUrl).not.toContain("since=");
    expect(changes).toHaveLength(1);
    expect(changes[0].boss).toBe("raider");
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("2");
    expect(localStorage.getItem(STORAGE_KEYS.notificationsEnabled)).toBe("true");
    expect(localStorage.getItem(STORAGE_KEYS.soundEnabled)).toBe("false");
    expect(localStorage.getItem(STORAGE_KEYS.autoRefreshEnabled)).toBe("true");
    expect(localStorage.getItem(STORAGE_KEYS.lastNotifiedCount)).toBe("54");
    expect(localStorage.getItem(STORAGE_KEYS.lastNotifiedLatestTs)).toBe(
      "1784037003317",
    );
    expect(localStorage.getItem(STORAGE_KEYS.lastViewedAt)).toBe("1784037003317");
    expect(localStorage.getItem(STORAGE_KEYS.lastViewedCount)).toBe("54");
    expect(localStorage.getItem(STORAGE_KEYS.lastViewedLatestTs)).toBe(
      "1784037003317",
    );
  });

  test("manual refresh bypasses freshness while remaining incremental", async () => {
    seedCache({ fresh: true, version: 2 });
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = input.toString();
      return successfulResponse();
    };

    const changes = await fetchChanges({ force: true });

    expect(requestedUrl).toContain(`since=${cachedChange.timestamp}`);
    expect(changes).toHaveLength(2);
    expect(changes.some((change) => change.boss === "raider")).toBe(true);
  });

  test("normal refresh stays incremental after the cache is current", async () => {
    seedCache({ version: 2 });
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = input.toString();
      return successfulResponse();
    };

    const changes = await fetchChanges();

    expect(requestedUrl).toContain(`since=${cachedChange.timestamp}`);
    expect(changes).toHaveLength(2);
  });

  test("changes requests remain simple CORS requests without preflight-only headers", async () => {
    seedCache({ version: 2 });
    let requestedInit: RequestInit | undefined;
    globalThis.fetch = async (_input, init) => {
      requestedInit = init;
      return successfulResponse();
    };

    await fetchChanges();

    expect(requestedInit?.method).toBe("GET");
    expect(requestedInit?.headers).toEqual({
      Accept: "application/json",
    });
  });

  test("a failed upgrade keeps the stale cache and does not advance its version", async () => {
    seedCache();
    globalThis.fetch = async () => {
      throw new Error("offline");
    };

    const changes = await fetchChanges();

    expect(changes).toEqual([cachedChange]);
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBeNull();
  });

  test("a quota response keeps cached data and pauses requests until the next UTC reset", async () => {
    seedCache({ version: 2 });
    let requestCount = 0;
    globalThis.fetch = async () => {
      requestCount += 1;
      return new Response("error code: 1027", { status: 500 });
    };

    const firstChanges = await fetchChanges();
    const retryAfter = Number(localStorage.getItem(STORAGE_KEYS.retryAfter));
    const secondChanges = await fetchChanges({ force: true });

    expect(firstChanges).toEqual([cachedChange]);
    expect(secondChanges).toEqual([cachedChange]);
    expect(requestCount).toBe(1);
    expect(retryAfter).toBeGreaterThan(Date.now());
    expect(retryAfter - Date.now()).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5 * 60 * 1000);
  });

  test("an unavailable changes service resolves to an empty list for a new visitor", async () => {
    let requestCount = 0;
    globalThis.fetch = async () => {
      requestCount += 1;
      throw new TypeError("Failed to fetch");
    };

    const firstChanges = await fetchChanges();
    const secondChanges = await fetchChanges();

    expect(firstChanges).toEqual([]);
    expect(secondChanges).toEqual([]);
    expect(requestCount).toBe(1);
    expect(Number(localStorage.getItem(STORAGE_KEYS.retryAfter))).toBeGreaterThan(
      Date.now(),
    );
  });

  test("a successful retry clears an expired circuit breaker", async () => {
    seedCache({ version: 2 });
    localStorage.setItem(STORAGE_KEYS.retryAfter, (Date.now() - 1).toString());
    globalThis.fetch = async () => successfulResponse();

    const changes = await fetchChanges();

    expect(changes).toHaveLength(2);
    expect(localStorage.getItem(STORAGE_KEYS.retryAfter)).toBeNull();
  });

  test("a malformed upgrade response keeps the stale cache and version", async () => {
    seedCache({ version: 1 });
    globalThis.fetch = async () => successfulResponse([
      { ...serverChange, timestamp: "not-a-number" } as unknown as typeof serverChange,
    ]);

    const changes = await fetchChanges();

    expect(changes).toEqual([cachedChange]);
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("1");
  });

  test("maps Season changes explicitly and rejects unknown game modes", async () => {
    globalThis.fetch = async () => successfulResponse([
      { ...serverChange, game_mode: "pvp-season" },
    ]);

    const seasonChanges = await fetchChanges({ force: true });
    expect(seasonChanges[0].gameMode).toBe("Season");

    globalThis.localStorage = new MemoryStorage();
    globalThis.fetch = async () => successfulResponse([
      { ...serverChange, game_mode: "unknown" },
    ]);

    const unknownChanges = await fetchChanges({ force: true });
    expect(unknownChanges).toEqual([]);
  });

  test("a full-sync 404 clears only the changes cache", async () => {
    seedCache();
    localStorage.setItem(STORAGE_KEYS.notificationsEnabled, "true");
    globalThis.fetch = async () => new Response(null, { status: 404 });

    const changes = await fetchChanges();

    expect(changes).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.cache)).toBe("[]");
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("2");
    expect(localStorage.getItem(STORAGE_KEYS.notificationsEnabled)).toBe("true");
  });

  test("a full synchronization follows stable cursors beyond 1000 rows", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      ...serverChange,
      id: 2000 - index,
      timestamp: 1784038000000,
    }));
    const finalChange = {
      ...serverChange,
      id: 1000,
      timestamp: 1784038000000,
    };
    const requestedUrls: string[] = [];

    globalThis.fetch = async (input) => {
      const url = input.toString();
      requestedUrls.push(url);
      return requestedUrls.length === 1
        ? successfulResponse(firstPage)
        : successfulResponse([finalChange]);
    };

    const changes = await fetchChanges();

    expect(changes).toHaveLength(1001);
    expect(requestedUrls).toHaveLength(2);
    expect(requestedUrls[0]).not.toContain("beforeTimestamp=");
    expect(requestedUrls[1]).toContain("beforeTimestamp=1784038000000");
    expect(requestedUrls[1]).toContain("beforeId=1001");
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("2");
  });
});

const monitorHealthResponse = {
  healthy: true,
  now: 1787503354434,
  staleAfterMs: 600000,
  modes: [
    {
      gameMode: "regular",
      stale: false,
      lastAttemptAt: 1787503339462,
      lastSuccessAt: 1787503339864,
      lastError: null,
      lastDurationMs: 402,
      lastChangeCount: 0,
      lastResult: "not-modified",
    },
    {
      gameMode: "pve",
      stale: false,
      lastAttemptAt: 1787503219449,
      lastSuccessAt: 1787503219844,
      lastError: null,
      lastDurationMs: 395,
      lastChangeCount: 0,
      lastResult: "not-modified",
    },
    {
      gameMode: "pvp-season",
      stale: false,
      lastAttemptAt: 1787503279458,
      lastSuccessAt: 1787503279860,
      lastError: null,
      lastDurationMs: 402,
      lastChangeCount: 0,
      lastResult: "not-modified",
    },
  ],
};

describe("change monitor health", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("requests fresh monitor health from the configured Worker", async () => {
    let requestedUrl = "";
    let requestedInit: RequestInit | undefined;
    globalThis.fetch = async (input, init) => {
      requestedUrl = input.toString();
      requestedInit = init;
      return new Response(JSON.stringify(monitorHealthResponse), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    };

    const health = await fetchChangeMonitorHealth();

    expect(requestedUrl).toBe(
      "https://bossdata.cultistcircle.workers.dev/api/health"
    );
    expect(requestedInit?.cache).toBe("no-store");
    expect(health.healthy).toBe(true);
    expect(health.modes.map((mode) => mode.gameMode)).toEqual([
      "regular",
      "pve",
      "pvp-season",
    ]);
  });

  test("keeps a valid degraded response available to the status UI", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ...monitorHealthResponse,
          healthy: false,
          modes: monitorHealthResponse.modes.map((mode, index) =>
            index === 0 ? { ...mode, stale: true } : mode
          ),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 503,
        }
      );

    const health = await fetchChangeMonitorHealth();

    expect(health.healthy).toBe(false);
    expect(health.modes[0].stale).toBe(true);
  });

  test("rejects incomplete mode health instead of reporting a false healthy state", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          ...monitorHealthResponse,
          modes: monitorHealthResponse.modes.slice(0, 2),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );

    await expect(fetchChangeMonitorHealth()).rejects.toThrow(
      "Change monitor returned an invalid response"
    );
  });
});
