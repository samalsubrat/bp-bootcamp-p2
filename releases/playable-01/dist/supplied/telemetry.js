// SUPPLIED: event helper (transport to the LOCAL collector only).
//
// recordEvent(event) copies the record you give it and sends it in ONE same-origin POST to /api/events.
// The returned promise fulfils when the local collector accepts the event and rejects on a network
// failure or a non-2xx response. There is no retry queue, durable storage or exactly-once guarantee.
// A failed recording must never undo a game action: report it with text("telemetry", ...) and move on.
//
// The collector keeps events in the memory of the local server process (see events.html).
// It is not Grafana and not BP telemetry.
/** A new random run identifier such as "run-3f9c2a1b". */
export function newRunId() {
    return `run-${crypto.randomUUID().slice(0, 8)}`;
}
export async function recordEvent(event) {
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
    if (!response.ok)
        throw new Error(`Local collector rejected the event: HTTP ${response.status}`);
}
//# sourceMappingURL=telemetry.js.map