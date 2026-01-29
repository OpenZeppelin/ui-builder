/**
 * pnpm hook for local development with openzeppelin-ui packages
 *
 * This file enables seamless local development by dynamically resolving
 * @openzeppelin/ui-* packages to local file paths when LOCAL_UI=true.
 *
 * Usage:
 *   LOCAL_UI=true pnpm install   # Use local packages
 *   pnpm install                  # Use npm packages (default)
 *
 * Or use the convenience scripts:
 *   pnpm dev:local               # Enable local packages
 *   pnpm dev:npm                 # Switch to npm packages
 *
 * Expected directory structure:
 *   ~/dev/
 *   ├── contracts-ui-builder/    # This repo
 *   └── openzeppelin-ui/         # UI Kit repo (sibling directory)
 *
 * Custom path:
 *   LOCAL_UI_PATH=../my-ui-fork LOCAL_UI=true pnpm install
 */

const path = require('path');

const LOCAL_UI_PATH = process.env.LOCAL_UI_PATH || '../openzeppelin-ui';

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

/**
 * Hook called by pnpm for each package being resolved
 * @param {object} pkg - The package.json content
 * @param {object} context - Context with directory info and logging
 * @returns {object} - Modified package.json content
 */
function readPackage(pkg, context) {
  // Skip if local development is not enabled
  if (process.env.LOCAL_UI !== 'true') {
    return pkg;
  }

  // Use process.cwd() as fallback if context.dir is undefined
  const baseDir = context.dir || process.cwd();

  // Replace @openzeppelin/ui-* dependencies with local file: references
  // Note: peerDependencies are excluded because pnpm requires them to be
  // semver ranges, workspace: specs, or catalog: specs (not file: paths)
  for (const depType of ['dependencies', 'devDependencies']) {
    if (!pkg[depType]) continue;

    for (const [npmName, localPath] of Object.entries(UI_PACKAGE_MAP)) {
      if (pkg[depType][npmName]) {
        const absolutePath = path.resolve(baseDir, LOCAL_UI_PATH, localPath);
        pkg[depType][npmName] = `file:${absolutePath}`;
        context.log(`[local-dev] ${npmName} → ${absolutePath}`);
      }
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
