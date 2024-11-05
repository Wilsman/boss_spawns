import { SpawnData } from "@/types"

export interface DataChange {
  map: string
  boss: string
  field: "spawnChance" | "location" | "status"
  oldValue: string
  newValue: string
  timestamp: number
  gameMode: "PvP" | "PvE"
}

export function diffData(oldData: SpawnData[], newData: SpawnData[], gameMode: "PvP" | "PvE"): DataChange[] {
  const changes: DataChange[] = []
  const timestamp = Date.now()

  // Create maps for faster lookups
  const oldBossMap = new Map<string, { spawnChance: number; locations: Set<string> }>()
  oldData?.forEach(map => {
    map.bosses.forEach(boss => {
      const key = `${map.normalizedName}-${boss.boss.normalizedName}`
      oldBossMap.set(key, {
        spawnChance: boss.spawnChance,
        locations: new Set(boss.spawnLocations.map(loc => loc.name))
      })
    })
  })

  // Compare new data with old data
  newData?.forEach(map => {
    map.bosses.forEach(boss => {
      const key = `${map.normalizedName}-${boss.boss.normalizedName}`
      const oldBoss = oldBossMap.get(key)

      if (!oldBoss) {
        changes.push({
          map: map.normalizedName,
          boss: boss.boss.normalizedName,
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
          boss: boss.boss.normalizedName,
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
            boss: boss.boss.normalizedName,
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

  return changes.sort((a, b) => b.timestamp - a.timestamp)
} 