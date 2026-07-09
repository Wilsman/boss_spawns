import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataChange } from "@/lib/diff";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import type { ChangeVisitSummary } from "@/hooks/useChangeMonitor";
import { bossMatchesQuery, getCanonicalBossName } from "@/lib/boss-aliases";

interface ChangesTableProps {
  changes: DataChange[];
  filters: {
    map: string;
    boss: string;
    search: string;
  };
  changeFilters: ChangeFilters;
  onChangesUpdate: (options?: {
    force?: boolean;
    silent?: boolean;
  }) => Promise<void>;
  visitSummary: ChangeVisitSummary | null;
}

export type ChangeGroupBy = "none" | "day" | "week";
export type ChangeDateRange = "all" | "24h" | "7d" | "30d";

export interface ChangeFilters {
  groupBy: ChangeGroupBy;
  dateRange: ChangeDateRange;
  modeFilter: string;
  changeTypeFilter: string;
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
const CHANGE_BATCH_SIZE = 75;

export function ChangesTable({
  changes = [],
  filters,
  changeFilters,
  onChangesUpdate,
  visitSummary,
}: ChangesTableProps) {
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleChangeCount, setVisibleChangeCount] =
    useState(CHANGE_BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadMoreIntersectingRef = useRef(false);

  // Apply date range filter before other filters
  const filteredChanges = useMemo(() => {
    if (!Array.isArray(changes)) return [];

    return changes.filter((change) => {
      const now = Date.now();
      const changeTime = change.timestamp;
      const diff = now - changeTime;
      const millisecondsPerDay = 24 * 60 * 60 * 1000;

      // Apply date range filter
      switch (changeFilters.dateRange) {
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
        changeFilters.modeFilter &&
        change.gameMode.toLowerCase() !== changeFilters.modeFilter.toLowerCase()
      ) {
        return false;
      }

      // Apply change type filter
      if (
        changeFilters.changeTypeFilter &&
        change.field !== changeFilters.changeTypeFilter
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
        !bossMatchesQuery(change.boss, filters.boss)
      )
        return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          change.map.toLowerCase().includes(search) ||
          bossMatchesQuery(change.boss, search) ||
          change.oldValue.toLowerCase().includes(search) ||
          change.newValue.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [changes, changeFilters, filters]);

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
            return getCanonicalBossName(change.boss);
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
        ? a.map.localeCompare(b.map) ||
          getCanonicalBossName(a.boss).localeCompare(
            getCanonicalBossName(b.boss)
          )
        : comparison * direction;
    });
  }, [filteredChanges, sortField, sortDirection]);

  useEffect(() => {
    setVisibleChangeCount(CHANGE_BATCH_SIZE);
  }, [
    changeFilters.changeTypeFilter,
    changeFilters.dateRange,
    filters.boss,
    filters.map,
    filters.search,
    changeFilters.groupBy,
    changeFilters.modeFilter,
    sortDirection,
    sortField,
  ]);

  const visibleChanges = useMemo(
    () => sortedChanges.slice(0, visibleChangeCount),
    [sortedChanges, visibleChangeCount]
  );
  const hasMoreChanges = visibleChangeCount < sortedChanges.length;
  const loadMoreChanges = useCallback(() => {
    setVisibleChangeCount((currentCount) =>
      Math.min(currentCount + CHANGE_BATCH_SIZE, sortedChanges.length)
    );
  }, [sortedChanges.length]);

  useEffect(() => {
    if (!hasMoreChanges) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadMoreIntersectingRef.current) {
          loadMoreIntersectingRef.current = true;
          loadMoreChanges();
        } else if (!entry.isIntersecting) {
          loadMoreIntersectingRef.current = false;
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMoreChanges, loadMoreChanges]);

  // Group changes if needed
  const groupedChanges = useMemo(() => {
    return changeFilters.groupBy === "none"
      ? null
      : groupChangesByDate(visibleChanges, changeFilters.groupBy);
  }, [visibleChanges, changeFilters.groupBy]);

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

