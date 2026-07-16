# FireWeave agent instructions (widget-svc)

This repo is **rollout-ready** ("promote, not wrap"). Feature work keeps manifests, anchors, and stamps aligned **while coding** — never as a backfill.

## Rollout-ready layout

| Artifact | Path |
|----------|------|
| Harness | `src/fireweave/fw-harness.ts` |
| Providers | `src/fireweave/fw-providers.ts` |
| Stamp tree | `src/fireweave/fw-tracker/` |
| Manifests | `.fireweave/rollout-ready/` |
| Changelog | `.fireweave/changelog/` |
| Providers doc | `.fireweave/PROVIDERS.md` |
| Entrypoint wiring | `src/index.ts` — `await initFwHarness()` first |

## Every feature change (dev — before `/fireweave:safe-rollout-fast`) — HARD ORDER

**Backfill after coding is NOT the client path.** If you implement first and add the
manifest later, `/fireweave:safe-rollout-fast` and clients cannot rely on promote-not-wrap.

1. **FIRST** — create or update `.fireweave/rollout-ready/<feature>.json` (copy the **Manifest contract** below). Mint `chg_<ULID>` + `stmp_<ULID>` (the `chg_`/`stmp_` prefixes are hard-enforced by `build_register_rollout_from_manifest` at ship time; a date-slug fails registration). Append the stamp to every surface `FW_STAMPS`.
2. Gate behavior behind OpenFeature via the harness — not legacy direct vendor SDK calls. Add `// @fireweave-flag <key>` at every evaluation site **while writing code**.
3. **BEFORE calling the task done** — run `mcp__rollout-server__assert_dev_checklist` with `{ feature }`. **PARK on any block.** Checklist hard-fails if `telemetry.metrics[].name` entries are declared without emit sites in wrap-point files (dummy / registry-only metrics are forbidden). Also run `detect_rollout_ready` + `reconcile` phase `build`.
4. Do NOT open a PR / declare done until `assert_dev_checklist.pass === true`.

## Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave (OTLP direct to bound vendor).
- Delete `fw-tracker` stamps without `/fireweave:cleanup`.
- Write repo-local `mcp/rollout-server/` when using the Cursor FireWeave plugin.
- Finish feature code without a matching rollout-ready package (no backfill).

## Manifest contract (the committed ship contract — copy, don't invent)

`.fireweave/rollout-ready/<feature>.json` must match this exact shape (validated by `RolloutReadyManifestSchema`; `safe-rollout-fast` reads it to build the `RolloutSpec`). Every field below is load-bearing — start from this and swap the values. Invariants the schema enforces: every `wrapPoints[].flagKey` and `telemetry.metrics[].guards` must be a declared `flags[].key`; `telemetry.dimensions` must equal `context.dimensions` (the cohort seam); a `guardrail` metric needs an OTLP-metrics-capable destination (Grafana/Datadog — **PostHog cannot ingest OTLP metrics**), so keep adoption metrics as `role: "adoption"` unless you wire a metrics vendor.

```json
{
  "schema": 1,
  "feature": "<feature-slug>",
  "changeType": "new-feature",
  "userFacing": true,
  "change": {
    "id": "chg_<ULID>",
    "stampId": "stmp_<ULID>",
    "title": "<human title>",
    "description": "<what changes, one line>",
    "author": "<you@org>",
    "createdAt": "2026-07-06T00:00:00.000Z",
    "branch": "<dev-branch>",
    "backwardCompatible": "required",
    "supersedes": [],
    "supersededBy": [],
    "status": "in-progress",
    "migration": "<path/to/migration.sql or omit>"
  },
  "flagTelemetryProvider": "connected:posthog",
  "flags": [
    {
      "key": "<feature-slug>",
      "default": false,
      "cohortKey": "userId",
      "userFacing": true,
      "description": "Off: <today's behavior>. On: <new behavior>.",
      "tags": ["<area>"]
    }
  ],
  "wrapPoints": [
    {
      "file": "src/feature.ts",
      "symbol": "maybeNewBehavior",
      "wrapStyle": "method-guard",
      "flagKey": "<feature-slug>"
    }
  ],
  "context": { "targetingKey": "userId", "dimensions": [] },
  "telemetry": {
    "metrics": [
      { "name": "feature.<feature-slug>.adopted", "role": "adoption", "direction": "up-good", "guards": "<feature-slug>" },
      { "name": "feature.<feature-slug>.error", "role": "adoption", "direction": "up-bad", "guards": "<feature-slug>" }
    ],
    "logs": [],
    "traces": [],
    "dimensions": []
  },
  "harness": {
    "surface": "ts-server",
    "path": "src/fireweave/fw-harness.ts",
    "rolloutCredentialEnv": "POSTHOG_PROJECT_API_KEY",
    "attestUrlEnv": "FW_ATTEST_URL",
    "attestCredentialEnv": "FW_PROJECT_API_KEY",
    "posthogProjectId": "393610",
    "flags": { "api": "openfeature", "sdk": "server", "devProvider": "in-memory", "rolloutProvider": "connected:posthog" },
    "telemetry": { "api": "otel", "devExporter": "console", "rolloutTransport": "otlp", "semconv": "fireweave/rollout-otel-semconv-v1", "signals": {} }
  }
}
```

## Ship

Run `/fireweave:safe-rollout-fast` only after `assert_dev_checklist` passes — it **promotes** rollout-ready work; it does not wrap code.
