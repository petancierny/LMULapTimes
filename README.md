# LMU Lap Times

A lightweight, readable lap-time benchmark viewer for LMU tracks and classes. Pick a track and class, review percentage targets, and compare your own lap times against the curated benchmark data.

## Features
- Track + class selection across LMGT3, LMH, LMP2 (WEC/ELMS), LMP3, and GTE.
- Percent target grid (100%–107%) to quickly spot where your pace sits.
- Fastest car and class-average references for the selected combination.
- Deterministic track layout visualization per track (procedural placeholder).
- Personal lap-time input that highlights the closest pace bucket.

## Quick Start
1. Open `index.html` in a modern browser.
2. Choose a track and class.
3. Paste your best lap time to see your percentage and bucket.

No build step is required. All data is embedded via `data/laptimes.js`.

## Updating The Data
If you replace the CSV with a new export, regenerate the embedded JS:

```bash
python3 /Users/petancierny/Documents/GitHub/Personal/LMULapTimes/scripts/build_data.py
```

That script reads `data/laptimes.csv` and rebuilds `data/laptimes.js` so the app can run without a local server.

## Data Mapping
The CSV contains multiple header rows. The parser extracts rows that match:
- `Track` (column 1)
- `Class` (column 16)
- Percent targets from columns 4–11 (`~100%` through `107%`)

Captured fields:
- `track`: Track name (column 1).
- `patch`: Patch label (column 2).
- `classAvg`: Class average (column 3).
- `times`: Percent targets (columns 4–11).
- `fastestCar`: Fastest car (column 12).
- `fastestLap`: Fastest lap time (column 13).
- `bestAvg`: Best/Avg delta (column 14).

## Track Layouts
Layout visuals are generated procedurally so every track has an immediate placeholder map. If you want to use real track maps:
1. Drop SVGs into a new folder (for example `assets/track-layouts/`).
2. Replace the `buildTrackSvg()` implementation in `app.js` to load the real SVG instead of the procedural path.

## Project Structure
- `index.html` — App shell and layout.
- `styles.css` — Visual system and responsive styling.
- `app.js` — Data parsing, filtering, rendering, and interactions.
- `data/laptimes.csv` — Raw benchmark data.
- `data/laptimes.js` — Embedded CSV for runtime use.
- `scripts/build_data.py` — CSV to JS embedding helper.

## Notes
- Lap time inputs accept `m:ss.xx`, `mm:ss.xx`, or `h:mm:ss` formats.
- The displayed pace buckets are approximate, based on the 100–107% range.
