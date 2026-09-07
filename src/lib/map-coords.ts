import type { GamePosition } from "../types";
import type { MapMeta, MapLevel, MapBounds } from "./map-meta";

export const gameLatLng = (p: GamePosition): [number, number] => [p.z, p.x];
export const leafletBounds = (
  b: MapBounds,
): [[number, number], [number, number]] => [
  [b[0][1], b[0][0]],
  [b[1][1], b[1][0]],
];
export function rotate(
  x: number,
  z: number,
  degrees: number,
): [number, number] {
  const angle = (degrees * Math.PI) / 180;
  return [
    x * Math.cos(angle) - z * Math.sin(angle),
    x * Math.sin(angle) + z * Math.cos(angle),
  ];
}

// Inject Leaflet so this geometry can also be tested without a browser global.
export function createGameCRS(
  L: typeof import("leaflet"),
  meta: MapMeta,
): import("leaflet").CRS {
  const [sx, mx, sy, my] = meta.transform;
  return L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(sx, mx, -sy, my),
    projection: {
      project(latlng: import("leaflet").LatLng) {
        return L.point(
          ...rotate(latlng.lng, latlng.lat, meta.coordinateRotation),
        );
      },
      unproject(point: import("leaflet").Point) {
        const [x, z] = rotate(point.x, point.y, -meta.coordinateRotation);
        return L.latLng(z, x);
      },
    },
  });
}

function inLevel(p: GamePosition, level: MapLevel): boolean {
  return (
    !level.extents ||
    level.extents.some(
      (e) =>
        p.y >= e.height[0] &&
        p.y < e.height[1] &&
        (!e.bounds ||
          e.bounds.some(
            ([a, b]) =>
              p.x >= Math.min(a[0], b[0]) &&
              p.x <= Math.max(a[0], b[0]) &&
              p.z >= Math.min(a[1], b[1]) &&
              p.z <= Math.max(a[1], b[1]),
          )),
    )
  );
}
export function isOnLevel(
  p: GamePosition,
  levels: MapLevel[],
  index: number,
): boolean {
  // Area-bounded basement overrides must not dim outdoor positions at the same height.
  if (
    index === 0 &&
    levels
      .slice(1)
      .some((l) => l.extents?.some((e) => e.bounds) && inLevel(p, l))
  )
    return false;
  return inLevel(p, levels[index]);
}
