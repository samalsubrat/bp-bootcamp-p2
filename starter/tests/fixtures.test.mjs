// SUPPLIED contract fixtures. Do not edit: these expected results were authored independently of
// any implementation and are shared by every week of the course (TypeScript, C# and the .NET API).
//
// Runs F01-F11 (13 files) for the treasure route or R01-R05B (6 files) for the range route,
// whichever src/genre.ts selects; the other route is reported as skipped.
// Each case calls your COMPILED rules in dist/rules.js, so `npm run check:rules` builds first.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { GENRE } from "../dist/genre.js";
import { parseConfig } from "../dist/supplied/config.js";
import * as rules from "../dist/rules.js";

const fixtures = new URL("../fixtures/", import.meta.url);
const load = (path) => JSON.parse(readFileSync(new URL(path, fixtures), "utf8"));

/** Freeze every nested object so an accidental mutation throws instead of passing silently. */
function deepFreeze(value) {
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const routes = [
  { genre: "treasure", folder: "treasure", definition: "board-reference.json", input: "action" },
  { genre: "range", folder: "range", definition: "range-reference.json", input: "event" },
];

for (const route of routes) {
  const skip = route.genre === GENRE ? false : `src/genre.ts selects "${GENRE}"`;
  const config = skip ? null : parseConfig(route.genre, load(route.definition));
  for (const file of readdirSync(new URL(`${route.folder}/`, fixtures)).sort()) {
    const fixture = load(`${route.folder}/${file}`);
    test(`${fixture.id} ${fixture.description}`, { skip }, () => {
      if (fixture.state === null) {
        // Start fixtures: only the initial state is defined.
        assert.deepStrictEqual(rules.initialState(config), fixture.expected.state);
        return;
      }
      const before = JSON.stringify(fixture.state);
      const state = deepFreeze(structuredClone(fixture.state));
      const action = deepFreeze(structuredClone(fixture[route.input]));
      const result = rules.evaluate(config, state, action);
      assert.deepStrictEqual(result, fixture.expected);
      assert.equal(JSON.stringify(state), before, "evaluate() must not mutate its input state");
    });
  }
}
