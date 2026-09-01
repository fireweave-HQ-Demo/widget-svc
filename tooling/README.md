# Fireweave tooling — prod_dd_bench

Instance: **prod**

Marketplace: `https://github.com/FireWeave-HQ/plugins-marketplace` (@ `main`)
Cursor MCP: **plugin-fireweave-rollout-server**
Claude plugin: **fireweave@fireweave** (extraKnownMarketplaces → fireweave)
Skills: `fw-feedback`, `fw-adopt`, `fw-cleanup`, `fw-rollout`, `fw-migrate-harness`, `fw-initialise`
Clone/path: `/Users/kalyanchowdary/Desktop/code/work/test-bench/bench/workspaces/prod_dd_bench/tooling/marketplace`
Editor: open `prod_dd_bench.code-workspace` in Cursor (`bench open --name prod_dd_bench`)

See `CURSOR.md` for Cursor + Claude settings shapes.

## CLI

Workspace `tooling/bin` is prepended to `PATH` automatically (shell chpwd hook +
`.envrc` / Cursor terminal env). After linking, open a **new** terminal in this
workspace (or `source ~/.zshrc`) so `which fw` resolves to the linked CLI:

```bash
which fw   # …/tooling/bin/fw → checkout packages/fw-cli/bin/fw
fw login
```

Manual fallback: `export PATH="$PWD/tooling/bin:$PATH"`

App volumes stay B3-clean.
