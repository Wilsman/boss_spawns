# Project rules

- Never add "Generated with Devin" or any Devin attribution/trailer to commits, PRs, or any other output.

## Data and maps

- Compare the exact selected game mode's `json.tarkov.dev` payload with
  `src/lib/api.ts` normalization before changing displayed boss data. The changes
  API is a separate Worker; trace its database and execution path separately from
  this frontend and the Twitch bot when investigating repeated changes.
- Map coordinates stay in game space: `gameLatLng` uses `[z, x]`, with rotation and
  scale applied once by `createGameCRS` in `src/lib/map-coords.ts`. Preserve `y` for
  floor selection and the area-bounded floor rules. Do not pre-transform markers
  a second time. Verify landmark alignment when changing projection metadata.
- Preserve encounter identity, selected mode and filters between table, full map
  and boss dialog. Pins show possible spawn positions; boss spawn chance and
  location chance are different values. Missing positions must remain explicit.

## Procedural models and map art

For pose or animation changes, preserve the requested scope. Check hand/weapon
clearance and camera framing across the full animation, including impact, in both
the header and model view when testing is in scope. A pose that fits one frame may
clip later. If the user takes over testing, state that runtime appearance remains
unverified.

For building reconstructions, use the supplied map assets and image references
for footprint, orientation and height. Identify estimated dimensions and verify
placement against the map rather than treating a plausible silhouette as exact.
