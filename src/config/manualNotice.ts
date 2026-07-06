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
  mapRows: [
    {
      bossName: "Blackout",
      mapName: "TBA",
      value: "Coming soon",
      locations: "Waiting for the event to begin. Start date is currently unknown.",
    },
  ],
  modes: ["PvP", "PvE"],
  statusLine:
    "Waiting for the Blackout event to begin. Start date is currently unknown.",
  title: "Blackout Event Pending",
};
