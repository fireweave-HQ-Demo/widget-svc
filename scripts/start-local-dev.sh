#!/usr/bin/env bash
set -euo pipefail
# Start stg_polyglot local/dev
# Uses bench compose up so host apps/ is synced into named volumes.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
CMD="$REPO/apps/bench-cmd/main.ts"
if [ ! -f "$CMD" ]; then
  echo "bench CLI not found at $CMD" >&2
  echo "Start from the test-bench repo so compose up can sync volumes." >&2
  exit 1
fi
echo "→ bench compose up --name stg_polyglot --bucket local --env dev"
exec bun "$CMD" compose up --name stg_polyglot --bucket local --env dev
