import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/DataTable";
import { DataMode, SpawnData } from "@/types";
import { fetchSpawnData } from "@/lib/api";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { ModeToggle } from "@/components/ModeToggle";
import { CacheStatus } from "@/components/CacheStatus";
import { diffData, DataChange } from "@/lib/diff";
import { ChangesTable } from "@/components/ChangesTable";
import { saveChanges, getStoredChanges } from "@/lib/changes";

const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function App() {
  const [mode, setMode] = useState<DataMode>("regular");
  const [regularData, setRegularData] = useState<SpawnData[] | null>(null);
  const [pveData, setPveData] = useState<SpawnData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapFilter, setMapFilter] = useState("");
  const [bossFilter, setBossFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [changes, setChanges] = useState<DataChange[]>([]);

  const loadData = useCallback(
    async (gameMode?: "regular" | "pve" | "both") => {
      setLoading(true);
      try {
        if (gameMode === "regular" || gameMode === "both") {
          const regular = await fetchSpawnData("regular");
          setRegularData(regular);
          localStorage.setItem("maps_regular_timestamp", Date.now().toString());
        }
        if (gameMode === "pve" || gameMode === "both") {
          const pve = await fetchSpawnData("pve");
          setPveData(pve);
          localStorage.setItem("maps_pve_timestamp", Date.now().toString());
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial data load
  useEffect(() => {
    loadData("both");
  }, [loadData]);

  // Check cache and refresh data when needed
  useEffect(() => {
    const checkCacheAndRefresh = () => {
      const regularTimestamp = parseInt(
        localStorage.getItem("maps_regular_timestamp") || "0"
      );
      const pveTimestamp = parseInt(
        localStorage.getItem("maps_pve_timestamp") || "0"
      );
      const now = Date.now();

      if (now - regularTimestamp >= CACHE_EXPIRY_TIME) {
        loadData("regular");
      }
      if (now - pveTimestamp >= CACHE_EXPIRY_TIME) {
        loadData("pve");
      }
    };

    // Check when component mounts and when window regains focus
    checkCacheAndRefresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkCacheAndRefresh();
      }
    };

    // Set up timer to check every minute
    const interval = setInterval(checkCacheAndRefresh, 60000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadData]);

  useEffect(() => {
    if (mode === "changes") {
      setChanges(getStoredChanges())
    }
  }, [mode])

  useEffect(() => {
    if (mode === "changes" && regularData && pveData) {
      const regularPrevious = JSON.parse(
        localStorage.getItem("maps_regular_previous") || "{}"
      )?.data?.maps || [];
      
      const pvePrevious = JSON.parse(
        localStorage.getItem("maps_pve_previous") || "{}"
      )?.data?.maps || [];

      const regularChanges = diffData(regularPrevious, regularData, "PvP");
      const pveChanges = diffData(pvePrevious, pveData, "PvE");
      
      // Save new changes to persistent storage
      if (regularChanges.length > 0 || pveChanges.length > 0) {
        const newChanges = [...regularChanges, ...pveChanges]
        saveChanges(newChanges)
        setChanges(getStoredChanges())
      }
    }
  }, [mode, regularData, pveData]);

  const handleExport = () => {
    const data = mode === "regular" ? regularData : pveData;
    if (!data) return;

    const csvContent = [
      ["Map", "Boss", "Spawn Chance", "Location", "Location Chance"].join(","),
      ...data.flatMap((map: SpawnData) =>
        map.bosses.flatMap((boss) =>
          boss.spawnLocations.map((location) =>
            [
              map.normalizedName,
              boss.boss.normalizedName,
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

  const handleChangesUpdate = useCallback(() => {
    setChanges(getStoredChanges())
  }, [])

  return (
    <div className="min-h-screen text-gray-100 bg-gray-900">
      <div className="px-2 py-4 mx-auto max-w-7xl sm:px-4 sm:py-8">
        <Header />

        <div className="mb-4 space-y-4 sm:space-y-6 sm:mb-8">
          <div className="flex flex-row justify-center gap-2 sm:gap-4">
            <div className="px-2 py-1 border rounded-lg sm:px-4 bg-gray-800/50 border-gray-700/50">
              <CacheStatus
                mode="regular"
                onExpired={() => loadData("regular")}
              />
            </div>
            <div className="px-2 py-1 border rounded-lg sm:px-4 bg-gray-800/50 border-gray-700/50">
              <CacheStatus mode="pve" onExpired={() => loadData("pve")} />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full p-1 rounded-lg bg-gray-800/30 sm:w-auto">
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
          </div>

          <div className="p-2 rounded-lg bg-gray-800/30 sm:p-4">
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
        </div>

        <div className="p-2 rounded-lg bg-gray-800/30 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
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
              data={mode === "regular" ? regularData : pveData}
              mode={mode}
              filters={{
                map: mapFilter,
                boss: bossFilter,
                search: searchQuery,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
