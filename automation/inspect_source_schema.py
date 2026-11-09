#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from collections import defaultdict
from pathlib import Path
import xlrd

path = Path(sys.argv[1])
wb = xlrd.open_workbook(path, on_demand=True)
report = {"file": path.name, "sheets": []}
keywords = ("saldo", "credito", "crédito", "dispon", "dotacao", "dotação", "empenh", "valor")

for ws in wb.sheets():
    if ws.nrows == 0 or ws.ncols == 0:
        report["sheets"].append({"name": ws.name, "rows": ws.nrows, "cols": ws.ncols, "headers": []})
        continue
    best_row = max(range(min(ws.nrows, 12)), key=lambda r: sum(bool(str(ws.cell_value(r,c)).strip()) for c in range(ws.ncols)))
    headers = [str(ws.cell_value(best_row,c)).strip() for c in range(ws.ncols)]
    header_map = {h: i for i, h in enumerate(headers) if h}
    candidates = []
    for c,h in enumerate(headers):
        norm = re.sub(r"\s+", " ", h).strip().lower()
        if not norm or not any(k in norm for k in keywords):
            continue
        total = 0.0
        numeric = 0
        for r in range(best_row+1, ws.nrows):
            v = ws.cell_value(r,c)
            if isinstance(v,(int,float)) and not isinstance(v,bool):
                total += float(v)
                numeric += 1
        candidates.append({"column": h, "numericCells": numeric, "sum": round(total,2)})

    aggregates = {}
    value_col = header_map.get("VALOR USD")
    if value_col is not None:
        for group_col_name in ("DEB/CRED", "TIPO", "STATUS", "SIAFI OK"):
            gc = header_map.get(group_col_name)
            if gc is None:
                continue
            grouped = defaultdict(lambda: {"count":0,"sumValorUsd":0.0})
            for r in range(best_row+1, ws.nrows):
                key = str(ws.cell_value(r,gc)).strip() or "(vazio)"
                v = ws.cell_value(r,value_col)
                val = float(v) if isinstance(v,(int,float)) and not isinstance(v,bool) else 0.0
                grouped[key]["count"] += 1
                grouped[key]["sumValorUsd"] += val
            aggregates[group_col_name] = [
                {"value": k, "count": v["count"], "sumValorUsd": round(v["sumValorUsd"],2)}
                for k,v in sorted(grouped.items(), key=lambda kv: (-kv[1]["count"], kv[0]))[:50]
            ]
        dc = header_map.get("DEB/CRED")
        st = header_map.get("STATUS")
        ok = header_map.get("SIAFI OK")
        if dc is not None:
            combo = defaultdict(lambda:{"count":0,"sumValorUsd":0.0})
            for r in range(best_row+1, ws.nrows):
                parts=[str(ws.cell_value(r,c)).strip() or "(vazio)" for c in (dc,st,ok) if c is not None]
                key=" | ".join(parts)
                v=ws.cell_value(r,value_col)
                val=float(v) if isinstance(v,(int,float)) and not isinstance(v,bool) else 0.0
                combo[key]["count"] += 1
                combo[key]["sumValorUsd"] += val
            aggregates["DEB/CRED|STATUS|SIAFI OK"]=[
                {"value":k,"count":v["count"],"sumValorUsd":round(v["sumValorUsd"],2)}
                for k,v in sorted(combo.items(), key=lambda kv:-kv[1]["count"])[:100]
            ]
    report["sheets"].append({
        "name": ws.name,
        "rows": ws.nrows,
        "cols": ws.ncols,
        "headerRow": best_row+1,
        "headers": headers,
        "candidateNumericColumns": candidates,
        "aggregates": aggregates,
    })
wb.release_resources()
print(json.dumps(report, ensure_ascii=False, indent=2))
