#!/usr/bin/env bash
set -euo pipefail
# Stop sample_skills_git local/dev
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE="$ROOT/infra/local/dev/docker-compose.yml"
echo "→ docker compose -f $COMPOSE down"
docker compose -f "$COMPOSE" down "$@"
