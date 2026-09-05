import { Suspense, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BOSS_MODELS } from "./boss-model-registry";

const DUCK_ENABLED_IN_HEADER = false;
const SHADOW_OF_TAGILLA_ENABLED_IN_HEADER = false;
const HEADER_BOSS_MODELS = BOSS_MODELS.filter(boss => {
  if (boss.id === "duck") return DUCK_ENABLED_IN_HEADER;
  if (boss.id === "shadow-of-tagilla") return SHADOW_OF_TAGILLA_ENABLED_IN_HEADER;
  return true;
});

export function BossSwitcher() {
  const [selection, setSelection] = useState(() => ({
    index: Math.floor(Math.random() * HEADER_BOSS_MODELS.length),
    direction: 1,
  }));
  const reducedMotion = useReducedMotion();
  const boss = HEADER_BOSS_MODELS[selection.index % HEADER_BOSS_MODELS.length];
  const Viewer = boss.Viewer;
  const switchBoss = (direction: number) => setSelection(current => ({
    index: (current.index + direction + HEADER_BOSS_MODELS.length) % HEADER_BOSS_MODELS.length,
    direction,
  }));
  const arrowClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent text-gray-500 transition-colors duration-200 hover:border-white/10 hover:bg-white/[0.04] hover:text-white active:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 motion-reduce:transition-none";

  return (
    <section aria-label="Boss showcase" className="flex w-full flex-col items-center">
      <h1 className="relative z-10 text-center">
        <a href="/" className="inline-block rounded-sm text-[25px] font-black italic leading-none tracking-[0.12em] text-white/90 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-400">
          EFT<span className="text-gray-400">BOSS</span>
          <span className="sr-only"> — Escape from Tarkov boss spawn tracker</span>
        </a>
      </h1>
      <div className="mt-1 flex w-full max-w-[380px] items-center justify-center gap-1 sm:gap-3">
        <button type="button" className={arrowClass} onClick={() => switchBoss(-1)} aria-label="Previous boss" title="Previous boss">
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <div className="relative h-[250px] w-[260px] min-w-0" aria-label={`${boss.name}, drag to rotate`}>
          <AnimatePresence initial={false} mode="wait" custom={selection.direction}>
            <motion.div
              key={boss.id}
              custom={selection.direction}
              variants={{
                enter: (direction: number) => ({ opacity: 0, x: reducedMotion ? 0 : direction * 12 }),
                visible: { opacity: 1, x: 0 },
                exit: (direction: number) => ({ opacity: 0, x: reducedMotion ? 0 : direction * -12 }),
              }}
              initial="enter"
              animate="visible"
              exit="exit"
              transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              title={`Drag to spin ${boss.name}`}
            >
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-gray-500" role="status">Loading {boss.name}…</div>}>
                <Viewer transparent showControls={false} height={250} autoSpinDefault={!reducedMotion} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" className={arrowClass} onClick={() => switchBoss(1)} aria-label="Next boss" title="Next boss">
          <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <p className="-mt-1 min-h-5 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500" aria-live="polite" aria-atomic="true">
        {boss.name}
      </p>
    </section>
  );
}
