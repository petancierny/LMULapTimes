import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUIDES_DIR = ROOT / "guides"
OUTPUT_PATH = ROOT / "data" / "guides.js"

if not GUIDES_DIR.exists():
    raise SystemExit(f"Guides directory not found: {GUIDES_DIR}")

payload = {}
for guide_path in sorted(GUIDES_DIR.glob("*.md")):
    payload[guide_path.stem] = guide_path.read_text(encoding="utf-8")

OUTPUT_PATH.write_text(
    "window.LAPTIME_GUIDES = " + json.dumps(payload) + ";\n",
    encoding="utf-8",
)

print(f"Wrote {OUTPUT_PATH} with {len(payload)} guide(s)")
