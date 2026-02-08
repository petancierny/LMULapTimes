const elements = {
  trackSelect: document.getElementById("trackSelect"),
  classSelect: document.getElementById("classSelect"),
  lastUpdated: document.getElementById("lastUpdated"),
  patchValue: document.getElementById("patchValue"),
  trackName: document.getElementById("trackName"),
  statusLine: document.getElementById("statusLine"),
  percentGrid: document.getElementById("percentGrid"),
  paceLegend: document.getElementById("paceLegend"),
  fastestCar: document.getElementById("fastestCar"),
  fastestLap: document.getElementById("fastestLap"),
  classAverage: document.getElementById("classAverage"),
  bestAvg: document.getElementById("bestAvg"),
  layoutStage: document.getElementById("layoutStage"),
  yourTime: document.getElementById("yourTime"),
  pacePill: document.getElementById("pacePill"),
  paceValue: document.getElementById("paceValue"),
  paceDelta: document.getElementById("paceDelta"),
};

const percentTargets = [100, 101, 102, 103, 104, 105, 106, 107];
const paceLegend = [
  { percent: 100, label: "Alien" },
  { percent: 101, label: "Competitive" },
  { percent: 102, label: "Good" },
  { percent: 104, label: "Midpack" },
  { percent: 106, label: "Tail-ender" },
  { percent: 107, label: "Offline" },
];

const classOrder = ["LMH", "LMP2wec", "LMP2elms", "LMP3", "LMGT3", "GTE"];
const classTokens = new Set(classOrder);

const state = {
  data: [],
  tracks: [],
  classes: [],
  selectedTrack: "",
  selectedClass: "",
  lastUpdated: "",
  currentRecord: null,
};

init();

function init() {
  const csvText = window.LAPTIME_CSV;
  if (!csvText) {
    elements.statusLine.textContent = "Lap time data not found.";
    return;
  }

  const parsed = parseLapTimeCSV(csvText);
  state.data = parsed.data;
  state.lastUpdated = parsed.lastUpdated || "Unknown";
  state.tracks = [...new Set(state.data.map((row) => row.track))].sort();
  state.classes = classOrder.filter((cls) =>
    state.data.some((row) => row.className === cls)
  );

  state.selectedTrack = state.tracks[0] || "";
  state.selectedClass = state.classes[0] || "";

  buildSelectOptions(elements.trackSelect, state.tracks);
  buildSelectOptions(elements.classSelect, state.classes);

  elements.trackSelect.value = state.selectedTrack;
  elements.classSelect.value = state.selectedClass;

  elements.trackSelect.addEventListener("change", (event) => {
    state.selectedTrack = event.target.value;
    render();
  });

  elements.classSelect.addEventListener("change", (event) => {
    state.selectedClass = event.target.value;
    render();
  });

  elements.yourTime.addEventListener("input", () => {
    updateUserPace();
  });

  render();
}

function parseLapTimeCSV(text) {
  const rows = parseCSV(text);
  let lastUpdated = "";
  for (const row of rows) {
    for (const cell of row) {
      if (cell.includes("Last updated:")) {
        lastUpdated = cell.split("Last updated:")[1].trim();
      }
    }
  }

  const data = [];
  for (const row of rows) {
    const track = (row[1] || "").trim();
    const combined = (row[0] || "").trim();
    if (!track || track === "Track" || !combined) {
      continue;
    }

    const className = (row[16] || "").trim() || inferClass(combined);
    if (!classTokens.has(className)) {
      continue;
    }

    const percentTimes = percentTargets.map((_, index) =>
      (row[4 + index] || "").trim()
    );

    data.push({
      track,
      patch: (row[2] || "").trim(),
      classAvg: (row[3] || "").trim(),
      times: percentTimes,
      fastestCar: (row[12] || "").trim(),
      fastestLap: (row[13] || "").trim(),
      bestAvg: (row[14] || "").trim(),
      benchmarkLap: (row[15] || "").trim(),
      className,
      readiness: row.slice(17, 21).map((cell) => (cell || "").trim()),
    });
  }

  return { data, lastUpdated };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function inferClass(combined) {
  for (const token of classTokens) {
    if (combined.endsWith(token)) {
      return token;
    }
  }
  return "";
}

function buildSelectOptions(select, options) {
  select.innerHTML = "";
  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option;
    item.textContent = option;
    select.appendChild(item);
  });
}

