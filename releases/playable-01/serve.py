#!/usr/bin/env python3
"""SUPPLIED: run this packed release (copied into each release directory by tools/release.py).

    python3 ../releases/playable-01/serve.py          # http://127.0.0.1:4182 (PORT overrides)

It starts the release's own copy of the supplied local host (server/serve.mjs) from the release
directory, so the page, compiled code, game-data API and event collector all come from the release,
not from your working copy. Node.js must be installed. Stop with Ctrl+C.
"""
import os
import shutil
import subprocess
import sys

here = os.path.dirname(os.path.abspath(__file__))
node = shutil.which("node")
if node is None:
    sys.exit("node was not found on PATH: the supplied local API needs Node.js")

try:
    sys.exit(subprocess.call([node, os.path.join(here, "server", "serve.mjs"), *sys.argv[1:]], cwd=here))
except KeyboardInterrupt:
    sys.exit(130)
