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
      badgeLabel: "Ended",
      changedAt: "2026-10-26",
      endsAt: "2026-10-26T07:00:00Z",
      id: "scourge-lab-event",
      linkLabel: "View removal in Changes",
      linkUrl: "/changes?boss=Scourge",
      // Start day per Tarkov Market; exact start hour not published.
      startsAt: "2026-10-16T07:00:00Z",
      summary:
        "The Scourge Incursion has ended. Scourge and his guards no longer spawn on The Lab.",
      title: "Scourge on The Lab",
    },
  ],
  title: "Recent updates",
};
