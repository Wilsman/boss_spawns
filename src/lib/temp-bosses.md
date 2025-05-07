example:

[
  {
    "name": "NameOfTheMap", // e.g., "Customs", "Shoreline"
    "bosses": [
      {
        "boss": {
          "name": "YourTemporaryBossName"
          // You might need to add other properties to `boss` if DataTable.tsx expects them,
          // e.g., health, imagePortraitLink.
          // For now, the structure matches the minimal requirement from SpawnData.
        },
        "spawnLocations": [
          {
            "name": "SpecificLocationName", // e.g., "Dorms", "Power Station"
            "chance": 0.8 // Spawn chance at this specific location (0 to 1)
          }
        ],
        "spawnChance": 0.65 // Overall spawn chance for this boss on this map (0 to 1)
      }
      // You can add more bosses to this map
    ]
  }
  // You can add more map entries
]