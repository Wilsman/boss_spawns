import { Suspense } from "react";
import { Link } from "react-router-dom";
import { BOSS_MODELS } from "./boss-model-registry";

export default function BossModelPage({ boss = "goons" }: { boss?: string }) {
  const selected = BOSS_MODELS.find(model => model.id === boss) ?? BOSS_MODELS[0];
  const Viewer = selected.Viewer;
  return (
    <div className="container mx-auto max-w-3xl px-3 pt-6 pb-24 sm:px-4">
      <h1 className="mb-1 text-center text-xl font-bold text-white">Lego {selected.name} - 3D</h1>
      <p className="mb-4 text-center text-sm text-gray-400">Drag horizontally to spin. Use the arrows for a closer look from each side.</p>
      <nav aria-label="Boss models" className="mb-4 flex flex-wrap justify-center gap-2">
        {BOSS_MODELS.map(model => (
          <Link
            key={model.id}
            to={`/${model.id}-3d`}
            aria-current={selected.id === model.id ? "page" : undefined}
            className={`rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 ${selected.id === model.id ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"}`}
          >{model.name}</Link>
        ))}
      </nav>
      <Suspense fallback={<div className="flex h-[520px] items-center justify-center text-sm text-gray-400">Loading 3D viewer...</div>}>
        <Viewer key={selected.id} height={520} />
      </Suspense>
      <div className="mt-4 text-center">
        <Link to="/" className="text-sm text-blue-400 hover:underline">Back to tracker</Link>
      </div>
    </div>
  );
}
