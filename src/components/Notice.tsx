"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

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
          System Notice
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
        <span className="text-xl sm:text-2xl font-bold text-green-400 drop-shadow-sm text-center">
          API Back Online
        </span>
      </div>

      <div className="text-base text-gray-200 tracking-wider text-center space-y-3">
        <div className="mb-3">
          The API is now fully operational. All boss spawn data is up to date.
        </div>
        
        <div className="space-y-2">
          <div className="font-semibold text-purple-300">Current Status:</div>
          <div className="space-y-1">
            <div>
              <span className="font-bold text-green-400">PVE:</span>{" "}
              <span className="text-purple-200">100% Goons on Lighthouse</span>
            </div>
            <div>
              <span className="font-bold text-blue-400">PVP:</span>{" "}
              <span className="text-purple-200">All bosses 70% on their respective maps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
