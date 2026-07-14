import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  FileDown,
  Filter,
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
import { ChangeNotificationControls } from "@/components/ChangeNotificationControls";
import type {
  ChangeDateRange,
  ChangeFilters,
  ChangeGroupBy,
} from "@/components/ChangesTable";
import { cn } from "@/lib/utils";
import { Crosshair, History, Scale, Swords } from "lucide-react";

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
  const filterSelectClass = "w-full rounded-lg border border-white/[0.08] bg-gray-900/80 px-3 py-2.5 text-sm text-gray-200 outline-none transition-colors hover:border-violet-400/40 focus:border-violet-400/70";
  const clearAllFilters = () => {
    onClearFilters();
    setChangeFilters(defaultChangeFilters);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/[0.08] bg-[#0c1117]/80 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-3 lg:flex-row lg:items-center lg:justify-between">
            <NavBar
              items={[
                { name: "PVP", url: "/pvp", icon: Swords },
                { name: "PVE", url: "/pve", icon: Crosshair },
                { name: "Compare", url: "/compare", icon: Scale },
                { name: "Changes", url: "/changes", icon: History, badgeCount: unreadCount },
              ]}
              className="justify-start"
            />
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <CacheStatus
                onExpired={() => void onChangesUpdate()}
                onManualRefresh={() => onChangesUpdate({ force: true })}
                isRefreshing={isRefreshing}
                disabled={!changesLoaded}
              />
              <div ref={notificationRef} className="relative">
                <button type="button" aria-label="Notification settings" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-lg border text-gray-300 transition-colors", notificationsOpen ? "border-violet-400/50 bg-violet-400/15 text-violet-200" : "border-white/[0.08] bg-gray-900/70 hover:border-violet-400/40 hover:text-white")}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-[#0c1117]" />}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-[min(92vw,390px)] rounded-xl border border-white/[0.1] bg-[#111722] p-2 shadow-2xl">
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
              <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto]">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search changes..." className="w-full rounded-lg border border-white/[0.08] bg-gray-900/80 py-2.5 pl-9 pr-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-violet-400/70" /></label>
            <label className="relative"><Map className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><select value={mapFilter} onChange={(event) => onMapFilterChange(event.target.value)} aria-label="Map" className={cn(filterSelectClass, "pl-9")}><option value="">All Maps</option>{maps.map((map) => <option key={map} value={map}>{map}</option>)}</select></label>
            <label className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><select value={bossFilter} onChange={(event) => onBossFilterChange(event.target.value)} aria-label="Boss" className={cn(filterSelectClass, "pl-9")}><option value="">All Bosses</option>{bosses.map((boss) => <option key={boss} value={boss}>{boss}</option>)}</select></label>
            <button type="button" onClick={() => setAdvancedOpen((open) => !open)} aria-expanded={advancedOpen} className={cn("inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors", advancedOpen || activeFilterCount > 0 ? "border-violet-400/40 bg-violet-400/10 text-violet-100" : "border-white/[0.08] bg-gray-900/80 text-gray-300 hover:border-violet-400/40 hover:text-white")}><SlidersHorizontal className="h-4 w-4" /><span>Filters</span>{activeFilterCount > 0 && <span className="rounded-full bg-violet-300 px-1.5 text-[11px] font-bold text-gray-950">{activeFilterCount}</span>}<ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} /></button>
          </div>

          {advancedOpen && <div className="grid gap-2 border-t border-white/[0.07] pt-3 md:grid-cols-4">
            <select value={changeFilters.dateRange} onChange={(event) => updateChangeFilter("dateRange", event.target.value as ChangeDateRange)} aria-label="Date range" className={filterSelectClass}><option value="all">All Time ({dateCounts.all})</option><option value="24h">Last 24 Hours ({dateCounts.last24h})</option><option value="7d">Last 7 Days ({dateCounts.last7d})</option><option value="30d">Last 30 Days ({dateCounts.last30d})</option></select>
            <select value={changeFilters.modeFilter} onChange={(event) => updateChangeFilter("modeFilter", event.target.value)} aria-label="Game mode" className={filterSelectClass}><option value="">All Modes</option><option value="PvP">PvP</option><option value="PvE">PvE</option></select>
            <select value={changeFilters.changeTypeFilter} onChange={(event) => updateChangeFilter("changeTypeFilter", event.target.value)} aria-label="Change type" className={filterSelectClass}><option value="">All Change Types</option>{changeTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <select value={changeFilters.groupBy} onChange={(event) => updateChangeFilter("groupBy", event.target.value as ChangeGroupBy)} aria-label="Grouping" className={filterSelectClass}><option value="none">No Grouping</option><option value="day">Group by Day</option><option value="week">Group by Week</option></select>
          </div>}

          {activeFilterCount > 0 && <div className="flex items-center justify-between border-t border-white/[0.07] pt-2 text-xs text-gray-500"><span><Filter className="mr-1 inline h-3.5 w-3.5" />Filters are active</span><button type="button" onClick={clearAllFilters} className="font-semibold text-violet-300 hover:text-violet-200">Clear all</button></div>}
        </div>
      </section>
      {renderContent(changeFilters)}
    </div>
  );
}
