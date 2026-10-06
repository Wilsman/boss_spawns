export interface ManualNoticeMapRow {
  bossName?: string;
  locations: string;
  mapName: string;
  value: string;
}

export interface ManualNoticeEvent {
  badgeLabel: string;
  bossDisplayName?: string;
  changedAt?: string;
  highlights?: string[];
  id: string;
  imageUrl?: string;
  linkLabel?: string;
  linkUrl?: string;
  mapRows?: ManualNoticeMapRow[];
  modes?: string[];
  statusLine?: string;
  summary?: string;
  title: string;
}

export interface ManualNoticeConfig {
  badgeLabel: string;
  events: ManualNoticeEvent[];
  title: string;
}

export const manualNotice: ManualNoticeConfig = {
  badgeLabel: "",
  events: [
    {
      badgeLabel: "PvE",
      changedAt: "2026-10-06",
      highlights: [
        "PMC bots start fights with Scavs and bosses more often.",
        "USEC and BEAR bots often team up; some stay neutral to you until you get close or shoot.",
        "PMC bots head for points of interest and task areas, including spots they used to skip.",
        "Every raid starts with PMC bots, in steadier numbers. The Labyrinth now has them too.",
        "Gear scales with bot level. The Lab gets more high-level PMC bots.",
        "Fixed Tagilla spawning next to players at the start of Factory raids.",
      ],
      id: "patch-1-2-0-0-ai",
      linkLabel: "Full patch notes",
      linkUrl: "https://telegra.ph/Patch-1200-10-06",
      summary:
        "PvE PMC bots now roam more, team up across factions and fight bosses more often.",
      title: "Patch 1.2.0.0: AI upgrade",
    },
  ],
  title: "Recent updates",
};
