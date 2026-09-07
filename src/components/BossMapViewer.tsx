import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import DOMPurify from "dompurify";
import { Crosshair, Expand, Layers, MapPin, Users } from "lucide-react";
import type { GameMode, SpawnData } from "@/types";
import { getCanonicalBossName } from "@/lib/boss-aliases";
import { getMapLevels, getMapMeta, type MapMeta } from "@/lib/map-meta";
import { createGameCRS, gameLatLng, isOnLevel, leafletBounds } from "@/lib/map-coords";
import { clusterPins, getSpawnPins, type SpawnPin } from "@/lib/map-spawns";
import "leaflet/dist/leaflet.css";
import "./boss-map.css";

type Background = "abstract" | "satellite" | "markers";
type Focus = { boss?: string; location?: string; revision?: number };
const MODE_LABELS = { regular: "PVP", pve: "PVE", "pvp-season": "Season" };
const svgCache = new Map<string, string>();
const percent = (value: number) => `${Math.round(value * 100)}%`;
const safeImage = (url?: string | null) => url && /^https:\/\//i.test(url) ? url : undefined;

export interface BossMapViewerProps {
  data: SpawnData;
  mode: GameMode;
  initialBoss?: string;
  initialLocation?: string;
  onFullMap?: () => void;
}

export default function BossMapViewer({ data, mode, initialBoss, initialLocation, onFullMap }: BossMapViewerProps) {
  const meta = getMapMeta(data.normalizedName);
  const pins = useMemo(() => getSpawnPins(data), [data]);
  const levels = useMemo(() => meta ? getMapLevels(meta) : [], [meta]);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(data.bosses.map((b) => getCanonicalBossName(b.boss.name, b.spawnChance)).filter((name) => initialBoss && name !== initialBoss)));
  const [focus, setFocus] = useState<Focus>({ boss: initialBoss, location: initialLocation });
  const [level, setLevel] = useState(() => {
    const target = pins.find((p) => p.bossName === initialBoss && (!initialLocation || p.location === initialLocation));
    return target ? Math.max(0, levels.findIndex((_, i) => isOnLevel(target.position, levels, i))) : 0;
  });
  const [background, setBackground] = useState<Background>(meta?.svgPath ? "abstract" : meta?.tilePath ? "satellite" : "markers");
  const [players, setPlayers] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(true);
  const visiblePins = useMemo(() => pins.filter((p) => !hidden.has(p.bossName)), [pins, hidden]);
  const roster = useMemo(() => {
    const names = [...new Set(data.bosses.map((b) => getCanonicalBossName(b.boss.name, b.spawnChance)))];
    return names.map((name) => {
      const encounters = data.bosses.filter((b) => getCanonicalBossName(b.boss.name, b.spawnChance) === name);
      const chances = [...new Set(encounters.map((b) => b.spawnChance))].sort((a, b) => a - b);
      return { name, portrait: safeImage(encounters[0].boss.imagePortraitLink), chances,
        pins: pins.filter((p) => p.bossName === name) };
    });
  }, [data, pins]);

  function focusOn(boss?: string, location?: string) {
    if (boss) setHidden((previous) => { const next = new Set(previous); next.delete(boss); return next; });
    const target = pins.find((p) => (!boss || p.bossName === boss) && (!location || p.location === location));
    if (target && location) setLevel(Math.max(0, levels.findIndex((_, i) => isOnLevel(target.position, levels, i))));
    setFocus({ boss, location, revision: Date.now() });
  }

  return <section className="boss-map" aria-label={`${data.name} boss spawn map`}>
    <header className="boss-map-heading">
      <div className="boss-map-title"><MapPin size={19} /><div><h2>{initialBoss ? `${initialBoss} · ${data.name}` : data.name}</h2><p>{MODE_LABELS[mode]} <span>·</span> Possible spawn positions</p></div></div>
      <div className="boss-map-actions">
        <button type="button" onClick={() => { setHidden(new Set()); focusOn(); }}>Show all bosses</button>
        {onFullMap && <button type="button" onClick={onFullMap}><Expand size={14} />Open full map</button>}
      </div>
    </header>
    {!meta ? <div className="boss-map-empty"><MapPin /><h3>Map background not available yet</h3><p>{data.name} has no matching map calibration. Spawn details are still available in the table.</p></div> : <>
      <div className="boss-map-toolbar">
        {levels.length > 1 && <label className="boss-map-floor"><Layers size={14} /><select aria-label="Map floor" value={level} onChange={(e) => setLevel(Number(e.target.value))}>{levels.map((l, i) => <option value={i} key={l.name}>{l.name} · {visiblePins.filter((p) => isOnLevel(p.position, levels, i)).length}</option>)}</select></label>}
        <button type="button" onClick={() => focusOn()}><Crosshair size={14} />Fit spawns</button>
        <details className="boss-map-layers"><summary><Layers size={14} />Layers</summary><div>
          <span className="boss-map-eyebrow">Background</span>
          {(["abstract", "satellite", "markers"] as const).map((style) => <label key={style}><input type="radio" name={`background-${data.id}`} checked={background === style} disabled={style === "abstract" ? !meta.svgPath : style === "satellite" ? !meta.tilePath : false} onChange={() => setBackground(style)} />{style === "markers" ? "Markers only" : style === "abstract" ? "Abstract" : "Satellite"}</label>)}
          <label className="boss-map-player-option"><input type="checkbox" checked={players} onChange={(e) => setPlayers(e.target.checked)} /><Users size={14} />Player spawns</label>
        </div></details>
        <button type="button" className="boss-map-roster-toggle" aria-expanded={rosterOpen} onClick={() => setRosterOpen(!rosterOpen)}>Bosses ({roster.length})</button>
      </div>
      <div className={`boss-map-body ${rosterOpen ? "roster-open" : ""}`}>
        <MapCanvas meta={meta} data={data} pins={visiblePins} level={level} background={background} players={players} focus={focus} />
        <aside className="boss-map-roster" aria-label="Boss visibility and locations">
          <div className="boss-map-roster-heading"><span>Bosses & locations</span><span>{visiblePins.length} positions</span></div>
          {roster.map((boss) => <div key={boss.name} className={`boss-map-boss ${focus.boss === boss.name ? "is-focused" : ""} ${hidden.has(boss.name) ? "is-hidden" : ""}`}>
            <div className="boss-map-boss-heading">
              <input type="checkbox" aria-label={`Show ${boss.name}`} checked={!hidden.has(boss.name)} disabled={!boss.pins.length} onChange={() => setHidden((previous) => { const next = new Set(previous); if (next.has(boss.name)) next.delete(boss.name); else next.add(boss.name); return next; })} />
              <button type="button" onClick={() => focusOn(boss.name)} disabled={!boss.pins.length}>{boss.portrait && <img src={boss.portrait} alt="" />}<span>{boss.name}<small>{boss.chances.length > 1 ? `${percent(boss.chances[0])}–${percent(boss.chances[boss.chances.length - 1])}` : percent(boss.chances[0])} spawn{boss.chances.length > 1 ? " · varies by encounter" : ""}</small></span></button>
            </div>
            {!boss.pins.length ? <p className="boss-map-no-positions">No mapped spawn positions</p> : <div className="boss-map-locations">{[...new Set(boss.pins.map((p) => p.location))].map((location) => <button type="button" key={location} className={focus.boss === boss.name && focus.location === location ? "is-active" : ""} onClick={() => focusOn(boss.name, location)}><span>{location || "Unnamed location"}</span><small>{boss.pins.filter((p) => p.location === location).length}</small></button>)}</div>}
          </div>)}
        </aside>
      </div>
      <footer className="boss-map-footer"><span>Faded markers are on other floors. Pins show possible spawns, not live sightings.</span><span>Maps: <a href={meta.authorLink} target="_blank" rel="noreferrer">{meta.author}</a> / <a href="https://tarkov.dev" target="_blank" rel="noreferrer">Tarkov.dev</a> · <a href="/licenses/tarkov-dev.txt" target="_blank" rel="noreferrer">MIT</a></span></footer>
    </>}
  </section>;
}

