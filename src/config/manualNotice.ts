export interface ManualNoticeMapRow {
  bossName?: string;
  locations: string;
  mapName: string;
  value: string;
}

export interface ManualNoticeConfig {
  badgeLabel: string;
  bossDisplayName: string;
  changedAt?: string;
  imageUrl?: string;
  mapRows: ManualNoticeMapRow[];
  modes: string[];
  statusLine: string;
  title: string;
}

export const manualNotice: ManualNoticeConfig = {
  badgeLabel: "Tarkov Hospitality",
  bossDisplayName: "Arena Fighter",
  changedAt: "2026-06-05T14:50:00.000Z",
  imageUrl: "https://assets.tarkov.dev/arenafighter-portrait.webp",
  mapRows: [
    {
      bossName: "Arena Fighter",
      mapName: "Customs",
      value: "100%",
      locations: "Dorms",
    },
    {
      bossName: "Arena Fighter",
      mapName: "Woods",
      value: "100%",
      locations: "Scav House/Checkpoint Road",
    },
    {
      bossName: "Arena Fighter",
      mapName: "Shoreline",
      value: "100%",
      locations: "Smuggler's Depot",
    },
  ],
  modes: ["PvP", "PvE"],
  statusLine:
    "Tarkov Hospitality event: Arena Fighter is now spawning at 100% on Customs, Woods, and Shoreline in PvP and PvE.",
  title: "Tarkov Hospitality: Arena Fighter Event",
};