  function renderTable(changes: DataChange[], showHeader = true) {
    if (!changes.length) {
      // Check if we have filters applied
      const hasFilters =
        filters.map ||
        filters.boss ||
        filters.search ||
        changeFilters.dateRange !== "all" ||
        changeFilters.modeFilter ||
        changeFilters.changeTypeFilter;
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
              onClick={() => void onChangesUpdate()}
              className="px-3 py-1 text-sm bg-gray-800 rounded-md hover:bg-gray-700 mt-4"
            >
              Clear filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#0c1117]/70 shadow-[0_14px_40px_rgba(0,0,0,0.14)]">
        <table className="w-full min-w-[760px]">
          {showHeader && (
          <thead>
            <tr className="bg-gray-900/40">
              <SortHeader field="timestamp">Time</SortHeader>
              <SortHeader field="gameMode">Mode</SortHeader>
              <SortHeader field="map">Map</SortHeader>
              <SortHeader field="boss">Boss</SortHeader>
              <SortHeader field="field">Change Type</SortHeader>
              <SortHeader field="newValue">Change</SortHeader>
            </tr>
          </thead>
          )}
          <tbody>
            {changes.map((change, index) => (
              <tr
                key={`${change.map}-${change.boss}-${change.field}-${index}`}
                className="group border-t border-white/[0.06] transition-colors duration-200 hover:bg-white/[0.035]"
              >
                <TimestampCell timestamp={change.timestamp} />
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-bold tracking-wide ${change.gameMode.toLowerCase() === "pve" ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-orange-400/20 bg-orange-400/10 text-orange-200"}`}>
                    {change.gameMode}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-sm font-medium text-violet-200">
                  {titleCase(change.map)}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-sky-200">
                  {titleCase(getCanonicalBossName(change.boss))}
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <ChangeTypeBadge field={change.field} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="min-w-[52px] text-right font-mono text-rose-300/85 line-through decoration-rose-300/35">
                      {change.oldValue}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-600 transition-colors group-hover:text-gray-400" />
                    <span className="min-w-[52px] font-mono font-semibold text-emerald-300">
                      {change.newValue}
                    </span>
                    <ChangeDirection change={change} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              onClick={() => void onChangesUpdate({ force: true })}
              className="px-4 py-2 mt-4 text-sm bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check for changes
            </button>
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

  return (
    <div className="space-y-4">
      {visitSummary && (
        <LastVisitSummary
          count={visitSummary.count}
          previousViewedAt={visitSummary.previousViewedAt}
        />
      )}
      {groupedChanges
        ? Object.entries(groupedChanges)
            // Sort groups by date key
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, groupChanges], groupIndex) => (
              <div key={date} className="mb-6 last:mb-0">
                <div className="mb-2 flex items-center gap-3 px-1">
                  <h3 className="text-base font-semibold text-gray-200">
                    {formatGroupDate(date)}
                  </h3>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-xs text-gray-500">
                    ({groupChanges.length} change
                    {groupChanges.length !== 1 ? "s" : ""})
                  </span>
                </div>
                {renderTable(groupChanges, groupIndex === 0)}
              </div>
            ))
        : renderTable(visibleChanges)}

      {sortedChanges.length > 0 && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center gap-2 py-5 text-xs text-gray-500"
        >
          <span>
            Showing {visibleChanges.length.toLocaleString()} of{" "}
            {sortedChanges.length.toLocaleString()} changes
          </span>
          {hasMoreChanges ? (
            <button
              type="button"
              onClick={loadMoreChanges}
              className="rounded-md border border-gray-700/70 bg-gray-900/50 px-3 py-1.5 text-gray-300 transition-colors hover:border-purple-500/60 hover:text-purple-300"
            >
              Load more
            </button>
          ) : (
            <span>All matching changes loaded</span>
          )}
        </div>
      )}
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

function ChangeTypeBadge({ field }: { field: string }) {
  const normalized = field.toLowerCase();
  const isAdded = normalized.includes("added") || normalized === "status";
  const isRemoved = normalized.includes("removed");
  const Icon = isAdded ? Plus : isRemoved ? Minus : TrendingUp;
  const label = isAdded ? "Added" : isRemoved ? "Removed" : humanizeChangeType(field);
  const classes = isAdded
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
    : isRemoved
    ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
    : "border-violet-400/20 bg-violet-400/10 text-violet-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${classes}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ChangeDirection({ change }: { change: DataChange }) {
  const oldNumber = parseFloat(change.oldValue);
  const newNumber = parseFloat(change.newValue);
  if (Number.isNaN(oldNumber) || Number.isNaN(newNumber) || oldNumber === newNumber) return null;

  const increased = newNumber > oldNumber;
  return (
    <span className={`ml-1 inline-flex items-center gap-1 text-[11px] font-semibold ${increased ? "text-emerald-300/80" : "text-rose-300/80"}`}>
      {increased ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(newNumber - oldNumber)}{change.newValue.includes("%") ? "%" : ""}
    </span>
  );
}

function humanizeChangeType(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[:_]/g, " · ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
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
