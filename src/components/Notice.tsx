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
        "w-full bg-gradient-to-br from-purple-950/80 to-gray-900/80 border border-purple-800/40 rounded-lg px-3 py-3 mt-3 flex flex-col items-center shadow-md",
        "opacity-0 transition-opacity duration-500 ease-in-out", // Base opacity and transition
        isVisible && "opacity-100" // Fade in when visible
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-1 mb-1">
        <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
          Boss Spawn Notice
        </span>
        <span className="text-xs text-purple-400/70">
          Updated: November 20, 2025
        </span>
      </div>

      <div className="w-full mt-1">
        <div className="bg-gradient-to-r from-rose-900/70 via-purple-900 to-purple-700/70 border border-rose-800/60 rounded-2xl p-4 shadow-lg shadow-rose-900/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-shrink-0 relative">
              <img
                src="https://assets.tarkov.dev/tagilla-portrait.png"
                alt="Tagilla portrait"
                className="w-32 h-32 md:w-36 md:h-36 object-cover rounded-xl border-2 border-rose-500 shadow-xl"
              />
              <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full border border-rose-400 shadow-lg md:hidden">
                50% Spawn
              </div>
            </div>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-xs text-rose-100 uppercase tracking-[0.3em] font-semibold">
                  Tagilla Update
                </p>
                <span className="hidden md:inline-block bg-rose-600/90 text-white text-xs font-bold px-2 py-0.5 rounded border border-rose-400/50 shadow-sm">
                  50% Spawn Rate
                </span>
              </div>
              <p className="text-xl sm:text-3xl font-black leading-tight mb-2">
                Tagilla on Interchange
              </p>
              <p className="text-sm sm:text-base text-rose-100/90 leading-relaxed font-medium">
                Found in the underground carpark near the no-bag extract. <span className="opacity-75">[Tagilla’s hideout]</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PvP/PvE info */}
      <div
        className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-4"
      >
        {/* PvP Section */}
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-3 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="h-4 w-4 text-blue-400" />
            <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">
              PvP Mode
            </h3>
          </div>
          <p className="text-green-100 text-base font-bold mb-2">
            <span className="font-semibold text-green-200">
              Main bosses <span className="font-bold text-green-100">{"~"}75%</span>
            </span>{" "}
            on their respective maps
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Goons 40%:</span>
          </p>
          <p className="text-green-100 text-sm mb-2">
            <span className="text-green-100">- on Customs, Lighthouse, Shoreline & Woods</span>
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Cultists 20/25%:</span>
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="text-green-100">- on Customs, Shoreline & Woods</span>
          </p>
        </div>

        {/* PvE Section */}
        <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-green-400" />
            <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">
              PvE Mode
            </h3>
          </div>
          <p className="text-green-100 text-base font-bold mb-2">
            <span className="font-semibold text-green-200">
              Main bosses <span className="font-bold text-green-100">{"~"}75%</span>
            </span>{" "}
            on their respective maps
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Goons 40%:</span>
          </p>
          <p className="text-green-100 text-sm mb-2">
            <span className="text-green-100">- on Customs, Lighthouse, Shoreline & Woods</span>
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Cultists 20/25%:</span>
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="text-green-100">- on Customs, Shoreline & Woods</span>
          </p>
        </div>
      </div>
    </div>
  );
}
