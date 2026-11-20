// SUPPLIED local host: static page files + same-origin game-data API + local event collector.
//
// The course book describes the supplied game-data API as a .NET (net10.0) service. This package
// ships a dependency-free Node.js implementation of the SAME routes and behaviour so that it runs
// anywhere Node runs; learners do not implement or edit it.
//
//   GET  /                         index.html (also /index.html, /events.html, /site.css, /dist/...)
//   GET  /api/boards/reference     200 treasure board JSON          (other ids -> 404 NOT_FOUND)
//   GET  /api/ranges/reference     200 target-range JSON            (other ids -> 404 NOT_FOUND)
//   POST /api/events               201, stores one event in process memory (400 INVALID_EVENT if malformed)
//   GET  /api/events[?runId=...]   200 { events: [...] }   (oldest first)
//   GET  /healthz                  200 text "Healthy"
//
// Every response carries X-Request-Id, X-Lab-Release and X-Lab-Environment (see API-CONTRACT.md).
// Optional faults let you observe failure handling by hand (the browser checks use request interception):
//   fault: "slow" | "http" | "malformed" | "unexpected"  (game-data routes only)
//   collector: "down"                                   (POST /api/events answers 503)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extname, join, normalize, sep } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const PAGES = new Set(["/index.html", "/events.html", "/site.css"]);
const MAX_EVENT_BYTES = 64 * 1024;

export function createApp({ root, fault = "", collector = "", release = "development", environment = "local", log = console.log }) {
  const events = []; // process memory only: gone when the process stops

  function send(res, status, body, type, requestId) {
    res.writeHead(status, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
      "X-Lab-Release": release,
      "X-Lab-Environment": environment,
    });
    res.end(body);
  }

  const json = (res, status, value, id) => send(res, status, JSON.stringify(value), TYPES[".json"], id);
  const error = (res, status, code, message, id) => json(res, status, { code, message, requestId: id }, id);

  async function gameData(res, kind, id, requestId) {
    if (id !== "reference") {
      const what = kind === "boards" ? "Board" : "Range";
      return error(res, 404, "NOT_FOUND", `${what} not found`, requestId);
    }
    const file = kind === "boards" ? "board-reference.json" : "range-reference.json";
    if (fault === "slow") await new Promise((r) => setTimeout(r, 1500));
    if (fault === "http") return error(res, 503, "UNAVAILABLE", "Game data service unavailable", requestId);
    if (fault === "malformed") return send(res, 200, '{ "id": "reference", "width": ', TYPES[".json"], requestId);
    const data = JSON.parse(await readFile(join(root, "fixtures", file), "utf8"));
    if (fault === "unexpected") {
      if (kind === "boards") data.initialMoves = 9;
      else data.ammunition = 5;
    }
    return json(res, 200, data, requestId);
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0;
      const chunks = [];
      req.on("data", (chunk) => {
        size += chunk.length;
        if (size > MAX_EVENT_BYTES) reject(new Error("too large"));
        else chunks.push(chunk);
      });
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }

  function validEvent(e) {
    const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
    return isObject(e) && typeof e.runId === "string" && e.runId.length > 0 && e.runId.length <= 64 &&
      Number.isInteger(e.sequence) && e.sequence > 0 && typeof e.action === "string" && e.action.length <= 64 &&
      typeof e.accepted === "boolean" && isObject(e.before) && isObject(e.after);
  }

  async function collect(req, res, requestId) {
    if (collector === "down") return error(res, 503, "COLLECTOR_UNAVAILABLE", "Local collector unavailable", requestId);
    let event;
    try {
      event = JSON.parse(await readBody(req));
    } catch {
      return error(res, 400, "INVALID_EVENT", "Event body must be JSON (max 64 KiB)", requestId);
    }
    if (!validEvent(event)) {
      return error(res, 400, "INVALID_EVENT", "Event needs runId, sequence, action, accepted, before and after", requestId);
    }
    const { runId, sequence, action, accepted, before, after } = event;
    events.push({ receivedAt: new Date().toISOString(), requestId, runId, sequence, action, accepted, before, after });
    return json(res, 201, { stored: true, count: events.length, requestId }, requestId);
  }

  async function staticFile(res, path, requestId) {
    const wanted = path === "/" ? "/index.html" : path;
    const allowed = PAGES.has(wanted) || (wanted.startsWith("/dist/") && [".js", ".map"].includes(extname(wanted)));
    const file = normalize(join(root, wanted));
    if (!allowed || !file.startsWith(normalize(root) + sep)) return error(res, 404, "NOT_FOUND", "Not found", requestId);
    try {
      return send(res, 200, await readFile(file), TYPES[extname(file)] ?? "application/octet-stream", requestId);
    } catch {
      return error(res, 404, "NOT_FOUND", `Not found: ${wanted}`, requestId);
    }
  }

  async function route(req, res, url, requestId) {
    const path = url.pathname;
    const api = path.match(/^\/api\/(boards|ranges)\/([^/]+)$/);
    if (req.method === "GET" && api) return gameData(res, api[1], decodeURIComponent(api[2]), requestId);
    if (path === "/api/events" && req.method === "POST") return collect(req, res, requestId);
    if (path === "/api/events" && req.method === "GET") {
      const runId = url.searchParams.get("runId");
      return json(res, 200, { events: runId ? events.filter((e) => e.runId === runId) : events }, requestId);
    }
    if (path === "/healthz" && req.method === "GET") return send(res, 200, "Healthy", "text/plain; charset=utf-8", requestId);
    if (req.method === "GET") return staticFile(res, path, requestId);
    return error(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed", requestId);
  }

  return createServer(async (req, res) => {
    const started = Date.now();
    const requestId = randomUUID();
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    try {
      await route(req, res, url, requestId);
    } catch (e) {
      if (!res.headersSent) error(res, 500, "SERVER_ERROR", "Unexpected server error", requestId);
    }
    // One structured JSON line per request (same fields as the Week 1 request log).
    log(JSON.stringify({
      ts: new Date().toISOString(), job: "academy-p2", request_id: requestId, method: req.method,
      path: url.pathname, status: res.statusCode, duration_ms: Date.now() - started, release, environment,
    }));
  });
}
