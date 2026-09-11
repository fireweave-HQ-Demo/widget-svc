#!/usr/bin/env bash
set -euo pipefail
# Stop demo remote/prod
# Uses bench compose down so remote envs sync apps/ before teardown.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
CMD="$REPO/apps/bench-cmd/main.ts"
if [ ! -f "$CMD" ]; then
  echo "bench CLI not found at $CMD" >&2
  echo "Stop from the test-bench repo so compose down can sync remote volumes." >&2
  exit 1
fi
echo "→ bench compose down --name demo --bucket remote --env prod"
exec bun "$CMD" compose down --name demo --bucket remote --env prod "$@"
