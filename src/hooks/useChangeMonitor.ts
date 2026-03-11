import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataChange } from "@/lib/diff";
import {
  clearChangeNotificationStorage,
  readChangeStorageBoolean,
  readChangeStorageNumber,
  writeChangeStorage,
  writeChangeStorageNumber,
} from "@/lib/change-storage";

const POLL_INTERVAL = 5 * 60 * 1000;

const NOTIFICATIONS_SUPPORTED =
  typeof window !== "undefined" && "Notification" in window;

export interface ChangeVisitSummary {
  count: number;
  previousViewedAt: number;
}

interface UseChangeMonitorOptions {
  changes: DataChange[];
  changesLoaded: boolean;
  isChangesPage: boolean;
  refreshChanges: (options?: { force?: boolean }) => Promise<void>;
}

interface UseChangeMonitorResult {
  autoRefreshEnabled: boolean;
  notificationError: string | null;
  markAllRead: () => void;
  notificationsEnabled: boolean;
  notificationsSupported: boolean;
  resetNotificationSettings: () => void;
  soundEnabled: boolean;
  testNotification: () => void;
  toggleAutoRefresh: () => void;
  toggleNotifications: () => Promise<void>;
  toggleSound: () => void;
  unreadCount: number;
  visitSummary: ChangeVisitSummary | null;
}

function getLatestTimestamp(changes: DataChange[]): number {
  return changes.length ? Math.max(...changes.map((change) => change.timestamp)) : 0;
}

function countNewChanges(
  changes: DataChange[],
  baselineLatestTimestamp: number,
  baselineCount: number
): number {
  if (!changes.length) {
    return 0;
  }

  const latestTimestamp = getLatestTimestamp(changes);

  if (latestTimestamp > baselineLatestTimestamp) {
    return changes.filter(
      (change) => change.timestamp > baselineLatestTimestamp
    ).length;
  }

  if (
    latestTimestamp === baselineLatestTimestamp &&
    changes.length > baselineCount
  ) {
    return changes.length - baselineCount;
  }

  return 0;
}

