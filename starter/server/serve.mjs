// SUPPLIED: start the local host on http://127.0.0.1:4182 (override with PORT).
//
//   node server/serve.mjs                       normal development server
//   node server/serve.mjs --fault=slow          game data answers after 1.5 s (observe "loading")
//   node server/serve.mjs --fault=http          game data answers 503
//   node server/serve.mjs --fault=malformed     game data answers 200 with broken JSON
//   node server/serve.mjs --fault=unexpected    game data answers 200 with a different definition
//   node server/serve.mjs --collector=down      POST /api/events answers 503
//
// With npm:  npm start -- --fault=malformed   (the extra arguments reach this script)
// LAB_ENV sets the public X-Lab-Environment label (default "local"). It is never a credential.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const option = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? "";

const FAULTS = ["", "slow", "http", "malformed", "unexpected"];
const fault = option("fault");
const collector = option("collector");
if (!FAULTS.includes(fault)) {
  console.error(`Unknown --fault=${fault}. Use one of: ${FAULTS.filter(Boolean).join(", ")}`);
  process.exit(2);
}

// A packed release carries release.json; its name becomes the X-Lab-Release label.
const manifest = join(root, "release.json");
const release = existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")).name : "development";

if (!existsSync(join(root, "dist", "app.js"))) {
  console.error("dist/app.js is missing: run `npm run build` first (npm start does this for you).");
  process.exit(1);
}

const port = Number(process.env.PORT ?? 4182);
const server = createApp({ root, fault, collector, release, environment: process.env.LAB_ENV ?? "local" });
server.on("error", (e) => {
  console.error(e.code === "EADDRINUSE"
    ? `Port ${port} is already in use. Stop the other server (Ctrl+C) or set PORT to a free port.`
    : e.message);
  process.exit(1);
});
server.listen(port, "127.0.0.1", () => {
  const notes = [fault && `fault=${fault}`, collector && `collector=${collector}`].filter(Boolean).join(", ");
  console.log(`P2 (${release}) listening on http://127.0.0.1:${server.address().port}/${notes ? `  [${notes}]` : ""}`);
  console.log("Local event view: /events.html  (process memory only; Ctrl+C discards stored events)");
});
