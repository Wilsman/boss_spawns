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
  badgeLabel: "Wild Wild Woods",
  bossDisplayName: "Shturman",
  changedAt: "2026-06-25T16:15:04.612Z",
  imageUrl: "https://assets.tarkov.dev/shturman-portrait.png",
  mapRows: [
    {
      bossName: "Shturman",
      mapName: "Woods",
      value: "100%",
      locations:
        "Wild Wild Woods event active until 29 June, 09:00 BST / 04:00 EDT.",
    },
  ],
  modes: ["PvP", "PvE"],
  statusLine:
    "Wild Wild Woods is live until 29 June, 09:00 BST / 04:00 EDT. Shturman is now spawning at 100% on Woods.",
  title: "Wild Wild Woods Event",
};
