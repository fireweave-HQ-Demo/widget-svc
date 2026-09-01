#!/usr/bin/env bash
set -euo pipefail
# Start stg_dd_react_ts local/dev
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
if [ -f "$REPO/apps/bench-cmd/main.ts" ]; then
  echo "→ bench compose up --name stg_dd_react_ts --bucket local --env dev"
  exec bun "$REPO/apps/bench-cmd/main.ts" compose up --name stg_dd_react_ts --bucket local --env dev
fi
COMPOSE="$ROOT/infra/local/dev/docker-compose.yml"
echo "→ docker compose -f $COMPOSE up -d (bench CLI not found; ports may collide)"
docker compose -f "$COMPOSE" up -d
