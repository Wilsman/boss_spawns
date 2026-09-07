import { afterAll, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { createGameCRS, gameLatLng, isOnLevel, leafletBounds } from "./map-coords";
import { getMapMeta, getMapLevels } from "./map-meta";

const oldWindow = globalThis.window;
const oldDocument = globalThis.document;
const browser = new Window();
globalThis.window = browser as unknown as Window & typeof globalThis;
globalThis.document = browser.document as unknown as Document;
const L = await import("leaflet");
afterAll(() => { globalThis.window = oldWindow; globalThis.document = oldDocument; browser.happyDOM.abort(); });

describe("Tarkov map projection", () => {
  // Independent expected pixel values at zoom 0; asymmetric inputs catch axis swaps.
  for (const [name, rotation] of [["customs", 180], ["factory", 90], ["the-lab", 270], ["lighthouse", 180], ["icebreaker", 180]] as const) {
    test(`${name}: raw game coordinates receive the transform exactly once`, () => {
      const meta = getMapMeta(name)!;
      const position = { x: 37, y: 9, z: -23 };
      const rotated = rotation === 90 ? [23, 37] : rotation === 270 ? [-23, -37] : [-37, 23];
      const [sx, mx, sy, my] = meta.transform;
      const crs = createGameCRS(L, meta);
      const expected = [sx * rotated[0] + mx, -sy * rotated[1] + my];
      for (const zoom of [0, 3]) {
        const actual = crs.latLngToPoint(L.latLng(...gameLatLng(position)), zoom);
        expect(actual.x).toBeCloseTo(expected[0] * 2 ** zoom, 7);
        expect(actual.y).toBeCloseTo(expected[1] * 2 ** zoom, 7);
        const inverse = crs.pointToLatLng(actual, zoom);
        expect(inverse.lng).toBeCloseTo(position.x, 7);
        expect(inverse.lat).toBeCloseTo(position.z, 7);
      }
    });
  }
  test("alternate maps share calibration while remaining distinct data maps", () => {
    expect(getMapMeta("night-factory")).toBe(getMapMeta("factory"));
    expect(getMapMeta("the-lab-dark")).toBe(getMapMeta("the-lab"));
    expect(getMapMeta("ground-zero-21")).toBe(getMapMeta("ground-zero"));
    expect(getMapMeta("unknown-map")).toBeUndefined();
    expect(leafletBounds([[5, 10], [-3, 4]])).toEqual([[10, 5], [4, -3]]);
  });
  test("a bounded basement does not classify outdoor points at the same height", () => {
    const levels = getMapLevels(getMapMeta("shoreline")!);
    const underground = levels.findIndex((l) => l.name === "Underground");
    const indoor = { x: -180, y: -6, z: -80 };
    const outdoor = { x: 200, y: -6, z: 200 };
    expect(isOnLevel(indoor, levels, underground)).toBe(true);
    expect(isOnLevel(indoor, levels, 0)).toBe(false);
    expect(isOnLevel(outdoor, levels, underground)).toBe(false);
    expect(isOnLevel(outdoor, levels, 0)).toBe(true);
  });
});
