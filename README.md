# Project 2: Playable TypeScript game

**Week 2: TypeScript Programming** · 540 minutes (Thursday PM and Friday), after Thursday AM's
180-minute planning session (W2.10).

Build the first playable version of the game brief you refined in W2.10. Another person must be able
to start, make meaningful progress, finish and restart through its browser controls. Keep these seven
engineering outcomes; elaborate graphics do not earn additional credit.

## Objectives

1. **Design** typed game state and action models that represent the agreed rules.
2. **Write** the chosen game's core action, constraint, progress and completion logic with deterministic tests.
3. **Create** a browser interface that supports starting, playing, finishing and restarting a game.
4. **Integrate** the supplied or adapted game-data API with visible loading and failure handling.
5. **Debug** game-state defects using reproducible inputs and regression tests.
6. **Instrument** one game event using the supplied helper and locate it in the prepared telemetry view.
7. **Deploy** the playable version through the Week 1 workflow and demonstrate its acceptance examples.

## Prerequisites

Bring the existing game brief, selected plan and acceptance examples. The complete W2 examples, hints
and earlier solutions remain available support; repeating a known route or copying an implementation
alone does not demonstrate individual ownership.

| Prior work | Use here |
|---|---|
| W2.01–04 | Compiler, typed objects/unions, functions, collections and imports |
| W2.05 | Labelled controls, shared dispatch and state-driven presentation |
| W2.06 | HTTP/JSON, runtime validation, loading and recoverable failure |
| W2.07–08 | Deterministic checks, regression diagnosis and bounded responsibility |
| W2.09 | Input/rule/render trace and supplied event helper/view |
| W2.10 | Existing genre, minimum slice, dependencies and acceptance examples |
| Week 1 local foundation | Build/check, identify an artifact, run it and verify the request |

Prepared environment (course pins): Node 22.23.2 / npm 10.9.8, TypeScript 5.9.3, Playwright
1.61.0 / Chromium 149.0.7827.55, Python 3 and .NET SDK 10.0.401. No API key or cloud credential is
needed locally. BP access has not been established for this package: use the validated local workflow
when the BP route is blocked, recording the environment separately from learning evidence.

> **About the supplied API.** The book describes the supplied game-data API as a .NET service targeting
> `net10.0`; you do not implement C#. This package ships a dependency-free Node.js implementation of the
> same routes and behaviour ([`server/app.mjs`](starter/server/app.mjs)) so the whole project runs with
> Node alone. Nothing in your owned files depends on which runtime serves the API.

## Setup

Open a terminal in your own copy of [`starter`](starter/):

```bash
npm ci
npm run check:boot
npm run check:rules
npm start
```

* `npm run check:boot` builds and confirms the scaffold boots: page, styles, compiled modules, both
  game-data routes, the collector, `/healthz` and the configuration guard. It passes on the unchanged
  starter.
* `npm run check:rules` **initially fails** because the models/rules and your regression are unfinished:
  on the unchanged starter it reports 14 failing tests (13 treasure fixtures F01–F11 plus the
  placeholder learner test) and 6 skipped (the range fixtures, because `src/genre.ts` selects
  `treasure`). An import, compiler or service-startup error is a setup failure, not a behavioural red
  result.
* `npm start` serves http://127.0.0.1:4182. Set `PORT` to a different available port if needed
  (`PORT=4183 npm start`, or in PowerShell `$env:PORT=4183; npm start`). Stop with Ctrl+C.
  The page boots before the game is implemented. Buttons require neither reflex timing nor aiming.
* First run of the browser checks on a new machine: `npx playwright install chromium`.
* On Windows, use `python` where the book writes `python3` if `python3` is not on your `PATH`.

## What you own and what is supplied

