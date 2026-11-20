// SUPPLIED: an ACTUAL action reaches the local collector and appears in the local event view.
import { test, expect } from "@playwright/test";
import { action, expectFields, startVerified } from "./helpers.mjs";

async function openRow(page, runId, sequence) {
  await page.locator("#event-link").click();
  await expect(page).toHaveURL(/events\.html\?runId=/);
  await expect(page.locator("#run-filter")).toHaveValue(runId);
  const row = page.locator(`#rows tr[data-run-id="${runId}"][data-sequence="${sequence}"]`);
  await expect(row).toHaveCount(1);
  return row;
}

test("an actual action is recorded and visible in the local event view", async ({ page }) => {
  const route = await startVerified(page);
  const runId = (await page.locator("#run-id").textContent()) ?? "";
  await action(page, route.first).click();
  await expect(page.locator("#telemetry")).toHaveText("Recorded locally");

  const row = await openRow(page, runId, 1);
  await expect(row.locator('[data-field="action"]')).toHaveText(route.first);
  await expect(row.locator('[data-field="accepted"]')).toHaveText("accepted");
  await expect(row.locator('[data-field="before"]')).toContainText(route.eventBefore);
  await expect(row.locator('[data-field="after"]')).toContainText(route.eventAfter);
  // Filtering shows only this run.
  for (const shown of await page.locator("#rows tr").all()) await expect(shown).toHaveAttribute("data-run-id", runId);
});

test("a restart starts a new run whose sequence begins at one", async ({ page }) => {
  const route = await startVerified(page);
  const firstRun = (await page.locator("#run-id").textContent()) ?? "";
  await action(page, route.first).click();
  await expect(page.locator("#telemetry")).toHaveText("Recorded locally");
  await page.locator("#restart").click();
  await expect(page.locator("#run-id")).not.toHaveText(firstRun);
  const secondRun = (await page.locator("#run-id").textContent()) ?? "";
  await action(page, route.first).click();
  await expect(page.locator("#telemetry")).toHaveText("Recorded locally");
  await openRow(page, secondRun, 1);
});

test("collector failure is reported without undoing the action", async ({ page }) => {
  const route = await startVerified(page);
  await page.route("**/api/events", (r) => r.request().method() === "POST"
    ? r.fulfill({ status: 503, body: "collector down" }) : r.continue());
  await action(page, route.first).click();
  await expect(page.locator("#telemetry")).toHaveText("Local recording unavailable");
  await expectFields(page, route.afterFirst);
});
