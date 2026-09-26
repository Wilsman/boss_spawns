import { useEffect, useRef, useState } from "react";
import { Bell, FileDown, Map, Search, User, X } from "lucide-react";
import type { ReactNode } from "react";
import type { SpawnData } from "@/types";
import { getCanonicalBossName } from "@/lib/boss-aliases";
import { NavBar } from "@/components/ui/navbar";
import { CacheStatus } from "@/components/CacheStatus";
import { ChangeNotificationControls } from "@/components/ChangeNotificationControls";
import { CalendarDays, Crosshair, History, Scale, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useSearchParams } from "react-router-dom";
import { List } from "lucide-react";

interface DataWorkspaceProps {
  children: ReactNode;
  filterData: SpawnData[] | null;
  mapFilter: string;
  bossFilter: string;
  searchQuery: string;
  onMapFilterChange: (value: string) => void;
  onBossFilterChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  disabled: boolean;
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

export function DataWorkspace({
  children,
  filterData,
  mapFilter,
  bossFilter,
  searchQuery,
  onMapFilterChange,
  onBossFilterChange,
  onSearchQueryChange,
  onClearFilters,
  onExport,
  onRefresh,
  isRefreshing,
  disabled,
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
}: DataWorkspaceProps) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const canShowMap = location.pathname !== "/compare";
  const mapView = canShowMap && params.get("view") === "map";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const maps = Array.from(new Set(filterData?.map((map) => map.name) ?? [])).sort();
  const bosses = Array.from(new Set(filterData?.flatMap((map) => map.bosses.map((boss) => getCanonicalBossName(boss.boss.name, boss.spawnChance))) ?? [])).sort();

