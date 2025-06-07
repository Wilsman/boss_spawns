"use client";
import { useState, useEffect } from "react";
import { differenceInSeconds, intervalToDuration, isPast } from "date-fns";
import type { Duration } from "date-fns";
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
    .filter(part => part.value !== undefined && part.value !== null && part.value > 0)
    .map(part => `${String(part.value).padStart(2, '0')}${part.unit}`)
    .join(" ");
}

interface BossNoticeProps {
  bossNames: string[];
  startDate: Date;
  durationSeconds: number;
  eventTitle?: string;
  eventDescription?: string;
  mapName?: string;
  mapWiki?: string;
  spawnLocationsText?: string;
}

interface BossDetail {
  name: string;
  imageUrl?: string;
}

export function BossNotice({
  bossNames,
  startDate,
  durationSeconds,
  eventTitle,
  eventDescription,
  mapName: propMapName,
  mapWiki: propMapWiki,
  spawnLocationsText: propSpawnLocationsText,
}: BossNoticeProps) {
  const [now, setNow] = useState(new Date());
  const [bossesDetails, setBossesDetails] = useState<BossDetail[]>([]);
  
  const [displayMapName, setDisplayMapName] = useState<string | undefined>(propMapName);
  const [displayMapWiki, setDisplayMapWiki] = useState<string | undefined>(propMapWiki);
  const [displaySpawnLocations, setDisplaySpawnLocations] = useState<string | undefined>(propSpawnLocationsText);

  useEffect(() => {
    const fetchBossData = async () => {
      // Initialize details with boss names first
      let details: BossDetail[] = bossNames.map(name => ({ name, imageUrl: undefined }));
      let fetchedMapName: string | undefined = undefined;
      let fetchedMapWiki: string | undefined = undefined;
      let fetchedSpawnLocationsText: string | undefined = undefined;

      try {
        const cached = localStorage.getItem("maps_combined");
        if (cached) {
          const { data } = JSON.parse(cached);
          const allMapsData = [...(data?.regular || []), ...(data?.pve || [])];

          // Attempt to update details with images and fetch map info
          details = details.map((bossDetail, index) => {
            let foundBossImage: string | undefined = bossDetail.imageUrl; // Keep existing if any (though it's undefined initially here)
            for (const map of allMapsData) {
              if (map.bosses) {
                for (const bossEncounter of map.bosses) {
                  if (bossEncounter.boss.name === bossDetail.name) {
                    foundBossImage = bossEncounter.boss.imagePortraitLink ?? undefined;
                    // If this is the first boss (index 0) and prop map details aren't set, fetch them
                    if (index === 0 && !propMapName) {
                      fetchedMapName = map.name;
                      fetchedMapWiki = map.wiki;
                      fetchedSpawnLocationsText = (bossEncounter.spawnLocations || []).map((loc: {name: string}) => loc.name).join(", ");
                    }
                    break; // Found boss image for this bossDetail.name
                  }
                }
              }
              if (foundBossImage && (propMapName || index !== 0)) break; // Found image, and if not first boss or map details are from props, move to next bossDetail
            }
            return { ...bossDetail, imageUrl: foundBossImage };
          });
        } else {
          // localStorage is empty, details already contains names with undefined images
          console.log("BossNotice: maps_combined cache is empty. Displaying names only.");
        }
      } catch (e) {
        console.error("Error processing boss data from cache:", e);
        // On error, details still contains names with undefined images from initial mapping
      }
      setBossesDetails(details);
      // The rest of the function (setting displayMapName etc.) remains the same
      if (!propMapName) {
        setDisplayMapName(fetchedMapName);
        setDisplayMapWiki(fetchedMapWiki);
        setDisplaySpawnLocations(fetchedSpawnLocationsText);
      } else {
        setDisplayMapName(propMapName);
        setDisplayMapWiki(propMapWiki);
        setDisplaySpawnLocations(propSpawnLocationsText);
      }
    };

    fetchBossData();
  }, [bossNames, propMapName, propMapWiki, propSpawnLocationsText]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
  const secondsLeft = Math.max(0, differenceInSeconds(endDate, now));
  const timeUntilStartSeconds = Math.max(0, differenceInSeconds(startDate, now));
  const isExpired = secondsLeft <= 0 && isPast(endDate);
  const isActive = timeUntilStartSeconds <= 0 && !isExpired;

  let countdownDuration: Duration;
  if (timeUntilStartSeconds > 0) {
    countdownDuration = intervalToDuration({ start: 0, end: timeUntilStartSeconds * 1000 });
  } else {
    countdownDuration = intervalToDuration({ start: 0, end: secondsLeft * 1000 });
  }
  
  const displayBossNames = bossesDetails.map(b => b.name).join(" & ");

  return (
    <div
      className={cn(
        "w-full bg-gradient-to-br from-purple-950/80 to-gray-900/80 border border-purple-800/40 rounded-lg px-3 py-3 mt-3 flex flex-col items-center shadow-md",
        (isExpired || (!isActive && timeUntilStartSeconds <=0)) && "opacity-60" // Dim if expired or past start but not active (e.g. duration was 0)
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-1 mb-2">
        <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
          {eventTitle || (isActive ? "Current Event" : isExpired ? "Event Expired" : "Upcoming Event")}
        </span>
      </div>

      {bossesDetails.length > 0 && (
        <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-2">
          {bossesDetails.map((bossDetail) =>
            bossDetail.imageUrl ? (
              <img
                key={bossDetail.name}
                src={bossDetail.imageUrl}
                alt={bossDetail.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover border border-purple-700/50 shadow-sm"
              />
            ) : (
              <div key={bossDetail.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md bg-gray-700 flex items-center justify-center text-xs text-gray-400 border-purple-700/50 shadow-sm">
                {bossDetail.name}
              </div>
            )
          )}
        </div>
      )}

      <span className="text-2xl sm:text-3xl font-extrabold text-purple-200 drop-shadow-sm mb-1 text-center">
        {displayBossNames}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-base text-gray-200 tracking-wider text-center">
          <div className="flex flex-col items-center">
            {eventDescription && (
              <div className="mb-0.5">{eventDescription}</div>
            )}
            {!isExpired && (
              <div className="flex items-center justify-center gap-1">
                <span>
                  {timeUntilStartSeconds > 0
                    ? `Starts in: ~${formatPaddedDuration(countdownDuration)}`
                    : `Time left: ~${formatPaddedDuration(countdownDuration)}`}
                </span>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-purple-400 hover:text-purple-300 cursor-help" />
                  <div className="hidden group-hover:block absolute z-10 w-64 p-2 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 border border-purple-700 rounded-md text-xs text-gray-200">
                    The countdown is an estimate. BSG may change boss spawns or event timings.
                  </div>
                </div>
              </div>
            )}
            {isExpired && !eventDescription && ( // Only show these if eventDescription is NOT present
              (bossNames.includes("Killa") && bossNames.includes("Tagilla")) ? (
                <div className="flex flex-col items-center text-center text-sm">
                  <span>
                    Hints at <span className="font-bold text-purple-300">Killa</span> and{" "}
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
                "Event has ended."
              )
            )}
          </div>
        </span>
      </div>

      {(displayMapName || displaySpawnLocations) && (
        <div className="text-xs text-purple-400 mt-2 text-center space-y-0.5">
          {displayMapName && (
            <div>
              on{" "}
              {displayMapWiki ? (
                <a
                  href={displayMapWiki}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-purple-300 underline hover:text-purple-400"
                >
                  {displayMapName}
                </a>
              ) : (
                <span className="font-bold text-purple-300">{displayMapName}</span>
              )}
            </div>
          )}
          {displaySpawnLocations && (
            <div>at <span className="font-bold text-purple-300">{displaySpawnLocations}</span></div>
          )}
        </div>
      )}
    </div>
  );
}