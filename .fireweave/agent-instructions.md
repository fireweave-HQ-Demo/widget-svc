# FireWeave agent instructions

This repo is FireWeave rollout-ready ("promote, not wrap").

## Rollout-ready layout

| Artifact | Path |
| -------- | ---- |
| ts-server harness | `template-mirror/atlas-api/src/fireweave/fw-harness.ts` (+ `fw-providers.ts`) |
| web harness | `template-mirror/atlas-web/src/fireweave/fw-harness.ts` (+ `fw-providers.ts`) |
| ts-server `FW_STAMPS` | `template-mirror/atlas-api/src/fw-tracker/index.ts` |
| web `FW_STAMPS` | `template-mirror/atlas-web/src/fw-tracker/index.ts` |
| Providers | `.fireweave/PROVIDERS.md` |
| Manifests + change stamps | **Server-owned.** Author via `mcp_rollout-server_upsert_rollout_manifest`. No `.fireweave/rollout-ready/` or changelog directory. |
| Gitignored runtime | `.fireweave/.cache/` (projection), `.fireweave/.queue/` (unsynced author state — **never delete to clear a warning**), `.fireweave/.lock`, `.fireweave/local.json`, `.fireweave/deploy-beacon.env.local` |

## Every feature change (dev — before `/fw-rollout`) — HARD ORDER

**Backfill after coding is NOT the client path.** If you implement first and add the
manifest later, `/fw-rollout` and clients cannot rely on promote-not-wrap.

1. **FIRST** — author the rollout-ready manifest with `mcp_rollout-server_upsert_rollout_manifest` `{ feature, manifest, baseContentHash }` (build the manifest from the **Manifest contract** below). **FireWeave stores it — do not write a manifest file yourself.** `baseContentHash` is required and nullable: `null` asserts "no row exists yet"; otherwise pass the `contentHash` of the row you read. There is no omit-the-base path — omitting a base is last-writer-wins, and last-writer-wins silently erases a teammate's guardrail metric. On `outcome: 'conflict'`, re-apply your change on top of the returned `current` and retry with `baseContentHash = currentContentHash`. On `outcome: 'queued'`, fw-server did not answer: the edit is safe in `.fireweave/.queue/` and will replay, but **shipping is blocked until it drains** and no teammate can see it. Mint `chg_<ULID>` + `stmp_<ULID>` (the `chg_`/`stmp_` prefixes are hard-enforced by `build_register_rollout_from_manifest` at ship time; a date-slug fails registration). Apply the stamp policy: per-surface stamps by default (append each stamp ONLY to its own surface's `FW_STAMPS`); one shared stamp is allowed only when the change is single-project and every participating surface's harness is surface-aware. **`FW_STAMPS` is the one line FireWeave still writes into your repo** — the stamp record itself lives in `change_stamps` server-side.

   **Absence has names — only one means _author it now_.** If a read reports no manifest, the tools return an `absence`: `never-authored` (author it), `not-fetched` (run `fw sync` — this worktree has no projection, so absent is not evidence), `not-authorized` (the manifests are **withheld**, not absent — `fw login` or ask an admin), `server-unavailable` (retry), `queued` (you already authored it; drain the queue). **Never author a manifest to clear any of the last four** — you would be displacing a contract you cannot currently see.

2. Gate behavior behind OpenFeature via the harness — not legacy direct vendor SDK calls. Add `// @fireweave-flag <key>` at every evaluation site **while writing code**. Eval-site default MUST be `false` (RAMP-1). If you need the feature **on locally** for dogfood, set that key in the surface's `makeDevProvider()` `devFlags` — never `fw.flag(key, true)`.
3. **BEFORE calling the task done** — run `mcp_rollout-server_assert_dev_checklist` with `{ feature }`. **PARK on any block.** Checklist hard-fails if `telemetry.metrics[].name` entries are declared without emit sites in wrap-point files (dummy / registry-only metrics are forbidden). Also run `detect_rollout_ready` + `reconcile` phase `build`.
4. Do NOT open a PR / declare done until `assert_dev_checklist.pass === true`.

## Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave (OTLP direct to bound vendor).
- Delete `fw-tracker` stamps without `/fw-cleanup`.
- Write repo-local `mcp/rollout-server/` when using the Cursor FireWeave plugin.
- Finish feature code without a matching rollout-ready package (no backfill).
- Use `fw.flag(key, true)` / `default: true` to make a feature work on your laptop — that same `true` is what prod serves when the provider flag is missing. Local ON → `devFlags` only.
- Gate identity wiring behind a feature flag — `identify` / `reset` / the targeting-key bind are the precondition for flag evaluation, never a feature of it (INIT-S8; `assert_dev_checklist` blocks it).
- Rely on INIT-S8 for full Svelte template AST — only `<script>` bodies are AST-scanned; `{#if}` / `on:click` identity handlers are soft-warn only. Other known limits: cross-file helpers, multi-hop wrappers, dynamic/computed callees, object-literal helpers.

