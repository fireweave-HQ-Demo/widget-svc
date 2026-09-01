# FireWeave agent instructions — prod_dd_bench

Standing instructions for rollout-ready feature work. Manifests and change stamps are **server-owned** — author via `mcp__rollout-server__upsert_rollout_manifest`, never by writing files under `.fireweave/`.

## Rollout-ready layout

| Artifact | Location |
| --- | --- |
| ts-server harness | `apps/atlas-api/src/fireweave/` (`fw-harness.ts`, `fw-providers.ts`, `fw-tracker.ts`) |
| atlas-web harness | `apps/atlas-web/src/fireweave/` |
| python harness | `apps/lantern-api/src/fireweave/` (`fw_harness.py`, `fw_providers.py`, `fw_tracker.py`) |
| lantern-web harness | `apps/lantern-web/src/fireweave/` |
| Provider reference | `.fireweave/PROVIDERS.md` |
| Env contract | `fireweave.md` (repo root) |
| Build gate | `.fireweave/hooks/rollout-build-gate.{sh,mjs}` |

**Server-owned:** rollout-ready manifests → `repo_manifests`; change stamps → `change_stamps`. `FW_STAMPS` in each surface's tracker is the one git-visible stamp line per feature.

**Gitignored runtime:** `.fireweave/.cache/` (projection — rebuild with `fw sync`), `.fireweave/.queue/` (unsynced author state — **never delete as cache remediation**), `.fireweave/.lock`, `.fireweave/local.json`.

---

## How to emit a metric

### ts-server (`atlas-api`)

**Client:** OpenTelemetry `MeterProvider` from `@opentelemetry/sdk-metrics`, wired in `startOtel()`.

**Import / access:** `bootstrap()` returns `telemetry` implementing `Telemetry` with `increment(name, attributes?)` and `record(name, value, attributes?)`.

**Counter:** `telemetry.increment("my.counter", { dim: "value" })`

**Histogram:** `telemetry.record("my.latency_ms", 42, { route: "/home" })`

**Example:** `apps/atlas-api/src/features/telemetry/infrastructure/start-otel.ts` — `meter.createCounter(name)` / `meter.createHistogram(name)` behind the port methods.

**Already emits:** dynamic counter/histogram names via `telemetry.increment` / `telemetry.record`; request spans via `withRequestSpan`; log lines via `telemetry.info`.

### web (`atlas-web`)

**Client:** OTLP HTTP JSON posts in `start-browser-otel.ts` (no OTel SDK bundle).

**Import:** `import { increment, record } from "../features/telemetry/infrastructure/start-browser-otel"`

**Counter:** `await increment(ctx, "document.load")`

**Histogram:** `await record(ctx, "feature.latency_ms", ms)`

**Example:** `apps/atlas-web/src/features/telemetry/infrastructure/start-browser-otel.ts` lines 22–62.

**Already emits:** `document.load` (counter + trace on boot).

### python (`lantern-api`)

**Client:** `Telemetry` class in `start_otel.py` — hand-built OTLP JSON over `urllib`.

**Import:** injected via `bootstrap()` as `telemetry`.

**Counter:** `telemetry.increment("my.counter")`

**Histogram:** `telemetry.record("my.latency_ms", 12.5)`

**Example:** `apps/lantern-api/src/features/telemetry/infrastructure/start_otel.py` — `increment` / `record` POST to `/v1/metrics`.

**Already emits:** trace+log bundle on `emit(name)`; named counters/histograms via `increment` / `record`.

### web (`lantern-web`)

Same pattern as `atlas-web` — `apps/lantern-web/src/features/telemetry/infrastructure/start-browser-otel.ts`.

**Already emits:** `document.load` on boot.

---

## Cohort identity (always-on)

| Surface | Bind |
| --- | --- |
| atlas-api | `registerFwTarget(user.id, { properties })` on login — `handle-auth.ts` |
| atlas-web | `syncFireweaveUser(user.id, props)` after `loginAs` — `LoginPage.tsx` |
| lantern-api | `register_fw_target(user.id, properties=…)` on login — `handle_auth.py` |
| lantern-web | `syncFireweaveUser` after login — `LoginPage.svelte` |

Never gate these behind a feature flag.

---

## Does this task qualify?

Classify before step 1: **change** | **inquiry** | **brainstorm** | **infra-only**. Only **change** runs the HARD ORDER below. When unclear, treat as **change**.

---

## Every feature change — HARD ORDER

1. **FIRST** — `upsert_rollout_manifest` with manifest + `baseContentHash`; mint `chg_<ULID>` + `stmp_<ULID>`; append stamp to the surface's `FW_STAMPS`.
2. Gate with `fw.controlPoints.getBooleanValue(key, false, ctx)` + `// @fireweave-controlpoint <key>`.
3. At each control point, decide metrics (reuse existing names when possible).
4. Amend manifest with metric decisions.
5. **Before done** — `assert_dev_checklist` + `detect_rollout_ready` + `reconcile` phase `build`.
6. Ship via `/fireweave:safe-rollout` only after checklist passes.

## Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave.
- Use `default: true` at eval sites (RAMP-1).
- Gate identity behind flags.
- Write repo-local `mcp/rollout-server/` (Cursor plugin MCP only).

See `.cursor/rules/fireweave-rollout-ready.mdc` and `CLAUDE.md` for host-specific standing loops.
