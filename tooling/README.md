# Fireweave tooling — test_sample_z

Instance: **local**
API: `http://fw-server:3001`

Marketplace: `/workspaces/fireweaveai-platform/packages/fw-plugins/dist` (@ `main`)
Cursor MCP: **plugin-fireweave-rollout-server**
Claude plugin: **fireweave@fireweave** (extraKnownMarketplaces → fireweave)
Skills: `fw-rollout`, `fw-feedback`, `fw-initialise`, `fw-cleanup`, `fw-adopt`, `fw-migrate-harness`
Clone/path: `/workspaces/fireweaveai-platform/.worktrees/test-bench/bench/workspaces/test_sample_z/tooling/marketplace`

See `CURSOR.md` for Cursor + Claude settings shapes.

## CLI

```bash
export PATH="$PWD/bin:$PATH"
fw login --url 'http://fw-server:3001'
```

App volumes stay B3-clean.
