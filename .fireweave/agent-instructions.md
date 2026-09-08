# FireWeave agent instructions — stg_bench

Project **new_test_s** (`bffb7f42-10a4-4706-a6d3-e2c1f0d2be6e`). Promote-not-wrap: both dev and prod flag branches are scaffolded; the running environment selects the tier.

## Rollout-ready layout

| Artifact | Path |
| --- | --- |
| ts-server harness | `apps/atlas-api/src/fireweave/fw-harness.ts` |
| ts-server tracker | `apps/atlas-api/src/fireweave/fw-tracker.ts` (`FW_STAMPS`) |
| web harness (atlas) | `apps/atlas-web/src/fireweave/fw-harness.ts` |
| web tracker (atlas) | `apps/atlas-web/src/fireweave/fw-tracker.ts` |
| python harness | `apps/lantern-api/src/fireweave/fw_harness.py` |
| python tracker | `apps/lantern-api/src/fireweave/fw_tracker.py` |
| web harness (lantern) | `apps/lantern-web/src/fireweave/fw-harness.ts` |
| web tracker (lantern) | `apps/lantern-web/src/fireweave/fw-tracker.ts` |
| Provider notes | `.fireweave/PROVIDERS.md` |
| Env contract | `fireweave.md` (repo root) |

**Manifests and change stamps are server-owned** — author via `upsert_rollout_manifest`; do not create `.fireweave/rollout-ready/` or manifest files on disk.

Gitignored runtime: `.fireweave/.cache/` (projection — rebuild with `fw sync`), `.fireweave/.queue/` (unsynced author state — **never delete to clear warnings**), `.fireweave/.lock`.

## How to emit a metric — atlas-api (ts-server)

**Client:** OpenTelemetry `MeterProvider` via bootstrap telemetry port.

```typescript
import type { Telemetry } from "../features/telemetry/application/ports/telemetry";
```

- Counter: `telemetry.increment(name, attributes?)`
- Histogram: `telemetry.record(name, value, attributes?)`
- Source: injected from `bootstrap()` → `startOtel(ctx)` singleton per process.

**Already emits:** request spans and logs via `withRequestSpan`; OTel counters/histograms created lazily on first `increment`/`record` call. No named product metrics yet beyond bootstrap `otel started` log attributes.

Tags: OpenTelemetry attributes on each instrument; cohort via `targetingKey` on flag reads (not on metrics today).

## How to emit a metric — atlas-web (web)

**Client:** bench browser OTLP helper.

```typescript
import { increment, record } from "../features/telemetry/infrastructure/start-browser-otel";
```

- Counter: `await increment(ctx, name, value?)`
- Histogram: `await record(ctx, name, value)`
- Source: `ctx` from `loadRuntimeFromEnv`; called from composition after `startBrowserOtel(ctx)`.

**Already emits:** `document.load` counter on page boot (`apps/atlas-web/src/composition/create-app.tsx`).

## How to emit a metric — lantern-api (python)

**Client:** bench `Telemetry` class from `start_otel`.

```python
from src.features.telemetry.infrastructure.start_otel import Telemetry
```

- Counter: `telemetry.increment(name, value=1)`
- Histogram: `telemetry.record(name, value)`
- Source: injected into HTTP handler via bootstrap.

**Already emits:** `{method} {path}` trace/log emit per request (`apps/lantern-api/src/composition/create_app.py`).

## How to emit a metric — lantern-web (web)

Same browser OTLP helper as atlas-web (`start-browser-otel.ts`).

**Already emits:** `document.load` on boot (`apps/lantern-web/src/composition/App.svelte`).

## Cohort identity (always-on — never behind a flag)

| Surface | Contract |
| --- | --- |
| **atlas-api** | After login POST: `registerFwTarget(user.id, { properties })` in `handle-auth.ts`. Pass `targetingKey: user.id` on every `fw.controlPoints.getBooleanValue`. |
| **lantern-api** | After login POST: `register_fw_target(user_id, properties=...)` in `handle_auth.py`. |
| **atlas-web / lantern-web** | After login: `syncFireweaveUser(user.id, properties)` in LoginPage. Device key persisted pre-auth via harness. |

Never gate identify/register/sync behind a feature flag.

## Every feature change (dev — before `/fireweave:safe-rollout`)

1. **FIRST** — `upsert_rollout_manifest` + mint `chg_`/`stmp_` + append stamp to the surface's `FW_STAMPS`.
2. Gate with `fw.controlPoints.getBooleanValue(key, false, ctx)` + `// @fireweave-controlpoint <key>`.
3. Decide metrics at each control point; reuse existing signals when possible.
4. Amend manifest with metric decisions.
5. **Before done** — `assert_dev_checklist` + `reconcile` phase `build`.

## Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave.
- Use `getBooleanValue(key, true)` for local dogfood — seed `makeDevProvider()` instead.
- Gate identity wiring behind flags.

See `.fireweave/PROVIDERS.md` and `fireweave.md` for credentials.
