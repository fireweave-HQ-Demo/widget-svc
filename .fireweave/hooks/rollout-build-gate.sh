#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
proj="$root/.fireweave/project.json"
if [[ ! -f "$proj" ]]; then exit 0; fi
bound="$(node -e "
const fs = require('node:fs');
const j = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
process.stdout.write(j.projectId || j.projects ? 'yes' : 'no');
" "$proj")" || {
  echo "rollout-build-gate: cannot read $proj" >&2
  exit 1
}
if [[ "$bound" != "yes" ]]; then
  echo "rollout-build-gate: $proj carries no project identity (projectId / projects) — refusing to report a pass on a repo this gate cannot scope. Bind the repo with \`fw init\` or /fireweave:initialise." >&2
  exit 1
fi
node "$root/.fireweave/hooks/rollout-build-gate.mjs"
