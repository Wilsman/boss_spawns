import { BossEventConfig } from "@/types/bossEvents";

const bossEvents: BossEventConfig[] = [
  {
    id: "weekly_reshala",
    bossNames: ["Reshala"],
    startDate: "2025-05-10T12:00:00Z", // 2025-05-10 13:00 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Reshala"
  },
  {
    id: "weekly_glukhar",
    bossNames: ["Glukhar"],
    startDate: "2025-05-17T17:00:00Z", // 2025-06-17 18:00 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Glukhar"
  },
  {
    id: "weekly_shturman",
    bossNames: ["Shturman"],
    startDate: "2025-05-24T09:00:00Z", // 2025-05-24 10:00 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Shturman"
  },
  {
    id: "weekly_killa",
    bossNames: ["Killa"],
    startDate: "2025-05-31T11:18:00Z", // 2025-05-31 12:18 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Killa"
  },
  {
    id: "weekly_kaban",
    bossNames: ["Kaban"],
    startDate: "2025-06-08T15:49:00Z", // 2025-06-08 16:49 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Kaban"
  },
  {
    id: "weekly_sanitar",
    bossNames: ["Sanitar"],
    startDate: "2025-06-14T11:17:00Z", // 2025-06-14 12:17 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Sanitar"
  },
  {
    id: "weekly_tagilla",
    bossNames: ["Tagilla"],
    startDate: "2025-06-21T17:49:00Z", // 2025-06-21 18:49 BST (GMT+1)
    durationSeconds: 7 * 24 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    mapName: "Factory",
    mapWiki: "https://escapefromtarkov.fandom.com/wiki/Factory",
    spawnLocationsText: "Any scav spawn",
    eventTitle: "Weekly 100% Boss: Tagilla"
  },
];

export default bossEvents;
