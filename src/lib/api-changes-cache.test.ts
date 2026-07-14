import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { fetchChanges } from "./api";

const STORAGE_KEYS = {
  autoRefreshEnabled:
    "boss_spawns.changes.notifications.auto_refresh_enabled",
  cache: "boss_spawns.changes.cache",
  cacheTimestamp: "boss_spawns.changes.cache_timestamp",
  cacheVersion: "boss_spawns.changes.cache_version",
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
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("1");
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

  test("manual refresh replaces a current cache instead of merging", async () => {
    seedCache({ fresh: true, version: 1 });
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = input.toString();
      return successfulResponse();
    };

    const changes = await fetchChanges({ force: true });

    expect(requestedUrl).not.toContain("since=");
    expect(changes).toHaveLength(1);
    expect(changes[0].boss).toBe("raider");
  });

  test("normal refresh stays incremental after the cache is current", async () => {
    seedCache({ version: 1 });
    let requestedUrl = "";
    globalThis.fetch = async (input) => {
      requestedUrl = input.toString();
      return successfulResponse();
    };

    const changes = await fetchChanges();

    expect(requestedUrl).toContain(`since=${cachedChange.timestamp}`);
    expect(changes).toHaveLength(2);
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

  test("a malformed upgrade response keeps the stale cache and version", async () => {
    seedCache({ version: 0 });
    globalThis.fetch = async () => successfulResponse([
      { ...serverChange, timestamp: "not-a-number" } as unknown as typeof serverChange,
    ]);

    const changes = await fetchChanges();

    expect(changes).toEqual([cachedChange]);
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("0");
  });

  test("a full-sync 404 clears only the changes cache", async () => {
    seedCache();
    localStorage.setItem(STORAGE_KEYS.notificationsEnabled, "true");
    globalThis.fetch = async () => new Response(null, { status: 404 });

    const changes = await fetchChanges();

    expect(changes).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.cache)).toBe("[]");
    expect(localStorage.getItem(STORAGE_KEYS.cacheVersion)).toBe("1");
    expect(localStorage.getItem(STORAGE_KEYS.notificationsEnabled)).toBe("true");
  });
});