## Cohort identity (always-on — never behind a flag)

| Surface | Contract |
| ------- | -------- |
| **Web** | After auth (`loginAs` / `restoreSession` in `template-mirror/atlas-web/src/features/identity/application/auth-api.ts`): `syncFireweaveUser(user.id, evaluationContext.properties)`. On sign-out (`clearSession`): `reloadFireweaveFlags("anonymous")`. |
| **Server** | On login (`handleAuthSession` POST in `template-mirror/atlas-api/src/features/identity/presentation/http/handle-auth.ts`): `registerFwTarget(user.id, { properties })`. Every `fw.flag(...)` must pass `{ targetingKey }` — the session user when there is one, otherwise a stable fallback. Missing targeting key → the provider returns the safe default (`false`). |

**The bind is unconditional.** Manifests declare `context.targetingKey: "userId"`, and upstream `%` ramps hash that subject id — if it rotates every visit, every session looks like a new user and no flag ever sticks. Gating the bind on a flag deadlocks: the flag evaluates with no targeting key, RAMP-1 makes the safe default `false`, so the bind never runs and the key never arrives. It fails silently as 0% adoption, which reads as a product problem rather than a wiring bug. Gate the feature that _uses_ the identity; never the bind itself.

## Manifest contract (the committed ship contract — copy, don't invent)

The `manifest` argument you pass to `upsert_rollout_manifest` must match this exact shape (validated by `RolloutReadyManifestSchema` **before** anything reaches the server or disk; `safe-rollout` resolves it to build the `RolloutSpec`). `manifest.feature` must equal the `feature` argument — the row is keyed by it. Every field below is load-bearing — start from this and swap the values. Invariants the schema enforces: every `wrapPoints[].flagKey` and `telemetry.metrics[].guards` must be a declared `flags[].key`; `telemetry.dimensions` must equal `context.dimensions` (the cohort seam); a `guardrail` metric needs an OTLP-metrics-capable destination (Grafana/Datadog — **PostHog cannot ingest OTLP metrics**), so keep adoption metrics as `role: "adoption"` unless you wire a metrics vendor.

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
      "file": "template-mirror/atlas-api/src/features/<area>/application/<use-case>.ts",
      "symbol": "<symbol>",
      "wrapStyle": "method-guard",
      "flagKey": "<feature-slug>"
    }
  ],
  "context": { "targetingKey": "userId", "dimensions": [] },
  "telemetry": {
    "metrics": [
      {
        "name": "feature.<feature-slug>.adopted",
        "role": "adoption",
        "direction": "up-good",
        "guards": "<feature-slug>"
      },
      {
        "name": "feature.<feature-slug>.error",
        "role": "adoption",
        "direction": "up-bad",
        "guards": "<feature-slug>"
      }
    ],
    "logs": [],
    "traces": [],
    "dimensions": []
  },
  "harness": {
    "surface": "ts-server",
    "path": "template-mirror/atlas-api/src/fireweave/fw-harness.ts",
    "rolloutCredentialEnv": "FW_PROJECT_API_KEY",
    "posthogProjectId": "534547",
    "flags": {
      "api": "openfeature",
      "sdk": "server",
      "devProvider": "in-memory",
      "rolloutProvider": "connected:fireweave"
    },
    "telemetry": {
      "api": "otel",
      "devExporter": "console",
      "rolloutTransport": "otlp",
      "semconv": "fireweave/rollout-otel-semconv-v1",
      "signals": {}
    }
  }
}
```

For a **web** surface use `harness.surface: "web"`, `flags.sdk: "web"`, `rolloutCredentialEnv: "PUBLIC_FW_PROJECT_API_KEY"`, and path `template-mirror/atlas-web/src/fireweave/fw-harness.ts`. `harness.posthogProjectId` is the **prod-tier** environment's project id (`534547`).

**RAMP-1 — off until ramp:** boolean `flags[].default` MUST be `false`. Eval sites MUST use `fw.flag(key, false, …)`. Prod-tier ON is the ramp (or an explicit PostHog kill-switch at 100%), never the call-site default.

**Local vs prod control (standard):** local dogfood ON → that surface's `makeDevProvider()` `devFlags: { '<key>': true }`; prod-tier → connected vendor via FireWeave; eval site + manifest always `false`. Never use `fw.flag(key, true)` for "works on my laptop" — that is also the prod fallback when the provider flag is missing. Do not open new `ramp1Exception` entries; remediate legacy inverted kill-switches only via: create PostHog flag at 100% ON → verify serving → flip defaults to `false` → prove kill in staging.

## Ship

Run `/fw-rollout` only after `assert_dev_checklist` passes — it **promotes** rollout-ready work; it does not wrap code.
