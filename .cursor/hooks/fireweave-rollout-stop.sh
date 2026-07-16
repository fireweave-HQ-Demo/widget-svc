#!/usr/bin/env bash
# After agent work, nudge when rollout-ready artifacts drift.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
gate="$root/.fireweave/hooks/rollout-build-gate.sh"
if [[ ! -x "$gate" ]]; then exit 0; fi
out="$(mktemp)"
trap 'rm -f "$out"' EXIT
if "$gate" >"$out" 2>/dev/null; then exit 0; fi
findings="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log((j.findings||[]).map(f=>f.message).join('; '))" "$out" 2>/dev/null || echo 'rollout-ready drift detected')"
msg="FireWeave rollout-ready drift: ${findings}. Complete anchor + manifest + fw-tracker stamp per .fireweave/agent-instructions.md, then run reconcile phase build."
printf '%s\n' "{\"followup_message\":$(node -e "console.log(JSON.stringify(process.argv[1]))" "$msg")}"
