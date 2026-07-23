import { GameMode, ResolvedItem } from "@/types";

const TARKOV_JSON_API_BASE_URL = "https://json.tarkov.dev";
const itemCache = new Map<string, ResolvedItem>();
const itemDataCache = new Map<GameMode, Promise<ItemData>>();

interface TarkovJsonItem {
  id: string;
  name: string;
  shortName?: string | null;
  iconLink?: string | null;
  link?: string | null;
  types?: string[] | null;
  usedInTasks?: Array<{ id: string; name: string }> | null;
  properties?: {
    propertiesType?: string;
    class?: number | null;
    caliber?: string | null;
    damage?: number | null;
    penetrationPower?: number | null;
  } | null;
}

interface TarkovJsonItemsResponse {
  data?: {
    items?: Record<string, TarkovJsonItem>;
  };
}

interface TarkovJsonTranslationsResponse {
  data?: Record<string, string>;
}

interface ItemData {
  items: Record<string, TarkovJsonItem>;
  translations: Record<string, string>;
}

function cacheKey(mode: GameMode, itemId: string): string {
  return `${mode}:${itemId}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Item details request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

async function loadItemData(mode: GameMode): Promise<ItemData> {
  const baseUrl = `${TARKOV_JSON_API_BASE_URL}/${mode}/items`;
  const [itemsResponse, translationsResponse] = await Promise.all([
    fetchJson<TarkovJsonItemsResponse>(baseUrl),
    fetchJson<TarkovJsonTranslationsResponse>(`${baseUrl}_en`),
  ]);
  const items = itemsResponse.data?.items;
  const translations = translationsResponse.data;

  if (!items || !translations) {
    throw new Error("Invalid tarkov.dev JSON items response");
  }

  return { items, translations };
}

async function getItemData(mode: GameMode, force = false): Promise<ItemData> {
  if (force) {
    itemDataCache.delete(mode);
  }

  const cached = itemDataCache.get(mode);
  if (cached) {
    return cached;
  }

  const request = loadItemData(mode);
  itemDataCache.set(mode, request);

  try {
    return await request;
  } catch (error) {
    if (itemDataCache.get(mode) === request) {
      itemDataCache.delete(mode);
    }
    throw error;
  }
}

function translate(
  value: string | null | undefined,
  translations: Record<string, string>
): string | null | undefined {
  return value ? translations[value] ?? value : value;
}

function normalizeItem(
  item: TarkovJsonItem,
  translations: Record<string, string>
): ResolvedItem {
  const isAmmo = item.properties?.propertiesType === "ItemPropertiesAmmo";

  return {
    id: item.id,
    name: translate(item.name, translations) ?? item.id,
    shortName: translate(item.shortName, translations),
    iconLink: item.iconLink,
    link: item.link,
    types: item.types ?? [],
    usedInTasks: (item.usedInTasks ?? []).map((task) => ({
      id: task.id,
      name: translate(task.name, translations) ?? task.name,
    })),
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

export async function resolveItems(
  itemIds: string[],
  mode: GameMode,
  options?: { retry?: boolean }
): Promise<Record<string, ResolvedItem>> {
  const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)));
  const missingIds = uniqueIds.filter(
    (id) => options?.retry || !itemCache.has(cacheKey(mode, id))
  );

  if (missingIds.length) {
    const { items, translations } = await getItemData(mode, options?.retry);

    for (const id of missingIds) {
      const item = items[id];
      if (item) {
        itemCache.set(cacheKey(mode, id), normalizeItem(item, translations));
      }
    }
  }

  return Object.fromEntries(
    uniqueIds.flatMap((id) => {
      const item = itemCache.get(cacheKey(mode, id));
      return item ? [[id, item] as const] : [];
    })
  );
}
