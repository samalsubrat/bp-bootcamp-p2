// SUPPLIED: loading, success and each failure kind of the game-data request (intercepted in the browser).
import { test, expect } from "@playwright/test";
import { GAME_DATA, action, expectFields, field, openGame, startVerified } from "./helpers.mjs";

test("loading is visible before the response, then the data is verified", async ({ page }) => {
  let release = () => {};
  const held = new Promise((resolve) => (release = resolve));
  await page.route(GAME_DATA, async (r) => { await held; await r.continue(); });
  await openGame(page);
  await expect(page.locator("#api")).toHaveText(/loading/i);
  release();
  await expect(page.locator("#api")).toHaveText(/verified/i);
});

const failures = [
  ["HTTP failure", (r) => r.fulfill({ status: 503, contentType: "application/json", body: '{"code":"UNAVAILABLE"}' }), /HTTP 503/],
  ["malformed JSON", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{ "id": "reference", ' }), /malformed/i],
  ["unexpected definition", async (r) => {
    const response = await r.fetch();
    const data = await response.json();
    if ("initialMoves" in data) data.initialMoves = 9; else data.ammunition = 5;
    await r.fulfill({ response, json: data });
  }, /unexpected/i],
];

for (const [name, handler, message] of failures) {
  test(`${name} is reported and no game starts from it`, async ({ page }) => {
    await page.route(GAME_DATA, handler);
    await openGame(page);
    await expect(page.locator("#api")).toHaveText(message);
    await page.locator("#start").click();
    await expect(page.locator("#state dd")).toHaveCount(0);
    await expect(page.locator("#status")).not.toHaveText(message); // transport stays out of game status
  });
}

test("a failed reload preserves the last confirmed session", async ({ page }) => {
  const route = await startVerified(page);
  await action(page, route.first).click();
  await expectFields(page, route.afterFirst);
  const before = await page.locator("#state").textContent();

  await page.route(GAME_DATA, (r) => r.fulfill({ status: 503, body: "unavailable" }));
  await page.locator("#reload").click();
  await expect(page.locator("#api")).toHaveText(/HTTP 503/);
  await expect(page.locator("#state")).toHaveText(before ?? "");
  await expect(page.locator("#actions button").first()).toBeEnabled();
  await expect(page.locator("#status")).not.toHaveText(/HTTP/);
  await expect(field(page, "status")).toHaveText(route.fresh.status);
});
