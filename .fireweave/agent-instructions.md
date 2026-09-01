# FireWeave agent instructions (this repo)

This repository is FireWeave **rollout-ready** ("promote, not wrap"). Read this
before any user-facing or flag-gated change.

## Rollout-ready layout

| Artifact | Path |
| -------- | ---- |
| ts-server harness | `apps/atlas-api/src/fireweave/fw-harness.ts` + `fw-providers.ts` |
| ts-server tracker | `apps/atlas-api/src/fireweave/fw-tracker.ts` (`FW_STAMPS`) |
| atlas-web harness | `apps/atlas-web/src/fireweave/fw-harness.ts` + `fw-providers.ts` |
| atlas-web tracker | `apps/atlas-web/src/fireweave/fw-tracker.ts` (`FW_STAMPS`) |
| python harness | `apps/lantern-api/src/fireweave/fw_harness.py` + `fw_providers.py` |
| python tracker | `apps/lantern-api/src/fireweave/fw_tracker.py` (`FW_STAMPS`) |
| lantern-web harness | `apps/lantern-web/src/fireweave/fw-harness.ts` + `fw-providers.ts` |
| lantern-web tracker | `apps/lantern-web/src/fireweave/fw-tracker.ts` (`FW_STAMPS`) |
| Providers | `.fireweave/PROVIDERS.md` |
| Pointer | `.fireweave/project.json` |

**Rollout-ready manifests and change stamps are server-owned** — author via
`mcp_rollout-server_upsert_rollout_manifest` and the resolution seam. There is
**no** `.fireweave/rollout-ready/` or changelog directory to read or write.

Gitignored runtime paths: `.fireweave/.cache/` (projection), `.fireweave/.queue/`
(unsynced author state — **never delete** to clear a warning), `.fireweave/.lock`.

---

## How to emit a metric — `atlas-api` (ts-server)

**Client:** OpenTelemetry via the app `Telemetry` port from `startOtel`.

**Import (as used in this repo):**

```ts
import { startOtel } from "./features/telemetry/infrastructure/start-otel";
import type { Telemetry } from "./features/telemetry/application/ports/telemetry";
```

**Call shape:**

- Counter: `telemetry.increment(name, attributes?)`
- Histogram: `telemetry.record(name, value, attributes?)`

**Where the instrument comes from:** `bootstrap()` calls `startOtel(ctx)` once and
passes the `Telemetry` instance through composition into HTTP handlers. Prefer the
injected `telemetry` port — not a global meter.

**Real example** — counter/histogram implementation in
`apps/atlas-api/src/features/telemetry/infrastructure/start-otel.ts`:

```ts
increment(name, attributes = {}) {
  let counter = counters.get(name);
  if (!counter) {
    counter = meter.createCounter(name);
    counters.set(name, counter);
  }
  counter.add(1, attributes);
},
record(name, value, attributes = {}) {
  let histogram = histograms.get(name);
  if (!histogram) {
    histogram = meter.createHistogram(name);
    histograms.set(name, histogram);
  }
  histogram.record(value, attributes);
},
```

**Already emits today:** no named feature metrics yet. Request spans/logs fire via
`withRequestSpan`. First feature that needs a guardrail must **add** a metric at
the control point (`provenance: "added"`).

**Labels:** pass string attributes on `increment`/`record`. Prefer including a
cohort / `targetingKey`-adjacent dimension when comparing ramp cohorts.

---

## How to emit a metric — `atlas-web` (web)

**Client:** browser OTLP HTTP helpers (no OTel JS SDK).

**Import:**

```ts
import { increment, record, startBrowserOtel } from "./features/telemetry/infrastructure/start-browser-otel";
import type { RuntimeContext } from "./core/runtime-context";
```

**Call shape:**

- Counter: `await increment(ctx, name, value?)`
- Histogram: `await record(ctx, name, value)`

**Where the instrument comes from:** module-level helpers that POST to
`ctx.exporterEndpoint` `/v1/metrics`. Pass the same `RuntimeContext` the app
bootstrapped.

**Real example** — `apps/atlas-web/src/features/telemetry/infrastructure/start-browser-otel.ts`
emits `document.load` on boot:

```ts
await increment(ctx, "document.load");
```

**Already emits:** `document.load` (counter) from `startBrowserOtel`.

**Labels:** resource attributes include `service.name` and
`deployment.environment`. Per-datapoint attributes are not used today — add them
carefully if needed for cohort splits.

---

## How to emit a metric — `lantern-api` (python)

**Client:** stdlib OTLP via `urllib` on the `Telemetry` class from `start_otel`.

