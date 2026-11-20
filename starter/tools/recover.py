#!/usr/bin/env python3
"""SUPPLIED recovery: preserve your attempt, then restore a clean runnable scaffold.

    python3 tools/recover.py          (run from starter, the folder containing package.json)

1. Requires all six owned code files. If any is missing it STOPS before overwriting anything.
2. Copies them into a new, distinct directory recovery/attempt-<UTC time>[-n] with manifest.json
   (SHA-256 of each copy). Running it again creates another distinct backup; nothing is overwritten.
3. Restores the six files from tools/scaffold/ (the original starter versions).

Reopen the saved attempt beside the restored scaffold and recover one operation at a time.
evidence.md is never touched.
"""
import datetime
import hashlib
import json
import os
import shutil
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OWNED = ["src/genre.ts", "src/models.ts", "src/rules.ts", "src/api.ts", "src/app.ts", "tests/learner.test.mjs"]


def sha256(path):
    with open(path, "rb") as handle:
        return hashlib.sha256(handle.read()).hexdigest()


def main():
    missing = [p for p in OWNED if not os.path.isfile(os.path.join(HERE, p))]
    scaffold_missing = [p for p in OWNED if not os.path.isfile(os.path.join(HERE, "tools", "scaffold", p))]
    if missing or scaffold_missing:
        for p in missing:
            print(f"STOPPED: owned file missing: {p}")
        for p in scaffold_missing:
            print(f"STOPPED: scaffold file missing: tools/scaffold/{p}")
        print("Nothing was copied or overwritten. Restore or recreate the file, then run recover.py again.")
        return 1

    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    attempt = os.path.join(HERE, "recovery", f"attempt-{stamp}")
    n = 1
    while os.path.exists(attempt):
        n += 1
        attempt = os.path.join(HERE, "recovery", f"attempt-{stamp}-{n}")

    manifest = {"createdUtc": stamp, "files": []}
    for rel in OWNED:
        target = os.path.join(attempt, rel)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copy2(os.path.join(HERE, rel), target)
        manifest["files"].append({"path": rel, "sha256": sha256(target)})
    with open(os.path.join(attempt, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print(f"Saved your attempt: {os.path.relpath(attempt, HERE)} ({len(OWNED)} files, SHA-256 in manifest.json)")

    for rel in OWNED:
        shutil.copy2(os.path.join(HERE, "tools", "scaffold", rel), os.path.join(HERE, rel))
    print("Restored the clean scaffold. Next: npm run check:boot, then recover one operation from your attempt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
