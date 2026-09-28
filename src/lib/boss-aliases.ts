const BOSS_ALIAS_MAP = {
  bossbully: "Reshala",
  boar: "Kaban",
  kojaniy: "Shturman",
  goons: "Knight (Goons)",
  knight: "Knight (Goons)",
  knightgoons: "Knight (Goons)",
  arenafighter: "Arena Fighter",
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

// The boss filter holds an exact dropdown name ("Black Div") or, from older
// links, part of a name ("goons"). When it names a boss in the loaded data,
// match only that boss so "Black Div" does not also bring in Black Division
// or Black Div. Raider; otherwise keep matching by substring.
export function isExactBossFilter(
  filter: string,
  bosses: Iterable<{ name: string; spawnChance?: number }>
): boolean {
  if (!filter) return false;
  for (const { name, spawnChance } of bosses) {
    if (bossEqualsFilter(name, filter, spawnChance)) return true;
  }
  return false;
}

export function bossMatchesFilter(
  name: string,
  filter: string,
  spawnChance?: number,
  exact = false
): boolean {
  if (!filter) return true;
  return exact
    ? bossEqualsFilter(name, filter, spawnChance)
    : bossMatchesQuery(name, filter, spawnChance);
}

function bossEqualsFilter(
  name: string,
  filter: string,
  spawnChance?: number
): boolean {
  const filterLower = filter.toLowerCase();
  const normalizedFilter = sanitizeBossToken(filter);
  return getBossSearchTokens(name, spawnChance).some(
    (token) => token === filterLower || token === normalizedFilter
  );
}
