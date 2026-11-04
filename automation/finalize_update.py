#!/usr/bin/env python3
"""Finalize SISCABW TESTE generated files with source provenance and consistency checks."""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

candidate = Path(sys.argv[1])
manifest = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
files = manifest.get("files", [])
if len(files) != 10:
    raise SystemExit("Expected ten downloaded Excel sources")
latest = max(files, key=lambda f: f.get("modifiedTime", ""))
if not latest.get("modifiedTime"):
    raise SystemExit("Excel modification timestamp missing from Drive")
status_path = candidate / "data-update-status.json"
status = json.loads(status_path.read_text(encoding="utf-8"))
source_times = {Path(f["canonicalName"]).stem.lower(): f["modifiedTime"] for f in files}
for panel, entries in status.get("paineis", {}).items():
    for entry in entries:
        stem = Path(entry.get("arquivo", "")).stem.lower()
        if stem in source_times:
            entry["atualizadoEm"] = source_times[stem]
status["excelMaisRecente"] = {
    "arquivo": latest["name"],
    "modificadoEmDrive": latest["modifiedTime"],
    "observacao": "Data de ultima modificacao no Google Drive; nao necessariamente criacao original do Excel"
}
status["geradoEmUTC"] = datetime.now(timezone.utc).isoformat()
text = json.dumps(status, ensure_ascii=False, indent=2) + "\n"
for name in ("data-update-status.json", "assets/data/data-update-status.json"):
    target = candidate / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")
home_path = candidate / "home-data.js"
raw = home_path.read_text(encoding="utf-8")
prefix = "window.CABW_HOME_DATA = "
if not raw.startswith(prefix) or not raw.rstrip().endswith(";"):
    raise SystemExit("Unexpected home-data.js format")
home = json.loads(raw[len(prefix):].strip()[:-1])
home.setdefault("meta", {})["excelMaisRecente"] = status["excelMaisRecente"]
home["meta"]["geradoEmUTC"] = status["geradoEmUTC"]
home_path.write_text(prefix + json.dumps(home, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
years = home.get("restosPagar", {}).get("anos", {})
if any(str(y) not in years for y in range(2022, 2026)):
    raise SystemExit("RP annual balances missing from home-data.js")
total = sum(float(years[str(y)].get("atual", 0)) for y in range(2022, 2026))
if not (0 <= total < 1_000_000_000):
    raise SystemExit("RP total outside plausible range")
print(json.dumps({"latestExcel": status["excelMaisRecente"], "rpCurrentTotal": round(total, 2)}, ensure_ascii=False))
