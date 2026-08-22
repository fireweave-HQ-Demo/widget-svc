# Fireweave agents — Cursor + Claude Code

MCP is **not** `https://mcp.fireweave.ai/mcp`.
Both tools load the marketplace plugin (rollout MCP + skills).

## Cursor — `.cursor/settings.json`

```json
{
  "plugins": {
    "fireweave/fireweave": {
      "enabled": true,
      "gitUrl": "https://github.com/FireWeave-HQ/plugins-marketplace",
      "gitRef": "main"
    }
  }
}
```

Reload Cursor. MCP server: **plugin-fireweave-rollout-server**.

## Claude Code — `.claude/settings.json`

```json
{
  "enabledPlugins": {
    "fireweave@fireweave": true
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

Or interactively:
```
/plugin marketplace add FireWeave-HQ/plugins-marketplace
/plugin install fireweave@FireWeave-HQ/plugins-marketplace
```

(Staging marketplace slug: `FireWeave-HQ/plugins-marketplace-staging`.)
