#!/usr/bin/env python3
"""Compare the ten selected Drive files with the last published source snapshot."""
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
previous_path = Path(sys.argv[2])
files = manifest.get("files", [])
if len(files) != 10 or len({f.get("canonicalName") for f in files}) != 10:
    raise SystemExit("Invalid Drive manifest: expected ten unique canonical sources")

def fingerprint(f):
    # Content checksum preferred; timestamps catch changes where Drive has no MD5.
    return {
        "id": f.get("id"),
        "name": f.get("name"),
        "md5Checksum": f.get("md5Checksum"),
        "modifiedTime": f.get("modifiedTime"),
        "size": f.get("size"),
    }

current = {f["canonicalName"]: fingerprint(f) for f in files}
previous = {}
if previous_path.exists():
    previous = json.loads(previous_path.read_text(encoding="utf-8")).get("sources", {})
def materially_changed(old, new):
    if not old:
        return True
    if set(old) != set(new):
        return True
    for name, now in new.items():
        before = old[name]
        # When both MD5 values exist, content identity is authoritative.
        if before.get("md5Checksum") and now.get("md5Checksum"):
            if before["md5Checksum"] != now["md5Checksum"]:
                return True
        elif (before.get("id"), before.get("modifiedTime"), before.get("size")) != (
            now.get("id"), now.get("modifiedTime"), now.get("size")
        ):
            return True
    return False

changed = materially_changed(previous, current)
print(json.dumps({"changed": changed, "sources": current}, sort_keys=True))
