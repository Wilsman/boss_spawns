"use client";
import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import type { Duration } from "date-fns"; // Ensure Duration type is imported correctly
import { cn } from "@/lib/utils";

// Helper function to format duration with leading zeros
function formatPaddedDuration(duration: Duration): string {
  const parts = [
    { value: duration.days, unit: "d" },
    { value: duration.hours, unit: "h" },
    { value: duration.minutes, unit: "m" },
    { value: duration.seconds, unit: "s" },
  ];

  return parts
    .filter(part => part.value !== undefined && part.value !== null) // Filter out undefined/null values
    .map(part => `${String(part.value).padStart(2, '0')}${part.unit}`)
    .join(" ");
}

interface BossNoticeProps {
  boss: string;
  start: Date;
  durationSeconds: number;
  bossImageUrl?: string;
  bossMapName?: string;
}

export function BossNotice({ boss, start, durationSeconds, bossImageUrl, bossMapName }: BossNoticeProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const end = new Date(start.getTime() + durationSeconds * 1000);
  const secondsLeft = Math.max(0, differenceInSeconds(end, now));
  const duration = intervalToDuration({ start: now, end });
  const isExpired = secondsLeft <= 0;

  return (
    <div
      className={cn(
        "w-full bg-gradient-to-br from-purple-950/80 to-gray-900/80 border border-purple-800/40 rounded-lg px-3 py-3 mt-3 flex flex-col items-center shadow-md",
        isExpired && "opacity-60"
      )}
      role="status"
      aria-live="polite"
    >
      <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider mb-2">
        Current 100% Boss Spawn
      </span>
      {bossImageUrl && (
        <img
          src={bossImageUrl}
          alt={boss}
          className="w-20 h-20 rounded-md object-cover mb-2 border border-purple-700/50 shadow-sm"
        />
      )}
      <span className="text-3xl font-extrabold text-purple-200 drop-shadow-sm mb-1 text-center">
        {boss}
      </span>
      <span className="text-base text-gray-200 tracking-wider mt-1">
        {isExpired
          ? "Rotation ending, boss switching soon™️"
          : formatPaddedDuration(duration)
        }
      </span>
      {bossMapName && (
        <span className="text-xs text-purple-400 mt-1">
          on {bossMapName}
        </span>
      )}
    </div>
  );
}
