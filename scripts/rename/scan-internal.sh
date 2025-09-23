#!/usr/bin/env bash
set -euo pipefail

FAIL_ON_MATCH=${1:-}
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PATTERN='@openzeppelin/contracts-ui-builder|contracts-ui-builder|OpenZeppelin Contracts UI Builder|Contracts UI Builder'

MATCHES=$(grep -R -nE "$PATTERN" \
  --include='*.ts' --include='*.tsx' --include='*.json' --include='*.md' --include='*.adoc' --include='*.html' \
  --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='dist' --exclude-dir='.next' \
  --exclude-dir='.specify' --exclude-dir='specs' --exclude-dir='.changeset' --exclude-dir='.temp' --exclude-dir='.agent-os' --exclude-dir='test-results' --exclude='**/coverage/**' \
  --exclude='CHANGELOG.md' \
  "$REPO_ROOT" || true)

if [[ -n "$MATCHES" ]]; then
  echo "$MATCHES"
  if [[ "$FAIL_ON_MATCH" == "--fail-on-match" ]]; then
    echo "Found legacy internal strings" >&2
    exit 1
  fi
else
  echo "No legacy internal strings found"
fi