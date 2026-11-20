// OWNED BY YOU. The application adapter: load -> start -> dispatch -> restart.

import { loadConfig } from "./api.js";
import { GENRE } from "./genre.js";
import type { GameAction, GameState } from "./models.js";
import { evaluate, initialState, isFinished } from "./rules.js";
import type { TreasureConfig } from "./supplied/config.js";
import { connect, playable } from "./supplied/controls.js";
import { identify, paint, text } from "./supplied/render.js";
import { newRunId, recordEvent } from "./supplied/telemetry.js";

let config: TreasureConfig | null = null; // last verified game data
let state: GameState | null = null; // last confirmed session
let runId = "";
let sequence = 0;

const STATUS_TEXT = { playing: "Playing", won: "You won!", lost: "Out of moves: you lost" } as const;

function show(next: GameState): void {
  state = next;
  paint(next);
  text("status", STATUS_TEXT[next.status]);
  playable(!isFinished(next));
}

async function load(): Promise<void> {
  text("api", "Loading game data…");
  try {
    config = await loadConfig();
    text("api", "Game data verified");
  } catch (error) {
    // A failed (re)load keeps the previous config and session untouched.
    text("api", error instanceof Error ? error.message : String(error));
  }
}

function start(): void {
  if (!config) {
    text("status", "Cannot start until game data is verified");
    return;
  }
  runId = newRunId();
  sequence = 0;
  identify(runId);
  text("result", "");
  text("telemetry", "");
  show(initialState(config));
}

function dispatch(action: GameAction): void {
  if (!config || !state) return;
  const before = state;
  const result = evaluate(config, before, action);
  show(result.state);
  text("result", result.accepted ? `Moved ${action.direction}` : `Rejected: ${result.reason}`);

  recordEvent({
    runId,
    sequence: ++sequence,
    action: action.direction ?? action.type,
    accepted: result.accepted,
    before,
    after: result.state,
  }).then(
    () => text("telemetry", "Recorded locally"),
    () => text("telemetry", "Local recording unavailable"),
  );
}

connect(GENRE, { dispatch, start, restart: start, reload: load });
playable(false);
text("status", "Press Start to begin");
void load();
