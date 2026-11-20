// OWNED BY YOU. Precise state and action types, and the invariants they must keep.

import type { Point } from "./supplied/config.js";
import type { Direction } from "./supplied/controls.js";

export type Status = "playing" | "won" | "lost";

export type Reason = "WALL" | "EDGE" | "GAME_COMPLETE" | "INVALID_ACTION";

export interface GameState {
  readonly position: Point; // always on the board and never on a wall
  readonly movesRemaining: number; // 0 <= movesRemaining <= initialMoves; only accepted moves spend one
  readonly score: number; // sum of the values of `collected` treasures
  readonly collected: readonly string[]; // treasure ids, each at most once
  readonly status: Status; // "won"/"lost" are final: no further action is accepted
}

/** The panel only sends valid moves, but evaluate() still guards untrusted input (F10). */
export interface GameAction {
  readonly type: "move";
  readonly direction?: Direction;
}

export interface RuleResult {
  readonly accepted: boolean;
  readonly reason: Reason | null; // null exactly when accepted
  readonly state: GameState;
}