  useEffect(() => {
    if (!notificationsOpen) return;
    const closeOnPointerDown = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  const activeClass = "border-blue-500/60 bg-blue-500/10 text-blue-50 hover:border-blue-400/80 [color-scheme:dark] [&_option]:bg-[#101011] [&_option]:text-gray-200";
  const activeFilters = [
    searchQuery && { key: "search", label: "Search", value: `"${searchQuery}"`, clear: () => onSearchQueryChange("") },
    mapFilter && { key: "map", label: "Map", value: mapFilter, clear: () => onMapFilterChange("") },
    bossFilter && { key: "boss", label: "Boss", value: bossFilter, clear: () => onBossFilterChange("") },
  ].filter((filter): filter is { key: string; label: string; value: string; clear: () => void } => Boolean(filter));
  const selectClass = "w-full rounded-md border border-white/[0.09] bg-[#0b0b0c] px-3 py-2.5 text-sm text-gray-300 outline-none transition-colors hover:border-white/[0.16] focus:border-blue-500/70";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/[0.09] bg-[#0a0a0b] p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-3 lg:flex-row lg:items-center lg:justify-between">
            <NavBar items={[{ name: "Season", url: "/season", icon: CalendarDays }, { name: "PVP", url: "/pvp", icon: Swords }, { name: "PVE", url: "/pve", icon: Crosshair }, { name: "Compare", url: "/compare", icon: Scale }, { name: "Changes", url: "/changes", icon: History, badgeCount: unreadCount }]} className="justify-start" />
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <CacheStatus onExpired={onRefresh} onManualRefresh={onRefresh} isRefreshing={isRefreshing} disabled={disabled} />
              <div ref={notificationRef} className="relative">
                <button type="button" aria-label="Notification settings" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-md border text-gray-400 transition-colors", notificationsOpen ? "border-blue-500/50 bg-blue-500/10 text-blue-200" : "border-white/[0.09] bg-[#0b0b0c] hover:border-white/[0.18] hover:text-white")}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-[#0a0a0b]" />}
                </button>
                {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-[min(92vw,390px)] rounded-lg border border-white/[0.12] bg-[#101011] p-2 shadow-2xl">
                  <div className="mb-1 flex items-center justify-between px-2 py-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Notifications</span><button type="button" aria-label="Close notification settings" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1 text-gray-500 hover:bg-white/[0.06] hover:text-gray-200"><X className="h-3.5 w-3.5" /></button></div>
                  <ChangeNotificationControls autoRefreshEnabled={autoRefreshEnabled} canMarkAllRead={canMarkAllRead} errorText={errorText} notificationsEnabled={notificationsEnabled} notificationsSupported={notificationsSupported} onMarkAllRead={onMarkAllRead} onResetSettings={onResetSettings} onTestNotification={onTestNotification} onToggleAutoRefresh={onToggleAutoRefresh} onToggleNotifications={onToggleNotifications} onToggleSound={onToggleSound} soundEnabled={soundEnabled} unreadCount={unreadCount} className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-black/15 p-2" />
                </div>}
              </div>
              <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button>
            </div>
          </div>
          <div className={`grid gap-2 ${canShowMap ? "md:grid-cols-[minmax(0,1.4fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_auto]" : "md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]"}`}>
            <label className="relative"><Search className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", searchQuery ? "text-blue-300" : "text-gray-600")} /><input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search..." className={cn("w-full rounded-md border py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-gray-600 focus:border-blue-500/70", searchQuery ? activeClass : "border-white/[0.09] bg-[#0b0b0c] text-gray-300")} />{searchQuery && <ClearButton label="Clear search" onClick={() => onSearchQueryChange("")} />}</label>
            <label className="relative"><Map className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", mapFilter ? "text-blue-300" : "text-gray-500")} /><select value={mapFilter} onChange={(event) => onMapFilterChange(event.target.value)} aria-label="Map" className={cn(selectClass, "pl-9", mapFilter && cn(activeClass, "pr-14"))}><option value="">All Maps</option>{maps.map((map) => <option key={map} value={map}>{map}</option>)}</select>{mapFilter && <ClearButton label="Clear map filter" onClick={() => onMapFilterChange("")} offset />}</label>
            <label className="relative"><User className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", bossFilter ? "text-blue-300" : "text-gray-500")} /><select value={bossFilter} onChange={(event) => onBossFilterChange(event.target.value)} aria-label="Boss" className={cn(selectClass, "pl-9", bossFilter && cn(activeClass, "pr-14"))}><option value="">All Bosses</option>{bosses.map((boss) => <option key={boss} value={boss}>{boss}</option>)}</select>{bossFilter && <ClearButton label="Clear boss filter" onClick={() => onBossFilterChange("")} offset />}</label>
            {canShowMap && <div className="flex w-fit items-center gap-1 rounded-md border border-white/[0.09] bg-[#0b0b0c] p-1" role="group" aria-label="Results view">
              {([false, true] as const).map((isMap) => <button type="button" key={String(isMap)} aria-pressed={mapView === isMap} onClick={() => { const next = new URLSearchParams(params); if (isMap) next.set("view", "map"); else next.delete("view"); setParams(next); }} className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${mapView === isMap ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/25" : "text-gray-500 hover:text-white"}`}>{isMap ? <Map size={14} /> : <List size={14} />}{isMap ? "Map" : "Table"}</button>)}
            </div>}
          </div>
          {activeFilters.length > 0 && <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Active filters">
            <span className="text-gray-500">Filtering by</span>
            {activeFilters.map((filter) => <button type="button" key={filter.key} onClick={filter.clear} aria-label={`Remove ${filter.label} filter`} className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 py-1 pl-2.5 pr-1.5 text-blue-100 transition-colors hover:border-blue-400/60 hover:bg-blue-500/20"><span className="text-blue-300/70">{filter.label}:</span><span className="font-medium">{filter.value}</span><X className="h-3.5 w-3.5 text-blue-300" /></button>)}
            {activeFilters.length > 1 && <button type="button" onClick={onClearFilters} className="rounded-full px-2 py-1 text-gray-400 underline-offset-2 hover:text-white hover:underline">Clear all</button>}
          </div>}
        </div>
      </section>
      {children}
    </div>
  );
}

export function ClearButton({ label, onClick, offset = false }: { label: string; onClick: () => void; offset?: boolean }) {
  return <button type="button" aria-label={label} title={label} onClick={(event) => { event.preventDefault(); onClick(); }} className={cn("absolute top-1/2 -translate-y-1/2 rounded p-1 text-blue-300 transition-colors hover:bg-blue-500/20 hover:text-white", offset ? "right-7" : "right-2")}><X className="h-3.5 w-3.5" /></button>;
}
