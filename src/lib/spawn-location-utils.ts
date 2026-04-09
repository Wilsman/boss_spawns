interface BasicLocation {
  name: string;
  chance: number;
}

export function mergeSpawnLocations<T extends BasicLocation>(
  existingLocations: T[],
  incomingLocations: BasicLocation[]
): T[] {
  const merged = new Map<string, T>();

  existingLocations.forEach((location) => {
    merged.set(location.name, { ...location });
  });

  incomingLocations.forEach((location) => {
    const current = merged.get(location.name);

    if (!current) {
      merged.set(location.name, {
        ...(location as T),
      });
      return;
    }

    merged.set(location.name, {
      ...current,
      chance: Math.max(current.chance, location.chance),
    });
  });

  return Array.from(merged.values());
}
