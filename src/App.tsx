import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
} from "react-router-dom";
import { SpawnData, fetchAllSpawnData } from "./lib/api";
import { DataTable } from "@/components/DataTable";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { CacheStatus } from "@/components/CacheStatus";
import { DataChange } from "@/lib/diff";
import { ChangesTable } from "@/components/ChangesTable";
import { exportChanges, getStoredChanges } from "@/lib/changes";
import { VersionLabel } from "@/components/VersionLabel";
import { NavBar } from "@/components/ui/navbar";
import { Swords, Crosshair, Scale, History } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { PatchToast } from "@/components/patch-toast";
import type { DataMode } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// == Weekly Boss Configuration ==
const CURRENT_BOSS_NAME = "Shturman";
const CURRENT_BOSS_START_DATE = "2025-05-24T10:10:00+01:00"; // BST
const CURRENT_BOSS_DURATION_SECONDS = 7 * 24 * 60 * 60; // 1 week
// =============================

function MainApp() {
  const [regularData, setRegularData] = useState<SpawnData[] | null>(null);
  const [pveData, setPveData] = useState<SpawnData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState<DataChange[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") ?? "regular";
  const mapFilter = searchParams.get("map") ?? "";
  const bossFilter = searchParams.get("boss") ?? "";
  const searchQuery = searchParams.get("search") ?? "";
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    setSearchParams(params);
  };
  const setMapFilter = (v: string) => updateParam("map", v);
  const setBossFilter = (v: string) => updateParam("boss", v);
  const setSearchQuery = (v: string) => updateParam("search", v);

  const loadData = useCallback(
    async (
      gameMode: "regular" | "pve" | "both" = "both",
      options?: { forceRefresh?: boolean }
    ) => {
      setLoading(true);
      try {
        const { regular, pve } = await fetchAllSpawnData({
          forceRefresh: options?.forceRefresh,
        });

        if (gameMode === "regular" || gameMode === "both") {
          setRegularData(regular);
        }
        if (gameMode === "pve" || gameMode === "both") {
          setPveData(pve);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial data load - fetch fresh data immediately
  useEffect(() => {
    loadData("both");

    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      if (!loading) {
        loadData("both");
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  // Process data when mode changes
  useEffect(() => {
    async function processData() {
      if (mode === "regular" && regularData) {
        const regular = regularData;
        let foundBossUrl: string | undefined = undefined;
        let foundMapName: string | undefined = undefined;

        for (const map of regular) {
          if (map.bosses) {
            for (const bossEncounter of map.bosses) {
              if (bossEncounter.boss.name === CURRENT_BOSS_NAME) {
                foundBossUrl =
                  bossEncounter.boss.imagePortraitLink ?? undefined;
                foundMapName = map.name;
                break;
              }
            }
          }
          if (foundBossUrl && foundMapName) break;
        }
      } else if (mode === "pve" && pveData) {
        const pve = pveData;
        let foundBossUrl: string | undefined = undefined;
        let foundMapName: string | undefined = undefined;

        for (const map of pve) {
          if (map.bosses) {
            for (const bossEncounter of map.bosses) {
              if (bossEncounter.boss.name === CURRENT_BOSS_NAME) {
                foundBossUrl =
                  bossEncounter.boss.imagePortraitLink ?? undefined;
                foundMapName = map.name;
                break;
              }
            }
          }
          if (foundBossUrl && foundMapName) break;
        }
      }
    }
    processData();
  }, [regularData, pveData, mode]);

  // Check cache and refresh data when needed
  useEffect(() => {
    const checkCacheAndRefresh = () => {
      if (loading) return; // Prevent multiple simultaneous requests

      const combinedCache = localStorage.getItem("maps_combined");
      if (!combinedCache) {
        loadData("both");
        return;
      }

      try {
        const { timestamp } = JSON.parse(combinedCache);
        const now = Date.now();

        if (now - timestamp >= CACHE_EXPIRY_TIME) {
          loadData("both");
        }
      } catch (error) {
        console.error("Error checking cache:", error);
        loadData("both");
      }
    };

    // Check when component mounts
    checkCacheAndRefresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Add small delay to prevent race conditions with other triggers
        setTimeout(checkCacheAndRefresh, 100);
      }
    };

    // Set up timer to check every minute
    const interval = setInterval(checkCacheAndRefresh, 60000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadData, loading]);

  // Single effect for loading changes data when mode switches to changes
  useEffect(() => {
    if (mode === "changes") {
      setLoading(true);
      getStoredChanges()
        .then((changesData) => {
          setChanges(changesData);
        })
        .catch((error) => {
          console.error("Failed to fetch changes:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [mode]);

  const handleChangesUpdate = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStoredChanges();
      setChanges(data);
    } catch (error) {
      console.error("Failed to update changes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = () => {
    if (mode === "changes") {
      exportChanges();
      return;
    }

    const data = mode === "regular" ? regularData : pveData;
    if (!data) return;

    const csvContent = [
      ["Map", "Boss", "Spawn Chance", "Location", "Location Chance"].join(","),
      ...data.flatMap((map: SpawnData) =>
        map.bosses.flatMap((boss) =>
          boss.spawnLocations.map((location) =>
            [
              map.name,
              boss.boss.name === "infected" && boss.spawnChance < 1
                ? "Infected(Tagilla)"
                : boss.boss.name === "infected"
                ? "Infected(Zombie)"
                : boss.boss.name,
              `${Math.round(boss.spawnChance * 100)}%`,
              location.name,
              `${Math.round(location.chance * 100)}%`,
            ].join(",")
          )
        )
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tarkov_spawns_${mode === "regular" ? "pvp" : mode}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <div className="container mx-auto px-4 py-4 flex flex-col gap-4 pb-10">
        <Header
          bossName={CURRENT_BOSS_NAME}
          bossStartDate={new Date(CURRENT_BOSS_START_DATE)}
          bossDurationSeconds={CURRENT_BOSS_DURATION_SECONDS}
        />

        <div className="flex justify-center">
          <CacheStatus
            onExpired={() => loadData("both", { forceRefresh: true })}
          />
        </div>

        <NavBar
          items={[
            { name: "PVP", url: "/?mode=regular", icon: Swords },
            { name: "PVE", url: "/?mode=pve", icon: Crosshair },
            { name: "Compare", url: "/?mode=compare", icon: Scale },
            { name: "Changes", url: "/?mode=changes", icon: History },
          ]}
        />
        <Alert
          variant="default"
          className="w-full max-w-3xl mx-auto bg-gradient-to-r from-yellow-400/70 to-orange-500/70 border border-yellow-500/30 rounded-md px-2.5 py-1.5 flex items-center justify-center shadow-sm text-xs text-orange-950 tracking-wide"
        >
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-green-700 text-xs">✅</span>
              <AlertTitle className="font-bold text-xs m-0 p-0">
                Completed
              </AlertTitle>
              <span className="ml-auto text-xs text-orange-900">
                📅 <span className="italic">May 14, 2025</span>
              </span>
            </div>
            <AlertDescription className="text-xs mt-0.5">
              Removed silent walking for <b>BirdEye</b>, <b>Shturman</b>,{" "}
              <b>Partizan</b>, and <b>Cultists</b>. They should now walk about{" "}
              <b>20–35% quieter</b> than the rest.
            </AlertDescription>
            <div className="text-xs text-right italic text-orange-900 text-[10px] mt-0.5">
              — YOWA, Lead of Game Design, Battlestate Games
            </div>
          </div>
        </Alert>

        <div className="p-2 rounded-lg bg-black/30">
          <FilterBar
            mapFilter={mapFilter}
            bossFilter={bossFilter}
            searchQuery={searchQuery}
            onMapFilterChange={setMapFilter}
            onBossFilterChange={setBossFilter}
            onSearchQueryChange={setSearchQuery}
            onExport={handleExport}
            data={mode === "regular" ? regularData : pveData}
          />
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center items-center h-[200px]">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : mode === "changes" ? (
            <ChangesTable
              changes={changes}
              filters={{
                map: mapFilter,
                boss: bossFilter,
                search: searchQuery,
              }}
              onChangesUpdate={handleChangesUpdate}
            />
          ) : (
            <DataTable
              data={
                mode === "compare"
                  ? { regular: regularData || [], pve: pveData || [] }
                  : mode === "regular"
                  ? regularData
                  : pveData
              }
              mode={mode as DataMode}
              filters={{
                map: mapFilter,
                boss: bossFilter,
                search: searchQuery,
              }}
            />
          )}
        </div>
      </div>
      <VersionLabel />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        {/* <NavBar items={navItems} className="pt-4" /> */}
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="*" element={<MainApp />} />
          </Routes>
        </main>
        <PatchToast />
        <Toaster />
        <VersionLabel />
      </div>
    </BrowserRouter>
  );
}

export default App;