function render() {
  const record = state.data.find(
    (row) => row.track === state.selectedTrack && row.className === state.selectedClass
  );
  state.currentRecord = record || null;

  elements.lastUpdated.textContent = state.lastUpdated || "Unknown";
  elements.trackName.textContent = record ? record.track : "No data";
  elements.patchValue.textContent = record?.patch || "—";
  elements.fastestCar.textContent = record?.fastestCar || "Not listed";
  elements.fastestLap.textContent = record?.fastestLap || "—";
  elements.classAverage.textContent = record?.classAvg || "—";
  elements.bestAvg.textContent = record?.bestAvg || "—";

  renderPercentGrid(record);
  renderLegend();
  renderLayoutPlaceholder(record);
  updateUserPace();

  elements.statusLine.textContent = record
    ? `${state.data.length} laps loaded · ${record.track} · ${record.className}`
    : "No data for this combination.";
}

function renderPercentGrid(record) {
  elements.percentGrid.innerHTML = "";
  percentTargets.forEach((percent, index) => {
    const timeValue = record?.times[index] || "—";
    const cell = document.createElement("div");
    cell.className = "percent-item";
    cell.innerHTML = `
      <span>${percent}%</span>
      <span>${timeValue}</span>
    `;
    elements.percentGrid.appendChild(cell);
  });
}

function renderLegend() {
  if (elements.paceLegend.childElementCount) {
    return;
  }
  elements.paceLegend.innerHTML = paceLegend
    .map((item) => `<span>${item.percent}% ${item.label}</span>`)
    .join("");
}

function renderLayoutPlaceholder(record) {
  if (!record) {
    elements.layoutStage.textContent = "Select a track to preview the layout.";
    return;
  }
  elements.layoutStage.textContent = "Track map will render here.";
}

function updateUserPace() {
  const record = state.currentRecord;
  if (!record) {
    setPaceOutput("—", "—", "—");
    return;
  }

  const input = elements.yourTime.value.trim();
  if (!input) {
    setPaceOutput("—", "—", "—");
    return;
  }

  const baseSeconds = parseTimeToSeconds(record.times[0]);
  const userSeconds = parseTimeToSeconds(input);
  if (!baseSeconds || !userSeconds) {
    setPaceOutput("Invalid", "Check format", "");
    return;
  }

  const percent = (userSeconds / baseSeconds) * 100;
  const delta = ((userSeconds - baseSeconds) / baseSeconds) * 100;
  const paceLabel = paceLabelForPercent(percent);

  setPaceOutput(`${paceLabel}`, `${percent.toFixed(2)}%`, `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`);
  highlightPercentBucket(percent);
}

function setPaceOutput(pill, value, delta) {
  elements.pacePill.textContent = pill;
  elements.paceValue.textContent = value;
  elements.paceDelta.textContent = delta;
}

function parseTimeToSeconds(time) {
  if (!time) return null;
  const clean = time.trim();
  if (!clean) return null;
  const parts = clean.split(":");
  const segments = parts.map((part) => part.trim());

  let seconds = 0;
  if (segments.length === 1) {
    seconds = Number(segments[0]);
  } else if (segments.length === 2) {
    seconds = Number(segments[0]) * 60 + Number(segments[1]);
  } else if (segments.length === 3) {
    seconds = Number(segments[0]) * 3600 + Number(segments[1]) * 60 + Number(segments[2]);
  }

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return seconds;
}

function paceLabelForPercent(percent) {
  if (percent <= 100.5) return "Alien";
  if (percent <= 101.5) return "Competitive";
  if (percent <= 102.5) return "Good";
  if (percent <= 104.5) return "Midpack";
  if (percent <= 106.5) return "Tail-ender";
  return "Offline";
}

function highlightPercentBucket(percent) {
  const bucket = Math.min(107, Math.max(100, Math.round(percent)));
  const nodes = [...elements.percentGrid.children];
  nodes.forEach((node, index) => {
    node.classList.toggle("is-active", percentTargets[index] === bucket);
  });
}
