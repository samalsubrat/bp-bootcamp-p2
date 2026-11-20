// SUPPLIED: `npm run check:boot` (after the build). Confirms the scaffold boots BEFORE any game logic:
// the page, styles, compiled modules, both game-data routes, the collector and health route answer.
// A failure here is a setup problem (install, compile, missing file), not a behavioural red result.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../server/app.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const server = createApp({ root, log: () => {} });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

let failed = 0;
async function check(label, path, expectStatus, init) {
  try {
    const response = await fetch(base + path, init);
    if (response.status !== expectStatus) throw new Error(`HTTP ${response.status}, expected ${expectStatus}`);
    console.log(`PASS ${label}`);
    return response;
  } catch (e) {
    failed++;
    console.log(`FAIL ${label}: ${e.message}`);
  }
}

await check("page GET /", "/", 200);
await check("event view GET /events.html", "/events.html", 200);
await check("stylesheet GET /site.css", "/site.css", 200);
for (const module of ["app", "genre", "models", "rules", "api", "supplied/config", "supplied/controls",
  "supplied/render", "supplied/telemetry", "supplied/event-view"]) {
  await check(`compiled module dist/${module}.js`, `/dist/${module}.js`, 200);
}
const board = await check("game data GET /api/boards/reference", "/api/boards/reference", 200);
const range = await check("game data GET /api/ranges/reference", "/api/ranges/reference", 200);
await check("unknown board GET /api/boards/other -> 404", "/api/boards/other", 404);
await check("health GET /healthz", "/healthz", 200);
await check("collector rejects a malformed event -> 400", "/api/events", 400, { method: "POST", body: "{}" });

// The supplied configuration guard accepts the served reference definitions.
try {
  const { parseConfig } = await import("../dist/supplied/config.js");
  if (board) parseConfig("treasure", await board.json());
  if (range) parseConfig("range", await range.json());
  const fixture = JSON.parse(readFileSync(join(root, "fixtures", "board-reference.json"), "utf8"));
  parseConfig("treasure", fixture);
  console.log("PASS parseConfig accepts the reference definitions");
} catch (e) {
  failed++;
  console.log(`FAIL parseConfig: ${e.message}`);
}

server.closeAllConnections();
await new Promise((resolve) => server.close(resolve));
console.log(failed ? `${failed} boot check(s) failed: fix the setup before working on rules` : "Boot checks pass: the scaffold is ready");
process.exitCode = failed ? 1 : 0;
