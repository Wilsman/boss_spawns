import { BossEventConfig } from "@/types/bossEvents";

// Manual Boss Hint Configuration
// Change these values when you want to update the hint
export const MANUAL_BOSS_HINT = {
  bossName: "Goons",
  hintText: "100% spawn next?",
  sourceLabel: "Community Digest",
  sourceUrl: "https://pbs.twimg.com/media/Guh0w2iXEAAtKk0?format=jpg&name=medium",
  enabled: false // Set to false to hide the hint
};

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
  {
    id: "weekly_goons",
    bossNames: ["Goons"],
    startDate: "2025-06-29T11:55:00Z", // 2025-06-29 12:55 BST (GMT+1)
    durationSeconds: 6 * 22 * 60 * 60, // 7 days
    isWeeklyRotation: true,
    eventTitle: "Weekly 100% Boss: Goons",
    // mapName: "Lighthouse",
    // spawnLocationsText: "Water Treatment Plant and Chalet",
    // mapWiki: "https://escapefromtarkov.fandom.com/wiki/Lighthouse",
  },
  {
    id: "special_all_bosses",
    bossNames: ["Reshala", "Glukhar", "Shturman", "Killa", "Sanitar", "Tagilla", "Kaban", "Goons"],
    startDate: "2025-07-05T09:00:00Z", // 2025-07-05 09:00 BST (GMT+1) TODAY
    durationSeconds: 4 * 24 * 60 * 60 - 3600 * 2, // make end 2025-07-09 08:00 BST (GMT+1) TODAY
    isWeeklyRotation: false,
    eventTitle: "Special Event: ALL BOSSES 100%",
    eventDescription: "All bosses will spawn 100% of the time on their respective maps!",
    mapName: "All Maps",
    spawnLocationsText: "All boss spawn locations active"
  },
  // {
  //   id: "pve_only_goons",
  //   bossNames: ["Goons"],
  //   startDate: "2025-07-18T09:00:00Z", // 2025-07-05 09:00 BST (GMT+1) TODAY
  //   durationSeconds: 24 * 60 * 60 - 3600 * 2, // make end 2025-07-19 08:00 BST (GMT+1) TODAY
  //   isWeeklyRotation: false,
  //   eventTitle: "PVE ONLY: GOONS 100%",
  //   eventDescription: "PVE ONLY: Goons will spawn 100% of the time on their respective maps!",
  //   mapName: "Lighthouse",
  //   spawnLocationsText: "Water Treatment Plant and Chalet",
  //   mapWiki: "https://escapefromtarkov.fandom.com/wiki/Lighthouse",
  // },
];

export default bossEvents;