**Import:**

```python
from src.features.telemetry.infrastructure.start_otel import start_otel, Telemetry
```

**Call shape:**

- Counter: `telemetry.increment(name, value=1)`
- Histogram: `telemetry.record(name, value)`

**Where the instrument comes from:** `bootstrap(...)` calls `start_otel(ctx)` and
passes `Telemetry` into the HTTP app.

**Real example** — `apps/lantern-api/src/features/telemetry/infrastructure/start_otel.py`:

```python
def increment(self, name: str, value: int = 1) -> None:
    # posts OTLP /v1/metrics sum datapoint
    ...

def record(self, name: str, value: float) -> None:
    # posts OTLP /v1/metrics histogram datapoint
    ...
```

**Already emits today:** request traces/logs via `telemetry.emit(...)` in
`create_app.py`. No named feature metrics yet — first guardrail must **add** one.

**Labels:** resource attribute `service.name` only today.

---

## How to emit a metric — `lantern-web` (web)

Same pattern as atlas-web.

**Import:**

```ts
import { increment, record, startBrowserOtel } from "./features/telemetry/infrastructure/start-browser-otel";
```

**Already emits:** `document.load` from
`apps/lantern-web/src/features/telemetry/infrastructure/start-browser-otel.ts`.

---

## Does this task qualify? — classify BEFORE step 1

| Class | What it looks like | Run the package? |
| ----- | ------------------ | ---------------- |
| **change** | modify runtime behaviour a user/caller can observe | **YES** |
| **inquiry** | explain, locate, summarise, review | no |
| **brainstorm** | plan/design — nothing written yet | no (re-classify when writing starts) |
| **infra-only** | CI, lockfiles, docs, formatting, no behaviour delta | no |

When unclear, treat as **change**.

---

## Every feature change (dev — before `/fw-rollout`) — HARD ORDER

1. **FIRST** — author the rollout-ready manifest with
   `mcp_rollout-server_upsert_rollout_manifest` `{ feature, manifest, baseContentHash }`.
   FireWeave stores it — do **not** write a manifest file. Mint `chg_<ULID>` +
   `stmp_<ULID>`; append each stamp to its own surface's `FW_STAMPS`.
2. Gate behaviour behind the harness control point
   (`fw.controlPoints.getBooleanValue(key, false, ctx)` / python equivalent) with
   `// @fireweave-controlpoint <key>` (or `# @fireweave-controlpoint`) at every
   evaluation site. Eval-site default MUST be `false` (RAMP-1). Local ON →
   `devFlags` / local seed only.
3. At each control point, decide signals (reuse / add / park). Amend the manifest.
4. **BEFORE done** — `mcp_rollout-server_assert_dev_checklist` `{ feature }` (PARK
   on any block) + `detect_rollout_ready` + `reconcile` phase `build`.
5. Ship only via `/fireweave:safe-rollout` (promotes; never wraps).

**Absence has names:** only `never-authored` means author a manifest.
`not-fetched` → `fw sync`; `not-authorized` → withheld; `server-unavailable` →
retry; `queued` → drain `.fireweave/.queue/`.

### Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave.
- Delete `fw-tracker` stamps without `/fw-cleanup`.
- Write repo-local `mcp/rollout-server/`.
- Backfill the rollout package after coding.
- Use `default: true` / `getBooleanValue(key, true)` for laptop dogfood.
- Gate identity wiring behind a feature flag (INIT-S8).

---

## Cohort identity (always-on — never behind a flag)

| Surface | Contract |
| ------- | -------- |
| **atlas-api** | After login in `handle-auth.ts`, call `registerFwTarget(userId, { properties })` unconditionally. |
| **lantern-api** | After login in `handle_auth.py`, call `register_fw_target(user_id, properties=...)` unconditionally. |
| **web** | When auth is wired: bind subject via web SDK identify/reload after sign-in; reset on sign-out. Device id is minted in `fw-providers.ts` for anonymous visitors. |
| **Server reads** | Pass `{ targetingKey }` (session user, else instance key) on every control-point evaluation. |

Never place `registerFwTarget` / `register_fw_target` / identify / reset under a
flag branch or `@fireweave-controlpoint` anchor.

---

## Deriving `telemetry.metrics`

Prefer **reuse** of metrics this surface already emits. Add only when nothing
covers the failure mode. Park when the surface cannot emit. See changeType rubric
in the FireWeave initialise skill / standing rule: new-feature, enhancement,
bugfix, performance, refactor, infra.

A metric with no baseline is observe-only until it earns a threshold.
