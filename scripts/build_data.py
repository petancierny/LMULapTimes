import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "laptimes.csv"
OUTPUT_PATH = ROOT / "data" / "laptimes.js"

csv_text = CSV_PATH.read_text(encoding="utf-8")

OUTPUT_PATH.write_text(
    "window.LAPTIME_CSV = " + json.dumps(csv_text) + ";\n",
    encoding="utf-8",
)

print(f"Wrote {OUTPUT_PATH}")
