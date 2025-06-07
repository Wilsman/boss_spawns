"use client";
import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import type { Duration } from "date-fns"; // Ensure Duration type is imported correctly
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

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
}

export function BossNotice({ boss, start, durationSeconds }: BossNoticeProps) {
  const [now, setNow] = useState(new Date());
  const [bossImageUrl, setBossImageUrl] = useState<string | undefined>(undefined);
  const [bossMapName, setBossMapName] = useState<string | undefined>(undefined);
  const [bossMapWiki, setBossMapWiki] = useState<string | undefined>(undefined);
  const [spawnLocations, setSpawnLocations] = useState<Array<{ name: string; chance: number }>>([]);

  // On mount or when boss changes, fetch from maps_regular
  useEffect(() => {
    try {
      const cached = localStorage.getItem("maps_combined");
      if (cached) {
        const { data } = JSON.parse(cached);
        if (data?.regular && data?.pve) {
          const maps = [...data.regular, ...data.pve];
          for (const map of maps) {
            if (map.bosses) {
              for (const bossEncounter of map.bosses) {
                if (bossEncounter.boss.name === boss) {
                  setBossImageUrl(bossEncounter.boss.imagePortraitLink ?? undefined);
                  setBossMapName(map.name);
                  setBossMapWiki(map.wiki);
                  setSpawnLocations(bossEncounter.spawnLocations || []);
                  return;
                }
              }
            }
          }
        }
      }
    } catch (e) {
      setBossImageUrl(undefined);
      setBossMapName(undefined);
      setSpawnLocations([]);
    }
  }, [boss]);

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
      <div className="flex flex-col items-center gap-2 mb-2">
        <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
          Current 100% Boss Spawn
        </span>
      </div>
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
      <div className="flex items-center gap-2">
        <div className="group relative">
          <HelpCircle className="w-4 h-4 text-purple-400 hover:text-purple-300 cursor-help" />
          <div className="hidden group-hover:block absolute z-10 w-64 p-2 -left-32 -top-20 bg-gray-900 border border-purple-700 rounded-md text-xs text-gray-200">
            The countdown is an estimate. BSG may change the boss at a random point during the day.
          </div>
        </div>
        <span className="text-base text-gray-200 tracking-wider">
          {isExpired ? (
            <div className="flex flex-col items-center text-center">
              <span>
                Hints at{" "}
                <span className="font-bold text-purple-300">Killa</span> and{" "}
                <span className="font-bold text-purple-300">Tagilla</span> both
                being <span className="font-bold text-purple-300">100%</span>{" "}
                during a tournament
              </span>
              <span className="mt-1">
                on <span className="font-bold">8th June, 12:00–17:00</span>{" "}
                (Moscow time)
              </span>
            </div>
          ) : (
            `~${formatPaddedDuration(duration)}`
          )}
        </span>
      </div>
      <div className="text-xs text-purple-400 mt-1 text-center space-y-1">
        {bossMapName && bossMapWiki && (
          <div>
            on{" "}
            <a
              href={bossMapWiki + "#Maps"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-purple-300 underline hover:text-purple-400"
            >
              {bossMapName}
            </a>
          </div>
        )}
        {bossMapName && !bossMapWiki && (
          <div>
            on <span className="font-bold">{bossMapName}</span>
          </div>
        )}
        {spawnLocations.length > 0 && (
          <div>at <span className="font-bold">{spawnLocations.map(loc => loc.name).join(", ")}</span></div>
        )}
      </div>
    </div>
  );
}
