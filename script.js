// script.js
document.addEventListener("DOMContentLoaded", function () {
  // Constants
  const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Data variables
  let regularData = null;
  let pveData = null;

  // UI Elements
  const loadingIndicator = document.getElementById("loadingIndicator");
  const mapFilter = document.getElementById("mapFilter");
  const bossFilter = document.getElementById("bossFilter");
  const filterInput = document.getElementById("filterInput");
  const exportButton = document.getElementById("exportButton");
  const modeToggle = document.getElementsByName("mode");
  const regularTableWrapper = document.getElementById("regularTableWrapper");
  const pveTableWrapper = document.getElementById("pveTableWrapper");
  const compareTableWrapper = document.getElementById("compareTableWrapper");
  const cacheCountdownRegular = document.getElementById(
    "cacheCountdownRegular"
  );
  const cacheCountdownPve = document.getElementById("cacheCountdownPve");

  // Event Listeners
  mapFilter.addEventListener("change", filterTable);
  bossFilter.addEventListener("change", filterTable);
  filterInput.addEventListener("input", filterTable);
  exportButton.addEventListener("click", exportToCSV);

  modeToggle.forEach((radio) => {
    radio.addEventListener("change", switchMode);
  });

  // Initialization
  initializeCountdowns();
  fetchData("regular");
  fetchData("pve");

  // Functions

  function showLoadingIndicator() {
    loadingIndicator.style.display = "block";
  }

  function hideLoadingIndicator() {
    loadingIndicator.style.display = "none";
  }

  function showPopup(message) {
    const popup = document.createElement("div");
    popup.className = "popup";
    popup.innerText = message;
    document.body.appendChild(popup);
    setTimeout(() => {
      document.body.removeChild(popup);
    }, 3000);
  }

  function fetchData(gameMode) {
    showLoadingIndicator();
    const cacheKey = `maps_${gameMode}`;
    const cached = getCache(cacheKey);

    const countdownElement =
      gameMode === "regular" ? cacheCountdownRegular : cacheCountdownPve;

    if (cached && isCacheValid(cached.timestamp)) {
      hideLoadingIndicator();
      showPopup(`Loaded ${gameMode.toUpperCase()} data from cache!`);
      const maps = cached.data.maps;
      if (gameMode === "pve") {
        pveData = maps;
      } else {
        regularData = maps;
      }
      populateUI(gameMode);

      const expiryTime = cached.timestamp + CACHE_EXPIRY_TIME;
      startCountdown(expiryTime, countdownElement, gameMode);
    } else {
      fetch("https://api.tarkov.dev/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: `
                      query {
                          maps(gameMode: ${gameMode}) {
                              normalizedName
                              bosses {
                                  boss {
                                      normalizedName
                                  }
                                  spawnLocations {
                                      name
                                      chance
                                  }
                                  spawnChance
                              }
                          }
                      }
                  `,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          hideLoadingIndicator();

          if (!data.data || !data.data.maps) {
            showPopup(`Failed to fetch ${gameMode.toUpperCase()} data!`);
            console.error("Error: Invalid data structure", data);
            return;
          }

          showPopup(`${gameMode.toUpperCase()} data fetched successfully!`);

          setCache(cacheKey, data.data);
          const maps = data.data.maps;
          if (gameMode === "pve") {
            pveData = maps;
          } else {
            regularData = maps;
          }
          populateUI(gameMode);

          const expiryTime = new Date().getTime() + CACHE_EXPIRY_TIME;
          startCountdown(expiryTime, countdownElement, gameMode);
        })
        .catch((error) => {
          hideLoadingIndicator();
          showPopup(`Failed to fetch ${gameMode.toUpperCase()} data!`);
          console.error("Error fetching data:", error);
        });
    }
  }

  function populateUI(gameMode) {
    if (regularData && pveData) {
      populateFilters([...regularData, ...pveData]);
      if (
        document.querySelector('input[name="mode"]:checked').value === "compare"
      ) {
        populateCompareTable();
      }
    }

    if (gameMode === "regular" && regularData) {
      populateTable("regularTable", regularData);
      filterTable();
    }

    if (gameMode === "pve" && pveData) {
      populateTable("pveTable", pveData);
      filterTable();
    }
  }

  function populateFilters(maps) {
    const mapOptions = new Set();
    const bossOptions = new Set();

    maps.forEach((map) => {
      mapOptions.add(map.normalizedName);
      map.bosses.forEach((boss) => {
        bossOptions.add(boss.boss.normalizedName);
      });
    });

    mapFilter.innerHTML = '<option value="">All Maps</option>';
    bossFilter.innerHTML = '<option value="">All Bosses</option>';

    Array.from(mapOptions)
      .sort()
      .forEach((mapName) => {
        const option = document.createElement("option");
        option.value = mapName;
        option.text = mapName;
        mapFilter.appendChild(option);
      });

    Array.from(bossOptions)
      .sort()
      .forEach((bossName) => {
        const option = document.createElement("option");
        option.value = bossName;
        option.text = bossName;
        bossFilter.appendChild(option);
      });
  }

  function populateTable(tableId, maps) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    tableBody.innerHTML = "";

    let previousMapName = null;

    maps.forEach((mapData) => {
      const mapName = mapData.normalizedName;

      mapData.bosses.forEach((boss) => {
        const bossName = boss.boss.normalizedName;
        const spawnChance = `${Math.round(boss.spawnChance * 100)}%`;

        if (boss.spawnLocations.length > 0) {
          boss.spawnLocations.forEach((location) => {
            const locationName = location.name;
            const locationChance = `${Math.round(location.chance * 100)}%`;

            const row = document.createElement("tr");
            row.innerHTML = `
                        <td>${mapName}</td>
                        <td>${bossName}</td>
                        <td>${spawnChance}</td>
                        <td>${locationName}</td>
                        <td>${locationChance}</td>
                    `;

            if (previousMapName && previousMapName !== mapName) {
              row.classList.add("map-divider");
            }

            previousMapName = mapName;
            tableBody.appendChild(row);
          });
        }
      });
    });
  }

  function populateCompareTable() {
    const tableBody = document.querySelector("#compareTable tbody");
    tableBody.innerHTML = "";

    // Build a map for quick lookup
    const regularMap = buildDataMap(regularData);
    const pveMap = buildDataMap(pveData);

    let previousMapName = null;

    // Compare the data
    Object.keys(regularMap)
      .sort()
      .forEach((key) => {
        if (pveMap[key]) {
          const regularEntry = regularMap[key];
          const pveEntry = pveMap[key];

          if (regularEntry.spawnChance !== pveEntry.spawnChance) {
            // There is a difference
            const row = document.createElement("tr");
            row.innerHTML = `
                      <td>${regularEntry.mapName}</td>
                      <td>${regularEntry.bossName}</td>
                      <td class="regular-column">${regularEntry.spawnChance}</td>
                      <td class="pve-column">${pveEntry.spawnChance}</td>
                  `;

            if (previousMapName && previousMapName !== regularEntry.mapName) {
              row.classList.add("map-divider");
            }

            previousMapName = regularEntry.mapName;
            tableBody.appendChild(row);
          }
        }
      });

    filterTable(); // Apply filters
  }

  function buildDataMap(data) {
    const dataMap = {};

    data.forEach((mapData) => {
      const mapName = mapData.normalizedName;
      mapData.bosses.forEach((boss) => {
        const bossName = boss.boss.normalizedName;
        const spawnChance = `${Math.round(boss.spawnChance * 100)}%`;

        const key = `${mapName}-${bossName}`;
        dataMap[key] = {
          mapName,
          bossName,
          spawnChance,
        };
      });
    });

    return dataMap;
  }

  function filterTable() {
    const mapValue = mapFilter.value.toLowerCase();
    const bossValue = bossFilter.value.toLowerCase();
    const searchValue = filterInput.value.toLowerCase();

    const activeTableId = getActiveTableId();
    const rows = document.querySelectorAll(`#${activeTableId} tbody tr`);

    rows.forEach((row) => {
      const cells = row.cells;
      const mapName = cells[0].innerText.toLowerCase();
      const bossName = cells[1].innerText.toLowerCase();

      const mapMatch = !mapValue || mapName === mapValue;
      const bossMatch = !bossValue || bossName === bossValue;
      const searchMatch =
        !searchValue ||
        bossName.includes(searchValue) ||
        mapName.includes(searchValue);

      row.style.display = mapMatch && bossMatch && searchMatch ? "" : "none";
    });
  }

  function exportToCSV() {
    const activeTableId = getActiveTableId();
    const table = document.getElementById(activeTableId);
    const rows = Array.from(table.rows);
    const csvContent = [];

    rows.forEach((row) => {
      const cells = Array.from(row.cells);
      const rowContent = cells.map((cell) => `"${cell.innerText}"`).join(",");
      csvContent.push(rowContent);
    });

    const csvData = csvContent.join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const mode = activeTableId.replace("Table", "").toLowerCase();

    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `tarkov_boss_spawns_${mode}_${dateStr}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function switchMode() {
    const selectedMode = document.querySelector(
      'input[name="mode"]:checked'
    ).value;
    regularTableWrapper.style.display = "none";
    pveTableWrapper.style.display = "none";
    compareTableWrapper.style.display = "none";

    if (selectedMode === "regular") {
      regularTableWrapper.style.display = "";
      if (regularData) filterTable();
    } else if (selectedMode === "pve") {
      pveTableWrapper.style.display = "";
      if (pveData) filterTable();
    } else if (selectedMode === "compare") {
      compareTableWrapper.style.display = "";
      if (regularData && pveData) {
        populateCompareTable();
        filterTable();
      }
    }
  }

  function initializeCountdowns() {
    ["regular", "pve"].forEach((mode) => {
      const cacheKey = `maps_${mode}`;
      const cached = getCache(cacheKey);
      const countdownElement =
        mode === "regular" ? cacheCountdownRegular : cacheCountdownPve;

      if (cached && isCacheValid(cached.timestamp)) {
        const expiryTime = cached.timestamp + CACHE_EXPIRY_TIME;
        startCountdown(expiryTime, countdownElement, mode);
      } else {
        countdownElement.innerText = `${mode.toUpperCase()} Cache expires in: 00:00:00`;
      }
    });
  }

  function startCountdown(expiryTime, element, mode) {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        clearInterval(interval);
        element.innerText = `${mode.toUpperCase()} Cache expired`;
        return;
      }

      const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((distance / (1000 * 60)) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      element.innerText = `${mode.toUpperCase()} Cache expires in: ${String(
        hours
      ).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }, 1000);
  }

  function setCache(key, data) {
    const timestamp = new Date().getTime();
    const cacheData = {
      data: data,
      timestamp: timestamp,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  }

  function getCache(key) {
    const cacheData = localStorage.getItem(key);
    if (!cacheData) return null;

    try {
      return JSON.parse(cacheData);
    } catch (e) {
      return null;
    }
  }

  function isCacheValid(timestamp) {
    const now = new Date().getTime();
    return now - timestamp < CACHE_EXPIRY_TIME;
  }

  function getActiveTableId() {
    const selectedMode = document.querySelector(
      'input[name="mode"]:checked'
    ).value;
    if (selectedMode === "regular") return "regularTable";
    if (selectedMode === "pve") return "pveTable";
    if (selectedMode === "compare") return "compareTable";
  }
});
