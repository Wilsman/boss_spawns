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
      </div>

      <div className="w-full space-y-4">
        {/* PvP Section */}
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Swords className="h-4 w-4 text-blue-400" />
            <h3 className="text-blue-300 font-semibold text-sm uppercase tracking-wider">PvP Mode</h3>
          </div>
          <p className="text-blue-100 text-sm">
            All bosses <span className="font-semibold text-blue-300">50%</span> on their respective maps
          </p>
        </div>

        {/* PvE Section */}
        <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-green-400" />
            <h3 className="text-green-300 font-semibold text-sm uppercase tracking-wider">PvE Mode</h3>
          </div>
          <p className="text-green-100 text-sm mb-1">
            <span className="font-semibold text-green-300">39% Goons</span> on Lighthouse
          </p>
          <p className="text-xs text-green-300/70">
            Goons Lighthouse spawn rate reduced, no new 100% boss 😖
          </p>
        </div>
      </div>
    </div>
  );
}
