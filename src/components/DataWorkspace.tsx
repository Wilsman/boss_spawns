import { useEffect, useRef, useState } from "react";
import { Bell, FileDown, Map, Search, User, X } from "lucide-react";
import type { ReactNode } from "react";
import type { SpawnData } from "@/types";
import { getCanonicalBossName } from "@/lib/boss-aliases";
import { NavBar } from "@/components/ui/navbar";
import { CacheStatus } from "@/components/CacheStatus";
import { ChangeNotificationControls } from "@/components/ChangeNotificationControls";
import { Crosshair, History, Scale, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataWorkspaceProps {
  children: ReactNode;
  filterData: SpawnData[] | null;
  mapFilter: string;
  bossFilter: string;
  searchQuery: string;
  onMapFilterChange: (value: string) => void;
  onBossFilterChange: (value: string) => void;
  onSearchQueryChange: (value: string) => void;
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

  const selectClass = "w-full rounded-lg border border-white/[0.08] bg-gray-900/80 px-3 py-2.5 text-sm text-gray-200 outline-none transition-colors hover:border-violet-400/40 focus:border-violet-400/70";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/[0.08] bg-[#0c1117]/80 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.16)] sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-3 lg:flex-row lg:items-center lg:justify-between">
            <NavBar items={[{ name: "PVP", url: "/pvp", icon: Swords }, { name: "PVE", url: "/pve", icon: Crosshair }, { name: "Compare", url: "/compare", icon: Scale }, { name: "Changes", url: "/changes", icon: History, badgeCount: unreadCount }]} className="justify-start" />
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <CacheStatus onExpired={onRefresh} onManualRefresh={onRefresh} isRefreshing={isRefreshing} disabled={disabled} />
              <div ref={notificationRef} className="relative">
                <button type="button" aria-label="Notification settings" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className={cn("relative inline-flex h-9 w-9 items-center justify-center rounded-lg border text-gray-300 transition-colors", notificationsOpen ? "border-violet-400/50 bg-violet-400/15 text-violet-200" : "border-white/[0.08] bg-gray-900/70 hover:border-violet-400/40 hover:text-white")}>
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300 ring-2 ring-[#0c1117]" />}
                </button>
                {notificationsOpen && <div className="absolute right-0 top-11 z-50 w-[min(92vw,390px)] rounded-xl border border-white/[0.1] bg-[#111722] p-2 shadow-2xl">
                  <div className="mb-1 flex items-center justify-between px-2 py-1"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Notifications</span><button type="button" aria-label="Close notification settings" onClick={() => setNotificationsOpen(false)} className="rounded-md p-1 text-gray-500 hover:bg-white/[0.06] hover:text-gray-200"><X className="h-3.5 w-3.5" /></button></div>
                  <ChangeNotificationControls autoRefreshEnabled={autoRefreshEnabled} canMarkAllRead={canMarkAllRead} errorText={errorText} notificationsEnabled={notificationsEnabled} notificationsSupported={notificationsSupported} onMarkAllRead={onMarkAllRead} onResetSettings={onResetSettings} onTestNotification={onTestNotification} onToggleAutoRefresh={onToggleAutoRefresh} onToggleNotifications={onToggleNotifications} onToggleSound={onToggleSound} soundEnabled={soundEnabled} unreadCount={unreadCount} className="flex flex-col gap-2 rounded-lg border border-white/[0.06] bg-black/15 p-2" />
                </div>}
              </div>
              <button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Export</span></button>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)]">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><input value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="Search..." className="w-full rounded-lg border border-white/[0.08] bg-gray-900/80 py-2.5 pl-9 pr-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-violet-400/70" /></label>
            <label className="relative"><Map className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><select value={mapFilter} onChange={(event) => onMapFilterChange(event.target.value)} aria-label="Map" className={cn(selectClass, "pl-9")}><option value="">All Maps</option>{maps.map((map) => <option key={map} value={map}>{map}</option>)}</select></label>
            <label className="relative"><User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" /><select value={bossFilter} onChange={(event) => onBossFilterChange(event.target.value)} aria-label="Boss" className={cn(selectClass, "pl-9")}><option value="">All Bosses</option>{bosses.map((boss) => <option key={boss} value={boss}>{boss}</option>)}</select></label>
          </div>
        </div>
      </section>
      {children}
    </div>
  );
}
