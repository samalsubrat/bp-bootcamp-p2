// SUPPLIED: event helper (transport to the LOCAL collector only).
//
// recordEvent(event) copies the record you give it and sends it in ONE same-origin POST to /api/events.
// The returned promise fulfils when the local collector accepts the event and rejects on a network
// failure or a non-2xx response. There is no retry queue, durable storage or exactly-once guarantee.
// A failed recording must never undo a game action: report it with text("telemetry", ...) and move on.
//
// The collector keeps events in the memory of the local server process (see events.html).
// It is not Grafana and not BP telemetry.

export interface GameEvent {
  /** Identifies one game attempt; make a new one for every start/restart. */
  readonly runId: string;
  /** 1 for the first action of a run, then 2, 3, ... */
  readonly sequence: number;
  /** The action as a short word, e.g. "east" or "hit". */
  readonly action: string;
  /** Whether the rules accepted the action. */
  readonly accepted: boolean;
  /** State passed to the rule (copied when the helper is called). */
  readonly before: object;
  /** State the rule returned (copied when the helper is called). */
  readonly after: object;
}

/** A new random run identifier such as "run-3f9c2a1b". */
export function newRunId(): string {
  return `run-${crypto.randomUUID().slice(0, 8)}`;
}

export async function recordEvent(event: GameEvent): Promise<void> {
  // Serialising now copies before/after, so later actions cannot rewrite this record.
  const body = JSON.stringify({
    runId: event.runId,
    sequence: event.sequence,
    action: event.action,
    accepted: event.accepted,
    before: event.before,
    after: event.after,
  });
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!response.ok) throw new Error(`Local collector rejected the event: HTTP ${response.status}`);
}