| File | You own | Supplied boundary |
|---|---|---|
| [`src/genre.ts`](starter/src/genre.ts) | Choose the route matching your existing brief | Two domain-action panels |
| [`src/models.ts`](starter/src/models.ts) | Precise state/action types and invariants | Empty compilable shapes and result envelope |
| [`src/rules.ts`](starter/src/rules.ts) | `initialState(config)` and `evaluate(config,state,action)` | No rule implementation in starter |
| [`src/api.ts`](starter/src/api.ts) | Request, HTTP/JSON failure and `parseConfig` call | Configuration validator and same-origin host |
| [`src/app.ts`](starter/src/app.ts) | Load/start/dispatch/restart, retained state, presentation and event calls | `connect`, `paint`, `text`, `playable`, `identify` |
| [`tests/learner.test.mjs`](starter/tests/learner.test.mjs) | Changed-input regression and independent expectation | Node runner and separate contract fixtures |
| [`evidence.md`](starter/evidence.md) | Plan, actual observations, support and individual responses | Submission prompts |

CSS, HTML, button creation, state-text rendering, configuration guard, service routing/startup, event
transport/view and release tools are supplied:

| Supplied file | Responsibility |
|---|---|
| `index.html`, `events.html`, `site.css` | Page, local event view and presentation |
| `src/supplied/controls.ts` | `connect(GENRE, { dispatch, start, restart, reload })` builds the panel (North/East/South/West or Hit/Miss) and wires `#start`, `#restart`, `#reload`; `playable(enabled)` |
| `src/supplied/render.ts` | `paint(state)` lists every public field; `text(region, message)` for `api`, `status`, `result`, `telemetry`; `identify(runId)` |
| `src/supplied/config.ts` | `parseConfig(genre, data)` configuration guard, `TreasureConfig`, `RangeConfig`, `ConfigError` |
| `src/supplied/telemetry.ts` | `newRunId()` and `recordEvent(event)` (one local POST, returns a promise) |
| `src/supplied/event-view.ts` | Script for the local event view |
| `server/app.mjs`, `server/serve.mjs` | Same-origin host: page files, `GET /api/boards/reference`, `GET /api/ranges/reference`, `POST`/`GET /api/events`, `GET /healthz` |
| `tests/fixtures.test.mjs`, `fixtures/` | Contract fixtures F01–F11 and R01–R05B (byte-identical to the course's shared fixtures) |
| `tests/browser/*.spec.mjs`, `playwright.config.mjs` | Lifecycle, request-failure and actual local event checks |
| `tools/check-boot.mjs`, `tools/release.py`, `tools/recover.py` | Boot check, local release, recovery |

The renderer displays all public fields; you decide which returned state reaches it. Keep rules
independent of DOM, clock and random input. Explicit-state functions are sufficient; a class is a
justified choice rather than another requirement.

The request returns validated configuration. Reference wire data uses `initialMoves`; rule state uses
`movesRemaining`. The guard checks the fixed definition rather than installing arbitrary boards. The
telemetry helper accepts run ID, sequence, action, acceptance and copied before/after state, returning
a promise for one local POST. Report collector failure without undoing the action. Its process-memory
event view is not Grafana or BP telemetry.

### Messages the supplied browser checks look for

The checks read only the supplied regions, so your `app.ts`/`api.ts` must put these words there:

| Region / element | Expected text |
|---|---|
| `api` while the request is pending | contains `Loading` |
| `api` after success | contains `verified` |
| `api` after an HTTP failure | contains `HTTP <status>`, e.g. `HTTP 503` |
| `api` after malformed JSON | contains `malformed` |
| `api` after an unexpected definition | contains `Unexpected` (the `ConfigError` message from `parseConfig` already does) |
| `result` after a rejection | contains the reason, e.g. `Rejected: WALL` |
| `telemetry` | exactly `Recorded locally` or `Local recording unavailable` |
| `#start` | starts a fresh game only from verified data; a new run ID each start/restart |
| action buttons | disabled once the game is finished (`playable(false)`) |

Transport messages stay in `api`; game status stays in `status`. Never put an HTTP failure into `status`.

## Genre contract

Choose treasure or range in `src/genre.ts` and implement that route only. Keep your existing game
identity. A supplied text action panel is sufficient; do not build physics, cameras or an engine.

| Route | Minimum rules | Checks |
|---|---|---|
| Treasure hunt / puzzle | 3×3 board; start (0,0), wall (1,1), t1 (2,0), exit (2,2); six moves; accepted moves cost one; treasure gives ten once; exit with treasure wins before zero-budget loss; invalid/completed actions preserve state | F01–F11 in `tests/fixtures.test.mjs` |
| FPS target-range slice | Two ammunition; hit consumes one and scores one; miss consumes one without score; zero ammo completes; unknown and completed events preserve state | R01–R05 in the same file |

The range uses `GET /api/ranges/reference` with the same loading/failure, event and release
boundaries. Its buttons supply hit/miss events; aiming is not implemented. The treasure route uses
`GET /api/boards/reference`. A flight or RPG identity can use the same bounded event-panel approach:
retain its existing brief and agree its state/action/invariant/invalid/finish contract before coding.
Ask the facilitator to supply an additional fixture or presentation adapter within project time; do
not claim the two reference routes implement every genre or make new framework work an independent
prerequisite. The full rule contract is in
[`GAME-CONTRACT.md`](../../../../../shared/contract/GAME-CONTRACT.md).

## Milestones

| Day/block | Minutes | Cumulative | Evidence |
|---|---|---|---|
| Thursday PM: brief and existing-plan check | 20 | 20 | Genre, seven outcomes and owned files |
| Typed models, rules and first tests | 100 | 120 | Start, accepted and invalid examples |
| First browser connection | 30 | 150 | Start and one action render from state |
| Checkpoint and peer diagnosis | 30 | 180 | Actual results, gap and Friday first task |
| Friday: core play and browser lifecycle | 100 | 280 | Progress, finish and restart; midpoint at 270 |
| API loading/failure and observed event | 80 | 360 | Valid/failed requests and attributed row |
| Regression debugging, quality and local release | 80 | 440 | Reproduction, repair, tests and release |
| Acceptance demonstrations and feedback | 60 | 500 | Public-start trace and individual change |
| Reflection and next-week handoff | 30 | 530 | Assistance and next revisit |
| Preserve evidence and stop services | 10 | 540 | Source, logs, events and release retained |

**Midpoint target.** At minute 120 retain the typed model and actual start/accepted/rejected checks.
At minute 180 show one browser action and name the remaining handoff. At midpoint minute 270 aim for
roughly 60%: core rules and basic browser path, with API-failure evidence, event inspection and
release still to complete. The midpoint selects support; it is not the finished-project deadline.

Rotate implementation/review at Thursday's checkpoint and Friday integration. Estimate 150–210
learner-owned application lines across models, rules, API and controller, plus 20–40 test lines and
evidence. About 6.5 hours cover implementation/testing within the fixed timetable. These are planning
assumptions, not measured learner timing.

## Acceptance criteria

1. **Typed models:** name fields, permitted actions and an invariant; show the compiler catching an
   incompatible value, then restore valid source.
2. **Core logic:** run selected contract fixtures and your regression with independent expected values,
   unchanged input, invalid actions, progress and completion. Do not weaken checks for a green result.
3. **Browser lifecycle:** demonstrate public start, progress, finish and fresh restart. A prepared
   near-finish state alone does not establish the public path.
4. **API:** observe loading before response, success, and HTTP/malformed JSON/unexpected-definition
   failures. Preserve the last confirmed session during failed reload. Keep transport and game status
   separate.
5. **Debugging:** retain a reproducible failing behaviour, responsible boundary, narrow correction and
   same regression failing before/passing after. If no defect arises naturally, request the supplied
   diagnostic variant in a preserved copy after the core attempt. Record that support.
6. **Event:** call the helper for an actual action; open the event view, filter by displayed run ID, and
   compare sequence/action/acceptance/before/after with the page. Save the row before stopping the
   collector.
7. **Release:** complete quality/artifact/run/verification from a named local release and demonstrate
   its acceptance path. Distinguish source, artifact and process; label local scope accurately.

Run `npm test` after integration. `check:rules` runs contract and learner tests; `check:browser` runs
lifecycle, request-failure and actual local event checks (10 Playwright checks; the rejected-move check
is skipped on the range route). Browser automation is supplied verification, not a new
framework-writing task. Passing checks supports their stated cases; individual explanation remains
necessary.

### Observing failures by hand

The browser checks inject failures with request interception. To see them yourself, start the server
with a fault (stop the normal server first):

```bash
npm start -- --fault=slow         # game data answers after 1.5 s: watch "Loading"
npm start -- --fault=http         # 503
npm start -- --fault=malformed    # 200 with broken JSON
npm start -- --fault=unexpected   # 200 with a different definition (initialMoves 9 / ammunition 5)
npm start -- --collector=down     # POST /api/events answers 503
```

To test a failed *reload* while a session is in progress, start a game with the normal server, stop it,
restart it with a fault, then choose **Reload game data**.

## Local Week 1 release workflow

Use prepared Week 1 BP instructions only when the instructor confirms that exact environment. No BP
CLI, tenant or live deployment is supplied or claimed here. The local route retains quality → artifact
→ running instance → observable request/evidence:

```bash
npm test
python3 tools/release.py pack ../releases/playable-01
python3 tools/release.py verify ../releases/playable-01
python3 ../releases/playable-01/serve.py
```

Stop development before starting the release on the same port. Packing runs the rule gate and refuses
an existing destination; the preceding `npm test` is the complete browser quality gate. The release
contains compiled browser code, supplied API and SHA-256 inventory. Retain `release.json` and its
directory. In a second terminal, from the workspace:

```bash
P2_URL=http://127.0.0.1:4182 npm run check:browser
python3 tools/release.py verify ../releases/playable-01
```

(PowerShell: `$env:P2_URL="http://127.0.0.1:4182"; npm run check:browser`, then
`Remove-Item Env:P2_URL`.)

`P2_URL` directs checks to the already-running release; it starts no second server. Observe the
game-data GET (its `X-Lab-Release` header names the release), public play path and event. Give
subsequent releases new names. To return to a retained version, stop the current process, verify the
old inventory and run that directory's `serve.py`. This is local release/run evidence, not a container,
Kubernetes or BP deployment; no additional cloud administration is required.

## Feedback and individual evidence

Use the rubric at checkpoints and final review. Each learner predicts and executes a changed
invalid/completion input, explains its expected result from the brief, and locates an actual event and
release check. Oral, written, annotated or recorded responses use the same reasoning standard. A pair
shares an artifact but gives two individual responses. Record everything in
[`evidence.md`](starter/evidence.md).

First/core attempts and individual evidence use supplied materials, documentation and human/access
support without generated code or generated answers. Identify reused examples and demonstrate a bounded
change yourself. Record *demonstrated independently*; *demonstrated with a prompt*; *completed with
guided support*; or *not yet demonstrated*. *Environment blocked* is separate. No numerical grade or
competence from a checkpoint.

## Hints

If the prepared environment is unavailable, inspect the recorded local observations, preserve your
error and arrange a revisit. Label the capture as author evidence; it does not count as your execution.

**Hint 1: narrow the next result.** Choose one acceptance row. Name before-state, action and promised
after-state, then locate its owned function. Avoid changing presentation and rules at once.

**Hint 2: follow a boundary.** Compare rule result with the value passed to `paint`. Inspect HTTP/body
before the guard. Match run and sequence before treating a recorded row as yours.

**Hint 3: use a prior example.** Read the matching W2.04, W2.06, W2.07 or W2.09 example, implement one
operation in your own file, then predict a different input. Record the support; copying a whole engine
remains guided support.

## Recovery

If syntax/setup blocks progress, retain evidence and run `python3 tools/recover.py` from `starter`. It
requires all six owned files, copies and hashes them into a distinct attempt directory
(`recovery/attempt-<UTC time>/` with `manifest.json`), then restores a clean runnable scaffold from
`tools/scaffold/`. Missing files stop before overwrite; repetition creates another distinct backup.
Reopen the saved attempt beside the restored scaffold and recover one operation. Record the missing
skill and next in-class revisit. Ask for a guided connection checkpoint only after preserving your
attempt; supplied completion is not independent competence.

## Teardown

Save source, failed/passing logs, current event row, inventory and individual notes before Ctrl+C. The
collector is ephemeral. Retain attempt/release directories. Revisit gaps in remaining
circulation/feedback time, not extra homework. After all seven outcomes, optionally add a justified
boundary test, improve a state label, or refactor under unchanged tests. New levels, accounts,
multiplayer, physics and deployment platforms are outside the core.
