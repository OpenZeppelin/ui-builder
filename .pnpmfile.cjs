/**
 * pnpm hook for local development with openzeppelin-ui and openzeppelin-adapters.
 *
 * This file enables seamless local development by dynamically resolving:
 * - @openzeppelin/ui-* packages when LOCAL_UI=true
 * - @openzeppelin/adapter-* packages when LOCAL_ADAPTERS=true
 *
 * Usage:
 *   LOCAL_UI=true pnpm install        # Use local UI packages
 *   LOCAL_ADAPTERS=true pnpm install  # Use local adapter packages
 *   pnpm install                      # Use npm/workspace packages (default)
 *
 * Or use the convenience scripts:
 *   pnpm dev:local           # Enable local UI packages
 *   pnpm dev:adapters:local  # Enable local adapter packages
 *   pnpm dev:npm             # Switch back to npm packages
 *
 * Custom paths:
 *   LOCAL_UI_PATH=../my-ui-fork LOCAL_UI=true pnpm install
 *   LOCAL_ADAPTERS_PATH=../my-adapters-fork LOCAL_ADAPTERS=true pnpm install
 */

const fs = require('fs');
const path = require('path');

const LOCAL_UI_PATH = process.env.LOCAL_UI_PATH || '../openzeppelin-ui';
const LOCAL_ADAPTERS_ENV_VARS = ['LOCAL_ADAPTERS_PATH', 'LOCAL_UI_BUILDER_PATH'];
const DEFAULT_LOCAL_ADAPTERS_PATH = '../openzeppelin-adapters';

/**
 * Maps npm package names to their directory paths within openzeppelin-ui
 */
const UI_PACKAGE_MAP = {
  '@openzeppelin/ui-types': 'packages/types',
  '@openzeppelin/ui-utils': 'packages/utils',
  '@openzeppelin/ui-styles': 'packages/styles',
  '@openzeppelin/ui-components': 'packages/components',
  '@openzeppelin/ui-renderer': 'packages/renderer',
  '@openzeppelin/ui-react': 'packages/react',
  '@openzeppelin/ui-storage': 'packages/storage',
};

const ADAPTER_PACKAGE_MAP = {
  '@openzeppelin/adapter-evm': 'packages/adapter-evm',
  '@openzeppelin/adapter-midnight': 'packages/adapter-midnight',
  '@openzeppelin/adapter-polkadot': 'packages/adapter-polkadot',
  '@openzeppelin/adapter-solana': 'packages/adapter-solana',
  '@openzeppelin/adapter-stellar': 'packages/adapter-stellar',
};

function getConfiguredPath(envNames, defaultPath) {
  for (const envName of envNames) {
    if (process.env[envName]) {
      return {
        envName,
        relativePath: process.env[envName],
      };
    }
  }

  return {
    envName: null,
    relativePath: defaultPath,
  };
}

function resolveRepoRoot(baseDir, { envNames, defaultPath, repoName }) {
  const { envName, relativePath } = getConfiguredPath(envNames, defaultPath);
  const absolutePath = path.resolve(baseDir, relativePath);

  if (!fs.existsSync(absolutePath)) {
    const envHelp = envNames.join(' or ');
    const envSource = envName ? `${envName}=${relativePath}` : `default path ${defaultPath}`;

    throw new Error(
      `[local-dev] ${repoName} checkout not found at ${absolutePath} (${envSource}). ` +
        `Set ${envHelp} to a valid ${repoName} checkout.`
    );
  }

  return absolutePath;
}

function resolvePackageDirectory(baseDir, repoConfig, packageName, packagePath) {
  const repoRoot = resolveRepoRoot(baseDir, repoConfig);
  const absolutePath = path.resolve(repoRoot, packagePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `[local-dev] Expected ${packageName} at ${absolutePath}, but it was not found. ` +
        `Check that ${repoConfig.repoName} matches a compatible checkout.`
    );
  }

  return absolutePath;
}

function rewriteDependencies(pkg, context, packageMap, repoConfig) {
  const baseDir = context.dir || process.cwd();

  for (const depType of ['dependencies', 'devDependencies']) {
    if (!pkg[depType]) continue;

    for (const [npmName, localPath] of Object.entries(packageMap)) {
      if (!pkg[depType][npmName]) continue;

      const absolutePath = resolvePackageDirectory(baseDir, repoConfig, npmName, localPath);
      pkg[depType][npmName] = `file:${absolutePath}`;
      context.log(`[local-dev] ${npmName} → ${absolutePath}`);
    }
  }
}

/**
 * Hook called by pnpm for each package being resolved
 * @param {object} pkg - The package.json content
 * @param {object} context - Context with directory info and logging
 * @returns {object} - Modified package.json content
 */
function readPackage(pkg, context) {
  const localUiEnabled = process.env.LOCAL_UI === 'true';
  const localAdaptersEnabled = process.env.LOCAL_ADAPTERS === 'true';

  // Skip if local development is not enabled.
  if (!localUiEnabled && !localAdaptersEnabled) {
    return pkg;
  }

  // Replace local development dependencies with file: references.
  // Note: peerDependencies are excluded because pnpm requires them to be
  // semver ranges, workspace: specs, or catalog: specs (not file: paths).
  if (localUiEnabled) {
    rewriteDependencies(pkg, context, UI_PACKAGE_MAP, {
      envNames: ['LOCAL_UI_PATH'],
      defaultPath: '../openzeppelin-ui',
      repoName: 'openzeppelin-ui',
    });
  }

  if (localAdaptersEnabled) {
    rewriteDependencies(pkg, context, ADAPTER_PACKAGE_MAP, {
      envNames: LOCAL_ADAPTERS_ENV_VARS,
      defaultPath: DEFAULT_LOCAL_ADAPTERS_PATH,
      repoName: 'openzeppelin-adapters',
    });
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
