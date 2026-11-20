// OWNED BY YOU. Request the game data, separate HTTP and JSON failures, and call parseConfig.

import { GENRE } from "./genre.js";
import { parseConfig, type ConfigFor } from "./supplied/config.js";

const ROUTE = "/api/boards/reference";

export async function loadConfig(): Promise<ConfigFor<typeof GENRE>> {
  let response: Response;
  try {
    response = await fetch(ROUTE, { cache: "no-store" });
  } catch {
    throw new Error("Game data request failed: network unavailable");
  }
  if (!response.ok) throw new Error(`Game data request failed: HTTP ${response.status}`);

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Game data was malformed JSON");
  }
  return parseConfig(GENRE, data); // throws ConfigError ("Unexpected game definition ...")
}
