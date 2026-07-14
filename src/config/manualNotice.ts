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
  badgeLabel: "Blackout",
  bossDisplayName: "Black Division & The Wedge",
  changedAt: "2026-07-14T13:15:03.710Z",
  imageUrl: "https://assets.tarkov.dev/black-div-portrait.webp",
  mapRows: [
    {
      bossName: "Black Division & The Wedge",
      mapName: "The Lab",
      value: "100%",
      locations: "Active now",
    },
  ],
  modes: ["PvP", "PvE"],
  statusLine: "Black Division and The Wedge are now active on The Lab at 100%.",
  title: "Blackout Event",
};
