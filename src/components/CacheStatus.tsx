import { useEffect, useState } from "react"

interface CacheStatusProps {
  mode: "regular" | "pve"
  onExpired?: () => void
}

const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds

export function CacheStatus({ mode, onExpired }: CacheStatusProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    const updateTimer = () => {
      const timestamp = parseInt(localStorage.getItem(`maps_${mode}_timestamp`) || "0")
      const now = Date.now()
      const remaining = Math.max(0, CACHE_EXPIRY_TIME - (now - timestamp))
      
      setTimeLeft(remaining)
      
      if (remaining === 0 && onExpired) {
        onExpired()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [mode, onExpired])

  const minutes = Math.floor(timeLeft / 60000)
  const seconds = Math.floor((timeLeft % 60000) / 1000)

  const displayMode = mode === "regular" ? "PVP" : mode.toUpperCase()

  return (
    <div className="text-xs text-gray-400">
      {displayMode}: {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  )
} 