const CHANGE_STORAGE_PREFIX = "boss_spawns.changes";

export const CHANGE_STORAGE_KEYS = {
  autoRefreshEnabled: `${CHANGE_STORAGE_PREFIX}.notifications.auto_refresh_enabled`,
  cache: `${CHANGE_STORAGE_PREFIX}.cache`,
  cacheTimestamp: `${CHANGE_STORAGE_PREFIX}.cache_timestamp`,
  lastNotifiedCount: `${CHANGE_STORAGE_PREFIX}.notifications.last_notified.count`,
  lastNotifiedLatestTs: `${CHANGE_STORAGE_PREFIX}.notifications.last_notified.latest_ts`,
  lastViewedAt: `${CHANGE_STORAGE_PREFIX}.last_viewed.at`,
  lastViewedCount: `${CHANGE_STORAGE_PREFIX}.last_viewed.count`,
  lastViewedLatestTs: `${CHANGE_STORAGE_PREFIX}.last_viewed.latest_ts`,
  lastVisitSummaryCount: `${CHANGE_STORAGE_PREFIX}.last_visit_summary.count`,
  lastVisitSummaryPreviousViewedAt: `${CHANGE_STORAGE_PREFIX}.last_visit_summary.previous_viewed_at`,
  notificationsEnabled: `${CHANGE_STORAGE_PREFIX}.notifications.enabled`,
  soundEnabled: `${CHANGE_STORAGE_PREFIX}.notifications.sound_enabled`,
} as const;

type ChangeStorageKey = keyof typeof CHANGE_STORAGE_KEYS;

const LEGACY_CHANGE_STORAGE_KEYS: Record<ChangeStorageKey, string[]> = {
  autoRefreshEnabled: ["auto_refresh_enabled"],
  cache: ["changes_data"],
  cacheTimestamp: ["changes_timestamp"],
  lastNotifiedCount: ["changes_last_notified_count"],
  lastNotifiedLatestTs: ["changes_last_notified_latest_ts"],
  lastViewedAt: ["changes_last_viewed_at"],
  lastViewedCount: ["changes_last_viewed_count"],
  lastViewedLatestTs: ["changes_last_viewed_latest_ts"],
  lastVisitSummaryCount: ["changes_last_visit_summary_count"],
  lastVisitSummaryPreviousViewedAt: [
    "changes_last_visit_summary_previous_viewed_at",
  ],
  notificationsEnabled: ["notifications_enabled"],
  soundEnabled: ["sound_enabled"],
};

function migrateLegacyValue(key: ChangeStorageKey): string | null {
  const nextKey = CHANGE_STORAGE_KEYS[key];

  for (const legacyKey of LEGACY_CHANGE_STORAGE_KEYS[key]) {
    const legacyValue = localStorage.getItem(legacyKey);

    if (legacyValue !== null) {
      localStorage.setItem(nextKey, legacyValue);

      for (const staleLegacyKey of LEGACY_CHANGE_STORAGE_KEYS[key]) {
        localStorage.removeItem(staleLegacyKey);
      }

      return legacyValue;
    }
  }

  return null;
}

export function readChangeStorageRaw(key: ChangeStorageKey): string | null {
  const nextKey = CHANGE_STORAGE_KEYS[key];
  const currentValue = localStorage.getItem(nextKey);

  if (currentValue !== null) {
    return currentValue;
  }

  return migrateLegacyValue(key);
}

export function readChangeStorageBoolean(key: ChangeStorageKey): boolean {
  return readChangeStorageRaw(key) === "true";
}

export function readChangeStorageNumber(key: ChangeStorageKey): number {
  return parseInt(readChangeStorageRaw(key) || "0", 10);
}

export function writeChangeStorage(key: ChangeStorageKey, value: string): void {
  localStorage.setItem(CHANGE_STORAGE_KEYS[key], value);
}

export function writeChangeStorageNumber(
  key: ChangeStorageKey,
  value: number
): void {
  writeChangeStorage(key, value.toString());
}

export function removeChangeStorage(key: ChangeStorageKey): void {
  localStorage.removeItem(CHANGE_STORAGE_KEYS[key]);

  for (const legacyKey of LEGACY_CHANGE_STORAGE_KEYS[key]) {
    localStorage.removeItem(legacyKey);
  }
}

export function clearChangeNotificationStorage(): void {
  (
    [
      "autoRefreshEnabled",
      "lastNotifiedCount",
      "lastNotifiedLatestTs",
      "lastViewedAt",
      "lastViewedCount",
      "lastViewedLatestTs",
      "lastVisitSummaryCount",
      "lastVisitSummaryPreviousViewedAt",
      "notificationsEnabled",
      "soundEnabled",
    ] satisfies ChangeStorageKey[]
  ).forEach(removeChangeStorage);
}
