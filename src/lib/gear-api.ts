import { GameMode, ResolvedItem } from "@/types";

const TARKOV_GRAPHQL_URL = "https://api.tarkov.dev/graphql";
const MAX_BATCH_SIZE = 100;
const itemCache = new Map<string, ResolvedItem>();

interface GraphQlItem {
  id: string;
  name: string;
  shortName?: string | null;
  iconLink?: string | null;
  link?: string | null;
  types?: string[] | null;
  usedInTasks?: Array<{ id: string; name: string }> | null;
  properties?: {
    __typename?: string;
    class?: number | null;
    caliber?: string | null;
    damage?: number | null;
    penetrationPower?: number | null;
  } | null;
}

interface GraphQlResponse {
  data?: { items?: GraphQlItem[] | null };
  errors?: Array<{ message?: string }>;
}

const ITEM_QUERY = `
  query ResolveBossItems($ids: [ID], $mode: GameMode) {
    items(ids: $ids, lang: en, gameMode: $mode) {
      id
      name
      shortName
      iconLink
      link
      types
      usedInTasks { id name }
      properties {
        __typename
        ... on ItemPropertiesArmor { class }
        ... on ItemPropertiesChestRig { class }
        ... on ItemPropertiesHelmet { class }
        ... on ItemPropertiesAmmo {
          caliber
          damage
          penetrationPower
        }
      }
    }
  }
`;

function cacheKey(mode: GameMode, itemId: string): string {
  return `${mode}:${itemId}`;
}

function normalizeItem(item: GraphQlItem): ResolvedItem {
  const isAmmo = item.properties?.__typename === "ItemPropertiesAmmo";

  return {
    id: item.id,
    name: item.name,
    shortName: item.shortName,
    iconLink: item.iconLink,
    link: item.link,
    types: item.types ?? [],
    usedInTasks: item.usedInTasks ?? [],
    armorClass:
      typeof item.properties?.class === "number" ? item.properties.class : null,
    ammo: isAmmo
      ? {
          caliber: item.properties?.caliber,
          damage: item.properties?.damage,
          penetrationPower: item.properties?.penetrationPower,
        }
      : null,
  };
}

async function fetchBatch(ids: string[], mode: GameMode): Promise<ResolvedItem[]> {
  const response = await fetch(TARKOV_GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ITEM_QUERY, variables: { ids, mode } }),
  });

  if (!response.ok) {
    throw new Error(`Item details request failed (${response.status})`);
  }

  const result = (await response.json()) as GraphQlResponse;
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message).filter(Boolean).join("; "));
  }

  return (result.data?.items ?? []).map(normalizeItem);
}

export async function resolveItems(
  itemIds: string[],
  mode: GameMode,
  options?: { retry?: boolean }
): Promise<Record<string, ResolvedItem>> {
  const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)));
  const missingIds = uniqueIds.filter(
    (id) => options?.retry || !itemCache.has(cacheKey(mode, id))
  );

  for (let index = 0; index < missingIds.length; index += MAX_BATCH_SIZE) {
    const items = await fetchBatch(
      missingIds.slice(index, index + MAX_BATCH_SIZE),
      mode
    );
    for (const item of items) {
      itemCache.set(cacheKey(mode, item.id), item);
    }
  }

  return Object.fromEntries(
    uniqueIds.flatMap((id) => {
      const item = itemCache.get(cacheKey(mode, id));
      return item ? [[id, item] as const] : [];
    })
  );
}
