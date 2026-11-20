// SUPPLIED helpers shared by the browser checks. They read the page only through the supplied
// regions (#api, #status, #result, #telemetry, #run-id, #state [data-field]) and buttons.
import { expect } from "@playwright/test";

export const GAME_DATA = /\/api\/(boards|ranges)\/reference$/;

/** Per-genre play script: the reference winning path and the expected fresh/after-first-action values. */
export const ROUTES = {
  treasure: {
    first: "east",
    path: ["east", "east", "south", "south"],
    finished: { status: "won", score: "10", movesRemaining: "2" },
    fresh: { status: "playing", position: "(0,0)", movesRemaining: "6", score: "0" },
    afterFirst: { position: "(1,0)", movesRemaining: "5" },
    eventBefore: '"movesRemaining":6',
    eventAfter: '"movesRemaining":5',
  },
  range: {
    first: "hit",
    path: ["hit", "miss"],
    finished: { status: "complete", score: "1", ammunition: "0" },
    fresh: { status: "active", ammunition: "2", score: "0", shots: "0" },
    afterFirst: { ammunition: "1", score: "1" },
    eventBefore: '"ammunition":2',
    eventAfter: '"ammunition":1',
  },
};

export async function openGame(page) {
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute("data-genre", /treasure|range/);
  const genre = await page.locator("body").getAttribute("data-genre");
  return ROUTES[genre];
}

export const field = (page, name) => page.locator(`#state [data-field="${name}"]`);
export const action = (page, name) => page.locator(`#actions button[data-action="${name}"]`);

export async function expectFields(page, values) {
  for (const [name, value] of Object.entries(values)) await expect(field(page, name)).toHaveText(value);
}

export async function startVerified(page) {
  const route = await openGame(page);
  await expect(page.locator("#api")).toHaveText(/verified/i);
  await page.locator("#start").click();
  await expectFields(page, route.fresh);
  return route;
}
