import { useEffect, useState } from "react"

interface CacheStatusProps {
  onExpired?: () => void
}

export function CacheStatus({ onExpired }: CacheStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(() => {
    const now = new Date();
    const nextRefresh = new Date(now);
    const minutes = now.getMinutes();
    // Set to next 5-minute mark
    nextRefresh.setMinutes(Math.floor(minutes / 5) * 5 + 5, 0, 0);
    return nextRefresh;
  });

  // Update time left every second
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const newTimeLeft = Math.max(0, nextRefreshTime.getTime() - now.getTime());
      setTimeLeft(newTimeLeft);

      // Check if it's time to refresh
      if (newTimeLeft <= 0) {
        const newNextRefresh = new Date(nextRefreshTime);
        newNextRefresh.setMinutes(newNextRefresh.getMinutes() + 5);
        setNextRefreshTime(newNextRefresh);
        onExpired?.();
      }
    };

    updateTimeLeft(); // Update immediately
    const intervalId = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(intervalId);
  }, [nextRefreshTime, onExpired]);

  // Calculate minutes and seconds from timeLeft
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="text-xs text-gray-400">
      Next refresh at{" "}
      {nextRefreshTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })}{" "}
      ({minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")})
    </div>
  )
}
