# Fireweave agents — Cursor + Claude Code

MCP is **not** `https://mcp.fireweave.ai/mcp`.
Both tools load the marketplace plugin (rollout MCP + skills).

Cursor plugin key and Claude marketplace name are **instance-scoped**
(`fireweave-staging/fireweave` / `fireweave-staging`) so staging does not collide with a
user-global prod plugin named `fireweave/fireweave`.

## Cursor — `.cursor/settings.json`

```json
{
  "plugins": {
    "fireweave/fireweave": {
      "enabled": false
    },
    "fireweave-staging/fireweave": {
      "enabled": true,
      "gitUrl": "https://github.com/FireWeave-HQ/plugins-marketplace-staging",
      "gitRef": "main"
    },
    "fireweave-local/fireweave": {
      "enabled": false
    }
  }
}
```

Open this workspace via `bench open --name …` (not the harness), then reload.
MCP server: **plugin-fireweave-rollout-server**.

## Claude Code — `.claude/settings.json`

Open Claude in this workspace directory (not the harness repo).

```json
{
  "enabledPlugins": {
    "fireweave@fireweave": false,
    "fireweave@fireweave-staging": true,
    "fireweave@fireweave-local": false
  },
  "extraKnownMarketplaces": {
    "fireweave-staging": {
      "source": {
        "source": "git",
        "url": "https://github.com/FireWeave-HQ/plugins-marketplace-staging.git"
      },
      "autoUpdate": true
    }
  }
}
```

Plugin id: `fireweave@fireweave-staging`. Skills are also copied to `.claude/skills` as a
project fallback.

Or interactively (use the instance marketplace — do not re-add the prod name `fireweave` for staging):
```
/plugin marketplace add FireWeave-HQ/plugins-marketplace-staging
/plugin install fireweave@fireweave-staging
```
