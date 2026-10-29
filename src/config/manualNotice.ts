export interface ManualNoticeMapRow {
  bossName?: string;
  locations: string;
  mapName: string;
  value: string;
}

export interface ManualNoticeEvent {
  /** "start" counts down to the event start instead of its end. */
  countdownMode?: "start" | "end";
  badgeLabel: string;
  bossDisplayName?: string;
  changedAt?: string;
  /** ISO timestamp; shows a live countdown in the notice. */
  endsAt?: string;
  /** Thumbnail shown in the notice; click opens the full image. */
  enlargeImage?: { alt: string; src: string; thumbSrc?: string };
  /** Extra line shown in the countdown tooltip. */
  endsNote?: string;
  /** End time before an extension; marked on the progress bar. */
  originalEndsAt?: string;
  /** ISO timestamp; with endsAt, draws the event progress bar. */
  startsAt?: string;
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
      badgeLabel: "PvE and Season",
      bossDisplayName: "Infected",
      changedAt: "2026-10-29",
      highlights: [
        "Infected Screamer now spawns on almost every map: about 83-89% on most, 100% on Factory and Night Factory.",
        "Two new maps, Infected Lab and Infected Factory, are full of Infected and an Infected Tagilla.",
        "Tagilla is removed from Factory, Night Factory and Interchange. Partisan is removed from Customs, Woods, Shoreline and Lighthouse.",
        "Most regular boss spawn chances dropped by about 5-15 points.",
        "End date is not announced.",
      ],
      id: "halloween-infected-event",
      mapRows: [
        {
          bossName: "Infected + Infected Tagilla",
          locations: "Infected Tagilla: 75% in PvE, 100% in Season",
          mapName: "Infected Lab",
          value: "100%",
        },
        {
          bossName: "Infected + Infected Tagilla",
          locations: "Infected Tagilla: 75% in PvE, 100% in Season",
          mapName: "Infected Factory",
          value: "100%",
        },
        {
          bossName: "Infected Screamer",
          locations: "Most maps",
          mapName: "Factory, Night Factory",
          value: "100%",
        },
        {
          bossName: "Infected Screamer",
          locations: "Most maps",
          mapName: "Other maps",
          value: "83-89%",
        },
      ],
      modes: ["PvE", "Season"],
      statusLine: "Live since 29 October.",
      summary:
        "The Halloween event is live. Infected Screamers spawn on almost every map, and two new infected maps are open. Several bosses were removed and regular spawn chances dropped.",
      title: "Halloween event is live",
    },
  ],
  title: "Recent updates",
};
