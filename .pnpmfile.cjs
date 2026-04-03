/**
 * pnpm hook for config-driven local development.
 *
 * This hook reads `.openzeppelin-dev.json` from the repository root and rewrites
 * configured dependency families to either packed tarballs or direct repo paths
 * when their corresponding LOCAL_* flags are enabled.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = '.openzeppelin-dev.json';
const STANDARD_FAMILIES = {
  ui: {
    repoName: 'openzeppelin-ui',
    envFlag: 'LOCAL_UI',
    envNames: ['LOCAL_UI_PATH'],
    defaultPath: '../openzeppelin-ui',
    packageMap: {
      '@openzeppelin/ui-types': 'packages/types',
      '@openzeppelin/ui-utils': 'packages/utils',
      '@openzeppelin/ui-styles': 'packages/styles',
      '@openzeppelin/ui-components': 'packages/components',
      '@openzeppelin/ui-renderer': 'packages/renderer',
      '@openzeppelin/ui-react': 'packages/react',
      '@openzeppelin/ui-storage': 'packages/storage',
    },
  },
  adapters: {
    repoName: 'openzeppelin-adapters',
    envFlag: 'LOCAL_ADAPTERS',
    envNames: ['LOCAL_ADAPTERS_PATH'],
    defaultPath: '../openzeppelin-adapters',
    packageMap: {
      '@openzeppelin/adapters-vite': 'packages/adapters-vite',
      '@openzeppelin/adapter-evm-core': 'packages/adapter-evm-core',
      '@openzeppelin/adapter-evm': 'packages/adapter-evm',
      '@openzeppelin/adapter-midnight': 'packages/adapter-midnight',
      '@openzeppelin/adapter-polkadot': 'packages/adapter-polkadot',
      '@openzeppelin/adapter-runtime-utils': 'packages/adapter-runtime-utils',
      '@openzeppelin/adapter-solana': 'packages/adapter-solana',
      '@openzeppelin/adapter-stellar': 'packages/adapter-stellar',
    },
  },
};

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getRealPath(targetPath) {
  return typeof fs.realpathSync.native === 'function'
    ? fs.realpathSync.native(targetPath)
    : fs.realpathSync(targetPath);
}

function resolveCacheDir(workspaceRoot, cacheDir) {
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  const resolvedCacheDir = path.resolve(resolvedWorkspaceRoot, cacheDir);
  const relativeCacheDir = path.relative(resolvedWorkspaceRoot, resolvedCacheDir);

  if (
    relativeCacheDir === '' ||
    relativeCacheDir.startsWith('..') ||
    path.isAbsolute(relativeCacheDir)
  ) {
    throw new Error(`${CONFIG_FILE} "cacheDir" must be a subdirectory of the workspace root.`);
  }

  return resolvedCacheDir;
}

function isAnyLocalFamilyEnabled() {
  return Object.values(STANDARD_FAMILIES).some((family) => process.env[family.envFlag] === 'true');
}

function readProjectConfig(workspaceRoot) {
  const configPath = path.join(workspaceRoot, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing ${CONFIG_FILE} in ${workspaceRoot}.`);
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!isObject(parsed) || parsed.version !== 1 || !isObject(parsed.families)) {
    throw new Error(`${CONFIG_FILE} must declare "version": 1 and a "families" object.`);
  }

  const families = Object.create(null);
  for (const [familyKey, overrides] of Object.entries(parsed.families)) {
    if (!Object.prototype.hasOwnProperty.call(STANDARD_FAMILIES, familyKey)) {
      throw new Error(`Unsupported family "${familyKey}" in ${CONFIG_FILE}.`);
    }

    const familyOverrides = isObject(overrides) ? overrides : {};
    const baseFamily = STANDARD_FAMILIES[familyKey];
    const filteredEnvNames =
      Array.isArray(familyOverrides.envNames) && familyOverrides.envNames.length > 0
        ? familyOverrides.envNames.filter((value) => typeof value === 'string' && value.length > 0)
        : null;
    families[familyKey] = {
      ...baseFamily,
      defaultPath:
        typeof familyOverrides.defaultPath === 'string' && familyOverrides.defaultPath.length > 0
          ? familyOverrides.defaultPath
          : baseFamily.defaultPath,
      envNames:
        filteredEnvNames && filteredEnvNames.length > 0
          ? filteredEnvNames
          : [...baseFamily.envNames],
    };
  }

  const cacheDirFromConfig =
    typeof parsed.cacheDir === 'string' && parsed.cacheDir.trim().length > 0
      ? parsed.cacheDir
      : '.packed-packages/local-dev';

  return {
    cacheDir: resolveCacheDir(workspaceRoot, cacheDirFromConfig),
    families,
  };
}

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

function resolveRepoRoot(baseDir, family) {
  const { envName, relativePath } = getConfiguredPath(family.envNames, family.defaultPath);
  const resolvedPath = path.resolve(baseDir, relativePath);

  if (!fs.existsSync(resolvedPath)) {
    const envHelp = family.envNames.join(' or ');
    const envSource = envName ? `${envName}=${relativePath}` : `default path ${family.defaultPath}`;
    throw new Error(
      `[local-dev] ${family.repoName} checkout not found at ${resolvedPath} (${envSource}). Set ${envHelp} to a valid ${family.repoName} checkout.`
    );
  }

  return getRealPath(resolvedPath);
}

function resolvePackageDirectory(workspaceRoot, family, packageName, packagePath) {
  const repoRoot = resolveRepoRoot(workspaceRoot, family);
  const resolvedPath = path.resolve(repoRoot, packagePath);
  const expectedPackageJsonPath = path.join(resolvedPath, 'package.json');

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `[local-dev] Expected ${packageName} to have a package.json at ${expectedPackageJsonPath}, but it was not found. Check that ${family.repoName} matches a compatible checkout and contains this package.`
    );
  }

  const absolutePath = getRealPath(resolvedPath);
  const packageJsonPath = path.join(absolutePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      `[local-dev] Expected ${packageName} to have a package.json at ${packageJsonPath}, but it was not found. Check that ${family.repoName} matches a compatible checkout and contains this package.`
    );
  }

  return absolutePath;
}

function readPackedManifest(cacheDir, familyKey) {
  const manifestPath = path.join(cacheDir, `${familyKey}.json`);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return isObject(parsed) && isObject(parsed.packages) ? parsed.packages : null;
  } catch {
    return null;
  }
}

function rewriteDependencies(pkg, context, cacheDir, familyKey, family) {
  const packedPackages = readPackedManifest(cacheDir, familyKey);
  const workspaceRoot = __dirname;

  for (const depType of ['dependencies', 'devDependencies']) {
    if (!pkg[depType]) continue;

    for (const [npmName, packagePath] of Object.entries(family.packageMap)) {
      if (!pkg[depType][npmName]) continue;

      const packedTarballPath = packedPackages && packedPackages[npmName];
      if (packedTarballPath && fs.existsSync(packedTarballPath)) {
        pkg[depType][npmName] = `file:${packedTarballPath}`;
        context.log(`[local-dev] ${npmName} → ${packedTarballPath} (packed)`);
        continue;
      }

      const absolutePath = resolvePackageDirectory(workspaceRoot, family, npmName, packagePath);
      pkg[depType][npmName] = `file:${absolutePath}`;
      context.log(`[local-dev] ${npmName} → ${absolutePath}`);
    }
  }
}

/**
 * Widen `^X.Y.Z` ranges on `@openzeppelin/adapter*` packages to also include
 * pre-release versions (`>=X.Y.Z-0 <(X+1).0.0`).
 *
 * This lets `pnpm install` resolve RC packages (e.g. 2.0.0-rc.1) when the
 * stable version (e.g. 2.0.0) hasn't been published yet, without changing
 * the declared range in package.json. Once the stable version ships, pnpm
 * naturally resolves to it (highest match wins). The rewrite is harmless
 * when stable versions are available — it's effectively a permanent no-op.
 *
 * Skips deps already rewritten to `file:` paths by local-dev mode.
 */
function allowAdapterPrereleases(pkg) {
  for (const depType of ['dependencies', 'devDependencies']) {
    if (!pkg[depType]) continue;
    for (const [name, range] of Object.entries(pkg[depType])) {
      if (!name.startsWith('@openzeppelin/adapter')) continue;
      const m = range.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
      if (!m) continue;
      const [, maj, min, pat] = m;
      pkg[depType][name] = `>=${maj}.${min}.${pat}-0 <${Number(maj) + 1}.0.0`;
    }
  }
}

function readPackage(pkg, context) {
  if (isAnyLocalFamilyEnabled()) {
    const workspaceRoot = __dirname;
    const projectConfig = readProjectConfig(workspaceRoot);

    for (const [familyKey, family] of Object.entries(projectConfig.families)) {
      if (process.env[family.envFlag] !== 'true') {
        continue;
      }

      rewriteDependencies(pkg, context, projectConfig.cacheDir, familyKey, family);
    }
  }

  allowAdapterPrereleases(pkg);

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
