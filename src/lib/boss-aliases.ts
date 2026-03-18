const BOSS_ALIAS_MAP = {
  bossbully: "Reshala",
  boar: "Kaban",
  kojaniy: "Shturman",
} as const;

function sanitizeBossToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getInfectedBossName(spawnChance: number): string {
  return spawnChance < 1 ? "Infected(Tagilla)" : "Infected(Zombie)";
}

export function getCanonicalBossName(name: string, spawnChance?: number): string {
  if (name === "infected") {
    return getInfectedBossName(spawnChance ?? 1);
  }

  const normalizedToken = sanitizeBossToken(name);
  return BOSS_ALIAS_MAP[normalizedToken as keyof typeof BOSS_ALIAS_MAP] ?? name;
}

export function getBossSearchTokens(name: string, spawnChance?: number): string[] {
  const canonicalName = getCanonicalBossName(name, spawnChance);
  const rawName = name.trim();
  const tokens = new Set<string>([
    canonicalName.toLowerCase(),
    sanitizeBossToken(canonicalName),
  ]);

  if (rawName) {
    tokens.add(rawName.toLowerCase());
    tokens.add(sanitizeBossToken(rawName));
  }

  return Array.from(tokens).filter(Boolean);
}

export function bossMatchesQuery(
  name: string,
  query: string,
  spawnChance?: number
): boolean {
  if (!query) {
    return true;
  }

  const queryLower = query.toLowerCase();
  const normalizedQuery = sanitizeBossToken(query);

  return getBossSearchTokens(name, spawnChance).some(
    (token) => token.includes(queryLower) || token.includes(normalizedQuery)
  );
}
