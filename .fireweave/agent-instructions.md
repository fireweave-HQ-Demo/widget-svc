# FireWeave agent instructions — dd_react_python

Standing instructions for every feature change in this rollout-ready repo.

## Rollout-ready layout

| Artifact | Path |
| --- | --- |
| ts-server harness | `apps/atlas-api/fireweave/fw-harness.ts` |
| ts-server providers | `apps/atlas-api/fireweave/fw-providers.ts` |
| ts-server tracker | `apps/atlas-api/fireweave/fw-tracker.ts` (`FW_STAMPS`) |
| web harness (atlas) | `apps/atlas-web/fireweave/fw-harness.ts` |
| web tracker (atlas) | `apps/atlas-web/fireweave/fw-tracker.ts` |
| python harness | `apps/lantern-api/fireweave/fw_harness.py` |
| python tracker | `apps/lantern-api/fireweave/fw_tracker.py` |
| web harness (lantern) | `apps/lantern-web/fireweave/fw-harness.ts` |
| web tracker (lantern) | `apps/lantern-web/fireweave/fw-tracker.ts` |
| Provider notes | `.fireweave/PROVIDERS.md` |
| Env contract | `fireweave.md` (repo root) |
| Project pointer | `.fireweave/project.json` |

**Rollout-ready manifests and change stamps are server-owned** — author via `mcp_rollout-server_upsert_rollout_manifest`. There is no `.fireweave/rollout-ready/` directory to read or write.

Gitignored runtime paths: `.fireweave/.cache/` (projection — rebuild with `fw sync`), `.fireweave/.queue/` (unsynced author state), `.fireweave/.lock`, `.fireweave/local.json`. **Never delete `.queue/` to clear a warning.**

Environment signal: `APP_ENV` (server surfaces) / `VITE_APP_ENV` (web). Profile map: `dev` → local provider, `prod` → connected vendor.

## How to emit a metric

### ts-server — atlas-api

**Client:** OpenTelemetry `MeterProvider` via `@opentelemetry/sdk-metrics` — constructed in `apps/atlas-api/src/features/telemetry/infrastructure/start-otel.ts`.

**Import / access:** injected `Telemetry` port from bootstrap — `telemetry.increment(name, attributes)` / `telemetry.record(name, value, attributes)`.

**Example (infrastructure):**

```94:108:apps/atlas-api/src/features/telemetry/infrastructure/start-otel.ts
    increment(name, attributes = {}) {
      let counter = counters.get(name);
      if (!counter) {
        counter = meter.createCounter(name);
        counters.set(name, counter);
      }
      counter.add(1, attributes);
    },
    record(name, value, attributes = {}) {
```

**What this surface already emits:** request spans via `telemetry.withRequestSpan` on every HTTP call (`apps/atlas-api/src/composition/create-fetch.ts`). No named custom counters/histograms yet — add metrics at control points using the `Telemetry` port when a rollout needs them.

### web — atlas-web

**Client:** manual OTLP HTTP exporter in `apps/atlas-web/src/features/telemetry/infrastructure/start-browser-otel.ts`.

**Call shape:** `increment(name, attributes?)` / `record(name, value, attributes?)` on the object returned by `startBrowserOtel(ctx)`.

**Example:**

```typescript
void startBrowserOtel(ctx); // in create-app.tsx
```

**What this surface already emits:** no named custom metrics yet — browser telemetry posts raw OTLP JSON to `/v1/metrics` when increment/record are called.

### python — lantern-api

**Client:** stdlib OTLP client in `apps/lantern-api/src/features/telemetry/infrastructure/start_otel.py` — `Telemetry.increment(name)` / `Telemetry.record(name, value)`.

**Wired in:** `apps/lantern-api/src/composition/bootstrap.py`.

**What this surface already emits:** request handling spans/logs; no named custom metrics yet.

### web — lantern-web

**Client:** manual OTLP HTTP — `apps/lantern-web/src/features/telemetry/infrastructure/start-browser-otel.ts` (same pattern as atlas-web).

**What this surface already emits:** no named custom metrics yet.

## Cohort identity (always-on — never behind a flag)

| Surface | Contract |
| --- | --- |
| **ts-server** | `registerFwTarget(userId, …)` in `handle-auth.ts` after login; pass `{ targetingKey: user.id }` on every `getBooleanValue`. |
| **python** | `register_fw_target(user_id, …)` in `handle_auth.py` after login. |
| **web** | `syncFireweaveUser(user.id, props)` after login / session restore in `LoginPage`. |

## Every feature change (dev — before `/fw-rollout`) — HARD ORDER

1. **FIRST** — `mcp_rollout-server_upsert_rollout_manifest` with manifest + `baseContentHash`; mint `chg_<ULID>` + `stmp_<ULID>`; append stamp to the surface's `FW_STAMPS`.
2. Gate behavior behind `fw.controlPoints.getBooleanValue(key, false, ctx)` with `// @fireweave-controlpoint <key>` at each site.
3. At each control point, decide metrics (reuse existing emits first).
4. Amend manifest with telemetry decisions.
5. **Before done** — `assert_dev_checklist` + `reconcile` phase `build`.

Ship only via `/fireweave:safe-rollout`.
