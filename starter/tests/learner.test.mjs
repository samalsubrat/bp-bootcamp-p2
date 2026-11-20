// OWNED BY YOU. Changed-input regression with an INDEPENDENT expected value (worked out by hand).
//
// Case: the treasure is already collected and the player steps back onto its square.
// Expected from the brief ("treasure gives ten once"): the move is accepted and costs one,
// but score and collected stay unchanged.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseConfig } from "../dist/supplied/config.js";
import { evaluate } from "../dist/rules.js";

const board = JSON.parse(readFileSync(new URL("../fixtures/board-reference.json", import.meta.url), "utf8"));
const config = parseConfig("treasure", board);

test("learner regression: re-entering a collected treasure square does not score again", () => {
  const state = Object.freeze({
    position: Object.freeze({ x: 1, y: 0 }),
    movesRemaining: 3,
    score: 10,
    collected: Object.freeze(["t1"]),
    status: "playing",
  });
  const before = JSON.stringify(state);

  const result = evaluate(config, state, { type: "move", direction: "east" });

  assert.deepStrictEqual(result, {
    accepted: true,
    reason: null,
    state: { position: { x: 2, y: 0 }, movesRemaining: 2, score: 10, collected: ["t1"], status: "playing" },
  });
  assert.equal(JSON.stringify(state), before, "input state must not be mutated");
});
