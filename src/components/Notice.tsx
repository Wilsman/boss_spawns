"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface NoticeImage {
  src: string;
  alt: string;
  imageClassName?: string;
}

const noticeImages: NoticeImage[] = [
  {
    src: "https://assets.tarkov.dev/glukhar-portrait.png",
    alt: "Glukhar",
  },
];

const changeRows = [
  { label: "Glukhar", from: "75%", to: "100%" },
] as const;
const changeDateLabel = "March 11, 2026";

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
        "mt-3 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-4",
        "opacity-0 transition-opacity duration-200 ease-out",
        isVisible && "opacity-100"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <h2 className="text-base font-semibold text-zinc-100">
            Boss spawn update
          </h2>
          <span className="text-xs text-zinc-500">
            Updated: {changeDateLabel}
          </span>
        </div>

        <article className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <div className="flex gap-2 md:shrink-0">
              {noticeImages.map((image) => (
                <div
                  key={image.alt}
                  className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-950"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={cn(
                      "h-full w-full object-contain p-1",
                      image.imageClassName
                    )}
                  />
                </div>
              ))}
            </div>

            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[96px_minmax(0,1fr)]">
              <dt className="text-zinc-500">Map</dt>
              <dd className="text-zinc-100">Reserve</dd>

              <dt className="text-zinc-500">Status</dt>
              <dd className="text-zinc-100">
                Glukhar is now back at 100% on Reserve in Regular and PVE.
              </dd>

              <dt className="text-zinc-500">Rates</dt>
              <dd className="space-y-1 text-zinc-300">
                {changeRows.map((change) => (
                  <div
                    key={change.label}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="min-w-[58px] text-zinc-400">
                      {change.label}
                    </span>
                    <span className="text-zinc-500 line-through">
                      {change.from}
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-600" />
                    <span className="font-semibold text-zinc-100">
                      {change.to}
                    </span>
                  </div>
                ))}
              </dd>

              <dt className="text-zinc-500">Changed</dt>
              <dd className="text-zinc-300">{changeDateLabel}</dd>

              <dt className="text-zinc-500">Locations</dt>
              <dd className="text-zinc-300">
                K Buildings, Black Knight, White Knight, and Train Station.
              </dd>
            </dl>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Notice;
