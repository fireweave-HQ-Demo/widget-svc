#!/usr/bin/env bash
set -euo pipefail
# Start sample-atlas local/dev
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/infra/local/dev/docker-compose.yml"
echo "→ docker compose -f $COMPOSE up -d"
docker compose -f "$COMPOSE" up -d
