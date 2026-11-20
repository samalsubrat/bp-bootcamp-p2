// SUPPLIED: local event view (events.html). Reads the events held in the local server's memory.
// Filtering by Run ID only changes what is displayed; it never deletes stored rows.
// Stopping the server discards every row, so save the row you need before Ctrl+C.

interface StoredEvent {
  receivedAt: string;
  runId: string;
  sequence: number;
  action: string;
  accepted: boolean;
  before: unknown;
  after: unknown;
}

function byId<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`events.html is missing #${id}`);
  return found as T;
}

const filter = byId<HTMLInputElement>("run-filter");
const rows = byId<HTMLTableSectionElement>("rows");
const summary = byId<HTMLElement>("summary");

filter.value = new URLSearchParams(location.search).get("runId") ?? "";

function cell(row: HTMLTableRowElement, value: string, field: string): void {
  const td = row.insertCell();
  td.textContent = value;
  td.dataset.field = field;
}

async function refresh(): Promise<void> {
  summary.textContent = "Loading stored events...";
  try {
    const response = await fetch("/api/events", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = (await response.json()) as { events: StoredEvent[] };
    const wanted = filter.value.trim();
    const shown = wanted ? body.events.filter((e) => e.runId === wanted) : body.events;
    rows.replaceChildren();
    for (const event of shown) {
      const row = rows.insertRow();
      row.dataset.runId = event.runId;
      row.dataset.sequence = String(event.sequence);
      cell(row, event.receivedAt, "receivedAt");
      cell(row, event.runId, "runId");
      cell(row, String(event.sequence), "sequence");
      cell(row, event.action, "action");
      cell(row, event.accepted ? "accepted" : "rejected", "accepted");
      cell(row, JSON.stringify(event.before), "before");
      cell(row, JSON.stringify(event.after), "after");
    }
    summary.textContent = `Showing ${shown.length} of ${body.events.length} stored events` +
      (wanted ? ` for run ${wanted}` : " (all runs)");
  } catch (error) {
    summary.textContent = `Event view unavailable: ${(error as Error).message}`;
  }
}

byId<HTMLButtonElement>("refresh").addEventListener("click", () => void refresh());
byId<HTMLFormElement>("filter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const url = new URL(location.href);
  url.searchParams.set("runId", filter.value.trim());
  history.replaceState(null, "", url);
  void refresh();
});
void refresh();
