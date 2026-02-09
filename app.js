const elements = {
  trackSelect: document.getElementById("trackSelect"),
  classSelect: document.getElementById("classSelect"),
  lastUpdated: document.getElementById("lastUpdated"),
  trackName: document.getElementById("trackName"),
  guideToggle: document.getElementById("guideToggle"),
  guideSection: document.getElementById("guideSection"),
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
  "Bahrain (endurance)": "data/layouts/Bahrain_Endurance.png",
  "Bahrain (outer)": "data/layouts/Bahrain_Outer.png",
  "Bahrain (paddock)": "data/layouts/Bahrain_Paddock.png",
  "Bahrain (wec)": "data/layouts/Bahrain_WEC.png",
  "COTA": "data/layouts/COTA_Default.png",
  "COTA (national)": "data/layouts/COTA_National.png",
  "Circuit de la Sarthe": "data/layouts/Circuit_de_la_sarthe.png",
  "Circuit de la Sarthe (straight)": "data/layouts/Circuit_de_la_sarthe_mulsanne.png",
  "Fuji (chicane)": "data/layouts/Fuji_Default.png",
  "Fuji (classic)": "data/layouts/Fuji_Classic.png",
  "Imola": "data/layouts/Imola.png",
  "Interlagos": "data/layouts/Interlagos.png",
  "Monza": "data/layouts/Monza_Default.png",
  "Monza (curvagrande)": "data/layouts/Monza_CurvaGrande.png",
  "Paul Ricard": "data/layouts/PaulRicard.png",
  "Portimao": "data/layouts/Portimao.png",
  "Qatar": "data/layouts/Qatar_Default.png",
  "Qatar (short)": "data/layouts/Qatar_Short.png",
  "Sebring": "data/layouts/Sebring_Default.png",
  "Sebring (school)": "data/layouts/Sebring_School.png",
  "Silverstone": "data/layouts/Silverstone.png",
  "Spa": "data/layouts/SPA_Default.png",
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
  "Bahrain (endurance)": "bahrain-endurance-lmgt3",
  "Bahrain (outer)": "bahrain-outer-lmgt3",
  "Bahrain (paddock)": "bahrain-paddock-lmgt3",
  "Bahrain (wec)": "bahrain-wec-lmgt3",
  "COTA": "cota-lmgt3",
  "COTA (national)": "cota-national-lmgt3",
  "Circuit de la Sarthe": "circuit-de-la-sarthe-lmgt3",
  "Circuit de la Sarthe (straight)": "circuit-de-la-sarthe-straight-lmgt3",
  "Fuji (chicane)": "fuji-chicane-lmgt3",
  "Fuji (classic)": "fuji-classic-lmgt3",
  "Imola": "imola-lmgt3",
  "Interlagos": "interlagos-lmgt3",
  "Monza": "monza-lmgt3",
  "Monza (curvagrande)": "monza-curvagrande-lmgt3",
  "Paul Ricard": "paul-ricard-lmgt3",
  "Portimao": "portimao-lmgt3",
  "Qatar": "qatar-lmgt3",
  "Qatar (short)": "qatar-short-lmgt3",
  "Sebring": "sebring-lmgt3",
  "Sebring (school)": "sebring-school-lmgt3",
  "Silverstone": "silverstone-lmgt3",
  "Spa": "spa-lmgt3",
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
    console.warn("Lap time data not found.");
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

  if (elements.guideToggle && elements.guideSection) {
    const applyGuideVisibility = () => {
      const isHidden = !elements.guideToggle.checked;
      elements.guideSection.hidden = isHidden;
      elements.guideSection.classList.toggle("is-hidden", isHidden);
    };
    elements.guideToggle.addEventListener("change", applyGuideVisibility);
    applyGuideVisibility();
  }

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

function createImageElement(src, alt, className) {
  const img = document.createElement("img");
  img.className = className;
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  img.decoding = "async";
  return img;
}

function createTrimmedCanvas(src, alt, className) {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", alt);

  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.crossOrigin = "anonymous";

  img.onload = () => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;

    const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      canvas.replaceWith(createImageElement(src, alt, className));
      return;
    }

    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    const alphaThreshold = 32;
    const colorThreshold = 22;
    const sampleSize = Math.min(6, width, height);
    const rowCounts = new Uint32Array(height);
    const colCounts = new Uint32Array(width);

    const sampleCorner = (startX, startY) => {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let y = 0; y < sampleSize; y++) {
        for (let x = 0; x < sampleSize; x++) {
          const px = startX + x;
          const py = startY + y;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const idx = (py * width + px) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count += 1;
        }
      }
      return count ? [r / count, g / count, b / count] : [0, 0, 0];
    };

    const corners = [
      sampleCorner(0, 0),
      sampleCorner(width - sampleSize, 0),
      sampleCorner(0, height - sampleSize),
      sampleCorner(width - sampleSize, height - sampleSize),
    ];
    const bg = corners.reduce(
      (acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]],
      [0, 0, 0]
    ).map((v) => v / corners.length);

    const isBackground = (r, g, b, a) => {
      if (a <= alphaThreshold) return true;
      const dr = r - bg[0];
      const dg = g - bg[1];
      const db = b - bg[2];
      return Math.sqrt(dr * dr + dg * dg + db * db) <= colorThreshold;
    };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (isBackground(r, g, b, a)) continue;
      const idx = i >> 2;
      const x = idx % width;
      const y = Math.floor(idx / width);
      rowCounts[y] += 1;
      colCounts[x] += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    if (maxX === -1) {
      canvas.width = width;
      canvas.height = height;
      const outCtx = canvas.getContext("2d");
      if (outCtx) {
        outCtx.drawImage(img, 0, 0);
      }
      return;
    }

    const minRowFill = Math.max(3, Math.floor(width * 0.002));
    const minColFill = Math.max(3, Math.floor(height * 0.002));
    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;

    while (top < height && rowCounts[top] < minRowFill) top += 1;
    while (bottom > top && rowCounts[bottom] < minRowFill) bottom -= 1;
    while (left < width && colCounts[left] < minColFill) left += 1;
    while (right > left && colCounts[right] < minColFill) right -= 1;

    if (top <= bottom && left <= right) {
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }

    const padding = 4;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const outCtx = canvas.getContext("2d");
    if (outCtx) {
      outCtx.imageSmoothingEnabled = true;
      outCtx.drawImage(img, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    }
  };

  img.onerror = () => {
    canvas.replaceWith(createImageElement(src, alt, className));
  };

  img.src = src;
  return canvas;
}

