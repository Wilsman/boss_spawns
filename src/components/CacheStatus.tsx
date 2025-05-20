import { useEffect, useState, useCallback } from "react"

interface CacheStatusProps {
  onExpired?: () => void
}

export function CacheStatus({ onExpired }: CacheStatusProps) {
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(new Date())

  const calculateNextRefresh = useCallback((currentTime: Date): Date => {
    const nextRefresh = new Date(currentTime)
    const currentMinutes = currentTime.getMinutes()
    const minutesToAdd = 5 - (currentMinutes % 5)
    nextRefresh.setMinutes(currentMinutes + minutesToAdd, 0, 0)
    return nextRefresh
  }, [])

  const handleExpiredTimer = useCallback((currentTime: Date) => {
    const newNextRefresh = calculateNextRefresh(currentTime)
    setNextRefreshTime(newNextRefresh)
    onExpired?.()
  }, [onExpired, calculateNextRefresh])

  const updateTimerState = useCallback((nextRefresh: Date) => {
    setNextRefreshTime(nextRefresh)
  }, [])

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const nextRefresh = calculateNextRefresh(now)
      const timeUntilNextRefresh = nextRefresh.getTime() - now.getTime()
      
      if (timeUntilNextRefresh <= 0) {
        handleExpiredTimer(now)
      } else {
        updateTimerState(nextRefresh)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [calculateNextRefresh, handleExpiredTimer, updateTimerState])

  // Calculate time left based on current time and next refresh time
  const now = new Date()
  const timeUntilRefresh = nextRefreshTime.getTime() - now.getTime()
  const minutes = Math.max(0, Math.floor(timeUntilRefresh / 60000))
  const seconds = Math.max(0, Math.floor((timeUntilRefresh % 60000) / 1000))

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
