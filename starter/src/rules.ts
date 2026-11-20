// OWNED BY YOU. Pure rules: no DOM, clock, randomness or I/O, and never mutate an input.

import type { Point, TreasureConfig } from "./supplied/config.js";
import type { GameAction, GameState, Reason, RuleResult } from "./models.js";

const STEPS: Readonly<Record<string, Point>> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const reject = (state: GameState, reason: Reason): RuleResult => ({ accepted: false, reason, state });

export function initialState(config: TreasureConfig): GameState {
  return {
    position: { x: config.start.x, y: config.start.y },
    movesRemaining: config.initialMoves,
    score: 0,
    collected: [],
    status: "playing",
  };
}

export function evaluate(config: TreasureConfig, state: GameState, action: GameAction): RuleResult {
  if (isFinished(state)) return reject(state, "GAME_COMPLETE");

  const step = action?.type === "move" && typeof action.direction === "string" && Object.hasOwn(STEPS, action.direction)
    ? STEPS[action.direction]
    : undefined;
  if (!step) return reject(state, "INVALID_ACTION");

  const position = { x: state.position.x + step.x, y: state.position.y + step.y };
  if (position.x < 0 || position.y < 0 || position.x >= config.width || position.y >= config.height) {
    return reject(state, "EDGE");
  }
  if (config.walls.some((wall) => same(wall, position))) return reject(state, "WALL");

  const found = config.treasures.find((t) => same(t, position) && !state.collected.includes(t.id));
  const collected = found ? [...state.collected, found.id] : [...state.collected];
  const score = state.score + (found?.value ?? 0);
  const movesRemaining = state.movesRemaining - 1;
  const hasAllTreasure = config.treasures.every((t) => collected.includes(t.id));

  // Win is checked before the zero-budget loss (F07).
  const status = same(position, config.exit) && hasAllTreasure ? "won" : movesRemaining === 0 ? "lost" : "playing";

  return { accepted: true, reason: null, state: { position, movesRemaining, score, collected, status } };
}

/** True when no further action can be accepted. */
export function isFinished(state: GameState): boolean {
  return state.status !== "playing";
}
