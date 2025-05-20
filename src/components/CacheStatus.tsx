import { useEffect, useState } from "react"

interface CacheStatusProps {
  onExpired?: () => void
}

export function CacheStatus({ onExpired }: CacheStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(new Date())

  useEffect(() => {
    const calculateNextRefresh = () => {
      const now = new Date()
      // Calculate minutes until next 5-minute mark
      const nextRefresh = new Date(now)
      nextRefresh.setMinutes(
        Math.floor(now.getMinutes() / 5) * 5 + 5, // next multiple of 5
        0,
        0
      )
      return nextRefresh
    }

    const updateTimer = () => {
      const now = new Date()
      const nextRefresh = calculateNextRefresh()
      
      // If we've passed the next refresh time, calculate the next one
      if (now >= nextRefresh) {
        const newNextRefresh = new Date(nextRefresh)
        newNextRefresh.setMinutes(newNextRefresh.getMinutes() + 5)
        setNextRefreshTime(newNextRefresh)
        if (onExpired) onExpired()
      } else {
        setNextRefreshTime(nextRefresh)
      }
      
      const timeUntilNextRefresh = nextRefresh.getTime() - now.getTime()
      setTimeLeft(Math.max(0, timeUntilNextRefresh))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [onExpired])

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)

  return (
    <div className="text-xs text-gray-400">
      Next refresh at{" "}
      {nextRefreshTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}{" "}
      ({minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")})
    </div>
  )
}
