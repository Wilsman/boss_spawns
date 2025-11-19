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
        "w-full bg-gradient-to-br from-amber-900/80 to-gray-900/80 border border-amber-800/40 rounded-lg px-4 py-4 mt-3 flex flex-col items-center text-center shadow-lg",
        "opacity-0 transition-opacity duration-5000 ease-in-out",
        "animate-[pulse_2s_ease-in-out_infinite]",
        isVisible && "opacity-100"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-1 mb-2">
        <span className="text-xs text-amber-200 font-semibold uppercase tracking-wider">
          Boss Spawn Data - Updated
        </span>
        <span className="text-xs text-amber-200/80">Updated: November 20, 2025</span>
      </div>

      <p className="text-sm text-amber-50 leading-snug">
        {/* link on "tarkov-changes" https://x.com/LogicaISoIution/status/1991226574792757436?s=20 */}
        We have setup a temparay override with the lastest boss spawn data provided by <a href="https://x.com/LogicaISoIution/status/1991226574792757436?s=20" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">tarkov-changes</a> until the API is back online. 
        {/* boss data last updated: 20/11/2025 */}
        <p className="text-xs text-amber-200/80">Boss data last updated: November 20, 2025</p>
      </p>
    </div>
  );
}
