import { useCallback, useEffect, useMemo, useState } from "react";
import { DataChange } from "@/lib/diff";
import { ArrowUpDown, RefreshCcw, AlertTriangle } from "lucide-react";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import type { ChangeVisitSummary } from "@/hooks/useChangeMonitor";
import { readChangeStorageNumber } from "@/lib/change-storage";

interface ChangesTableProps {
  changes: DataChange[];
  filters: {
    map: string;
    boss: string;
    search: string;
  };
  onChangesUpdate: (options?: {
    force?: boolean;
    silent?: boolean;
  }) => Promise<void>;
  visitSummary: ChangeVisitSummary | null;
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
  visitSummary,
}: ChangesTableProps) {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [modeFilter, setModeFilter] = useState<string>(""); // Add mode filter state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(() => {
    return readChangeStorageNumber("cacheTimestamp") || Date.now();
  });
  const [nextRefreshAllowed, setNextRefreshAllowed] = useState<number>(() => {
    const timestamp = readChangeStorageNumber("cacheTimestamp");
    return timestamp + CACHE_DURATION;
  });
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(
    Math.max(0, nextRefreshAllowed - Date.now())
  );
  const lastRefreshedTimeDisplay = useRelativeTime(lastRefreshTime);
  const canRefresh = timeUntilRefresh === 0;

  useEffect(() => {
    const storedRefreshTime = readChangeStorageNumber("cacheTimestamp");

    if (storedRefreshTime > 0) {
      setLastRefreshTime(storedRefreshTime);
      setNextRefreshAllowed(storedRefreshTime + CACHE_DURATION);
      setTimeUntilRefresh(
        Math.max(0, storedRefreshTime + CACHE_DURATION - Date.now())
      );
    }
  }, [changes]);

  const handleManualRefresh = useCallback(async () => {
    const now = Date.now();
    if (isRefreshing || now < nextRefreshAllowed) return;

    setIsRefreshing(true);
    setError(null);

    try {
      await onChangesUpdate({ force: true });
      const currentTime =
        readChangeStorageNumber("cacheTimestamp") || Date.now();
      setLastRefreshTime(currentTime);
      setNextRefreshAllowed(currentTime + CACHE_DURATION);
      setTimeUntilRefresh(CACHE_DURATION);
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
      if (
        modeFilter &&
        change.gameMode.toLowerCase() !== modeFilter.toLowerCase()
      ) {
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
      const hasFilters =
        filters.map || filters.boss || filters.search || modeFilter;
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
      <div className="overflow-x-auto rounded-xl border border-gray-700/60 bg-[#0c1117]/60">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-900/40">
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
                className="border-t border-gray-800/70 hover:bg-gray-800/30 transition-colors duration-200"
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
      </div>
    );
  }

  // If we have no changes data, show an appropriate message with substantial content
  if (!changes.length) {
    return (
      <div className="space-y-6">
        {/* Status message */}
        <div className="flex flex-col items-center justify-center py-8 gap-4">
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
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Informational content for AdSense compliance */}
        <div className="rounded-xl border border-gray-700/60 bg-[#0c1117]/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            About Boss Spawn Changes
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            This page tracks historical changes to boss spawn rates in Escape
            from Tarkov. Battlestate Games periodically adjusts spawn chances
            during events, patches, and wipes.
          </p>

          <h4 className="text-md font-semibold text-white mb-2">
            What We Track
          </h4>
          <ul className="text-gray-400 text-sm space-y-1 mb-4">
            <li>
              • <strong className="text-gray-300">Spawn Chance Changes</strong>{" "}
              - When a boss's spawn probability is modified
            </li>
            <li>
              • <strong className="text-gray-300">Location Changes</strong> -
              When bosses are added to or removed from maps
            </li>
            <li>
              • <strong className="text-gray-300">Event Updates</strong> -
              Special events like 100% boss spawn weeks
            </li>
            <li>
              •{" "}
              <strong className="text-gray-300">PVP vs PVE Differences</strong>{" "}
              - Mode-specific spawn rate adjustments
            </li>
          </ul>

          <h4 className="text-md font-semibold text-white mb-2">
            How It Works
          </h4>
          <p className="text-gray-400 text-sm">
            We poll the Tarkov.dev API every 5 minutes and compare the data
            against previous snapshots. When differences are detected, they're
            logged here with timestamps. Enable notifications to get alerted
            when new changes are detected.
          </p>
        </div>

        {/* Boss quick reference */}
        <div className="rounded-xl border border-gray-700/60 bg-[#0c1117]/60 p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Tarkov Bosses Quick Reference
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">
                Reshala
              </span>
              <span className="text-gray-500">Customs</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">Killa</span>
              <span className="text-gray-500">Interchange</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">
                Glukhar
              </span>
              <span className="text-gray-500">Reserve</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">
                Shturman
              </span>
              <span className="text-gray-500">Woods</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">
                Sanitar
              </span>
              <span className="text-gray-500">Shoreline</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">
                Tagilla
              </span>
              <span className="text-gray-500">Factory</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">Kaban</span>
              <span className="text-gray-500">Streets</span>
            </div>
            <div className="rounded-lg bg-gray-900/40 p-3">
              <span className="text-purple-400 font-semibold block">
                The Goons
              </span>
              <span className="text-gray-500">Roaming</span>
            </div>
          </div>
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
      {visitSummary && (
        <LastVisitSummary
          count={visitSummary.count}
          previousViewedAt={visitSummary.previousViewedAt}
        />
      )}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-700/60 bg-[#0c1117]/60 p-4 md:flex-row">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-3 py-2 text-sm text-gray-200"
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
            className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-3 py-2 text-sm text-gray-200"
          >
            <option value="">All Modes</option>
            <option value="PvP">PvP</option>
            <option value="PvE">PvE</option>
          </select>

          {/* Grouping Options */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded-lg border border-gray-700/60 bg-gray-900/40 px-3 py-2 text-sm text-gray-200"
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
          </div>
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

function LastVisitSummary({
  count,
  previousViewedAt,
}: {
  count: number;
  previousViewedAt: number;
}) {
  const previousVisitRelativeTime = useRelativeTime(previousViewedAt);

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-emerald-200">
          {count} change{count === 1 ? "" : "s"} landed since your last visit
        </span>
        <span className="text-emerald-100/70">
          Last viewed {previousVisitRelativeTime || "recently"}.
        </span>
      </div>
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
