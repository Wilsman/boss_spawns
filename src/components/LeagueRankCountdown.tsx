import { useEffect, useState } from "react";

// League ranks change every 7 days. Anchor derived from the in-game
// "Time until rank change" timer (6d 12h 19m at 2026-09-28 08:41 UTC).
const RANK_CHANGE_ANCHOR_MS = Date.UTC(2026, 9, 4, 21, 0, 0);
const RANK_CHANGE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

function nextRankChange(now: number) {
  const periods = Math.ceil((now - RANK_CHANGE_ANCHOR_MS) / RANK_CHANGE_PERIOD_MS);
  const next = RANK_CHANGE_ANCHOR_MS + periods * RANK_CHANGE_PERIOD_MS;
  return next <= now ? next + RANK_CHANGE_PERIOD_MS : next;
}

function splitRemaining(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

export function LeagueRankCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  const next = nextRankChange(now);
  const { days, hours, minutes } = splitRemaining(next - now);

  return (
    <span
      className="whitespace-nowrap text-[11px] text-gray-500 sm:text-xs"
      title={`League rank change: ${new Date(next).toLocaleString()}`}
    >
      <span className="hidden sm:inline">League rank change in </span>
      <span className="sm:hidden">Rank </span>
      <time dateTime={new Date(next).toISOString()} className="font-medium tabular-nums text-gray-300">
        {days}d {hours}h<span className="hidden sm:inline"> {minutes}m</span>
      </time>
    </span>
  );
}
