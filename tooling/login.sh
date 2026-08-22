#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$DIR/bin:$PATH"
fw login --url 'https://staging-app-server.fireweave.ai'
