export function getInfectedBossName(spawnChance: number) {
  return spawnChance < 1 ? "Infected(Tagilla)" : "Infected(Zombie)"
} 