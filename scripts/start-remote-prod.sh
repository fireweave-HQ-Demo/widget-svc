#!/usr/bin/env bash
set -euo pipefail
# Start demo_sample remote/prod
# Goes through bench compose up so this env gets its own host ports
# (raw docker compose reuses a stale file and collides with local/dev).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
if [ -f "$REPO/apps/bench-cmd/main.ts" ]; then
  echo "→ bench compose up --name demo_sample --bucket remote --env prod"
  exec bun "$REPO/apps/bench-cmd/main.ts" compose up --name demo_sample --bucket remote --env prod
fi
COMPOSE="$ROOT/infra/remote/prod/docker-compose.yml"
echo "→ docker compose -f $COMPOSE up -d (bench CLI not found; ports may collide)"
docker compose -f "$COMPOSE" up -d
