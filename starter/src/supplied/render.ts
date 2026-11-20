// SUPPLIED: state-text rendering. You decide WHICH state reaches paint(); this file decides how it looks.
//
// paint(state)          lists every public field of the state you pass, e.g. "movesRemaining: 5".
//                        Painting the same state twice is safe. It never changes the object it is given.
// text(region, message)  replaces the words of one message region (textContent, never HTML).
// identify(runId)        shows the current run ID and points the "Local event view" link at it.

export type Region = "api" | "status" | "result" | "telemetry";

function region(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Supplied page is missing #${id}`);
  return found;
}

function show(value: unknown): string {
  if (Array.isArray(value)) return value.length === 0 ? "none" : value.map(show).join(", ");
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record.x === "number" && typeof record.y === "number" && Object.keys(record).length === 2) {
      return `(${record.x},${record.y})`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/** Describe a state object: one <dt>/<dd> pair per public field, in the object's own order. */
export function paint(state: object): void {
  const list = region("state");
  const rows: HTMLElement[] = [];
  for (const [name, value] of Object.entries(state)) {
    const term = document.createElement("dt");
    term.textContent = name;
    const detail = document.createElement("dd");
    detail.dataset.field = name;
    detail.textContent = show(value);
    rows.push(term, detail);
  }
  list.replaceChildren(...rows);
  const status = (state as { status?: unknown }).status;
  if (typeof status === "string") document.body.dataset.status = status;
}

/** Replace the text of one message region: "api", "status", "result" or "telemetry". */
export function text(name: Region, message: string): void {
  region(name).textContent = message;
}

/** Show the current run ID and carry it into the local event view link. */
export function identify(runId: string): void {
  region("run-id").textContent = runId;
  const link = region("event-link");
  if (link instanceof HTMLAnchorElement) link.href = `events.html?runId=${encodeURIComponent(runId)}`;
}
