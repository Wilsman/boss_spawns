import { useEffect, useState, useRef } from "react";
import { RefreshCcw } from "lucide-react";

interface CacheStatusProps {
  onExpired?: () => void;
  isRefreshing?: boolean;
}

export function CacheStatus({
  onExpired,
  isRefreshing = false,
}: CacheStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
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

  // Update time left every second
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
    };

    updateTimeLeft(); // Update immediately
    const intervalId = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(intervalId);
  }, [nextRefreshTime]);

  // Calculate minutes and seconds from timeLeft
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="text-xs text-gray-400 flex items-center gap-2">
      {isRefreshing ? (
        <>
          <RefreshCcw className="w-3 h-3 animate-spin text-purple-400" />
          <span className="text-purple-400">Refreshing data...</span>
        </>
      ) : (
        <>
          Next refresh at{" "}
          {nextRefreshTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}{" "}
          ({minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")})
        </>
      )}
    </div>
  );
}
