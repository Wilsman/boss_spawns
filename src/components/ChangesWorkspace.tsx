import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  FileDown,
  Map,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import type { SpawnData } from "@/types";
import type { DataChange } from "@/lib/diff";
import { getCanonicalBossName } from "@/lib/boss-aliases";
import { NavBar } from "@/components/ui/navbar";
import { CacheStatus } from "@/components/CacheStatus";
import { ChangeMonitorHealth } from "@/components/ChangeMonitorHealth";
import { ChangeNotificationControls } from "@/components/ChangeNotificationControls";
import type {
  ChangeDateRange,
  ChangeFilters,
  ChangeGroupBy,
} from "@/components/ChangesTable";
import { ClearButton } from "@/components/DataWorkspace";
import { cn } from "@/lib/utils";
import { CalendarDays, Crosshair, History, Scale, Swords } from "lucide-react";

interface ChangesWorkspaceProps {
  renderContent: (filters: ChangeFilters) => ReactNode;
  changes: DataChange[];
  filterData: SpawnData[] | null;
  mapFilter: string;
  bossFilter: string;
  searchQuery: string;
  onMapFilterChange: (value: string) => void;
  onBossFilterChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  onChangesUpdate: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  isRefreshing: boolean;
  changesLoaded: boolean;
  autoRefreshEnabled: boolean;
  canMarkAllRead: boolean;
  errorText?: string | null;
  notificationsEnabled: boolean;
  notificationsSupported: boolean;
  onMarkAllRead: () => void;
  onResetSettings: () => void;
  onTestNotification?: () => void;
  onToggleAutoRefresh: () => void;
  onToggleNotifications: () => void | Promise<void>;
  onToggleSound: () => void;
  soundEnabled: boolean;
  unreadCount: number;
}

const defaultChangeFilters: ChangeFilters = {
  dateRange: "all",
  modeFilter: "",
  changeTypeFilter: "",
  groupBy: "day",
};

