# Fireweave agents — Cursor + Claude Code

MCP is **not** `https://mcp.fireweave.ai/mcp`.
Both tools load the marketplace plugin (rollout MCP + skills).

Cursor plugin key and Claude marketplace name are **instance-scoped**
(`fireweave/fireweave` / `fireweave`) so staging does not collide with a
user-global prod plugin named `fireweave/fireweave`.

## Cursor — `.cursor/settings.json`

```json
{
  "plugins": {
    "fireweave/fireweave": {
      "enabled": true,
      "gitUrl": "https://github.com/FireWeave-HQ/plugins-marketplace",
      "gitRef": "main"
    },
    "fireweave-staging/fireweave": {
      "enabled": false
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
    "fireweave@fireweave": true,
    "fireweave@fireweave-staging": false,
    "fireweave@fireweave-local": false
  },
  "extraKnownMarketplaces": {
    "fireweave": {
      "source": {
        "source": "git",
        "url": "https://github.com/FireWeave-HQ/plugins-marketplace.git"
      },
      "autoUpdate": true
    }
  }
}
```

Plugin id: `fireweave@fireweave`. Skills are also copied to `.claude/skills` as a
project fallback.

Or interactively:
```
/plugin marketplace add FireWeave-HQ/plugins-marketplace
/plugin install fireweave@fireweave
```
