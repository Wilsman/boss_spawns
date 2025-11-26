"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function MaintenanceNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "w-full bg-gradient-to-br from-green-500/80 to-green-900/80 border border-green-100/40 rounded-lg px-4 py-4 mt-3 flex flex-col items-center text-center shadow-lg",
        "opacity-0 transition-opacity duration-5000 ease-in-out",
        "animate-[pulse_2s_ease-in-out_infinite]",
        isVisible && "opacity-100"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-1 mb-2">
        <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
          API Back Online
        </span>
        <span className="text-xs text-amber-200/80">
          Updated: November 26, 2025
        </span>
      </div>

      <p className="text-sm text-amber-50 leading-snug">
        API is back online. PvP and PvE boss data all back to normal! Now go enjoy dying to bosses 🫡
      </p>
    </div>
  );
}