export function ChangesWorkspace({
  renderContent,
  changes,
  filterData,
  mapFilter,
  bossFilter,
  searchQuery,
  onMapFilterChange,
  onBossFilterChange,
  onSearchQueryChange,
  onClearFilters,
  onExport,
  onChangesUpdate,
  isRefreshing,
  changesLoaded,
  autoRefreshEnabled,
  canMarkAllRead,
  errorText,
  notificationsEnabled,
  notificationsSupported,
  onMarkAllRead,
  onResetSettings,
  onTestNotification,
  onToggleAutoRefresh,
  onToggleNotifications,
  onToggleSound,
  soundEnabled,
  unreadCount,
}: ChangesWorkspaceProps) {
  const [changeFilters, setChangeFilters] = useState<ChangeFilters>(defaultChangeFilters);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  const updateChangeFilter = <K extends keyof ChangeFilters>(key: K, value: ChangeFilters[K]) => {
    setChangeFilters((current) => ({ ...current, [key]: value }));
  };

  const maps = useMemo(
    () => Array.from(new Set(filterData?.map((map) => map.name) ?? [])).sort(),
    [filterData]
  );
  const bosses = useMemo(
    () => Array.from(new Set(filterData?.flatMap((map) => map.bosses.map((boss) => getCanonicalBossName(boss.boss.name, boss.spawnChance))) ?? [])).sort(),
    [filterData]
  );
  const changeTypes = useMemo(
    () => Array.from(new Set(changes.map((change) => change.field))).sort(),
    [changes]
  );
  const dateCounts = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return {
      all: changes.length,
      last24h: changes.filter((change) => now - change.timestamp <= day).length,
      last7d: changes.filter((change) => now - change.timestamp <= 7 * day).length,
      last30d: changes.filter((change) => now - change.timestamp <= 30 * day).length,
    };
  }, [changes]);

  const activeFilterCount = [
    mapFilter,
    bossFilter,
    searchQuery,
    changeFilters.dateRange !== "all" ? changeFilters.dateRange : "",
    changeFilters.modeFilter,
    changeFilters.changeTypeFilter,
  ].filter(Boolean).length;
  const filterSelectClass = "w-full rounded-md border border-white/[0.09] bg-[#0b0b0c] px-3 py-2.5 text-sm text-gray-300 outline-none transition-colors hover:border-white/[0.16] focus:border-blue-500/70";
  const activeClass = "border-blue-500/60 bg-blue-500/10 text-blue-50 hover:border-blue-400/80 [color-scheme:dark] [&_option]:bg-[#101011] [&_option]:text-gray-200";
  const dateLabels: Record<string, string> = { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days" };
  const activeFilters = [
    searchQuery && { key: "search", label: "Search", value: `"${searchQuery}"`, clear: () => onSearchQueryChange("") },
    mapFilter && { key: "map", label: "Map", value: mapFilter, clear: () => onMapFilterChange("") },
    bossFilter && { key: "boss", label: "Boss", value: bossFilter, clear: () => onBossFilterChange("") },
    changeFilters.dateRange !== "all" && { key: "date", label: "Date", value: dateLabels[changeFilters.dateRange] ?? changeFilters.dateRange, clear: () => updateChangeFilter("dateRange", "all") },
    changeFilters.modeFilter && { key: "mode", label: "Mode", value: changeFilters.modeFilter, clear: () => updateChangeFilter("modeFilter", "") },
    changeFilters.changeTypeFilter && { key: "type", label: "Type", value: changeFilters.changeTypeFilter, clear: () => updateChangeFilter("changeTypeFilter", "") },
  ].filter((filter): filter is { key: string; label: string; value: string; clear: () => void } => Boolean(filter));
  const clearAllFilters = () => {
    onClearFilters();
    setChangeFilters(defaultChangeFilters);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/[0.09] bg-[#0a0a0b] p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-3 lg:flex-row lg:items-center lg:justify-between">
            <NavBar
              items={[
                { name: "Season", url: "/season", icon: CalendarDays },
                { name: "PVP", url: "/pvp", icon: Swords },
                { name: "PVE", url: "/pve", icon: Crosshair },
                { name: "Compare", url: "/compare", icon: Scale },
                { name: "Changes", url: "/changes", icon: History, badgeCount: unreadCount },
              ]}
              className="justify-start"
            />
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <ChangeMonitorHealth />
              <CacheStatus
                onExpired={() => void onChangesUpdate()}
                onManualRefresh={() => onChangesUpdate({ force: true })}
                isRefreshing={isRefreshing}
                disabled={!changesLoaded}
              />
              <div ref={notificationRef} className="relative">
                <button type="button" aria-label="Notification settings" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-gray-400 transition-colors", notificationsOpen ? "border-blue-500/50 bg-blue-500/10 text-blue-200" : "border-white/[0.09] bg-[#0b0b0c] hover:border-white/[0.18] hover:text-white")}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#0a0a0b]" />}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-[min(92vw,390px)] rounded-lg border border-white/[0.12] bg-[#101011] p-2 shadow-2xl">
                    <div className="mb-1 flex items-center justify-between px-2 py-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Notifications</span>
                      <button type="button" aria-label="Close notification settings" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1 text-gray-500 hover:bg-white/[0.06] hover:text-gray-200"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <ChangeNotificationControls
                      autoRefreshEnabled={autoRefreshEnabled}
                      canMarkAllRead={canMarkAllRead}
                      errorText={errorText}
                      notificationsEnabled={notificationsEnabled}
                      notificationsSupported={notificationsSupported}
                      onMarkAllRead={onMarkAllRead}
                      onResetSettings={onResetSettings}
                      onTestNotification={onTestNotification}
                      onToggleAutoRefresh={onToggleAutoRefresh}
                      onToggleNotifications={onToggleNotifications}
                      onToggleSound={onToggleSound}
                      soundEnabled={soundEnabled}
                      unreadCount={unreadCount}
                      className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-black/15 p-2"
                    />
                  </div>
                )}
              </div>
              <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto]">
            <label className="relative"><Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", searchQuery ? "text-blue-300" : "text-gray-600")} /><input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search changes..." className={cn("w-full rounded-md border py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-gray-600 focus:border-blue-500/70", searchQuery ? activeClass : "border-white/[0.09] bg-[#0b0b0c] text-gray-300")} />{searchQuery && <ClearButton label="Clear search" onClick={() => onSearchQueryChange("")} />}</label>
            <label className="relative"><Map className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", mapFilter ? "text-blue-300" : "text-gray-500")} /><select value={mapFilter} onChange={(event) => onMapFilterChange(event.target.value)} aria-label="Map" className={cn(filterSelectClass, "pl-9", mapFilter && cn(activeClass, "pr-14"))}><option value="">All Maps</option>{maps.map((map) => <option key={map} value={map}>{map}</option>)}</select>{mapFilter && <ClearButton label="Clear map filter" onClick={() => onMapFilterChange("")} offset />}</label>
            <label className="relative"><User className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", bossFilter ? "text-blue-300" : "text-gray-500")} /><select value={bossFilter} onChange={(event) => onBossFilterChange(event.target.value)} aria-label="Boss" className={cn(filterSelectClass, "pl-9", bossFilter && cn(activeClass, "pr-14"))}><option value="">All Bosses</option>{bosses.map((boss) => <option key={boss} value={boss}>{boss}</option>)}</select>{bossFilter && <ClearButton label="Clear boss filter" onClick={() => onBossFilterChange("")} offset />}</label>
            <button type="button" onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen} className={cn("inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors", advancedOpen || activeFilterCount > 0 ? "border-blue-500/40 bg-blue-500/10 text-blue-100" : "border-white/[0.09] bg-[#0b0b0c] text-gray-300 hover:border-white/[0.18] hover:text-white")}><SlidersHorizontal className="h-4 w-4" /><span>Filters</span>{activeFilterCount > 0 && <span className="rounded-full bg-blue-400 px-1.5 text-[11px] font-bold text-gray-950">{activeFilterCount}</span>}<ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} /></button>
          </div>

          {advancedOpen && <div className="grid gap-2 border-t border-white/[0.07] pt-3 md:grid-cols-4">
            <select value={changeFilters.dateRange} onChange={(event) => updateChangeFilter("dateRange", event.target.value as ChangeDateRange)} aria-label="Date range" className={cn(filterSelectClass, changeFilters.dateRange !== "all" && activeClass)}><option value="all">All Time ({dateCounts.all})</option><option value="24h">Last 24 Hours ({dateCounts.last24h})</option><option value="7d">Last 7 Days ({dateCounts.last7d})</option><option value="30d">Last 30 Days ({dateCounts.last30d})</option></select>
            <select value={changeFilters.modeFilter} onChange={(event) => updateChangeFilter("modeFilter", event.target.value)} aria-label="Game mode" className={cn(filterSelectClass, changeFilters.modeFilter && activeClass)}><option value="">All Modes</option><option value="PvP">PvP</option><option value="PvE">PvE</option><option value="Season">Season</option></select>
            <select value={changeFilters.changeTypeFilter} onChange={(event) => updateChangeFilter("changeTypeFilter", event.target.value)} aria-label="Change type" className={cn(filterSelectClass, changeFilters.changeTypeFilter && activeClass)}><option value="">All Change Types</option>{changeTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <select value={changeFilters.groupBy} onChange={(event) => updateChangeFilter("groupBy", event.target.value as ChangeGroupBy)} aria-label="Grouping" className={filterSelectClass}><option value="none">No Grouping</option><option value="day">Group by Day</option><option value="week">Group by Week</option></select>
          </div>}

          {activeFilters.length > 0 && <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Active filters">
            <span className="text-gray-500">Filtering by</span>
            {activeFilters.map((filter) => <button type="button" key={filter.key} onClick={filter.clear} aria-label={`Remove ${filter.label} filter`} className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 py-1 pl-2.5 pr-1.5 text-blue-100 transition-colors hover:border-blue-400/60 hover:bg-blue-500/20"><span className="text-blue-300/70">{filter.label}:</span><span className="font-medium">{filter.value}</span><X className="h-3.5 w-3.5 text-blue-300" /></button>)}
            {activeFilters.length > 1 && <button type="button" onClick={clearAllFilters} className="rounded-full px-2 py-1 text-gray-400 underline-offset-2 hover:text-white hover:underline">Clear all</button>}
          </div>}
        </div>
      </section>
      {renderContent(changeFilters)}
    </div>
  );
}
