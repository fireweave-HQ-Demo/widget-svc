#!/usr/bin/env bash
set -euo pipefail
# Start test_sample_z local/dev
# Goes through bench compose up so this env gets its own host ports
# (raw docker compose reuses a stale file and collides with local/dev).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
if [ -f "$REPO/apps/bench-cmd/main.ts" ]; then
  echo "→ bench compose up --name test_sample_z --bucket local --env dev"
  exec bun "$REPO/apps/bench-cmd/main.ts" compose up --name test_sample_z --bucket local --env dev
fi
COMPOSE="$ROOT/infra/local/dev/docker-compose.yml"
echo "→ docker compose -f $COMPOSE up -d (bench CLI not found; ports may collide)"
docker compose -f "$COMPOSE" up -d