export function useChangeMonitor({
  changes,
  changesLoaded,
  isChangesPage,
  refreshChanges,
}: UseChangeMonitorOptions): UseChangeMonitorResult {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () => readChangeStorageBoolean("notificationsEnabled")
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    readChangeStorageBoolean("soundEnabled")
  );
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() =>
    readChangeStorageBoolean("autoRefreshEnabled")
  );
  const [notificationError, setNotificationError] = useState<string | null>(
    null
  );
  const [lastNotifiedLatestTimestamp, setLastNotifiedLatestTimestamp] =
    useState<number>(() => readChangeStorageNumber("lastNotifiedLatestTs"));
  const [lastNotifiedCount, setLastNotifiedCount] = useState<number>(() =>
    readChangeStorageNumber("lastNotifiedCount")
  );
  const [lastViewedLatestTimestamp, setLastViewedLatestTimestamp] =
    useState<number>(() => readChangeStorageNumber("lastViewedLatestTs"));
  const [lastViewedCount, setLastViewedCount] = useState<number>(() =>
    readChangeStorageNumber("lastViewedCount")
  );
  const [lastViewedAt, setLastViewedAt] = useState<number>(() =>
    readChangeStorageNumber("lastViewedAt")
  );
  const [visitSummary, setVisitSummary] = useState<ChangeVisitSummary | null>(
    () => {
      const count = readChangeStorageNumber("lastVisitSummaryCount");
      const previousViewedAt = readChangeStorageNumber(
        "lastVisitSummaryPreviousViewedAt"
      );

      if (count <= 0 || previousViewedAt <= 0) {
        return null;
      }

      return {
        count,
        previousViewedAt,
      };
    }
  );

  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const notificationsInitializedRef = useRef(false);
  const wasChangesPageRef = useRef(false);
  const pendingVisitMarkRef = useRef(false);
  const latestTimestamp = useMemo(() => getLatestTimestamp(changes), [changes]);

  const syncNotificationBaseline = useCallback(
    (nextLatestTimestamp: number, nextCount: number) => {
      setLastNotifiedLatestTimestamp(nextLatestTimestamp);
      setLastNotifiedCount(nextCount);
      writeChangeStorageNumber("lastNotifiedLatestTs", nextLatestTimestamp);
      writeChangeStorageNumber("lastNotifiedCount", nextCount);
    },
    []
  );

  const syncViewedBaseline = useCallback(
    (nextLatestTimestamp: number, nextCount: number, viewedAt: number) => {
      setLastViewedLatestTimestamp(nextLatestTimestamp);
      setLastViewedCount(nextCount);
      setLastViewedAt(viewedAt);
      writeChangeStorageNumber("lastViewedLatestTs", nextLatestTimestamp);
      writeChangeStorageNumber("lastViewedCount", nextCount);
      writeChangeStorageNumber("lastViewedAt", viewedAt);
    },
    []
  );

  const unreadCount = useMemo(
    () =>
      lastViewedAt === 0 &&
      lastViewedLatestTimestamp === 0 &&
      lastViewedCount === 0
        ? 0
        : countNewChanges(changes, lastViewedLatestTimestamp, lastViewedCount),
    [changes, lastViewedAt, lastViewedCount, lastViewedLatestTimestamp]
  );

  const testNotification = useCallback(() => {
    if (soundEnabled && notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });
    }

    if (NOTIFICATIONS_SUPPORTED && Notification.permission === "granted") {
      new Notification("Test Notification", {
        body: "Change alerts are active.",
        icon: "/favicon.ico",
      });
    }
  }, [soundEnabled]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((current) => {
      const nextValue = !current;
      writeChangeStorage("autoRefreshEnabled", nextValue.toString());
      return nextValue;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      const nextValue = !current;
      writeChangeStorage("soundEnabled", nextValue.toString());
      return nextValue;
    });
  }, []);

  const clearVisitSummary = useCallback(() => {
    setVisitSummary(null);
    writeChangeStorageNumber("lastVisitSummaryCount", 0);
    writeChangeStorageNumber("lastVisitSummaryPreviousViewedAt", 0);
  }, []);

  const markAllRead = useCallback(() => {
    const viewedAt = Date.now();

    syncViewedBaseline(latestTimestamp, changes.length, viewedAt);
    clearVisitSummary();
    setNotificationError(null);
  }, [changes.length, clearVisitSummary, latestTimestamp, syncViewedBaseline]);

  const resetNotificationSettings = useCallback(() => {
    const viewedAt = Date.now();

    clearChangeNotificationStorage();
    setNotificationsEnabled(false);
    setSoundEnabled(false);
    setAutoRefreshEnabled(false);
    setNotificationError(null);
    setLastNotifiedLatestTimestamp(latestTimestamp);
    setLastNotifiedCount(changes.length);
    syncViewedBaseline(latestTimestamp, changes.length, viewedAt);
    clearVisitSummary();
    notificationsInitializedRef.current = false;
  }, [
    changes.length,
    clearVisitSummary,
    latestTimestamp,
    syncViewedBaseline,
  ]);

  const toggleNotifications = useCallback(async () => {
    setNotificationError(null);

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      setSoundEnabled(false);
      writeChangeStorage("notificationsEnabled", "false");
      writeChangeStorage("soundEnabled", "false");
      return;
    }

    if (!NOTIFICATIONS_SUPPORTED) {
      setNotificationError(
        "Browser notifications are not supported on this device."
      );
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setNotificationError("Notification permission was denied.");
        return;
      }
    }

    setNotificationsEnabled(true);
    setSoundEnabled(true);
    writeChangeStorage("notificationsEnabled", "true");
    writeChangeStorage("soundEnabled", "true");
    syncNotificationBaseline(latestTimestamp, changes.length);
  }, [changes.length, latestTimestamp, notificationsEnabled, syncNotificationBaseline]);

  useEffect(() => {
    notificationSound.current = new Audio("/notification2.wav");

    return () => {
      notificationSound.current = null;
    };
  }, []);

  useEffect(() => {
    if (!(isChangesPage || notificationsEnabled || autoRefreshEnabled)) {
      return;
    }

    if (!changesLoaded) {
      void refreshChanges();
    }

    const runRefresh = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      void refreshChanges({ force: true });
    };

    const intervalId = window.setInterval(runRefresh, POLL_INTERVAL);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const lastRefreshTimestamp = readChangeStorageNumber("cacheTimestamp");

      if (Date.now() - lastRefreshTimestamp >= POLL_INTERVAL) {
        runRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    autoRefreshEnabled,
    changesLoaded,
    isChangesPage,
    notificationsEnabled,
    refreshChanges,
  ]);

  useEffect(() => {
    if (!changesLoaded) {
      return;
    }

    if (!notificationsEnabled) {
      return;
    }

    if (!notificationsInitializedRef.current) {
      notificationsInitializedRef.current = true;
      syncNotificationBaseline(latestTimestamp, changes.length);
      return;
    }

    const newChangesCount = countNewChanges(
      changes,
      lastNotifiedLatestTimestamp,
      lastNotifiedCount
    );

    if (newChangesCount <= 0) {
      return;
    }

    if (NOTIFICATIONS_SUPPORTED && Notification.permission === "granted") {
      new Notification("New Changes Detected", {
        body: `${newChangesCount} new change${
          newChangesCount === 1 ? "" : "s"
        } detected.`,
        icon: "/favicon.ico",
      });
    }

    if (soundEnabled && notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch((error) => {
        console.error("Error playing notification sound:", error);
      });
    }

    syncNotificationBaseline(latestTimestamp, changes.length);
  }, [
    changes,
    changes.length,
    changesLoaded,
    lastNotifiedCount,
    lastNotifiedLatestTimestamp,
    latestTimestamp,
    notificationsEnabled,
    soundEnabled,
    syncNotificationBaseline,
  ]);

  useEffect(() => {
    if (!changesLoaded) {
      return;
    }

    if (
      lastViewedAt === 0 &&
      lastViewedLatestTimestamp === 0 &&
      lastViewedCount === 0
    ) {
      syncViewedBaseline(latestTimestamp, changes.length, Date.now());
    }
  }, [
    changes.length,
    changesLoaded,
    lastViewedAt,
    lastViewedCount,
    lastViewedLatestTimestamp,
    latestTimestamp,
    syncViewedBaseline,
  ]);

  useEffect(() => {
    if (isChangesPage && !wasChangesPageRef.current) {
      pendingVisitMarkRef.current = true;
    }

    if (!isChangesPage) {
      pendingVisitMarkRef.current = false;
    }

    if (pendingVisitMarkRef.current && isChangesPage && changesLoaded) {
      pendingVisitMarkRef.current = false;

      if (lastViewedAt > 0) {
        const summaryCount = countNewChanges(
          changes,
          lastViewedLatestTimestamp,
          lastViewedCount
        );

        if (summaryCount > 0) {
          const nextSummary = {
            count: summaryCount,
            previousViewedAt: lastViewedAt,
          };

          setVisitSummary(nextSummary);
          writeChangeStorageNumber("lastVisitSummaryCount", nextSummary.count);
          writeChangeStorageNumber(
            "lastVisitSummaryPreviousViewedAt",
            nextSummary.previousViewedAt
          );
        } else {
          clearVisitSummary();
        }
      }

      syncViewedBaseline(latestTimestamp, changes.length, Date.now());
    }

    wasChangesPageRef.current = isChangesPage;
  }, [
    changes,
    changes.length,
    changesLoaded,
    isChangesPage,
    lastViewedAt,
    lastViewedCount,
    lastViewedLatestTimestamp,
    latestTimestamp,
    clearVisitSummary,
    syncViewedBaseline,
  ]);

  return {
    autoRefreshEnabled,
    notificationError,
    markAllRead,
    notificationsEnabled,
    notificationsSupported: NOTIFICATIONS_SUPPORTED,
    resetNotificationSettings,
    soundEnabled,
    testNotification,
    toggleAutoRefresh,
    toggleNotifications,
    toggleSound,
    unreadCount,
    visitSummary,
  };
}
