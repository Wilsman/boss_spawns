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
  /** ISO timestamp; shows a live countdown in the notice. */
  endsAt?: string;
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
      badgeLabel: "All modes",
      bossDisplayName: "Scourge",
      changedAt: "2026-10-22",
      endsAt: "2026-10-26T07:00:00Z",
      endsNote: "Extended by BSG (3:00 AM EDT).",
      originalEndsAt: "2026-10-20T07:00:00Z",
      // Start day per Tarkov Market; exact start hour not published.
      startsAt: "2026-10-16T07:00:00Z",
      highlights: [
        "Event extended until 26 October, 07:00 GMT / 3:00 AM EDT.",
        "Scourge and all four guards wear Arena Battle Pass gear.",
        "The squad spawns in either the Armory or the Green Office (50% each).",
        "Live in PvP, PvE and Season.",
      ],
      id: "scourge-lab-event",
      mapRows: [
        {
          bossName: "Scourge + 4 guards",
          locations: "Armory or Green Office (50% each)",
          mapName: "The Lab",
          value: "100%",
        },
      ],
      modes: ["PvP", "PvE", "Season"],
      statusLine: "Spawns on The Lab every raid with four Scourge Guards.",
      summary:
        "Scourge Incursion: Scourge and four guards, all in Arena Battle Pass gear, spawn on The Lab. Extended until 26 October.",
      title: "Scourge on The Lab",
    },
  ],
  title: "Recent updates",
};
