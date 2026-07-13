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
  bossDisplayName: "TBA",
  imageUrl: "https://assets.tarkov.dev/black-div-portrait.webp",
  mapRows: [
    {
      bossName: "Blackout",
      mapName: "TBA",
      value: "Coming soon",
      locations:
        "Expected after patch maintenance ends (starts July 14 at 8:00 AM BST / 3:00 AM EST; 4–6 hours).",
    },
  ],
  modes: ["PvP", "PvE"],
  statusLine:
    "Expected after patch maintenance ends (starts July 14 at 8:00 AM BST / 3:00 AM EST; 4–6 hours).",
  title: "Blackout Event",
};
