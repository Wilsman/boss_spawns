import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CacheStatusProps {
  mode: 'regular' | 'pve'
}

export function CacheStatus({ mode }: CacheStatusProps) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const cacheKey = `maps_${mode}`
    const interval = setInterval(() => {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { timestamp } = JSON.parse(cached)
        const expiryTime = timestamp + 5 * 60 * 1000 // 5 minutes
        const now = new Date().getTime()
        const distance = expiryTime - now

        if (distance < 0) {
          setTimeLeft('Expired')
          return
        }

        const minutes = Math.floor((distance / (1000 * 60)) % 60)
        const seconds = Math.floor((distance / 1000) % 60)
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setTimeLeft('No cache')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [mode])

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-purple-400" />
      <span className="text-sm font-medium text-gray-400">
        {mode.toUpperCase()} Cache:
        <span className="ml-2 text-purple-400">{timeLeft}</span>
      </span>
    </div>
  )
} 