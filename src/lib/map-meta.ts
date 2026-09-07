import metadata from "./map-meta.json";

// Trimmed from the-hideout/tarkov-dev, MIT. Revision:
// 8d693b1b5eae77746de4f313b44d53166b3f84ae (2026-09-07).
// See public/licenses/tarkov-dev.txt. Preserve artist attribution with each map.
export type MapBounds = [[number, number], [number, number]];
export interface MapLevel {
  name: string;
  tilePath?: string;
  svgLayer?: string;
  show?: boolean;
  extents?: Array<{
    height: [number, number];
    bounds?: Array<[[number, number], [number, number], ...unknown[]]>;
  }>;
}
export interface MapMeta {
  key: string;
  normalizedName: string;
  altMaps?: string[];
  transform: [number, number, number, number];
  coordinateRotation: number;
  bounds: MapBounds;
  svgBounds?: MapBounds;
  tilePath?: string;
  tileSize?: number;
  svgPath?: string;
  svgLayer?: string;
  heightRange?: [number, number];
  minZoom?: number;
  maxZoom?: number;
  author: string;
  authorLink: string;
  layers?: MapLevel[];
}
export const INTERACTIVE_MAPS = metadata as MapMeta[];
export function getMapMeta(normalizedName?: string): MapMeta | undefined {
  return INTERACTIVE_MAPS.find(
    (m) =>
      m.normalizedName === normalizedName ||
      m.altMaps?.includes(normalizedName ?? ""),
  );
}
export function getMapLevels(meta: MapMeta): MapLevel[] {
  const defaultLayer = meta.layers?.find((l) => l.show);
  return [
    {
      name: defaultLayer?.name ?? "Ground",
      tilePath: meta.tilePath,
      svgLayer: meta.svgLayer,
      extents: meta.heightRange ? [{ height: meta.heightRange }] : undefined,
    },
    ...(meta.layers ?? []).filter((l) => l !== defaultLayer),
  ];
}
