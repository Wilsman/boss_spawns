import { getInfectedBossName } from "@/utils/boss-utils"
import { SpawnData } from "@/types"

export interface DataChange {
  map: string
  boss: string
  field: string
  oldValue: string
  newValue: string
  timestamp: number
  gameMode: string
}

export function diffData(oldData: SpawnData[], newData: SpawnData[], gameMode: "PvP" | "PvE"): DataChange[] {
  const changes: DataChange[] = []
  const timestamp = Date.now()

  // Create maps for faster lookups
  const oldBossMap = new Map<string, { spawnChance: number; locations: Set<string> }>()
  oldData?.forEach(map => {
    map.bosses.forEach(boss => {
      // Normalize the boss name for infected bosses
      const bossName = boss.boss.normalizedName === "infected"
        ? getInfectedBossName(boss.spawnChance)
        : boss.boss.normalizedName

      const key = `${map.normalizedName}-${bossName}`
      oldBossMap.set(key, {
        spawnChance: boss.spawnChance,
        locations: new Set(boss.spawnLocations.map(loc => loc.name))
      })
    })
  })

  // Compare new data with old data
  newData?.forEach(map => {
    map.bosses.forEach(boss => {
      // Normalize the boss name for infected bosses
      const bossName = boss.boss.normalizedName === "infected"
        ? getInfectedBossName(boss.spawnChance)
        : boss.boss.normalizedName

      const key = `${map.normalizedName}-${bossName}`
      const oldBoss = oldBossMap.get(key)

      if (!oldBoss) {
        changes.push({
          map: map.normalizedName,
          boss: bossName,
          field: "status",
          oldValue: "Not Present",
          newValue: "Added",
          timestamp,
          gameMode
        })
        return
      }

      // Check spawn chance changes
      if (oldBoss.spawnChance !== boss.spawnChance) {
        changes.push({
          map: map.normalizedName,
          boss: bossName,
          field: "spawnChance",
          oldValue: `${Math.round(oldBoss.spawnChance * 100)}%`,
          newValue: `${Math.round(boss.spawnChance * 100)}%`,
          timestamp,
          gameMode
        })
      }

      // Check location changes
      boss.spawnLocations.forEach(loc => {
        if (!oldBoss.locations.has(loc.name)) {
          changes.push({
            map: map.normalizedName,
            boss: bossName,
            field: "location",
            oldValue: "Not Present",
            newValue: loc.name,
            timestamp,
            gameMode
          })
        }
      })
    })
  })

  return changes
} 