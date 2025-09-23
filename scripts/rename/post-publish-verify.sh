#!/usr/bin/env bash
set -euo pipefail

# Verify npm publish status for new and legacy packages

PACKAGES_NEW=(
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

PACKAGES_OLD=(
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

echo "Checking new package availability..."
for pkg in "${PACKAGES_NEW[@]}"; do
  echo -n "  ${pkg}: "
  if npm info "${pkg}" version >/dev/null 2>&1; then
    echo "OK ($(npm info "${pkg}" version))"
  else
    echo "MISSING"
  fi
done

echo "\nChecking legacy packages deprecation flag..."
for pkg in "${PACKAGES_OLD[@]}"; do
  echo -n "  ${pkg}: "
  if npm info "${pkg}" deprecated >/dev/null 2>&1; then
    dep_msg=$(npm info "${pkg}" deprecated 2>/dev/null || true)
    if [ -n "${dep_msg}" ] && [ "${dep_msg}" != "null" ]; then
      echo "DEPRECATED (${dep_msg})"
    else
      echo "NOT DEPRECATED"
    fi
  else
    echo "NOT FOUND"
  fi
done


