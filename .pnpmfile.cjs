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
      if (!name.startsWith('@openzeppelin/adapter') && !name.startsWith('@openzeppelin/adapters-')) continue;
      const m = range.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
      if (!m) continue;
      const maj = Number(m[1]), min = Number(m[2]), pat = Number(m[3]);
      const upper = maj > 0
        ? `${maj + 1}.0.0`
        : min > 0
          ? `0.${min + 1}.0`
          : `0.0.${pat + 1}`;
      pkg[depType][name] = `>=${maj}.${min}.${pat}-0 <${upper}`;
    }
  }
}

// --- License compliance: strip the Trezor (T-RSL) stack --------------------
// @creit.tech/stellar-wallets-kit hard-depends on @trezor/connect-web and
// @trezor/connect-plugin-stellar, which together pull in 22 @trezor/* packages
// licensed under the Trezor Reference Source License (T-RSL). T-RSL grants
// "reference use" within the company only and excludes the right to distribute
// the software outside the company.
//
// Nothing we ship reaches that code: the kit's barrel does not re-export
// modules/trezor.module, allowAllModules() returns only the eight non-Trezor
// modules, and trezor.module is an isolated leaf that nothing else in the kit
// imports. Dropping both deps leaves bundle output byte-identical.
//
// Done here rather than through pnpm.patchedDependencies so it is not pinned to
// one kit version, and so it applies however deep the kit is pulled in (e.g.
// via @openzeppelin/adapter-stellar rather than a direct dependency).
const TREZOR_DEP_HOST = '@creit.tech/stellar-wallets-kit';
const TREZOR_DEPS = ['@trezor/connect-web', '@trezor/connect-plugin-stellar'];
const TREZOR_DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripTrezorDependencies(pkg, context) {
  if (pkg.name !== TREZOR_DEP_HOST) {
    return;
  }

  for (const field of TREZOR_DEP_FIELDS) {
    for (const dep of TREZOR_DEPS) {
      if (pkg[field] && dep in pkg[field]) {
        delete pkg[field][dep];
        context.log(`[license] stripped ${dep} from ${pkg.name}@${pkg.version} (T-RSL)`);
      }
    }
  }
}

// --- License compliance: strip the WalletConnect / Reown stack ---------------
// We no longer register a WalletConnect connector in any ecosystem, so these
// dependencies are dead weight -- and the EVM one drags in @reown/appkit.
//
// Reown moved AppKit to the Reown Community License at 1.8.3 (commercial fees
// above 500 monthly active users, a mandatory-gateway clause and a
// confidentiality clause). The wagmi team have themselves deprecated their
// walletConnect connector over that relicence, noting they cannot patch a known
// downstream vulnerability (pino@7.11.0) because of it.
//
// Both host packages reach WalletConnect through a single isolated module that
// nothing else imports:
//   - @wagmi/connectors                -> walletConnect.js (dynamic import, unused)
//   - @creit.tech/stellar-wallets-kit   -> modules/walletconnect.module (not in the
//     barrel, not in allowAllModules())
// @wagmi/connectors@8+ makes its WalletConnect dependency an optional peer; until
// we move to wagmi 3 this hook achieves the same on the version we pin.
const WALLETCONNECT_STRIP = {
  '@wagmi/connectors': ['@walletconnect/ethereum-provider'],
  '@creit.tech/stellar-wallets-kit': ['@walletconnect/modal', '@walletconnect/sign-client'],
};
const WALLETCONNECT_DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripWalletConnectDependencies(pkg, context) {
  const deps = WALLETCONNECT_STRIP[pkg.name];
  if (!deps) {
    return;
  }

  for (const field of WALLETCONNECT_DEP_FIELDS) {
    for (const dep of deps) {
      if (pkg[field] && dep in pkg[field]) {
        delete pkg[field][dep];
        context.log(`[license] stripped ${dep} from ${pkg.name}@${pkg.version} (WalletConnect)`);
      }
    }
  }
}

// --- License compliance: strip the MetaMask SDK -----------------------------
// @metamask/sdk ships a proprietary ConsenSys licence, not an open-source one:
// "Copyright ConsenSys Software Inc. 2022. All rights reserved", granting only a
// non-exclusive, non-transferable licence for Non-Commercial Use -- and clause 2
// requires any Resulting Program to carry that same Non-Commercial restriction
// forward.
//
// The OpenZeppelin adapters are AGPL-3.0, which forbids conveying the work under
// added restrictions. A non-commercial-only restriction is exactly such a
// restriction, so the two licences cannot both be satisfied. The conflict is
// structural: it does not depend on a monthly-active-user count, and there is no
// clean version to pin (no published version declares a `license` field at all).
//
// The same 2715-byte licence file ships in @metamask/sdk,
// @metamask/sdk-communication-layer and @metamask/sdk-install-modal-web.
//
// Scoped to those three package names on purpose. Most of @metamask/* is MIT or
// ISC (utils, providers, json-rpc-engine, rpc-errors, superstruct, ...) and is
// legitimately needed; a scope-wide strip would break far more than it fixes.
//
// @wagmi/connectors declares @metamask/sdk as a hard dependency, not an optional
// peer, so it installs whether or not a metaMask() connector is registered.
const METAMASK_STRIP = {
  '@wagmi/connectors': ['@metamask/sdk'],
};
const METAMASK_DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function stripMetaMaskDependencies(pkg, context) {
  const deps = METAMASK_STRIP[pkg.name];
  if (!deps) {
    return;
  }

  for (const field of METAMASK_DEP_FIELDS) {
    for (const dep of deps) {
      if (pkg[field] && dep in pkg[field]) {
        delete pkg[field][dep];
        context.log(`[license] stripped ${dep} from ${pkg.name}@${pkg.version} (MetaMask SDK)`);
      }
    }
  }
}

function readPackage(pkg, context) {
  stripWalletConnectDependencies(pkg, context);

  stripTrezorDependencies(pkg, context);

  stripMetaMaskDependencies(pkg, context);

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
