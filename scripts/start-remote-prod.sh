#!/usr/bin/env bash
set -euo pipefail
# Start demo_k1 remote/prod
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/infra/remote/prod/docker-compose.yml"
echo "→ docker compose -f $COMPOSE up -d"
docker compose -f "$COMPOSE" up -d
