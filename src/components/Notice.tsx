"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, MapPin } from "lucide-react";

interface NoticeImage {
  src: string;
  alt: string;
  imageClassName?: string;
}

interface NoticeSection {
  key: string;
  map: string;
  bosses: string;
  images: NoticeImage[];
  changes: Array<{ label: string; from: string; to: string }>;
  locations: string[];
}

const noticeSections: NoticeSection[] = [
  {
    key: "customs",
    map: "Customs",
    bosses: "Reshala",
    images: [{ src: "/eft_boss_reshala.webp", alt: "Reshala" }],
    changes: [{ label: "Reshala", from: "75%", to: "100%" }],
    locations: ["Dorms", "New Gas Station", "Stronghold"],
  },
  {
    key: "interchange",
    map: "Interchange",
    bosses: "Killa, Tagilla",
    images: [
      { src: "/eft_boss_killer.webp", alt: "Killa" },
      {
        src: "/eft_boss_tagilla.webp",
        alt: "Tagilla",
        imageClassName: "object-[62%_center]",
      },
    ],
    changes: [
      { label: "Killa", from: "75%", to: "100%" },
      { label: "Tagilla", from: "50%", to: "100%" },
    ],
    locations: ["Center mall", "OLI", "IDEA", "Goshan", "Garage below Goshan"],
  },
];

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
        "opacity-0 transition-opacity duration-300 ease-out",
        isVisible && "opacity-100"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <h2 className="text-base font-semibold text-zinc-100">
            Boss spawn updates
          </h2>
          <span className="text-xs text-zinc-500">Updated: March 9, 2026</span>
        </div>

        <div className="space-y-3">
          {noticeSections.map((section) => (
            <article
              key={section.key}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-3"
            >
              <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,188px)_minmax(0,1fr)] lg:items-start">
                <div className="flex gap-2">
                  {section.images.map((image) => (
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

                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-zinc-100">
                      {section.map}
                    </div>
                    <div className="text-sm text-zinc-300">{section.bosses}</div>
                  </div>

                  <div className="space-y-1 text-sm">
                    {section.changes.map((change) => (
                      <div
                        key={change.label}
                        className="flex flex-wrap items-center gap-2 text-zinc-300"
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
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    Locations
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-sm text-zinc-300">
                    {section.locations.map((location) => (
                      <span
                        key={location}
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Notice;
