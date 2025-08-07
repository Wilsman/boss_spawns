import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { DataChange } from "@/lib/diff";
import { ArrowUpDown, RefreshCcw, AlertTriangle, BellPlus, BellOff } from "lucide-react";
import { useRelativeTime } from "@/hooks/useRelativeTime";

interface ChangesTableProps {
  changes: DataChange[];
  filters: {
    map: string;
    boss: string;
    search: string;
  };
  onChangesUpdate: () => Promise<void>;
}

type SortField =
  | "map"
  | "boss"
  | "field"
  | "oldValue"
  | "newValue"
  | "timestamp"
  | "gameMode";
type SortDirection = "asc" | "desc";
type GroupBy = "none" | "day" | "week";
type DateRange = "all" | "24h" | "7d" | "30d";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function ChangesTable({
  changes = [],
  filters,
  onChangesUpdate,
}: ChangesTableProps) {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [modeFilter, setModeFilter] = useState<string>(""); // Add mode filter state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("notifications_enabled") === "true";
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("sound_enabled") === "true";
  });
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    return localStorage.getItem("auto_refresh_enabled") === "true";
  });
  // Fixed 5-minute auto-refresh interval
  const autoRefreshInterval = 300000; // 5 minutes in milliseconds
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  // Guard to prevent firing notifications on initial load
  const notificationsInitializedRef = useRef<boolean>(false);
  const [lastSeenChangeCount, setLastSeenChangeCount] = useState<number>(() => {
    return parseInt(localStorage.getItem("last_seen_change_count") || "0", 10);
  });
  // Track the latest seen change timestamp to avoid false positives on reloads/tab switches
  const [lastSeenLatestTimestamp, setLastSeenLatestTimestamp] = useState<number>(() => {
    return parseInt(localStorage.getItem("last_seen_latest_ts") || "0", 10);
  });
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(() => {
    return parseInt(
      localStorage.getItem("changes_timestamp") || Date.now().toString(),
      10
    );
  });
  const [nextRefreshAllowed, setNextRefreshAllowed] = useState<number>(() => {
    const timestamp = parseInt(
      localStorage.getItem("changes_timestamp") || "0",
      10
    );
    return timestamp + CACHE_DURATION;
  });
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(
    Math.max(0, nextRefreshAllowed - Date.now())
  );
  const lastRefreshedTimeDisplay = useRelativeTime(lastRefreshTime);
  const canRefresh = timeUntilRefresh === 0;

  // Compute the latest timestamp in the current changes list
  const latestTimestamp = useMemo(() => {
    return changes && changes.length ? Math.max(...changes.map((c) => c.timestamp)) : 0;
  }, [changes]);

  // Track last page visibility change to suppress notifications right after switching tabs
  const lastVisibilityChangeRef = useRef<number>(Date.now());
  useEffect(() => {
    const onVisibilityChange = () => {
      lastVisibilityChangeRef.current = Date.now();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    const newState = !autoRefreshEnabled;
    setAutoRefreshEnabled(newState);
    localStorage.setItem("auto_refresh_enabled", newState.toString());
  }, [autoRefreshEnabled]);
  
  // Using fixed 5-minute interval, no need for change handler
  
  const toggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      // Turn off notifications
      setNotificationsEnabled(false);
      localStorage.setItem("notifications_enabled", "false");
      // Also turn off sound when notifications are disabled
      setSoundEnabled(false);
      localStorage.setItem("sound_enabled", "false");
      return;
    }
    
    // Request permission if not granted
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        // User denied permission
        return;
      }
    }
    
    // Enable notifications and store current change count
    setNotificationsEnabled(true);
    localStorage.setItem("notifications_enabled", "true");
    // Enable sound by default when notifications are enabled
    setSoundEnabled(true);
    localStorage.setItem("sound_enabled", "true");
    setLastSeenChangeCount(changes.length);
    localStorage.setItem("last_seen_change_count", changes.length.toString());
    // Also sync the latest timestamp so we don't fire immediately after enabling
    setLastSeenLatestTimestamp(latestTimestamp);
    localStorage.setItem("last_seen_latest_ts", latestTimestamp.toString());
  }, [notificationsEnabled, changes.length, latestTimestamp]);

  // Toggle sound notifications separately
  const toggleSound = useCallback(() => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem("sound_enabled", newSoundState.toString());
    // No longer automatically play sound when toggling
  }, [soundEnabled]);
  
  // Test sound function
  const testSound = useCallback(() => {
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(err => console.error("Error playing notification sound:", err));
    }
  }, []);

  const handleManualRefresh = useCallback(async () => {
    const now = Date.now();
    if (isRefreshing || now < nextRefreshAllowed) return;

    setIsRefreshing(true);
    setError(null);

    try {
      await onChangesUpdate();
      const currentTime = Date.now();
      setLastRefreshTime(currentTime);
      setNextRefreshAllowed(currentTime + CACHE_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch changes");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onChangesUpdate, nextRefreshAllowed]);

  // Calculate time until next refresh
  useEffect(() => {
    if (!canRefresh) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, nextRefreshAllowed - Date.now());
        setTimeUntilRefresh(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [nextRefreshAllowed, canRefresh]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled || !canRefresh) return;
    
    const interval = setInterval(() => {
      if (canRefresh && !isRefreshing) {
        handleManualRefresh();
        // Ensure timestamp is updated even if no new changes
        const currentTime = Date.now();
        setLastRefreshTime(currentTime);
        localStorage.setItem("changes_timestamp", currentTime.toString());
      }
    }, autoRefreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, canRefresh, isRefreshing, autoRefreshInterval]);

  // Initialize notification sound
  useEffect(() => {
    notificationSound.current = new Audio("/notification2.wav");
    return () => {
      if (notificationSound.current) {
        notificationSound.current = null;
      }
    };
  }, []);

  // Trigger notifications when genuinely new changes arrive
  useEffect(() => {
    if (!notificationsEnabled) return;

    // On first run after enabling/mount, initialize without notifying
    if (!notificationsInitializedRef.current) {
      notificationsInitializedRef.current = true;
      // Sync counters silently to avoid initial spam
      if (changes.length !== lastSeenChangeCount) {
        setLastSeenChangeCount(changes.length);
        localStorage.setItem("last_seen_change_count", changes.length.toString());
      }
      if (latestTimestamp && latestTimestamp !== lastSeenLatestTimestamp) {
        setLastSeenLatestTimestamp(latestTimestamp);
        localStorage.setItem("last_seen_latest_ts", latestTimestamp.toString());
      }
      return;
    }

    // Suppress right after tab becomes visible to avoid false positives on refocus
    const now = Date.now();
    if (document.visibilityState === 'visible' && now - lastVisibilityChangeRef.current < 1500) {
      // Sync silently
      if (latestTimestamp > lastSeenLatestTimestamp) {
        setLastSeenLatestTimestamp(latestTimestamp);
        localStorage.setItem("last_seen_latest_ts", latestTimestamp.toString());
      }
      if (changes.length !== lastSeenChangeCount) {
        setLastSeenChangeCount(changes.length);
        localStorage.setItem("last_seen_change_count", changes.length.toString());
      }
      return;
    }

    // Only notify when we see changes newer than the last seen timestamp
    if (latestTimestamp > lastSeenLatestTimestamp) {
      const newChangesCount = changes.filter(c => c.timestamp > lastSeenLatestTimestamp).length;

      if (newChangesCount > 0) {
        // Browser notification
        if (Notification.permission === "granted") {
          new Notification("New Changes Detected", {
            body: `${newChangesCount} new change${newChangesCount !== 1 ? 's' : ''} detected.`,
            icon: "/favicon.ico",
          });
        }

        // Optional sound
        if (soundEnabled && notificationSound.current) {
          notificationSound.current.currentTime = 0;
          notificationSound.current.play().catch((err) => {
            console.error("Error playing notification sound:", err);
          });
        }

        // Persist the new seen markers
        setLastSeenLatestTimestamp(latestTimestamp);
        localStorage.setItem("last_seen_latest_ts", latestTimestamp.toString());
        setLastSeenChangeCount(changes.length);
        localStorage.setItem("last_seen_change_count", changes.length.toString());
      }
    }
  }, [changes, changes.length, latestTimestamp, notificationsEnabled, soundEnabled, lastSeenChangeCount, lastSeenLatestTimestamp]);

  // Apply date range filter before other filters
  const filteredChanges = useMemo(() => {
    if (!Array.isArray(changes)) return [];

    return changes.filter((change) => {
      const now = Date.now();
      const changeTime = change.timestamp;
      const diff = now - changeTime;
      const millisecondsPerDay = 24 * 60 * 60 * 1000;

      // Apply date range filter
      switch (dateRange) {
        case "24h":
          if (diff > millisecondsPerDay) return false;
          break;
        case "7d":
          if (diff > 7 * millisecondsPerDay) return false;
          break;
        case "30d":
          if (diff > 30 * millisecondsPerDay) return false;
          break;
      }

      // Apply mode filter
      if (modeFilter && change.gameMode.toLowerCase() !== modeFilter.toLowerCase()) {
        return false;
      }

      // Apply text filters
      if (
        filters.map &&
        !change.map.toLowerCase().includes(filters.map.toLowerCase())
      )
        return false;
      if (
        filters.boss &&
        !change.boss.toLowerCase().includes(filters.boss.toLowerCase())
      )
        return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          change.map.toLowerCase().includes(search) ||
          change.boss.toLowerCase().includes(search) ||
          change.oldValue.toLowerCase().includes(search) ||
          change.newValue.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [changes, dateRange, filters, modeFilter]);

  // Memoize date range counts
  const dateRangeCounts = useMemo(() => {
    const now = Date.now();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return {
      all: changes.length,
      last24h: changes.filter((c) => now - c.timestamp <= millisecondsPerDay)
        .length,
      last7d: changes.filter((c) => now - c.timestamp <= 7 * millisecondsPerDay)
        .length,
      last30d: changes.filter(
        (c) => now - c.timestamp <= 30 * millisecondsPerDay
      ).length,
    };
  }, [changes]);

  // Memoize sorted changes
  const sortedChanges = useMemo(() => {
    return [...filteredChanges].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      const getValue = (change: DataChange) => {
        switch (sortField) {
          case "timestamp":
            return change.timestamp;
          case "map":
            return change.map;
          case "boss":
            return change.boss;
          case "field":
            return change.field;
          case "oldValue":
            return change.oldValue;
          case "newValue":
            return change.newValue;
          case "gameMode":
            return change.gameMode;
          default:
            return change.timestamp;
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return comparison === 0
          ? b.timestamp - a.timestamp
          : comparison * direction;
      }

      const comparison = (aValue as number) - (bValue as number);
      return comparison === 0
        ? a.map.localeCompare(b.map) || a.boss.localeCompare(b.boss)
        : comparison * direction;
    });
  }, [filteredChanges, sortField, sortDirection]);

  // Group changes if needed
  const groupedChanges = useMemo(() => {
    return groupBy === "none"
      ? null
      : groupChangesByDate(sortedChanges, groupBy);
  }, [sortedChanges, groupBy]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-6 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:bg-gray-700/50"
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown
          className={`h-4 w-4 transition-colors ${
            sortField === field ? "text-purple-400" : "text-gray-500"
          }`}
        />
      </div>
    </th>
  );

  function renderTable(changes: DataChange[]) {
    if (!changes.length) {
      // Check if we have filters applied
      const hasFilters = filters.map || filters.boss || filters.search || modeFilter;
      const message = hasFilters
        ? "No changes match your current filters"
        : "No changes have been detected yet";
      const suggestion = hasFilters
        ? "Try adjusting your filters or changing the date range"
        : "Changes will appear here when boss spawns are updated";

      return (
        <div className="text-center py-12 space-y-2">
          <div className="text-gray-400">{message}</div>
          <div className="text-gray-500 text-sm">{suggestion}</div>
          {hasFilters && (
            <button
              onClick={() => {
                // Reset filters through parent component
                onChangesUpdate();
              }}
              className="px-3 py-1 text-sm bg-gray-800 rounded-md hover:bg-gray-700 mt-4"
            >
              Clear filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800">
              <SortHeader field="timestamp">Time</SortHeader>
              <SortHeader field="gameMode">Mode</SortHeader>
              <SortHeader field="map">Map</SortHeader>
              <SortHeader field="boss">Boss</SortHeader>
              <SortHeader field="field">Change Type</SortHeader>
              <SortHeader field="oldValue">Previous Value</SortHeader>
              <SortHeader field="newValue">New Value</SortHeader>
            </tr>
          </thead>
          <tbody>
            {changes.map((change, index) => (
              <tr
                key={`${change.map}-${change.boss}-${change.field}-${index}`}
                className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors duration-200"
              >
                <TimestampCell timestamp={change.timestamp} />
                <td className="px-6 py-4 whitespace-nowrap text-orange-300">
                  {change.gameMode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-purple-300">
                  {change.map}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-300">
                  {change.boss}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {change.field}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-red-400">
                  {change.oldValue}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-green-400">
                  {change.newValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="space-y-4">
          <div className="text-red-400">{error}</div>
          <div className="text-gray-400 text-sm">
            {changes.length > 0
              ? "Showing previously loaded changes. Click retry to fetch latest updates."
              : "Unable to load changes. Please try again."}
          </div>
          <button
            onClick={handleManualRefresh}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
        <div className="flex items-center gap-2 p-2 border border-purple-500/30 rounded-lg bg-gray-800/30">
          <span className="text-sm text-gray-400">
            {notificationsEnabled ? "Notifications enabled" : "Get notified of changes"}
          </span>
          <button
            onClick={toggleNotifications}
            className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <BellOff className="w-4 h-4 text-purple-400" />
            ) : (
              <BellPlus className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => {
              if (Notification.permission === "granted") {
                new Notification("Test Notification", {
                  body: "This is a test notification for developers",
                  icon: "/favicon.ico"
                });
              } else {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("Test Notification", {
                      body: "This is a test notification for developers",
                      icon: "/favicon.ico"
                    });
                  }
                });
              }
            }}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 ml-2"
            title="Test notification (for developers)"
          >
            Test
          </button>
        </div>
      </div>
    );
  }

  // If we have no changes data, show an appropriate message
  if (!changes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <div className="text-center space-y-2">
          <p className="text-gray-400">No changes have been detected yet</p>
          <p className="text-gray-500 text-sm">
            Changes will appear here when boss spawns are updated
          </p>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 mt-4 text-sm bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? (
              <>
                <RefreshCcw className="inline w-4 h-4 mr-2 animate-spin" />
                Checking for changes...
              </>
            ) : (
              "Check for changes"
            )}
          </button>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-2 p-2 border border-purple-500/30 rounded-lg bg-gray-800/30">
          <span className="text-sm text-gray-400">
            {notificationsEnabled ? "Notifications enabled" : "Get notified of changes"}
          </span>
          <button
            onClick={toggleNotifications}
            className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <BellOff className="w-4 h-4 text-purple-400" />
            ) : (
              <BellPlus className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => {
              if (Notification.permission === "granted") {
                new Notification("Test Notification", {
                  body: "This is a test notification for developers",
                  icon: "/favicon.ico"
                });
              } else {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("Test Notification", {
                      body: "This is a test notification for developers",
                      icon: "/favicon.ico"
                    });
                  }
                });
              }
            }}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 ml-2"
            title="Test notification (for developers)"
          >
            Test
          </button>
        </div>
      </div>
    );
  }

  const formatGroupDate = (dateStr: string): string => {
    if (dateStr.includes(" to ")) {
      const [start, end] = dateStr.split(" to ");
      return `Week of ${new Date(start).toLocaleDateString()} - ${new Date(
        end
      ).toLocaleDateString()}`;
    }
    return new Date(dateStr).toLocaleDateString();
  };

  // Update the refresh button in the UI
  const getRefreshButtonTooltip = () => {
    if (isRefreshing) return "Refreshing...";
    if (!canRefresh) {
      const minutes = Math.floor(timeUntilRefresh / 60000);
      const seconds = Math.floor((timeUntilRefresh % 60000) / 1000);
      return `Next refresh available in ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return "Refresh changes";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row p-4 bg-gray-800/50 rounded-lg gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-3 py-2 text-sm bg-gray-800 rounded-md border border-gray-700"
          >
            <option value="all">All Time ({dateRangeCounts.all})</option>
            <option value="24h">
              Last 24 Hours ({dateRangeCounts.last24h})
            </option>
            <option value="7d">Last 7 Days ({dateRangeCounts.last7d})</option>
            <option value="30d">
              Last 30 Days ({dateRangeCounts.last30d})
            </option>
          </select>

          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-800 rounded-md border border-gray-700"
          >
            <option value="">All Modes</option>
            <option value="PvP">PvP</option>
            <option value="PvE">PvE</option>
          </select>

          {/* Grouping Options */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-2 text-sm bg-gray-800 rounded-md border border-gray-700"
          >
            <option value="none">No Grouping</option>
            <option value="day">Group by Day</option>
            <option value="week">Group by Week</option>
          </select>

          <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`text-gray-400 ${isRefreshing ? "opacity-50" : ""}`}
              >
                Last updated: {lastRefreshedTimeDisplay || "just now"}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing || !canRefresh}
                className={`p-1 rounded-full hover:bg-gray-700/50 transition-colors 
                  ${
                    isRefreshing || !canRefresh
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                title={getRefreshButtonTooltip()}
              >
                <RefreshCcw
                  className={`w-4 h-4 ${
                    isRefreshing
                      ? "animate-spin text-purple-400"
                      : "text-gray-400"
                  }`}
                />
              </button>
              {!canRefresh && (
                <span className="text-xs text-gray-500">
                  {Math.floor(timeUntilRefresh / 60000)}:
                  {Math.floor((timeUntilRefresh % 60000) / 1000)
                    .toString()
                    .padStart(2, "0")}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 md:ml-4 md:border-l md:border-gray-700 md:pl-4">
              <span className="text-xs text-gray-400">Auto-refresh:</span>
              <button
                onClick={toggleAutoRefresh}
                className={`px-2 py-1 text-xs rounded ${autoRefreshEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                title={autoRefreshEnabled ? "Disable auto-refresh (5 min)" : "Enable auto-refresh (5 min)"}
              >
                {autoRefreshEnabled ? "ON (5m)" : "OFF"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 border border-purple-500/30 rounded-lg bg-gray-800/30 md:flex-wrap">
          <span className="text-sm text-gray-400">
            {notificationsEnabled ? "Notifications enabled" : "Get notified of changes"}
          </span>
          <button
            onClick={toggleNotifications}
            className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
            title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
          >
            {notificationsEnabled ? (
              <BellOff className="w-4 h-4 text-purple-400" />
            ) : (
              <BellPlus className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {notificationsEnabled && (
            <button
              onClick={toggleSound}
              className={`p-1 rounded-full hover:bg-gray-700/50 transition-colors ${soundEnabled ? 'text-purple-400' : 'text-gray-400'}`}
              title={soundEnabled ? "Disable sound" : "Enable sound"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                {soundEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              // Play the sound notification
              testSound();
              
              // Also show a browser notification if permission is granted
              if (Notification.permission === "granted") {
                new Notification("Test Notification", {
                  body: "Parmesan is a great cheese",
                  icon: "/favicon.ico"
                });
              } else {
                Notification.requestPermission().then(permission => {
                  if (permission === "granted") {
                    new Notification("Test Notification", {
                      body: "Parmesan is a bad cheese",
                      icon: "/favicon.ico"
                    });
                  }
                });
              }
            }}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 ml-2"
            title="Test notification (for developers)"
          >
            Test
          </button>
        </div>
      </div>

      {groupedChanges
        ? Object.entries(groupedChanges)
            // Sort groups by date key
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, groupChanges]) => (
              <div key={date} className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-gray-300 flex items-center gap-2">
                  {formatGroupDate(date)}
                  <span className="text-sm text-gray-500 font-normal">
                    ({groupChanges.length} change
                    {groupChanges.length !== 1 ? "s" : ""})
                  </span>
                </h3>
                {renderTable(groupChanges)}
              </div>
            ))
        : renderTable(sortedChanges)}
    </div>
  );
}

import * as Tooltip from '@radix-ui/react-tooltip';

// Enhanced TimestampCell component with tooltip
const TimestampCell = ({ timestamp }: { timestamp: number }) => {
  const relativeTime = useRelativeTime(timestamp);
  const fullDateTime = timestamp ? new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }) : 'unknown';

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <td className="px-6 py-4 whitespace-nowrap text-gray-400 cursor-help">
            {relativeTime || "unknown"}
          </td>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content 
            className="bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-50"
            side="top"
            sideOffset={5}
          >
            {fullDateTime}
            <Tooltip.Arrow className="fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

function groupChangesByDate(
  changes: DataChange[],
  grouping: "day" | "week"
): Record<string, DataChange[]> {
  const grouped: Record<string, DataChange[]> = {};

  changes.forEach((change) => {
    const date = new Date(change.timestamp);
    let key: string;

    if (grouping === "day") {
      // Format date as YYYY-MM-DD for proper sorting
      key = date.toISOString().split("T")[0];
    } else {
      // Get start of week
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      // Format as YYYY-MM-DD for sorting
      key = `${startOfWeek.toISOString().split("T")[0]} to ${
        endOfWeek.toISOString().split("T")[0]
      }`;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(change);
  });

  // Sort changes within each group by timestamp
  Object.values(grouped).forEach((group) => {
    group.sort((a, b) => b.timestamp - a.timestamp);
  });

  return grouped;
}
