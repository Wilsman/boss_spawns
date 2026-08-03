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
  badgeLabel: "No active events",
  events: [],
  title: "Active Events",
};
