export interface ManualNoticeMapRow {
  bossName?: string;
  locations: string;
  mapName: string;
  value: string;
}

export interface ManualNoticeEvent {
  badgeLabel: string;
  bossDisplayName: string;
  changedAt?: string;
  id: string;
  imageUrl?: string;
  mapRows: ManualNoticeMapRow[];
  modes: string[];
  statusLine: string;
  title: string;
}

export interface ManualNoticeConfig {
  badgeLabel: string;
  events: ManualNoticeEvent[];
  title: string;
}

export const manualNotice: ManualNoticeConfig = {
  badgeLabel: "2 Live Events",
  events: [
    {
      badgeLabel: "Blackout",
      bossDisplayName: "Black Division",
      changedAt: "2026-07-14T13:15:03.710Z",
      id: "blackout",
      imageUrl: "https://assets.tarkov.dev/black-div-portrait.webp",
      mapRows: [
        {
          bossName: "Black Division",
          mapName: "Dark Labs",
          value: "100%",
          locations: "Active now",
        },
      ],
      modes: ["PvP", "PvE"],
      statusLine: "Black Division is active on Dark Labs.",
      title: "Blackout",
    },
    {
      badgeLabel: "100% Spawns",
      bossDisplayName: "Main Bosses & Goons",
      changedAt: "2026-07-29T12:35:20.884Z",
      id: "boss-spawns-100",
      mapRows: [
        {
          bossName: "Main Bosses & Goons",
          mapName: "Usual maps",
          value: "100%",
          locations: "Active now",
        },
      ],
      modes: ["PvP", "PvE"],
      statusLine:
        "Main bosses and the Goons are now 100% on their usual maps.",
      title: "100% Boss Spawns",
    },
  ],
  title: "Active Events",
};
