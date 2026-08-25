# FireWeave agent instructions (tue_test)

## Rollout-ready layout

| Artifact | Path |
|----------|------|
| API harness | `template-mirror/atlas-api/src/fireweave/fw-harness.ts` (+ `fw-providers.ts`) |
| API tracker | `template-mirror/atlas-api/src/fireweave/fw-tracker.ts` → `FW_STAMPS` |
| Web harness | `template-mirror/atlas-web/src/fireweave/fw-harness.ts` (+ `fw-providers.ts`) |
| Web tracker | `template-mirror/atlas-web/src/fireweave/fw-tracker.ts` → `FW_STAMPS` |
| Providers | `.fireweave/PROVIDERS.md` |
| Manifests + stamps | **server-owned** — `mcp_rollout-server_upsert_rollout_manifest` / resolution seam. No `.fireweave/rollout-ready/` or `changelog/` directory. |
| Gitignored runtime | `.fireweave/.cache/` (projection), `.fireweave/.queue/` (unsynced author state — **never delete to clear a warning**), `.fireweave/.lock`, `deploy-beacon.env.local` |

## How to emit a metric — ts-server (atlas-api)

**Client:** OpenTelemetry `MeterProvider` via app telemetry port.

**Import (as in repo):**
```ts
import { startOtel } from "../features/telemetry/infrastructure/start-otel";
// composition: const telemetry = startOtel(ctx);
```

**Call shape:**
- Counter: `telemetry.increment(name, attributes?)`
- Histogram: `telemetry.record(name, value, attributes?)`

**Instrument source:** module-level maps inside `startOtel` — one `Meter` per service; counters/histograms created lazily by name.

**Real example:** `template-mirror/atlas-api/src/features/telemetry/infrastructure/start-otel.ts` — `increment` / `record` wrappers around `meter.createCounter` / `createHistogram`.

**Preferred wrapper:** the `Telemetry` port (`features/telemetry/application/ports/telemetry.ts`), not raw `@opentelemetry/api`.

**Tags:** attribute maps (`Record<string, string>`). Cohort key for rollout comparisons should be passed as an attribute when emitting at a gated path (e.g. `targetingKey` / user id).

**Already emits:** no fixed named metrics at call sites yet — only request spans + dynamic `increment`/`record` API. Inventory grows as features add names.

`metricsClient`: `otel-sdk`

## How to emit a metric — web (atlas-web)

**Client:** browser OTLP HTTP helpers.

**Import (as in repo):**
```ts
import { increment, record, startBrowserOtel } from "../features/telemetry/infrastructure/start-browser-otel";
```

**Call shape:**
- Counter: `await increment(ctx, name, value?)`
- Histogram: `await record(ctx, name, value)`

**Instrument source:** per-call POST to `ctx.exporterEndpoint` `/v1/metrics` (no shared MeterProvider).

**Real example:** `template-mirror/atlas-web/src/features/telemetry/infrastructure/start-browser-otel.ts` — `await increment(ctx, "document.load")` from `startBrowserOtel`.

**Preferred wrapper:** `increment` / `record` in that module.

**Tags:** resource attributes `service.name`, `deployment.environment` only today.

**Already emits:** `document.load` (counter) on boot via `startBrowserOtel`.

`metricsClient`: `browser-otlp`

## Does this task qualify? — classify BEFORE step 1

| Class | Run package? |
|-------|----------------|
| **change** — modify observable runtime behaviour | YES |
| **inquiry** / **brainstorm** / **infra-only** | no (re-classify when writing starts) |

When unclear, treat as **change**.

## Every feature change — HARD ORDER

1. **FIRST** — `mcp_rollout-server_upsert_rollout_manifest` `{ feature, manifest, baseContentHash }` (FireWeave stores it). Mint `chg_`/`stmp_`; append each stamp to its surface's `FW_STAMPS`.
2. Gate behind `fw.controlPoints.getBooleanValue(key, false, ctx)` + `// @fireweave-controlpoint <key>`.
3. At each control point, decide signals (reuse / add / park).
4. Amend the manifest with metrics decisions.
5. **BEFORE done** — `assert_dev_checklist` + `detect_rollout_ready` + `reconcile` phase `build`.
6. No PR / done until checklist passes. Ship via `/fw-rollout`.

Absence names: only `never-authored` means author now. `not-fetched`→`fw sync`; `not-authorized`→withheld; `queued`→drain `.queue/`.

## Do not

- Swap providers at promotion; route telemetry through FireWeave; delete stamps without `/fw-cleanup`; write repo-local `mcp/`; backfill manifests; use default `true`; gate identity behind a flag.

## Cohort identity (always-on — never behind a flag)

| Surface | Contract |
|---------|----------|
| **Web** | After login / session restore: `syncFireweaveUser(user.id, { plan, beta, org, country })` in `LoginPage.tsx`. On no-session / restore failure: `resetFireweaveUser()` (device key). |
| **Server** | On `POST /auth/session` login: `registerFwTarget(user.id, properties)` in `handle-auth.ts`. Pass `{ targetingKey: user.id }` on every request-path `getBooleanValue`. |

## Manifest contract / Ship

See Cursor rule + safe-rollout skill. Eval-site + manifest boolean defaults MUST be `false` (RAMP-1). Local ON → `makeDevProvider()` `local.controlPoints` only.
