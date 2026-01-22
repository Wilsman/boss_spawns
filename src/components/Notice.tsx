"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Swords, Shield } from "lucide-react";

export function Notice() {
  const [isVisible, setIsVisible] = useState(false);

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
        "w-full bg-gradient-to-br from-zinc-950/80 to-gray-900/80 border border-zinc-800/40 rounded-lg px-3 py-3 mt-3 flex flex-col items-center shadow-md",
        "opacity-0 transition-opacity duration-500 ease-in-out", // Base opacity and transition
        isVisible && "opacity-100", // Fade in when visible
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-1 mb-1">
        <span className="text-xs text-zinc-300 font-semibold uppercase tracking-wider">
          Boss Spawn Notice
        </span>
        <span className="text-xs text-zinc-500/70">
          Updated: January 22, 2026
        </span>
      </div>

      <div className="w-full mt-1">
        <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/80 to-zinc-800/90 border border-zinc-700/60 rounded-2xl p-4 shadow-lg shadow-black/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-shrink-0 relative">
              <img
                src="https://assets.tarkov.dev/655c67ab0d37ca5135388f4b-8x.webp"
                alt="Santa Claus"
                className="w-24 h-24 md:w-28 md:h-28 object-contain rounded-xl border border-zinc-700/50 shadow-lg"
              />
              <div className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full border border-amber-400 shadow-lg md:hidden">
                Updated
              </div>
            </div>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-xs text-zinc-400 uppercase tracking-[0.3em] font-semibold">
                  Update
                </p>
                <span className="hidden md:inline-block bg-zinc-700/90 text-zinc-100 text-xs font-bold px-2 py-0.5 rounded border border-zinc-500/50 shadow-sm">
                  Seasonal Change
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black leading-tight mb-2 uppercase text-amber-500">
                Santa Claus Removed
              </p>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-medium">
                Santa Claus has been removed from all map spawns. Regular boss
                spawns continue.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* PvP/PvE info */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {/* PvP Section */}
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="h-4 w-4 text-blue-400" />
            <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">
              PvP Mode
            </h3>
          </div>
          <p className="text-zinc-100 text-base font-bold mb-2">
            <span className="font-semibold text-zinc-200">
              Santa Claus:{" "}
              <span className="font-bold text-amber-500">REMOVED</span>
            </span>
          </p>
          <p className="text-zinc-300 text-sm mb-2">
            <span className="text-zinc-100">- No longer spawning in raids</span>
          </p>
          <p className="text-zinc-400 text-sm mb-1 font-semibold uppercase tracking-tight">
            Cultists:
          </p>
          <p className="text-zinc-300 text-sm mb-1">
            <span className="text-zinc-100">
              - Night spawns active (25-30%)
            </span>
          </p>
        </div>

        {/* PvE Section */}
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <h3 className="text-emerald-300 font-semibold text-sm uppercase tracking-wider">
              PvE Mode
            </h3>
          </div>
          <p className="text-zinc-100 text-base font-bold mb-2">
            <span className="font-semibold text-zinc-200">
              Santa Claus:{" "}
              <span className="font-bold text-amber-500">REMOVED</span>
            </span>
          </p>
          <p className="text-zinc-300 text-sm mb-2">
            <span className="text-zinc-100">- No longer spawning in raids</span>
          </p>
          <p className="text-zinc-400 text-sm mb-1 font-semibold uppercase tracking-tight">
            Cultists:
          </p>
          <p className="text-zinc-300 text-sm mb-1">
            <span className="text-zinc-100">
              - Night spawns active (25-30%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Notice;
