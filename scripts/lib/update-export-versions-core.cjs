'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/** Public adapter packages whose stable versions sync into apps/builder/src/export/versions.ts */
const ADAPTER_PACKAGES = [
  '@openzeppelin/adapter-evm',
  '@openzeppelin/adapter-midnight',
  '@openzeppelin/adapter-polkadot',
  '@openzeppelin/adapter-solana',
  '@openzeppelin/adapter-stellar',
];

/**
 * @param {string} packageName
 * @param {(cmd: string, opts: import('child_process').ExecSyncOptions) => string} execImpl
 * @returns {string | null}
 */
function getNpmVersion(packageName, execImpl = execSync) {
  try {
    const version = execImpl(`npm view ${packageName} version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return version || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} packageName e.g. @openzeppelin/adapter-evm
 * @param {string} localAdaptersRoot absolute or cwd-relative path to openzeppelin-adapters checkout
 * @returns {string | null}
 */
function getAdapterVersionFromLocalPath(packageName, localAdaptersRoot) {
  try {
    const nameWithoutScope = packageName.split('/')[1];
    if (!nameWithoutScope) return null;
    const packageJsonPath = path.resolve(
      localAdaptersRoot,
      'packages',
      nameWithoutScope,
      'package.json'
    );
    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the stable version string used in versions.ts for an adapter package.
 * Prefers LOCAL_ADAPTERS_PATH (or options.localAdaptersPath) when set and resolvable; otherwise npm registry.
 *
 * @param {string} packageName
 * @param {{ localAdaptersPath?: string; execSyncImpl?: typeof execSync }} [options]
 * @returns {string | null}
 */
function resolveAdapterVersion(packageName, options = {}) {
  const fromEnv = process.env.LOCAL_ADAPTERS_PATH;
  const localRoot = options.localAdaptersPath ?? fromEnv;
  if (localRoot) {
    const resolvedRoot = path.resolve(localRoot);
    const localVersion = getAdapterVersionFromLocalPath(packageName, resolvedRoot);
    if (localVersion) {
      return localVersion;
    }
  }
  return getNpmVersion(packageName, options.execSyncImpl ?? execSync);
}

module.exports = {
  ADAPTER_PACKAGES,
  resolveAdapterVersion,
  getNpmVersion,
  getAdapterVersionFromLocalPath,
};
