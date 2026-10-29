import { lazy } from "react";
import type { ModelViewerProps } from "./boss-model-registry";
import type { InfectedVariant } from "./infected-models";

function walker(variant: InfectedVariant) {
  return lazy(async () => {
    const { default: Viewer } = await import("./InfectedModel3D");
    return { default: ({ height, autoSpinDefault = true }: ModelViewerProps) => <Viewer variant={variant} height={height} animate={autoSpinDefault} /> };
  });
}

// Halloween 2026 infected event header models.
export const INFECTED_MODELS = [
  { id: "infected-black-division", name: "Infected Black Division", Viewer: walker("black-division") },
  { id: "infected-pmc", name: "Infected PMC", Viewer: walker("pmc") },
  { id: "infected-scav", name: "Infected Scav", Viewer: walker("scav") },
];
