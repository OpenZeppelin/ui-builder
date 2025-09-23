#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$SCRIPT_DIR/scan-user-facing.sh" --fail-on-match
"$SCRIPT_DIR/scan-internal.sh" --fail-on-match

echo "CI assert: no legacy strings detected"
