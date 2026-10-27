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
      badgeLabel: "Teaser",
      changedAt: "2026-10-27",
      countdownMode: "start",
      // The hidden message decodes to "Tomorrow at 3" (in Russian).
      // 15:00 Moscow time (12:00 UTC) is a guess.
      endsAt: "2026-10-28T12:00:00Z",
      endsNote: "Estimated: 3 PM Moscow time (12:00 UTC). Not confirmed.",
      enlargeImage: {
        alt: "Handwritten note from the Tarkov Discord teaser",
        src: "/discord-teaser.webp",
        thumbSrc: "/discord-teaser-thumb.webp",
      },
      highlights: [
        "The image's hidden binary message decodes to 'Tomorrow at 3' (in Russian).",
        "The note says the boss wants deliveries to Tarkov to start soon, and not to open the boxes.",
        "Start time and event details are not confirmed by BSG.",
      ],
      id: "tarkov-discord-teaser",
      // Teaser post time unknown; bar covers the final 24h before the guess.
      startsAt: "2026-10-27T12:00:00Z",
      summary:
        "A possible Halloween event may start tomorrow, 28 October, around 3 PM Moscow time (12:00 UTC), based on a teaser posted on the Tarkov Discord.",
      title: "Possible Halloween event",
    },
  ],
  title: "Recent updates",
};
