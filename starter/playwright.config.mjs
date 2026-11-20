// SUPPLIED browser checks (Playwright 1.61.0, Chromium).
//   npm run check:browser                       builds and starts its own server on PORT (default 4182)
//   P2_URL=http://127.0.0.1:4182 npm run check:browser
//                                               checks an ALREADY RUNNING server (e.g. a packed release)
//                                               and starts no second server.
// Stop `npm start` before the first form: both want the same port.
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 4182);
const external = process.env.P2_URL;

export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 20_000,
  use: {
    baseURL: external ?? `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: external
    ? undefined
    : {
        command: "npm run build && node server/serve.mjs",
        url: `http://127.0.0.1:${port}/healthz`,
        env: { PORT: String(port) },
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
