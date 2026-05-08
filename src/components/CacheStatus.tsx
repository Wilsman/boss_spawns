import { useEffect, useState, useRef } from "react";
import { RefreshCcw } from "lucide-react";

interface CacheStatusProps {
  onExpired?: () => void;
  onManualRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  disabled?: boolean;
}

const MANUAL_REFRESH_COOLDOWN_MS = 60 * 1000;
const MANUAL_REFRESH_STORAGE_KEY = "boss_data_manual_refresh_at";

function getStoredManualRefreshTime() {
  const stored = localStorage.getItem(MANUAL_REFRESH_STORAGE_KEY);
  const parsed = stored ? Number(stored) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CacheStatus({
  onExpired,
  onManualRefresh,
  isRefreshing = false,
  disabled = false,
}: CacheStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [manualCooldownLeft, setManualCooldownLeft] = useState<number>(() =>
    Math.max(0, MANUAL_REFRESH_COOLDOWN_MS - (Date.now() - getStoredManualRefreshTime()))
  );
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(() => {
    const now = new Date();
    const nextRefresh = new Date(now);
    const minutes = now.getMinutes();
    // Set to next 5-minute mark
    nextRefresh.setMinutes(Math.floor(minutes / 5) * 5 + 5, 0, 0);
    return nextRefresh;
  });

  // Use ref to track if we've already triggered refresh for this cycle
  const hasTriggeredRef = useRef(false);

  // Stable callback ref to avoid dependency issues
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  // Update refresh countdowns every second
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const newTimeLeft = Math.max(
        0,
        nextRefreshTime.getTime() - now.getTime()
      );
      setTimeLeft(newTimeLeft);

      // Check if it's time to refresh (only trigger once per cycle)
      if (newTimeLeft <= 0 && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        const newNextRefresh = new Date(nextRefreshTime);
        newNextRefresh.setMinutes(newNextRefresh.getMinutes() + 5);
        setNextRefreshTime(newNextRefresh);
        onExpiredRef.current?.();
      } else if (newTimeLeft > 0) {
        // Reset the trigger flag when we have time left again
        hasTriggeredRef.current = false;
      }

      setManualCooldownLeft(
        Math.max(
          0,
          MANUAL_REFRESH_COOLDOWN_MS - (now.getTime() - getStoredManualRefreshTime())
        )
      );
    };

    updateTimeLeft(); // Update immediately
    const intervalId = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(intervalId);
  }, [nextRefreshTime]);

  // Calculate minutes and seconds from timeLeft
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const cooldownSeconds = Math.ceil(manualCooldownLeft / 1000);
  const canManualRefresh =
    Boolean(onManualRefresh) &&
    !disabled &&
    !isRefreshing &&
    manualCooldownLeft <= 0;

  const handleManualRefresh = async () => {
    if (!onManualRefresh || !canManualRefresh) return;

    const now = Date.now();
    localStorage.setItem(MANUAL_REFRESH_STORAGE_KEY, now.toString());
    setManualCooldownLeft(MANUAL_REFRESH_COOLDOWN_MS);

    await onManualRefresh();
    const nextRefresh = new Date();
    nextRefresh.setMinutes(nextRefresh.getMinutes() + 5, 0, 0);
    setNextRefreshTime(nextRefresh);
  };

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
      <div className="flex items-center gap-2">
        {isRefreshing ? (
          <>
            <RefreshCcw className="w-3 h-3 animate-spin text-purple-400" />
            <span className="text-purple-400">Refreshing data...</span>
          </>
        ) : (
          <span>
            Next refresh at{" "}
            {nextRefreshTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}{" "}
            ({minutes.toString().padStart(2, "0")}:
            {seconds.toString().padStart(2, "0")})
          </span>
        )}
      </div>

      {onManualRefresh && (
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={!canManualRefresh}
          title={
            cooldownSeconds > 0
              ? `Manual refresh available in ${cooldownSeconds}s`
              : "Refresh boss data now"
          }
          aria-label="Refresh boss data now"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-700/70 bg-gray-900/70 text-gray-400 transition-colors hover:border-purple-500/60 hover:text-purple-300 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-gray-700/70 disabled:hover:text-gray-400"
        >
          <RefreshCcw
            className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
