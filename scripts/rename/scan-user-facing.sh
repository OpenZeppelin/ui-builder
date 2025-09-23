#!/usr/bin/env bash
set -euo pipefail

FAIL_ON_MATCH=${1:-}
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PATTERN='OpenZeppelin Contracts UI Builder|Contracts UI Builder'

# Search only user-facing file types and ignore tool/spec directories
MATCHES=$(grep -R -nE "$PATTERN" \
  --include='*.md' --include='*.adoc' --include='*.html' --include='*.yml' --include='*.tsx' \
  --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='dist' --exclude-dir='.next' \
  --exclude-dir='.specify' --exclude-dir='specs' --exclude-dir='coverage' --exclude-dir='.temp' --exclude-dir='.agent-os' \
  "$REPO_ROOT" || true)

if [[ -n "$MATCHES" ]]; then
  echo "$MATCHES"
  if [[ "$FAIL_ON_MATCH" == "--fail-on-match" ]]; then
    echo "Found legacy user-facing strings" >&2
    exit 1
  fi
else
  echo "No legacy user-facing strings found"
fi
