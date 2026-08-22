#!/usr/bin/env bash
set -euo pipefail
# Stop demo_ko remote/prod
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/infra/remote/prod/docker-compose.yml"
echo "→ docker compose -f $COMPOSE down"
docker compose -f "$COMPOSE" down "$@"
