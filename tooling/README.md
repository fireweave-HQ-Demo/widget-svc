# Fireweave tooling — oo_widget

Instance: **staging**
API: `https://staging-app-server.fireweave.ai`

Marketplace: `https://github.com/FireWeave-HQ/plugins-marketplace-staging` (@ `main`)
Cursor MCP: **plugin-fireweave-rollout-server**
Claude plugin: **fireweave@fireweave** (extraKnownMarketplaces → fireweave)
Skills: `fw-rollout`, `fw-feedback`, `fw-initialise`, `fw-cleanup`, `fw-adopt`, `fw-migrate-harness`
Clone/path: `/workspaces/fireweaveai-platform/.worktrees/test-bench/bench/workspaces/oo_widget/tooling/marketplace`

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
