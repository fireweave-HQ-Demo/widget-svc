# Fireweave tooling — demo_k2

Instance: **staging**
API: `https://staging-app-server.fireweave.ai`

Marketplace: `https://github.com/FireWeave-HQ/plugins-marketplace-staging` (@ `main`)
Cursor MCP: **plugin-fireweave-rollout-server**
Claude plugin: **fireweave@fireweave** (extraKnownMarketplaces → fireweave)
Skills: `fw-feedback`, `fw-adopt`, `fw-cleanup`, `fw-rollout`, `fw-migrate-harness`, `fw-initialise`
Clone/path: `/Users/kalyanchowdary/Desktop/code/work/test-bench/bench/workspaces/demo_k2/tooling/marketplace`

See `CURSOR.md` for Cursor + Claude settings shapes.

## CLI

```bash
export PATH="$PWD/bin:$PATH"
fw login --url 'https://staging-app-server.fireweave.ai'
```

App volumes stay B3-clean.
