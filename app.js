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
  guideSubtitle: document.getElementById("guideSubtitle"),
  guideStatus: document.getElementById("guideStatus"),
  guideContent: document.getElementById("guideContent"),
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


const layoutMap = {
  "Bahrain (endurance)": "data/layouts/Bahrain_International_Circuit--Endurance_Circuit.svg",
  "Bahrain (outer)": "data/layouts/Bahrain_International_Circuit--Outer_Circuit.svg",
  "Bahrain (paddock)": "data/layouts/Bahrain_International_Circuit--Paddock_Circuit.svg",
  "COTA": "data/layouts/COTA.svg",
  "COTA (national)": "data/layouts/COTA_National_Circuit.png",
  "Circuit de la Sarthe": "data/layouts/Circuit_de_la_Sarthe_track_map.svg",
  "Fuji (classic)": "data/layouts/Circuit_Fuji.svg",
  "Imola": "data/layouts/Imola_2009.svg",
  "Interlagos": "data/layouts/Circuit_Interlagos.svg",
  "Monza": "data/layouts/Monza_track_map.svg",
  "Paul Ricard": "data/layouts/Paul_Ricard.svg",
  "Portimao": "data/layouts/Portimao.svg",
  "Qatar": "data/layouts/Qatar.svg",
  "Sebring": "data/layouts/Sebring_International_Raceway.svg",
  "Silverstone": "data/layouts/Silverstone_Circuit_2020.png",
  "Spa": "data/layouts/Spa_Francorchamps_2007.jpg",
};


const logoMap = {
  "Bahrain (wec)": "data/logos/Bahrain_International_Circuit_logo.png",
  "Circuit de la Sarthe (straight)": "data/logos/circuitdelasarthelogo.png",
  "Fuji (chicane)": "data/logos/Logo-Fuji.png",
  "Monza (curvagrande)": "data/logos/Autodromo_Nazionale_Monza_circuit_logo.png",
  "Sebring (school)": "data/logos/Sebring12_IR.png",
  "Qatar (short)": "data/logos/qatarlogo.png",
};


const guideMap = {
  "Bahrain (wec)": "bahrain-wec-lmgt3",
  "Monza": "monza-lmgt3",
};




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

  elements.guideSubtitle.textContent =
    state.selectedClass === "LMGT3" ? "LMGT3 focus" : "LMGT3 guide only";

  renderPercentGrid(record);
  renderLegend();
  renderLayout(record);
  renderGuide(record);
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

function renderLayout(record) {
  if (!record) {
    elements.layoutStage.textContent = "Select a track to preview the layout.";
    return;
  }

  const asset = layoutMap[record.track];
  if (asset) {
    elements.layoutStage.innerHTML = `
      <div class="layout-inner">
        <img class="track-image" src="${asset}" alt="${record.track} layout" />
        <div class="layout-label">${record.track}</div>
      </div>
    `;
    return;
  }

  const logo = logoMap[record.track];
  if (logo) {
    elements.layoutStage.innerHTML = `
      <div class="layout-inner">
        <img class="logo-image" src="${logo}" alt="${record.track} logo" />
        <div class="layout-label">${record.track}</div>
      </div>
    `;
    return;
  }

  const svg = buildTrackSvg(record.track);
  elements.layoutStage.innerHTML = `
    <div class="layout-inner">
      ${svg}
      <div class="layout-label">${record.track}</div>
    </div>
  `;
}


function renderGuide(record) {
  if (!record) {
    elements.guideStatus.textContent = "Select a track to load its guide.";
    elements.guideContent.innerHTML = "";
    return;
  }

  const guides = window.LAPTIME_GUIDES || {};
  const guideKey = guideMap[record.track];
  const guideText = guideKey ? guides[guideKey] : null;

  if (!guideText) {
    elements.guideStatus.textContent = "Guide not available yet for this track.";
    elements.guideContent.innerHTML = "";
    return;
  }

  elements.guideStatus.textContent =
    state.selectedClass === "LMGT3"
      ? "LMGT3 guide loaded from LMU-specific sources."
      : "LMGT3 guide only - switch class for accurate use.";

  elements.guideContent.innerHTML = renderMarkdown(guideText);
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${formatInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${formatInline(trimmed.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${formatInline(trimmed)}</p>`);
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
}

function formatInline(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return safe;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTrackSvg(trackName) {
  const seed = hashString(trackName);
  const rand = mulberry32(seed);
  const pointCount = 12 + Math.floor(rand() * 6);
  const baseRadius = 30 + rand() * 8;
  const variance = 10 + rand() * 8;
  const squish = 0.82 + rand() * 0.2;

  const points = [];
  for (let i = 0; i < pointCount; i += 1) {
    const angle = (i / pointCount) * Math.PI * 2 + rand() * 0.4;
    const radius = baseRadius + (rand() * 2 - 1) * variance;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * squish;
    points.push({ x, y });
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    path += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  path += " Z";

  const start = points[0];

  return `
    <svg class="track-svg" viewBox="0 0 100 100" role="img" aria-label="${trackName} layout">
      <defs>
        <linearGradient id="trackStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="var(--accent-cool)" />
          <stop offset="100%" stop-color="var(--accent)" />
        </linearGradient>
      </defs>
      <path d="${path}" fill="none" stroke="url(#trackStroke)" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${start.x.toFixed(2)}" cy="${start.y.toFixed(2)}" r="3" fill="var(--ink)" />
      <circle cx="${start.x.toFixed(2)}" cy="${start.y.toFixed(2)}" r="1.4" fill="var(--bg)" />
    </svg>
  `;
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

  setPaceOutput(
    paceLabel,
    `${percent.toFixed(2)}%`,
    `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`
  );
  highlightPercentBucket(percent);
}

function setPaceOutput(pill, value, delta) {
  elements.pacePill.textContent = pill;
  elements.pacePill.dataset.pace = pill.toLowerCase().replace(/\s+/g, "-");
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
    seconds =
      Number(segments[0]) * 3600 + Number(segments[1]) * 60 + Number(segments[2]);
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
