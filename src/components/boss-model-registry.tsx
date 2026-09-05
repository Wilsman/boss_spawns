import { lazy } from "react";
import type { BossModelId } from "./boss-models";

export interface ModelViewerProps {
  height?: number;
  transparent?: boolean;
  showControls?: boolean;
  autoSpinDefault?: boolean;
}

function model(boss: BossModelId) {
  return lazy(async () => {
    const { default: Viewer } = await import("./BossModel3D");
    return { default: (props: ModelViewerProps) => <Viewer {...props} boss={boss} /> };
  });
}

// Keep the asset filenames intact; use the character names in the UI and routes.
export const BOSS_MODELS = [
  { id: "jaeger", name: "Jaeger", image: "/eft_boss_jaeger.webp", Viewer: model("jaeger") },
  { id: "goons", name: "Goons", image: "/eft_boss_goons.webp", Viewer: model("goons") },
  { id: "kaban", name: "Kaban", image: "/eft_boss_keban.webp", Viewer: model("kaban") },
  { id: "killa", name: "Killa", image: "/eft_boss_killer.webp", Viewer: model("killa") },
  { id: "tagilla", name: "Tagilla", image: "/eft_boss_tagilla.webp", Viewer: model("tagilla") },
  { id: "partisan", name: "Partisan", image: "/eft_boss_parasan.webp", Viewer: model("partisan") },
  { id: "reshala", name: "Reshala", image: "/eft_boss_reshala.webp", Viewer: lazy(() => import("./Reshala3D")) },
  { id: "sanitar", name: "Sanitar", image: "/eft_boss_sanny.webp", Viewer: model("sanitar") },
  { id: "shturman", name: "Shturman", image: "/eft_boss_shturman.webp", Viewer: lazy(() => import("./Shturman3D")) },
  { id: "wedgie", name: "Wedgie", image: "/eft_boss_wedgie.png", Viewer: model("wedgie") },
  { id: "zryachiy", name: "Zryachiy", image: "/eft_boss_zryachiy.png", Viewer: model("zryachiy") },
];
