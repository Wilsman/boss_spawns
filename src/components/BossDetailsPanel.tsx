import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  PackageOpen,
  Swords,
} from "lucide-react";
import { resolveItems } from "@/lib/gear-api";
import {
  Boss,
  GameMode,
  MobCatalog,
  MobCatalogEntry,
  MobEquipmentPoolItem,
  ResolvedItem,
} from "@/types";

type DetailTab = "spawns" | "equipment" | "loot";

interface BossDetailsPanelProps {
  bossName: string;
  encounters: Boss[];
  catalog: MobCatalog;
  mode: GameMode;
}

interface DisplayItem {
  item: ResolvedItem;
  prevalence?: number;
  slot?: string;
}

const TAB_LABELS: Array<{ key: DetailTab; label: string }> = [
  { key: "spawns", label: "Spawns" },
  { key: "equipment", label: "Weapons & Armor" },
  { key: "loot", label: "Loot" },
];

function percent(value: number): string {
  const result = value * 100;
  return `${result < 1 && result > 0 ? result.toFixed(2) : result.toFixed(0)}%`;
}

function prevalencePercent(value: number): string {
  return `${value < 1 && value > 0 ? value.toFixed(2) : value.toFixed(value < 10 ? 1 : 0)}%`;
}

function formatSpawnTime(seconds?: number | null): string {
  if (seconds === -1) return "Raid start";
  if (typeof seconds !== "number") return "Time not supplied";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function encounterSignature(encounter: Boss): string {
  return JSON.stringify({
    chance: encounter.spawnChance,
    time: encounter.spawnTime,
    random: encounter.spawnTimeRandom,
    trigger: encounter.spawnTrigger,
    switchId: encounter.switchId,
    locations: [...encounter.spawnLocations]
      .map(({ name, chance }) => ({ name, chance }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    escorts: [...(encounter.escorts ?? [])]
      .map((escort) => ({
        key: escort.mobKey ?? escort.boss.name,
        amount: [...escort.amount].sort((left, right) => left.count - right.count),
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
  });
}

function groupedEncounters(encounters: Boss[]): Array<{ encounter: Boss; count: number }> {
  const groups = new Map<string, { encounter: Boss; count: number }>();
  for (const encounter of encounters) {
    const signature = encounterSignature(encounter);
    const group = groups.get(signature);
    groups.set(signature, group ? { ...group, count: group.count + 1 } : { encounter, count: 1 });
  }
  return Array.from(groups.values());
}

function SpawnDetails({ encounters }: { encounters: Boss[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {groupedEncounters(encounters).map(({ encounter, count }, index) => (
        <article
          key={`${encounterSignature(encounter)}-${index}`}
          className="rounded-xl border border-white/[0.08] bg-slate-950/35 p-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-white">Encounter {index + 1}</span>
            {count > 1 && (
              <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-sky-200">
                {count} identical instances
              </span>
            )}
            <span className="ml-auto text-slate-300">
              {percent(encounter.spawnChance)} spawn
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-300">
            <span className="rounded bg-slate-800/80 px-2 py-1">
              {formatSpawnTime(encounter.spawnTime)}
              {encounter.spawnTimeRandom ? " · random timing" : ""}
            </span>
            {encounter.spawnTrigger && (
              <span className="rounded bg-amber-400/10 px-2 py-1 text-amber-100">
                Trigger: {encounter.spawnTrigger}
              </span>
            )}
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Locations
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {encounter.spawnLocations.length ? (
                encounter.spawnLocations.map((location, locationIndex) => (
                  <span
                    key={`${location.name}-${locationIndex}`}
                    className="rounded-md border border-white/[0.07] bg-slate-900/70 px-2 py-1 text-xs text-slate-200"
                  >
                    {location.name} · {percent(location.chance)}
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-slate-500">No specific location</span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Followers
            </p>
            {(encounter.escorts ?? []).length ? (
              <div className="mt-1 space-y-1.5">
                {encounter.escorts!.map((escort, escortIndex) => (
                  <div
                    key={`${escort.mobKey ?? escort.boss.name}-${escortIndex}`}
                    className="rounded-md bg-slate-900/60 px-2 py-1.5 text-xs"
                  >
                    <span className="font-medium text-slate-100">{escort.boss.name}</span>
                    <span className="ml-2 text-slate-400">
                      {escort.amount
                        .map(({ count: escortCount, chance }) =>
                          typeof chance === "number"
                            ? `×${escortCount} ${percent(chance)}`
                            : `×${escortCount}`
                        )
                        .join(" · ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">No followers supplied.</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function uniqueDisplayItems(items: DisplayItem[]): DisplayItem[] {
  return Array.from(new Map(items.map((entry) => [entry.item.id, entry])).values());
}

function ItemCard({ display }: { display: DisplayItem }) {
  const { item, prevalence, slot } = display;
  const isCarrier = item.types.some((type) => ["armor", "rig"].includes(type.toLowerCase()));
  const isHelmet = item.types.some((type) => type.toLowerCase() === "helmet");

  return (
    <article className="flex min-w-0 gap-2 rounded-lg border border-white/[0.07] bg-slate-900/65 p-2">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-black/25">
        {item.iconLink ? (
          <img src={item.iconLink} alt="" loading="lazy" className="max-h-11 max-w-11 object-contain" />
        ) : (
          <PackageOpen size={19} className="text-slate-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex gap-1">
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-100" title={item.name}>
            {item.name}
          </p>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${item.name} on Tarkov.dev`}
              className="shrink-0 text-slate-500 hover:text-sky-300"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {typeof item.armorClass === "number"
            ? `Class ${item.armorClass}`
            : item.ammo
            ? `Pen ${item.ammo.penetrationPower ?? "?"} · Damage ${item.ammo.damage ?? "?"}`
            : slot ?? item.types[0] ?? "Item"}
        </p>
        {isCarrier && !isHelmet && (
          <p className="mt-0.5 text-[9px] leading-tight text-amber-200/70">
            Fitted plate class unavailable
          </p>
        )}
        {typeof prevalence === "number" && (
          <p className="mt-0.5 text-[10px] text-sky-200/80">
            Estimated {prevalencePercent(prevalence)}
          </p>
        )}
        {item.usedInTasks.length > 0 && (
          <p className="mt-0.5 text-[9px] font-medium text-emerald-300">Used in quests</p>
        )}
      </div>
    </article>
  );
}

function ProgressiveSection({
  title,
  items,
  allowZeroPrevalence = false,
}: {
  title: string;
  items: DisplayItem[];
  allowZeroPrevalence?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(8);
  const [showComplete, setShowComplete] = useState(false);
  const defaultItems = allowZeroPrevalence
    ? items.filter((entry) => (entry.prevalence ?? 1) > 0)
    : items;
  const displayedPool = showComplete ? items : defaultItems;

  if (!items.length) return null;

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h4>
        <span className="text-[10px] text-slate-500">
          {displayedPool.length} {displayedPool.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {displayedPool.slice(0, visibleCount).map((display) => (
          <ItemCard key={display.item.id} display={display} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibleCount < displayedPool.length && (
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 12)}
            className="rounded-md border border-slate-600/60 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Show 12 more
          </button>
        )}
        {allowZeroPrevalence && !showComplete && defaultItems.length < items.length && (
          <button
            type="button"
            onClick={() => setShowComplete(true)}
            className="rounded-md px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            Show complete category ({items.length - defaultItems.length} zero-estimate)
          </button>
        )}
      </div>
    </section>
  );
}

function slotLabel(slot: string): string {
  const labels: Record<string, string> = {
    FirstPrimaryWeapon: "Primary weapons",
    SecondPrimaryWeapon: "Secondary weapons",
    Holster: "Holster weapons",
    Scabbard: "Melee weapons",
  };
  return labels[slot] ?? slot.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function EquipmentDetails({
  entry,
  resolved,
}: {
  entry: MobCatalogEntry;
  resolved: Record<string, ResolvedItem>;
}) {
  const weaponSlots = ["FirstPrimaryWeapon", "SecondPrimaryWeapon", "Holster", "Scabbard"];
  const weaponSections = weaponSlots.map((slot) => ({
    title: slotLabel(slot),
    items: uniqueDisplayItems(
      entry.equipment
        .filter((option) => option.slot === slot && resolved[option.itemId])
        .map((option) => ({ item: resolved[option.itemId], slot: slotLabel(slot) }))
    ),
  }));
  const protection = uniqueDisplayItems(
    entry.equipment
      .filter((option) =>
        ["ArmorVest", "TacticalVest", "Headwear"].includes(option.slot)
      )
      .filter((option) => resolved[option.itemId])
      .map((option) => ({ item: resolved[option.itemId], slot: slotLabel(option.slot) }))
  );
  const ammoIds = Array.from(new Set(entry.equipment.flatMap((option) => option.ammoIds)));
  const ammunition = ammoIds
    .filter((itemId) => resolved[itemId])
    .map((itemId) => ({ item: resolved[itemId] }));

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-lg border border-sky-400/15 bg-sky-400/[0.05] p-2 text-xs text-slate-400">
        <Swords size={16} className="shrink-0 text-sky-300" />
        Equipment choices are deduplicated options. The API does not provide reliable equipment probabilities.
      </div>
      {weaponSections.map((section) => (
        <ProgressiveSection key={section.title} title={section.title} items={section.items} />
      ))}
      <ProgressiveSection title="Armor, armored rigs & helmets" items={protection} />
      <ProgressiveSection title="Notable ammunition" items={ammunition} />
      {!weaponSections.some((section) => section.items.length) && !protection.length && !ammunition.length && (
        <p className="py-6 text-center text-sm text-slate-500">No weapon or protection pool supplied.</p>
      )}
    </div>
  );
}

function matchesType(item: ResolvedItem, types: string[]): boolean {
  return item.types.some((type) => types.includes(type.toLowerCase()));
}

function LootDetails({
  entry,
  resolved,
}: {
  entry: MobCatalogEntry;
  resolved: Record<string, ResolvedItem>;
}) {
  const all = entry.loot
    .filter((poolItem) => resolved[poolItem.itemId])
    .map((poolItem) => ({ item: resolved[poolItem.itemId], prevalence: poolItem.prevalence }))
    .sort((left, right) => (right.prevalence ?? 0) - (left.prevalence ?? 0));
  const featured = all.filter(
    ({ item }) => matchesType(item, ["keys"]) || item.usedInTasks.length > 0
  ).sort((left, right) => {
    const leftKey = matchesType(left.item, ["keys"]) ? 1 : 0;
    const rightKey = matchesType(right.item, ["keys"]) ? 1 : 0;
    return rightKey - leftKey || (right.prevalence ?? 0) - (left.prevalence ?? 0);
  });
  const featuredIds = new Set(featured.map(({ item }) => item.id));
  const remaining = all.filter(({ item }) => !featuredIds.has(item.id));
  const groups = [
    { title: "Medical & stims", types: ["meds", "injectors", "medical"] },
    { title: "Barter", types: ["barter"] },
    { title: "Grenades", types: ["grenade"] },
    { title: "Provisions", types: ["provisions", "food", "drink"] },
    { title: "Ammunition", types: ["ammo"] },
  ];
  const assigned = new Set<string>();
  const categorized = groups.map((group) => {
    const items = remaining.filter(
      ({ item }) => !assigned.has(item.id) && matchesType(item, group.types)
    );
    items.forEach(({ item }) => assigned.add(item.id));
    return { ...group, items };
  });
  const other = remaining.filter(({ item }) => !assigned.has(item.id));

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.05] p-2 text-xs text-slate-400">
        <AlertTriangle size={16} className="shrink-0 text-amber-300" />
        Loot prevalence is estimated. Tarkov.dev warns that boss equipment and item pools may be inaccurate.
      </div>
      <ProgressiveSection title="Featured keys & quest-use items" items={featured} allowZeroPrevalence />
      {categorized.map((group) => (
        <ProgressiveSection key={group.title} title={group.title} items={group.items} allowZeroPrevalence />
      ))}
      <ProgressiveSection title="Other loot" items={other} allowZeroPrevalence />
      {!all.length && (
        <p className="py-6 text-center text-sm text-slate-500">No carried-item pool supplied.</p>
      )}
    </div>
  );
}

function itemIdsForTab(entry: MobCatalogEntry, tab: DetailTab): string[] {
  if (tab === "equipment") {
    return entry.equipment.flatMap((option: MobEquipmentPoolItem) => [option.itemId, ...option.ammoIds]);
  }
  return tab === "loot" ? entry.loot.map((item) => item.itemId) : [];
}

export function BossDetailsPanel({ bossName, encounters, catalog, mode }: BossDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("spawns");
  const units = useMemo(() => {
    const keys = new Set<string>();
    for (const encounter of encounters) {
      if (encounter.mobKey) keys.add(encounter.mobKey);
      for (const escort of encounter.escorts ?? []) {
        if (escort.mobKey) keys.add(escort.mobKey);
      }
    }
    return Array.from(keys).flatMap((key) => (catalog[key] ? [catalog[key]] : []));
  }, [catalog, encounters]);
  const [selectedKey, setSelectedKey] = useState(units[0]?.key ?? "");
  const [resolved, setResolved] = useState<Record<string, ResolvedItem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const selected = catalog[selectedKey] ?? units[0];

  useEffect(() => {
    if (!units.some((unit) => unit.key === selectedKey)) {
      setSelectedKey(units[0]?.key ?? "");
    }
  }, [selectedKey, units]);

  useEffect(() => {
    if (!selected || activeTab === "spawns") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    resolveItems(itemIdsForTab(selected, activeTab), mode, { retry: retryCount > 0 })
      .then((items) => {
        if (!cancelled) setResolved(items);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Item details could not be loaded");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, mode, retryCount, selected]);

  return (
    <div className="border-t border-sky-300/10 bg-slate-950/30 px-3 pb-4 pt-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-700/70 bg-slate-950/60 p-1" role="tablist" aria-label={`${bossName} details`}>
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab !== "spawns" && units.length > 0 && (
          <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            Loadout for
            <select
              value={selected?.key ?? ""}
              onChange={(event) => setSelectedKey(event.target.value)}
              className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-slate-100"
            >
              {units.map((unit) => (
                <option key={unit.key} value={unit.key}>{unit.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-4" role="tabpanel">
        {activeTab === "spawns" ? (
          <SpawnDetails encounters={encounters} />
        ) : !selected ? (
          <p className="py-6 text-center text-sm text-slate-500">No mob catalog entry is available.</p>
        ) : loading ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading item details">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-slate-800/60" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-400/20 bg-red-950/20 p-3 text-sm text-red-200">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-2 rounded border border-red-300/30 px-2 py-1 text-xs hover:bg-red-900/30">
              Retry item details
            </button>
          </div>
        ) : activeTab === "equipment" ? (
          <EquipmentDetails key={selected.key} entry={selected} resolved={resolved} />
        ) : (
          <LootDetails key={selected.key} entry={selected} resolved={resolved} />
        )}
      </div>
    </div>
  );
}
