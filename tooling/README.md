# Fireweave tooling — rt0

Instance: **local**
API: `http://fw-server:3001`

Marketplace: `/workspaces/fireweaveai-platform/packages/fw-plugins/dist` (@ `main`)
Cursor MCP: **plugin-fireweave-rollout-server**
Claude plugin: **fireweave@fireweave** (extraKnownMarketplaces → fireweave)
Skills: `fw-rollout`, `fw-feedback`, `fw-ci-rollout-readiness`, `fw-initialise`, `fw-ci-register-control-points`, `fw-cleanup`, `fw-adopt`, `fw-migrate-harness`
Clone/path: `/workspaces/test-bench/bench/workspaces/rt0/tooling/marketplace`
Editor: open `rt0.code-workspace` in Cursor (`bench open --name rt0`)

See `CURSOR.md` for Cursor + Claude settings shapes.

## CLI

Workspace `tooling/bin` is prepended to `PATH` automatically (shell chpwd hook +
`.envrc` / Cursor terminal env). After linking, open a **new** terminal in this
workspace (or `source ~/.zshrc`) so `which fw` resolves to the linked CLI:

```bash
which fw   # …/tooling/bin/fw → checkout packages/fw-cli/bin/fw
fw login --url 'http://fw-server:3001'
```

Manual fallback: `export PATH="$PWD/tooling/bin:$PATH"`

App volumes stay B3-clean.
