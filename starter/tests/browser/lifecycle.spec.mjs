// SUPPLIED: public start -> progress -> finish -> fresh restart, through the real buttons.
import { test, expect } from "@playwright/test";
import { action, expectFields, field, startVerified } from "./helpers.mjs";

test("public start, progress, finish and fresh restart", async ({ page }) => {
  const route = await startVerified(page);
  const firstRun = await page.locator("#run-id").textContent();
  expect(firstRun).toMatch(/^run-/);

  await action(page, route.first).click();
  await expectFields(page, route.afterFirst);

  // Restart, then play the whole reference path from a fresh state.
  await page.locator("#restart").click();
  await expectFields(page, route.fresh);
  for (const step of route.path) await action(page, step).click();
  await expectFields(page, route.finished);
  for (const button of await page.locator("#actions button").all()) await expect(button).toBeDisabled();

  await page.locator("#restart").click();
  await expectFields(page, route.fresh);
  await expect(page.locator("#actions button").first()).toBeEnabled();
  await expect(page.locator("#run-id")).not.toHaveText(firstRun ?? "");
});

test("a rejected action is reported and leaves the state unchanged", async ({ page }) => {
  const route = await startVerified(page);
  test.skip(!("position" in route.fresh), "the range route has no rejectable button while active");
  await action(page, "north").click(); // off the board at (0,0)
  await expect(page.locator("#result")).toHaveText(/EDGE/);
  await expectFields(page, route.fresh);
  await action(page, "east").click();
  await action(page, "south").click(); // into the wall at (1,1)
  await expect(page.locator("#result")).toHaveText(/WALL/);
  await expect(field(page, "position")).toHaveText("(1,0)");
  await expect(field(page, "movesRemaining")).toHaveText("5");
});
