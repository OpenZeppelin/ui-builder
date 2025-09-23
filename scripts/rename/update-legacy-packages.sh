#!/usr/bin/env bash
set -euo pipefail

# One-off local script to update legacy packages on npm:
# - Adds a deprecation message pointing to the new package name
# - Adds a "legacy" dist-tag to the latest version
#
# Usage:
#   DRY_RUN=true  bash scripts/rename/update-legacy-packages.sh   # default (prints actions)
#   DRY_RUN=false bash scripts/rename/update-legacy-packages.sh   # applies changes
#
# Requirements:
#   - NPM_TOKEN must be set in the environment
#   - Node/npm must be installed

DRY_RUN=${DRY_RUN:-true}

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "❌ NPM_TOKEN is not set. Export NPM_TOKEN before running."
  exit 1
fi

echo "ℹ️  DRY_RUN=${DRY_RUN}"

# Use a temporary npmrc to avoid persisting the token locally
TMP_NPMRC=$(mktemp)
trap 'rm -f "$TMP_NPMRC"' EXIT
export NPM_CONFIG_USERCONFIG="$TMP_NPMRC"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$TMP_NPMRC"

echo "🔐 Authenticating to npm..."
npm whoami || true

# Parallel arrays: legacy -> new
OLD_PKGS=(
  "@openzeppelin/contracts-ui-builder-react-core"
  "@openzeppelin/contracts-ui-builder-renderer"
  "@openzeppelin/contracts-ui-builder-types"
  "@openzeppelin/contracts-ui-builder-styles"
  "@openzeppelin/contracts-ui-builder-storage"
  "@openzeppelin/contracts-ui-builder-ui"
  "@openzeppelin/contracts-ui-builder-utils"
  "@openzeppelin/contracts-ui-builder-adapter-evm"
  "@openzeppelin/contracts-ui-builder-adapter-solana"
  "@openzeppelin/contracts-ui-builder-adapter-stellar"
  "@openzeppelin/contracts-ui-builder-adapter-midnight"
)

NEW_PKGS=(
  "@openzeppelin/ui-builder-react-core"
  "@openzeppelin/ui-builder-renderer"
  "@openzeppelin/ui-builder-types"
  "@openzeppelin/ui-builder-styles"
  "@openzeppelin/ui-builder-storage"
  "@openzeppelin/ui-builder-ui"
  "@openzeppelin/ui-builder-utils"
  "@openzeppelin/ui-builder-adapter-evm"
  "@openzeppelin/ui-builder-adapter-solana"
  "@openzeppelin/ui-builder-adapter-stellar"
  "@openzeppelin/ui-builder-adapter-midnight"
)

run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY-RUN: $*"
  else
    echo "+ $*"
    # shellcheck disable=SC2086
    eval $*
  fi
}

echo "🚀 Processing legacy packages..."
for i in "${!OLD_PKGS[@]}"; do
  OLD_NAME="${OLD_PKGS[$i]}"
  NEW_NAME="${NEW_PKGS[$i]}"

  echo "\n——— ${OLD_NAME} → ${NEW_NAME} ———"

  LATEST="$(npm view "$OLD_NAME" version 2>/dev/null || true)"
  if [[ -z "$LATEST" ]]; then
    echo "⚠️  Package not found on npm: ${OLD_NAME} (skipping)"
    continue
  fi
  echo "ℹ️  Latest version of ${OLD_NAME}: ${LATEST}"

  # Deprecate all versions of the legacy package with a clear message
  DEPRECATION_MSG="This package has been renamed to ${NEW_NAME}. Please migrate: https://www.npmjs.com/package/${NEW_NAME}"
  run "npm deprecate \"${OLD_NAME}@*\" \"${DEPRECATION_MSG}\""

  # Add a 'legacy' dist-tag pointing to the last released version for clarity
  run "npm dist-tag add ${OLD_NAME}@${LATEST} legacy"

  # Optional tag clean-up examples (commented out by default)
  # run "npm dist-tag rm ${OLD_NAME} next || true"
  # run "npm dist-tag rm ${OLD_NAME} beta || true"

  echo "✅ Planned actions complete for ${OLD_NAME}"
done

echo "\n📦 Verification (read-only):"
for i in "${!OLD_PKGS[@]}"; do
  OLD_NAME="${OLD_PKGS[$i]}"
  echo "\n— ${OLD_NAME} —"
  npm dist-tag ls "$OLD_NAME" || true
  npm view "$OLD_NAME" deprecated 2>/dev/null || true
done

echo "\n🎉 Done. DRY_RUN=${DRY_RUN}"


