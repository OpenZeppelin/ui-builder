'use strict';

/**
 * Resolve adapter packages to the best available version for a given npm dist-tag
 * and surgically install them via `pnpm add --save-exact`.
 *
 * Called from the Dockerfile when ADAPTER_DIST_TAG is set (e.g. "rc" for staging).
 * Runs AFTER `pnpm install --frozen-lockfile`, so the full production dependency
 * tree is already in place. This script only swaps the adapter packages.
 *
 * Usage:  node scripts/resolve-staging-adapters.cjs <dist-tag>
 * Example: node scripts/resolve-staging-adapters.cjs rc
 */

const { execFileSync } = require('child_process');
const { ADAPTER_PACKAGES } = require('./lib/update-export-versions-core.cjs');

const STAGING_ADAPTER_PACKAGES = [
  ...ADAPTER_PACKAGES,
  '@openzeppelin/adapters-vite',
];

const WORKSPACE_FILTER = '@openzeppelin/ui-builder-app';

// ---------------------------------------------------------------------------
// npm helpers
// ---------------------------------------------------------------------------

/**
 * Query npm for the version a dist-tag points to.
 * @param {string} packageName
 * @param {string} tag  e.g. "rc", "latest"
 * @returns {string | null}
 */
function getNpmTagVersion(packageName, tag) {
  if (!/^[\w@/.-]+$/.test(tag)) {
    throw new Error(`Invalid dist-tag: ${tag}`);
  }
  try {
    return (
      execFileSync('npm', ['view', `${packageName}@${tag}`, 'version'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim() || null
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Inline semver comparison (no external dependencies)
// ---------------------------------------------------------------------------

/**
 * Parse a semver string into { major, minor, patch, prerelease }.
 * @param {string} version
 */
function parseSemver(version) {
  const [core, ...prereleaseParts] = version.split('-');
  const [major, minor, patch] = core.split('.').map(Number);
  return { major, minor, patch, prerelease: prereleaseParts.join('-') || null };
}

/**
 * Compare two parsed semver base versions (ignoring prerelease).
 * Returns -1, 0, or 1.
 * @param {{ major: number, minor: number, patch: number }} a
 * @param {{ major: number, minor: number, patch: number }} b
 * @returns {-1 | 0 | 1}
 */
function compareBase(a, b) {
  for (const key of /** @type {const} */ (['major', 'minor', 'patch'])) {
    if (a[key] > b[key]) return 1;
    if (a[key] < b[key]) return -1;
  }
  return 0;
}

/**
 * Pick the better version between an RC candidate and the stable (latest) version.
 *
 * Rules:
 *  - RC base > latest base  --> RC  (e.g. 1.0.1-rc.0 vs 1.0.0)
 *  - RC base == latest base --> latest wins (release > pre-release)
 *  - RC base < latest base  --> latest wins (RC is stale)
 *
 * @param {string} rcVersion
 * @param {string} latestVersion
 * @returns {{ version: string, source: 'rc' | 'latest', reason: string }}
 */
function pickBestVersion(rcVersion, latestVersion) {
  const rc = parseSemver(rcVersion);
  const latest = parseSemver(latestVersion);
  const cmp = compareBase(rc, latest);

  if (cmp > 0) {
    return {
      version: rcVersion,
      source: 'rc',
      reason: `rc base ${rcVersion} > latest ${latestVersion}`,
    };
  }
  if (cmp === 0) {
    return {
      version: latestVersion,
      source: 'latest',
      reason: `same base; release ${latestVersion} beats pre-release ${rcVersion}`,
    };
  }
  return {
    version: latestVersion,
    source: 'latest',
    reason: `rc ${rcVersion} is older than latest ${latestVersion}`,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const distTag = process.argv[2];
  if (!distTag) {
    console.error('Usage: node resolve-staging-adapters.cjs <dist-tag>');
    process.exit(1);
  }

  console.log(`\n🔍 Resolving adapter packages for dist-tag: "${distTag}"\n`);

  /** @type {Array<{ pkg: string, action: string, version: string, source: string, reason: string }>} */
  const results = [];
  /** @type {string[]} */
  const packagesToAdd = [];

  for (const pkg of STAGING_ADAPTER_PACKAGES) {
    const tagVersion = getNpmTagVersion(pkg, distTag);
    const latestVersion = getNpmTagVersion(pkg, 'latest');

    if (!latestVersion) {
      console.error(`❌ ${pkg}: no "latest" version found on npm. Cannot resolve.`);
      process.exit(1);
    }

    if (!tagVersion) {
      results.push({
        pkg,
        action: 'skip',
        version: latestVersion,
        source: 'latest',
        reason: `no "${distTag}" dist-tag on npm`,
      });
      continue;
    }

    const best = pickBestVersion(tagVersion, latestVersion);

    if (best.source === 'latest') {
      results.push({ pkg, action: 'skip', ...best });
    } else {
      results.push({ pkg, action: 'override', ...best });
      packagesToAdd.push(`${pkg}@${best.version}`);
    }
  }

  // Summary table
  console.log(
    '┌─────────────────────────────────────────┬──────────┬─────────────────┬─────────┬──────────────────────────────────────────────┐'
  );
  console.log(
    '│ Package                                 │ Action   │ Version         │ Source  │ Reason                                       │'
  );
  console.log(
    '├─────────────────────────────────────────┼──────────┼─────────────────┼─────────┼──────────────────────────────────────────────┤'
  );
  for (const r of results) {
    const pkg = r.pkg.padEnd(39);
    const action = r.action.padEnd(8);
    const version = r.version.padEnd(15);
    const source = r.source.padEnd(7);
    const reason = r.reason.padEnd(44);
    console.log(`│ ${pkg} │ ${action} │ ${version} │ ${source} │ ${reason} │`);
  }
  console.log(
    '└─────────────────────────────────────────┴──────────┴─────────────────┴─────────┴──────────────────────────────────────────────┘'
  );

  if (packagesToAdd.length === 0) {
    console.log('\n✅ All adapters are at the best available version. No overrides needed.\n');
    return;
  }

  // Surgical install: only the adapters that need overriding
  const addArgs = ['add', ...packagesToAdd, '--save-exact', '--filter', WORKSPACE_FILTER];
  console.log(`\n📦 Running: pnpm ${addArgs.join(' ')}\n`);

  try {
    execFileSync('pnpm', addArgs, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install adapter overrides:', error.message);
    process.exit(1);
  }

  console.log(`\n✅ Successfully overrode ${packagesToAdd.length} adapter package(s).\n`);
}

main();
