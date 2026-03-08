"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Map, Shield, Swords } from "lucide-react";

export function Notice() {
  const [isVisible, setIsVisible] = useState(false);
  const locations = ["Dorms", "New Gas Station", "Stronghold"];

  useEffect(() => {
    // Ensure the component is rendered before starting the transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-4 py-4 shadow-md",
        "opacity-0 transition-opacity duration-500 ease-in-out", // Base opacity and transition
        isVisible && "opacity-100", // Fade in when visible
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">
              Reshala update
            </h2>
            <p className="text-sm text-zinc-400">
              Customs spawn chance increased from 75% to 100%.
            </p>
          </div>
          <div className="text-xs text-zinc-500">
            Updated: March 8, 2026
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[128px_minmax(0,1fr)] md:items-start">
          <div className="flex justify-center md:justify-start">
            <div className="rounded-lg border border-zinc-800 bg-black/20 p-2">
              <img
                src="/eft_boss_reshala.webp"
                alt="Reshala"
                className="h-28 w-28 object-contain"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xl font-semibold text-zinc-100 sm:text-2xl">
                Reshala is now 100% on Customs
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                <span className="font-medium text-zinc-500 line-through">
                  75%
                </span>
                <ArrowRight className="h-4 w-4 text-zinc-500" />
                <span className="font-semibold text-zinc-100">
                  100%
                </span>
                <span>Spawn chance confirmed live for both raid modes.</span>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
              Active spawn points remain Dorms, New Gas Station, and
              Stronghold.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Map className="h-4 w-4 text-zinc-500" />
              Locations
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
              {locations.map((location) => (
                <span
                  key={location}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1"
                >
                  {location}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Swords className="h-4 w-4 text-zinc-500" />
              <Shield className="h-4 w-4 text-zinc-500" />
              Modes
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">
              PvP and PvE are currently aligned at 100% on Customs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notice;
