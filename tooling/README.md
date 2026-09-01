# Fireweave tooling — stg_dd_react_ts

Instance: **staging**
API: `https://staging-app-server.fireweave.ai`

Marketplace: `https://github.com/FireWeave-HQ/plugins-marketplace-staging` (@ `main`)
Cursor MCP: **plugin-fireweave-rollout-server**
Claude plugin: **fireweave@fireweave** (extraKnownMarketplaces → fireweave)
Skills: `fw-feedback`, `fw-adopt`, `fw-cleanup`, `fw-rollout`, `fw-migrate-harness`, `fw-initialise`
Clone/path: `/Users/kalyanchowdary/Desktop/code/work/test-bench/bench/workspaces/stg_dd_react_ts/tooling/marketplace`
Editor: open `stg_dd_react_ts.code-workspace` in Cursor (`bench open --name stg_dd_react_ts`)

See `CURSOR.md` for Cursor + Claude settings shapes.

## CLI

Workspace `tooling/bin` is prepended to `PATH` automatically (shell chpwd hook +
`.envrc` / Cursor terminal env). After linking, open a **new** terminal in this
workspace (or `source ~/.zshrc`) so `which fw` resolves to the linked CLI:

```bash
which fw   # …/tooling/bin/fw → checkout packages/fw-cli/bin/fw
fw login --url 'https://staging-app-server.fireweave.ai'
```

Manual fallback: `export PATH="$PWD/tooling/bin:$PATH"`

App volumes stay B3-clean.
