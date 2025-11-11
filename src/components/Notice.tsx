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
      <div className="flex flex-col items-center gap-1 mb-2">
        <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
          Boss Spawn Notice
        </span>
        <span className="text-xs text-purple-400/70">
          Updated: November 11, 2025
        </span>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* PvP Section */}
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-3 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="h-4 w-4 text-blue-400" />
            <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">PvP Mode</h3>
          </div>
          <p className="text-blue-100 text-sm mb-1">
            <span className="font-semibold text-blue-300">Knight (Goons)</span> added at <span className="font-bold text-blue-200">40%</span> on Customs, Lighthouse, Shoreline & Woods, <span className="font-bold text-blue-200">50%</span> on Lighthouse
          </p>
          <p className="text-blue-100 text-sm mb-1">
            <span className="font-semibold text-blue-300">Cultist Priest</span> buffed to <span className="font-bold text-blue-200">50%</span> on Shoreline, Customs, Woods, <span className="font-bold text-blue-200">30%</span> on Ground Zero (21+) & Woods (<span className="font-bold text-blue-200">25%</span>)
          </p>
          <p className="text-blue-100 text-sm mb-1">
            <span className="font-semibold text-blue-300">Main bosses <span className="font-bold text-blue-200">50%</span></span> across all maps
          </p>
          <p className="text-blue-100 text-xs opacity-80">
            Reshala, Tagilla, Sanitar, Shturman, Kollontay, Glukhar, Knight, Rogue (<span className="font-bold text-blue-200">80%</span>), Shadow of Tagilla (<span className="font-bold text-blue-200">100%</span>)
          </p>
        </div>

        {/* PvE Section */}
        <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3 h-full">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-green-400" />
            <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">PvE Mode</h3>
          </div>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Knight (Goons)</span> added at <span className="font-bold text-green-200">40%</span> on Customs, Lighthouse, Shoreline & Woods, <span className="font-bold text-green-200">50%</span> on Lighthouse
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Cultist Priest</span> buffed to <span className="font-bold text-green-200">50%</span> on Shoreline, Customs, Woods, <span className="font-bold text-green-200">30%</span> on Ground Zero (21+) & Woods (<span className="font-bold text-green-200">25%</span>)
          </p>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">Main bosses <span className="font-bold text-green-200">50%</span></span> across all maps
          </p>
          <p className="text-green-100 text-xs opacity-80">
            Reshala, Tagilla, Sanitar, Shturman, Kollontay, Glukhar (<span className="font-bold text-green-200">80%</span>), Knight, Rogue (<span className="font-bold text-green-200">80%</span>), Shadow of Tagilla (<span className="font-bold text-green-200">100%</span>)
          </p>
        </div>
      </div>
    </div>
  );
}