function setLayoutContent(mediaEl, label) {
  const wrapper = document.createElement("div");
  wrapper.className = "layout-inner";
  wrapper.appendChild(mediaEl);

  const labelEl = document.createElement("div");
  labelEl.className = "layout-label";
  labelEl.textContent = label;
  wrapper.appendChild(labelEl);

  elements.layoutStage.innerHTML = "";
  elements.layoutStage.appendChild(wrapper);
}

function renderLayout(record) {
  if (!record) {
    elements.layoutStage.textContent = "Select a track to preview the layout.";
    return;
  }

  const asset = layoutMap[record.track];
  if (asset) {
    const media = createTrimmedCanvas(asset, `${record.track} layout`, "track-image");
    setLayoutContent(media, record.track);
    return;
  }

  const logo = logoMap[record.track];
  if (logo) {
    const media = createTrimmedCanvas(logo, `${record.track} logo`, "logo-image");
    setLayoutContent(media, record.track);
    return;
  }

  const svg = buildTrackSvg(record.track);
  const wrapper = document.createElement("div");
  wrapper.className = "layout-inner";
  wrapper.innerHTML = `
    ${svg}
    <div class="layout-label">${record.track}</div>
  `;
  elements.layoutStage.innerHTML = "";
  elements.layoutStage.appendChild(wrapper);
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
