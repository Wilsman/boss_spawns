import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog } from "radix-ui";
import { ArrowUpRight, MapPin, X } from "lucide-react";
import ModernTable from "./ModernTable";
import type { DataMode, GameMode, MobCatalog, SpawnData } from "@/types";
import { getMapMeta } from "@/lib/map-meta";
import { filterMapBosses } from "@/lib/map-spawns";
import "./boss-map.css";

const BossMapViewer = lazy(() => import("./BossMapViewer"));
const pendingMap = <div className="boss-map-loading" role="status">Loading spawn map…</div>;

export default function SpawnResults({ data, mode, filters, catalog }: {
  data: SpawnData[] | Record<GameMode, SpawnData[]> | null;
  mode: DataMode;
  filters: { map: string; boss: string; search: string };
  catalog?: MobCatalog;
}) {
  const [params, setParams] = useSearchParams();
  const [popup, setPopup] = useState<{ map: string; boss: string; location?: string } | null>(null);
  useEffect(() => setPopup(null), [mode]);
  const mapView = mode !== "compare" && params.get("view") === "map";
  const maps = Array.isArray(data) ? data : [];
  const selected = maps.find((m) => m.name.toLowerCase() === filters.map.toLowerCase());
  const popupMap = maps.find((m) => m.name === popup?.map);
  const filtered = useMemo(() => selected ? filterMapBosses(selected, filters.boss, filters.search) : undefined, [selected, filters.boss, filters.search]);
  const choices = maps.map((m) => filterMapBosses(m, filters.boss, filters.search)).filter((m) => m.bosses.length).sort((a, b) => a.name.localeCompare(b.name));
  return <>
    <div hidden={mapView}>
      <ModernTable data={data} mode={mode} filters={filters} catalog={catalog} onOpenMap={(map, boss, location) => setPopup({ map: map.name, boss, location })} />
    </div>
    {mapView && (filtered ? <Suspense fallback={pendingMap}><BossMapViewer key={`${mode}:${filtered.name}:${filters.boss}:${filters.search}`} data={filtered} mode={mode as GameMode} /></Suspense> : <section className="boss-map-picker" aria-label="Choose a spawn map">
      <div><h2>Choose your map</h2><p>Explore possible boss spawns, one map at a time.</p></div>
      <div className="boss-map-map-grid">{choices.map((map) => {
        const meta = getMapMeta(map.normalizedName);
        const bossCount = new Set(map.bosses.map((b) => b.mobKey ?? b.boss.name)).size;
        return <button type="button" key={map.id ?? map.name} onClick={() => { const next = new URLSearchParams(params); next.set("map", map.name); setParams(next); }}>
          <div className="boss-map-preview">{meta?.svgPath ? <img src={meta.svgPath} alt="" loading="lazy" /> : <MapPin size={36} />}</div>
          <span><strong>{map.name}</strong><small>{bossCount} {bossCount === 1 ? "boss" : "bosses"}{!meta ? " · Map unavailable" : ""}</small></span><ArrowUpRight size={17} />
        </button>;
      })}</div>
      {!choices.length && <p>No maps match your filters.</p>}
    </section>)}
    <Dialog.Root open={!!popup && !!popupMap} onOpenChange={(open) => { if (!open) setPopup(null); }}>
      <Dialog.Portal><Dialog.Overlay className="boss-map-dialog-overlay" /><Dialog.Content className="boss-map-dialog" aria-describedby="spawn-map-description">
        <Dialog.Title className="sr-only">{popup?.boss} spawn locations on {popup?.map}</Dialog.Title>
        <Dialog.Description id="spawn-map-description" className="sr-only">Explore possible spawn positions. Drag to pan and use the zoom controls. Escape closes the map.</Dialog.Description>
        <Dialog.Close className="boss-map-dialog-close" aria-label="Close spawn map"><X size={19} /></Dialog.Close>
        {popupMap && popup && <Suspense fallback={pendingMap}><BossMapViewer key={`${mode}:${popup.map}:${popup.boss}:${popup.location}`} data={popupMap} mode={mode as GameMode} initialBoss={popup.boss} initialLocation={popup.location} onFullMap={() => {
          const next = new URLSearchParams(params); next.set("view", "map"); next.set("map", popup.map); next.set("boss", popup.boss); next.delete("search"); setParams(next); setPopup(null);
        }} /></Suspense>}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}
