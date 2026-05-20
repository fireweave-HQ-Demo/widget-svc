#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="/root/.bun/bin:${PATH}"
if [[ -f .env ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3101}"
exec bun run start
