"use client";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoticeImage {
  src: string;
  alt: string;
  imageClassName?: string;
}

const noticeImages: NoticeImage[] = [
  {
    src: "https://assets.tarkov.dev/unknown-npc-portrait.webp",
    alt: "Smuggler",
  },
];

const smugglerMaps = [
  "Customs",
  "Ground Zero",
  "Interchange",
  "Lighthouse",
  "Shoreline",
  "Streets of Tarkov",
  "Woods",
] as const;

const reserveBosses = [
  "Glukhar",
  "Kaban",
  "Killa",
  "Kollontay",
  "Reshala",
  "Sanitar",
  "Shturman",
  "Tagilla",
] as const;

const changeDateLabel = "March 19, 2026 9:30 AM GMT";

const followUpBosses = [
  "Reshala (Customs 75%)",
  "Tagilla (Factory 50%, Interchange 50%)",
  "Killa (Interchange 75%)",
  "Shturman (Woods 75%)",
  "Sanitar (Shoreline 75%)",
  "Kaban + Kollontay (Streets 75%)",
] as const;

export function Notice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      className={cn(
        "mt-3 w-full rounded-lg border border-amber-500/30 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 px-4 py-4",
        "opacity-0 transition-opacity duration-200 ease-out",
        isVisible && "opacity-100",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
          <h2 className="text-base font-semibold text-zinc-100">
            Boss spawn update
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Event finished
            </span>
            <span className="text-xs text-zinc-500">
              Updated: {changeDateLabel}
            </span>
          </div>
        </div>

        <article className="rounded-lg border border-amber-500/20 bg-zinc-900/40 px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <div className="flex gap-2 md:shrink-0">
              {noticeImages.map((image) => (
                <div
                  key={image.alt}
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-amber-500/20 bg-zinc-950"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={cn(
                      "h-full w-full object-contain p-1 grayscale opacity-75",
                      image.imageClassName,
                    )}
                  />
                </div>
              ))}
            </div>

            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[96px_minmax(0,1fr)]">
              <dt className="text-zinc-500">Map</dt>
              <dd className="text-zinc-100">Multiple maps</dd>

              <dt className="text-zinc-500">Status</dt>
              <dd className="text-amber-100">
                The temporary Smuggler and Reserve boss event has ended. Those
                boosted 100% spawns are no longer active.
              </dd>

              <dt className="text-zinc-500">Ended event</dt>
              <dd className="text-zinc-300">
                Smuggler had 100% spawns on {smugglerMaps.join(", ")}, and
                Reserve temporarily featured {reserveBosses.join(", ")} at
                boosted rates.
              </dd>

              <dt className="text-zinc-500">Current rotation</dt>
              <dd className="text-zinc-300">
                {followUpBosses.join("; ")}.
              </dd>

              <dt className="text-zinc-500">Ended</dt>
              <dd className="text-zinc-300">{changeDateLabel}</dd>
            </dl>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Notice;
