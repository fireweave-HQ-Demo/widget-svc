# FireWeave agent instructions — stg_dd_bench

Standing instructions for rollout-ready feature work in this repo.

## Rollout-ready layout

| Artifact | Location |
| --- | --- |
| atlas-api harness | `apps/atlas-api/src/fireweave/fw-harness.ts` |
| atlas-api tracker | `apps/atlas-api/src/fireweave/fw-tracker.ts` |
| atlas-web harness | `apps/atlas-web/src/fireweave/fw-harness.ts` |
| atlas-web tracker | `apps/atlas-web/src/fireweave/fw-tracker.ts` |
| lantern-api harness | `apps/lantern-api/src/fireweave/fw_harness.py` |
| lantern-api tracker | `apps/lantern-api/src/fireweave/fw_tracker.py` |
| lantern-web harness | `apps/lantern-web/src/fireweave/fw-harness.ts` |
| lantern-web tracker | `apps/lantern-web/src/fireweave/fw-tracker.ts` |
| Provider notes | `.fireweave/PROVIDERS.md` |
| Credential names | `fireweave.md` (repo root) |

**Manifests and change stamps are server-owned** — author via `mcp_rollout-server_upsert_rollout_manifest`; do not write files under `.fireweave/rollout-ready/`.

**Gitignored runtime:** `.fireweave/.cache/` (projection — rebuild with `fw sync`), `.fireweave/.queue/` (unsynced author state — never delete as cache remediation), `.fireweave/.lock`, `.fireweave/local.json`.

## How to emit a metric — atlas-api (ts-server)

**Client:** OpenTelemetry `MeterProvider` via `startOtel()` — `@opentelemetry/sdk-metrics`

**Import:** from `apps/atlas-api/src/features/telemetry/infrastructure/start-otel.ts` (returns `Telemetry` port)

**Counter:** `telemetry.increment(name, attributes?)`

**Histogram:** `telemetry.record(name, value, attributes?)`

**Where:** module singleton created in `bootstrap()` and passed through composition

**Example:** `apps/atlas-api/src/features/telemetry/infrastructure/start-otel.ts` — `telemetry.info("otel started", …)` at boot; request spans via `telemetry.withRequestSpan()`

**Tags:** OpenTelemetry attributes on each call; `service.name` and `deployment.environment` set on resource

**Already emits:** boot log via `info()`; per-request spans + logs in `withRequestSpan()`; named counters/histograms via `increment`/`record` when feature code calls them

**metricsClient:** `@opentelemetry/sdk-metrics` (OTLP HTTP export to collector)

## How to emit a metric — atlas-web (web)

**Client:** direct OTLP HTTP helpers in `start-browser-otel.ts`

**Import:** `import { increment, record } from "../features/telemetry/infrastructure/start-browser-otel"`

**Counter:** `await increment(ctx, name, value?)`

**Histogram:** `await record(ctx, name, value)`

**Example:** `apps/atlas-web/src/features/telemetry/infrastructure/start-browser-otel.ts` — `await increment(ctx, "document.load")` on page load

**metricsClient:** OTLP HTTP (browser → collector)

## How to emit a metric — lantern-api (python)

**Client:** `Telemetry` class from `start_otel(ctx)`

**Import:** `from src.features.telemetry.infrastructure.start_otel import start_otel`

**Counter:** `telemetry.increment(name, value=1)`

**Histogram:** `telemetry.record(name, value)`

**Example:** `apps/lantern-api/src/features/telemetry/infrastructure/start_otel.py` — OTLP JSON posts to `/v1/metrics`

**metricsClient:** stdlib OTLP HTTP (urllib)

## How to emit a metric — lantern-web (web)

Same pattern as atlas-web — `increment` / `record` in `apps/lantern-web/src/features/telemetry/infrastructure/start-browser-otel.ts` (if present) or shared browser OTLP helpers.

**metricsClient:** OTLP HTTP (browser → collector)

## Cohort identity

Identity binds run **unconditionally** at sign-in — never inside a flag branch:

- **atlas-api:** `registerFwTarget()` in `handle-auth.ts` after `store.login()`
- **lantern-api:** `register_fw_target()` in `handle_auth.py` after login
- **atlas-web / lantern-web:** `syncFireweaveUser()` in login UI after session established

Always pass real user id as `targetingKey` on flag reads.

## Does this task qualify?

Classify before step 1: **change** | **inquiry** | **brainstorm** | **infra-only**. Only **change** runs the rollout package. When unclear, treat as **change**.

## Every feature change (dev — before `/fw-rollout`) — HARD ORDER

1. **FIRST** — `upsert_rollout_manifest` + mint `chg_`/`stmp_` + append stamp to surface's `FW_STAMPS`
2. Implement behind `fw.controlPoints.getBooleanValue(key, false, ctx)` with `// @fireweave-controlpoint <key>`
3. **BEFORE done** — `assert_dev_checklist` + `reconcile` phase `build`
4. Ship via `/fireweave:safe-rollout` only

See `.cursor/rules/fireweave-rollout-ready.mdc` and `CLAUDE.md` for full manifest contract.
