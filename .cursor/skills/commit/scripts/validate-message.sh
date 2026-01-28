#!/usr/bin/env bash
# Validate a commit message against the project's commitlint rules
# Usage: ./validate-message.sh "feat(builder): add new feature"

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 \"<commit-message>\""
  echo ""
  echo "Examples:"
  echo "  $0 \"feat(builder): add new feature\""
  echo "  $0 \"fix(adapter-evm): resolve connection issue\""
  exit 1
fi

MESSAGE="$1"

# Find the project root (where commitlint.config.js lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

cd "$PROJECT_ROOT"

echo "Validating: $MESSAGE"
echo "---"

echo "$MESSAGE" | npx --no -- commitlint

if [ $? -eq 0 ]; then
  echo "---"
  echo "✅ Commit message is valid!"
else
  echo "---"
  echo "❌ Commit message is invalid. See errors above."
  exit 1
fi
