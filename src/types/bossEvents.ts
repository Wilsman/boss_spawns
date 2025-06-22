export interface BossEventConfig {
  id: string;
  bossNames: string[];
  startDate: string; // ISO Date string
  durationSeconds: number;
  isWeeklyRotation?: boolean;
  eventTitle?: string;
  eventDescription?: string;
  mapName?: string;
  mapWiki?: string;
  spawnLocationsText?: string;
  nextBossHint?: string;
}