function MapCanvas({ meta, data, pins, level, background, players, focus }: {
  meta: MapMeta; data: SpawnData; pins: SpawnPin[]; level: number; background: Background; players: boolean; focus: Focus;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  const levels = useMemo(() => getMapLevels(meta), [meta]);

  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, { crs: createGameCRS(L, meta), minZoom: -3, maxZoom: (meta.maxZoom ?? 6) + 2,
      zoomSnap: 0.25, attributionControl: false, scrollWheelZoom: false });
    instance.fitBounds(leafletBounds(meta.bounds), { padding: [24, 24] });
    const resize = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    resize.observe(element.current);
    setMap(instance);
    return () => { resize.disconnect(); instance.remove(); };
  }, [meta]);

  useEffect(() => {
    if (!map) return;
    const abort = new AbortController();
    const layers = L.layerGroup().addTo(map);
    let objectUrl: string | undefined;
    const active = levels[level];
    setStatus("");
    if (background === "satellite") {
      const tiles = L.tileLayer(active.tilePath ?? meta.tilePath!, { noWrap: true, bounds: leafletBounds(meta.bounds), tileSize: meta.tileSize ?? 256, maxNativeZoom: meta.maxZoom ?? 6, maxZoom: (meta.maxZoom ?? 6) + 2, minZoom: -3 });
      tiles.on("tileerror", () => setStatus("Some map tiles could not load. Try another background or retry."));
      layers.addLayer(tiles);
    } else if (background === "abstract" && meta.svgPath) {
      setStatus("Loading map background…");
      const url = meta.svgPath;
      (async () => {
        let source = svgCache.get(url);
        if (!source) {
          const response = await fetch(url, { signal: abort.signal });
          if (!response.ok) throw new Error(`Map background: ${response.status}`);
          source = await response.text();
          svgCache.set(url, source);
        }
        if (abort.signal.aborted) return;
        const clean = DOMPurify.sanitize(source, { USE_PROFILES: { svg: true, svgFilters: true }, ADD_TAGS: ["style"], FORBID_TAGS: ["foreignObject", "script"] });
        const svg = new DOMParser().parseFromString(clean, "image/svg+xml").documentElement;
        if (svg.nodeName !== "svg") throw new Error("Invalid map SVG");
        const group = active.svgLayer ?? meta.svgLayer;
        Array.from(svg.children).filter((node) => node.nodeName === "g" && node.id).forEach((node) => {
          node.setAttribute("style", node.id === group || node.getAttribute("data-keep-with-group") === group ? "display:inline" : "display:none");
        });
        // An image isolates the SVG's style rules from the application document.
        objectUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
        const overlay = L.imageOverlay(objectUrl, leafletBounds(meta.svgBounds ?? meta.bounds));
        overlay.on("load", () => { if (!abort.signal.aborted) setStatus(""); });
        overlay.on("error", () => { if (!abort.signal.aborted) setStatus("Map background could not load. Try another background or retry."); });
        layers.addLayer(overlay);
      })().catch((error) => { if (error.name !== "AbortError" && !abort.signal.aborted) setStatus("Map background could not load. Try another background or retry."); });
    }
    return () => { abort.abort(); layers.remove(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [map, meta, levels, level, background, retry]);

  useEffect(() => {
    if (!map) return;
    const target = pins.filter((p) => (!focus.boss || p.bossName === focus.boss) && (!focus.location || p.location === focus.location));
    if (target.length) map.fitBounds(L.latLngBounds(target.map((p) => gameLatLng(p.position))), { padding: [55, 55], maxZoom: focus.location ? 5 : 3.5, animate: false });
    else map.fitBounds(leafletBounds(meta.bounds), { padding: [24, 24], animate: false });
    // Visibility and refresh changes must not move the user's camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focus, meta]);

  useEffect(() => {
    if (!map) return;
    const layer = L.layerGroup().addTo(map);
    const spider = L.layerGroup().addTo(map);
    function addPin(pin: SpawnPin, destination: L.LayerGroup, offset?: L.Point) {
      const onLevel = isOnLevel(pin.position, levels, level);
      const highlighted = !focus.boss || (pin.bossName === focus.boss && (!focus.location || pin.location === focus.location));
      const node = document.createElement("span");
      node.className = "boss-pin-face";
      const url = safeImage(pin.encounter.boss.imagePortraitLink);
      if (url) { const image = document.createElement("img"); image.src = url; image.alt = ""; node.append(image); }
      else node.textContent = pin.bossName.slice(0, 1);
      const marker = L.marker(gameLatLng(pin.position), { title: `${pin.bossName} · ${pin.location}`, keyboard: true,
        icon: L.divIcon({ html: node, className: `boss-pin ${onLevel ? "" : "off-level"} ${highlighted ? "" : "unfocused"}`, iconSize: [30, 30], iconAnchor: [15 - (offset?.x ?? 0), 15 - (offset?.y ?? 0)], popupAnchor: [offset?.x ?? 0, -18 + (offset?.y ?? 0)] }) });
      const popup = document.createElement("div");
      popup.className = "boss-map-popup";
      const title = document.createElement("strong"); title.textContent = pin.bossName; popup.append(title);
      for (const text of [pin.location || "Unnamed location", `${percent(pin.encounter.spawnChance)} boss spawn · ${percent(pin.locationChance)} location chance`, onLevel ? levels[level].name : "Position on another floor"]) {
        const line = document.createElement("p"); line.textContent = text; popup.append(line);
      }
      const shared = [...new Set(pins.filter((p) => p.id !== pin.id && p.position.x === pin.position.x && p.position.z === pin.position.z && p.bossName !== pin.bossName).map((p) => p.bossName))];
      if (shared.length) { const line = document.createElement("p"); line.textContent = `Also spawns here: ${shared.join(", ")}`; popup.append(line); }
      marker.bindPopup(popup, { maxWidth: 290 }).addTo(destination);
    }
    function render() {
      if (!map) return;
      layer.clearLayers(); spider.clearLayers();
      if (players) for (const p of data.playerSpawns ?? []) L.circleMarker(gameLatLng(p), { radius: 3, color: "#c4b5fd", weight: 1, fillOpacity: isOnLevel(p, levels, level) ? 0.8 : 0.15, opacity: isOnLevel(p, levels, level) ? 0.8 : 0.15 }).bindTooltip("Possible player spawn").addTo(layer);
      // Keep other floors in separate groups so their fade remains meaningful.
      for (const onLevel of [false, true]) {
        const groups = clusterPins(pins.filter((p) => isOnLevel(p.position, levels, level) === onLevel), (p) => map.latLngToLayerPoint(gameLatLng(p.position)));
        for (const group of groups) {
          if (group.length === 1) { addPin(group[0], layer); continue; }
          const center = group.reduce((point, pin) => point.add(map.latLngToLayerPoint(gameLatLng(pin.position))), L.point(0, 0)).divideBy(group.length);
          const names = [...new Set(group.map((p) => p.bossName))];
          const marker = L.marker(map.layerPointToLatLng(center), { title: `${group.length} spawn positions: ${names.join(", ")}`, icon: L.divIcon({ className: `boss-pin-cluster ${onLevel ? "" : "off-level"}`, html: String(group.length), iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(layer);
          marker.on("click", () => {
            const spread = Math.max(...group.map((p) => center.distanceTo(map.latLngToLayerPoint(gameLatLng(p.position)))));
            if (spread > 12 && map.getZoom() < map.getMaxZoom()) { map.setView(marker.getLatLng(), Math.min(map.getZoom() + 1.5, map.getMaxZoom())); return; }
            spider.clearLayers();
            group.forEach((pin, i) => {
              const angle = i * Math.PI * 2 / group.length;
              const radius = Math.max(30, group.length * 6);
              const end = center.add(L.point(Math.cos(angle) * radius, Math.sin(angle) * radius));
              const start = map.latLngToLayerPoint(gameLatLng(pin.position));
              L.polyline([gameLatLng(pin.position), map.layerPointToLatLng(end)], { color: "#8db8f8", weight: 1, opacity: 0.65, interactive: false }).addTo(spider);
              addPin(pin, spider, end.subtract(start));
            });
          });
        }
      }
    }
    const clearSpider = () => spider.clearLayers();
    render(); map.on("zoomend", render); map.on("click", clearSpider);
    return () => { map.off("zoomend", render); map.off("click", clearSpider); layer.remove(); spider.remove(); };
  }, [map, pins, levels, level, players, data.playerSpawns, focus]);

  return <div className="boss-map-canvas-wrap">
    <div ref={element} className="boss-map-canvas" aria-label="Interactive spawn map. Use plus and minus to zoom; drag to pan." />
    {status && <div className="boss-map-status" role="status">{status}{!status.startsWith("Loading") && <button type="button" onClick={() => { if (meta.svgPath) svgCache.delete(meta.svgPath); setRetry((n) => n + 1); }}>Retry</button>}</div>}
    {!pins.length && <div className="boss-map-empty-overlay">No mapped spawn positions{data.bosses.length ? " for the visible bosses" : " for this selection"}.</div>}
    <span className="boss-map-pan-hint">Drag to pan · + / − to zoom</span>
  </div>;
}
