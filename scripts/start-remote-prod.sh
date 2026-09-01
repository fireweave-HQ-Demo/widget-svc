#!/usr/bin/env bash
set -euo pipefail
# Start stg_oodle_react_py remote/prod
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
if [ -f "$REPO/apps/bench-cmd/main.ts" ]; then
  echo "→ bench compose up --name stg_oodle_react_py --bucket remote --env prod"
  exec bun "$REPO/apps/bench-cmd/main.ts" compose up --name stg_oodle_react_py --bucket remote --env prod
fi
COMPOSE="$ROOT/infra/remote/prod/docker-compose.yml"
echo "→ docker compose -f $COMPOSE up -d (bench CLI not found; ports may collide)"
docker compose -f "$COMPOSE" up -d
