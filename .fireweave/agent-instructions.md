# FireWeave agent instructions (kal)

This repo is FireWeave rollout-ready ("promote, not wrap"). Classify every task
before step 1. Only **change** runs the package.

## Rollout-ready layout

| What | Path |
| ---- | ---- |
| API harness | `template-mirror/atlas-api/src/fireweave/fw-harness.ts` (+ `fw-providers.ts`) |
| Web harness | `template-mirror/atlas-web/src/fireweave/fw-harness.ts` (+ `fw-providers.ts`) |
| API tracker (`FW_STAMPS`) | `template-mirror/atlas-api/src/fw-tracker/index.ts` |
| Web tracker (`FW_STAMPS`) | `template-mirror/atlas-web/src/fw-tracker/index.ts` |
| Providers | `.fireweave/PROVIDERS.md` |
| API entrypoint | `template-mirror/atlas-api/src/main.ts` (`await initFwHarness()` first) |
| Web entrypoint | `template-mirror/atlas-web/src/main.tsx` (`await initFwHarness()` first) |

**Rollout-ready manifests and change stamps are server-owned.** Author manifests
with `mcp_rollout-server_upsert_rollout_manifest`. There is no
`.fireweave/rollout-ready/` or `.fireweave/changelog/` directory to read or write.
Gitignored runtime: `.fireweave/.cache/` (projection), `.fireweave/.queue/`
(unsynced author state — never delete it to clear a warning), `.fireweave/.lock`.

Environment signal: `APP_ENV` (API) / `VITE_APP_ENV` (web). FireWeave env `prod`
is prod-tier. Unknown names fall back through `isProd()`.

### Does this task qualify? — classify BEFORE step 1

A hook fires this reminder on a keyword match (`add|implement|feature|fix|ship|
build|wrap|change|refactor|rollout|flag`). That regex is a cheap outer filter and
it is **not** the decision: it cannot tell `fix the checkout bug` from `how do I
fix this typo in the README`, because both contain `fix`. You can. Classify the
task first, in one line, and say which class you chose:

| Class | What it looks like | Run the package? |
| ----- | ------------------ | ---------------- |
| **change** | you will modify runtime behaviour a user or caller can observe | **YES** — steps 1–4 below |
| **inquiry** | explain, locate, summarise, review, "how does X work" | no |
| **brainstorm** | weigh options, plan, design — nothing is being written yet | no — but re-classify the moment you start writing |
| **infra-only** | CI config, lockfiles, docs, formatting, test-only edits with no behaviour delta | no |

When the class is genuinely unclear, **treat it as `change`**. Do not ask permission to skip.

Two traps: a test-only edit that changes a default is a change; a refactor that
moves an evaluation site must take `// @fireweave-controlpoint` with it.

### Every feature change (dev — before `/fw-rollout`) — HARD ORDER

**Backfill after coding is NOT the client path.**

1. **FIRST** — author the rollout-ready manifest with `mcp_rollout-server_upsert_rollout_manifest` `{ feature, manifest, baseContentHash }` (Manifest contract below). **FireWeave stores it — do not write a manifest file yourself.** `baseContentHash` is required and nullable: `null` asserts "no row exists yet"; otherwise pass the `contentHash` of the row you read. On `outcome: 'conflict'`, re-apply on top of `current` and retry with `baseContentHash = currentContentHash`. On `outcome: 'queued'`, shipping is blocked until `.fireweave/.queue/` drains. Mint `chg_<ULID>` + `stmp_<ULID>`. Per-surface stamps by default (append each stamp ONLY to its own surface's `FW_STAMPS`).

   **Absence has names — only `never-authored` means author it now.** `not-fetched` → `fw sync`. `not-authorized` → withheld, not absent. `server-unavailable` → retry. `queued` → already authored; drain the queue. Never author a manifest to clear the last four.

2. Gate behavior behind `fw.controlPoints.getBooleanValue(key, false, ctx)` — not direct vendor SDK calls. Add `// @fireweave-controlpoint <key>` at every evaluation site while writing code. Eval-site default MUST be `false` (RAMP-1). Local dogfood ON → that surface's `makeDevProvider()` seed, never `getBooleanValue(key, true)`.
3. **BEFORE calling the task done** — run `mcp_rollout-server_assert_dev_checklist` with `{ feature }`. **PARK on any block.** Also `detect_rollout_ready` + `reconcile` phase `build`.
4. Do NOT open a PR / declare done until `assert_dev_checklist.pass === true`.

### Do not

- Swap providers at promotion time.
- Route telemetry through FireWeave (OTLP direct to bound vendor).
- Delete `fw-tracker` stamps without `/fw-cleanup`.
- Write repo-local `mcp/rollout-server/` when using the Cursor FireWeave plugin.
- Finish feature code without a matching rollout-ready package (no backfill).
- Use `fw.controlPoints.getBooleanValue(key, true)` for laptop dogfood.
- Gate identity wiring behind a feature flag (INIT-S8).

### Cohort identity (always-on — never behind a flag)

| Surface | Contract |
| ------- | -------- |
| **Web** | After auth: `syncFireweaveUser(user.id, { plan, org, country })` from `LoginPage` / restored session. On sign-out: do not leave the previous user as the targeting key. |
| **Server** | Every `fw.controlPoints.getBooleanValue(...)` passes `{ targetingKey }` — session user when present, otherwise `resolveInstanceTargetingKey()`. Login registers via `registerFwTarget`. |

The bind is unconditional. Gate the feature that uses identity; never the bind itself.

### Deriving `telemetry.metrics` — a rubric, not a generator

`assert_dev_checklist` hard-fails a metric declared with no emit site. Derive from the change type; do not reach for `propose_metrics`.

| `changeType` | Adoption | Stability |
| ------------ | -------- | --------- |
| `new-feature` | reach: distinct subjects on the new path | error rate + latency on the enclosing request |
| `enhancement` | completion rate of the improved flow | that flow's error rate vs the old path |
| `bugfix` | occurrences of the fixed fault (→ ~0) | regression on the surrounding operation |
| `performance` | share of traffic on the fast path | the claimed metric **plus** one you might trade against |
| `refactor` | usually NONE | error rate + latency unchanged is success |
| `infra` | none | the deploy's own health signal |

A metric with no baseline is not a guardrail. When there is no prior baseline, compare flag cohorts (new-path vs old-path) instead of inventing a threshold. `complexity` is yours; omit it when unsure.

### Manifest contract (the committed ship contract — copy, don't invent)

`manifest.feature` must equal the `feature` argument. `flags.api` is `"control-points"` on every NEW manifest. `harness.posthogProjectId` is `"393610"`.

- ts-server: `harness.surface: "ts-server"`, path `template-mirror/atlas-api/src/fireweave/fw-harness.ts`, `rolloutCredentialEnv: "FW_PROJECT_API_KEY"`, `flags.sdk: "server"`
- web: `harness.surface: "web"`, path `template-mirror/atlas-web/src/fireweave/fw-harness.ts`, `rolloutCredentialEnv: "PUBLIC_FW_PROJECT_API_KEY"`, `flags.sdk: "web"`

Boolean `flags[].default` MUST be `false`. Eval sites MUST use `fw.controlPoints.getBooleanValue(key, false, …)`.

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
    "posthogProjectId": "393610",
    "flags": {
      "api": "control-points",
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

### Ship

Run `/fw-rollout` only after `assert_dev_checklist` passes — it **promotes** rollout-ready work; it does not wrap code.
