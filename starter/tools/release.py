#!/usr/bin/env python3
"""SUPPLIED local release tool (the local route of the Week 1 workflow: quality -> artifact -> run -> verify).

    python3 tools/release.py pack ../releases/playable-01
    python3 tools/release.py verify ../releases/playable-01

pack    refuses an existing destination, runs the rule gate (npm run check:rules, which also builds),
        then copies the compiled browser code, page files, supplied API and its game data into the
        destination, adds serve.py and writes release.json with a SHA-256 inventory of every file.
        `npm test` before packing is the complete (browser) quality gate.
verify  recomputes every SHA-256, and reports changed, missing or unlisted files. Exit code 0 = intact.

This is local release/run evidence only: no container, Kubernetes or BP deployment is involved.
Run it from the starter directory (the folder containing package.json).
"""
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # the project directory
PAGE_FILES = ["index.html", "events.html", "site.css"]
TREES = [("dist", (".js", ".map")), ("server", (".mjs",)), ("fixtures", (".json",))]


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inventory(root):
    """Every file under root except release.json and caches, as sorted forward-slash paths."""
    found = []
    for base, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for name in files:
            rel = os.path.relpath(os.path.join(base, name), root).replace(os.sep, "/")
            if rel != "release.json":
                found.append(rel)
    return sorted(found)


def genre():
    source = open(os.path.join(HERE, "src", "genre.ts"), encoding="utf-8").read()
    match = re.search(r'GENRE\s*=\s*"(treasure|range)"', source)
    return match.group(1) if match else "unknown"


def pack(dest):
    if os.path.exists(dest):
        print(f"REFUSED: {dest} already exists. Give each release a new name (e.g. playable-02).")
        return 2
    print("Rule gate: npm run check:rules")
    gate = subprocess.run("npm run check:rules", shell=True, cwd=HERE)
    if gate.returncode != 0:
        print("REFUSED: the rule gate failed, so no release was created.")
        return 1

    os.makedirs(dest)
    for name in PAGE_FILES:
        shutil.copy2(os.path.join(HERE, name), os.path.join(dest, name))
    for tree, extensions in TREES:
        for base, _dirs, files in os.walk(os.path.join(HERE, tree)):
            for name in files:
                if name.endswith(extensions):
                    source = os.path.join(base, name)
                    target = os.path.join(dest, os.path.relpath(source, HERE))
                    os.makedirs(os.path.dirname(target), exist_ok=True)
                    shutil.copy2(source, target)
    shutil.copy2(os.path.join(HERE, "tools", "release-template", "serve.py"), os.path.join(dest, "serve.py"))

    files = [{"path": p, "sha256": sha256(os.path.join(dest, p)), "bytes": os.path.getsize(os.path.join(dest, p))}
             for p in inventory(dest)]
    manifest = {
        "name": os.path.basename(os.path.normpath(dest)),
        "genre": genre(),
        "createdUtc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gate": "npm run check:rules passed",
        "scope": "local release: compiled browser code, supplied API and game data; not a container or BP deployment",
        "files": files,
    }
    with open(os.path.join(dest, "release.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
    print(f"Packed release {manifest['name']} ({manifest['genre']}): {len(files)} files -> {dest}")
    print(f"Run it with: python3 {os.path.join(dest, 'serve.py')}")
    return 0


def verify(dest):
    manifest_path = os.path.join(dest, "release.json")
    if not os.path.isfile(manifest_path):
        print(f"FAIL: {manifest_path} not found")
        return 1
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    listed = {f["path"]: f["sha256"] for f in manifest["files"]}
    problems = []
    for path, expected in listed.items():
        full = os.path.join(dest, path)
        if not os.path.isfile(full):
            problems.append(f"missing  {path}")
        elif sha256(full) != expected:
            problems.append(f"changed  {path}")
    for path in inventory(dest):
        if path not in listed:
            problems.append(f"unlisted {path}")
    for line in problems:
        print(f"FAIL {line}")
    if problems:
        print(f"Release {manifest['name']} does NOT match its inventory ({len(problems)} problem(s))")
        return 1
    print(f"Release {manifest['name']} verified: {len(listed)} files match release.json (SHA-256)")
    return 0


def main(argv):
    if len(argv) != 3 or argv[1] not in ("pack", "verify"):
        print(__doc__)
        return 2
    dest = os.path.abspath(argv[2])
    return pack(dest) if argv[1] == "pack" else verify(dest)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
