const fs = require('fs');
const path = require('path');

const {
  adapterPackageNames,
  getAdapterPackageDirectoryName,
} = require('./adapterPackageSources.cjs');

function resolveWorkspacePackageRoot(workspaceRoot, packageName) {
  const packageRoot = path.join(
    workspaceRoot,
    'packages',
    getAdapterPackageDirectoryName(packageName)
  );
  return fs.existsSync(path.join(packageRoot, 'package.json')) ? packageRoot : null;
}

function findPackageRoot(startPath) {
  let currentPath = fs.statSync(startPath).isDirectory() ? startPath : path.dirname(startPath);

  while (true) {
    if (fs.existsSync(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      return null;
    }

    currentPath = parentPath;
  }
}

function resolveInstalledPackageRoot(monorepoRoot, packageName) {
  try {
    const resolvedEntry = require.resolve(packageName, { paths: [monorepoRoot] });
    return findPackageRoot(resolvedEntry);
  } catch {
    return null;
  }
}

function resolveLocalAdaptersRoot(
  monorepoRoot,
  localAdaptersPath = process.env.LOCAL_ADAPTERS_PATH
) {
  const candidateRoots = [];

  if (localAdaptersPath) {
    candidateRoots.push(path.resolve(localAdaptersPath));
  }

  candidateRoots.push(path.resolve(monorepoRoot, '../openzeppelin-adapters'));

  for (const candidateRoot of candidateRoots) {
    if (resolveWorkspacePackageRoot(candidateRoot, adapterPackageNames[0])) {
      return candidateRoot;
    }
  }

  return null;
}

function resolveLocalAdapterPackageRoot(
  monorepoRoot,
  packageName,
  localAdaptersPath = process.env.LOCAL_ADAPTERS_PATH
) {
  const localAdaptersRoot = resolveLocalAdaptersRoot(monorepoRoot, localAdaptersPath);
  if (localAdaptersRoot) {
    const localPackageRoot = resolveWorkspacePackageRoot(localAdaptersRoot, packageName);
    if (localPackageRoot) {
      return localPackageRoot;
    }
  }

  return resolveWorkspacePackageRoot(monorepoRoot, packageName);
}

function resolveAdapterPackageRoot(
  monorepoRoot,
  packageName,
  localAdaptersPath = process.env.LOCAL_ADAPTERS_PATH
) {
  return (
    resolveLocalAdapterPackageRoot(monorepoRoot, packageName, localAdaptersPath) ||
    resolveInstalledPackageRoot(monorepoRoot, packageName)
  );
}

function resolveAdapterPatchesDir(
  monorepoRoot,
  packageName,
  localAdaptersPath = process.env.LOCAL_ADAPTERS_PATH
) {
  const packageRoot = resolveAdapterPackageRoot(monorepoRoot, packageName, localAdaptersPath);
  if (!packageRoot) {
    return null;
  }

  const patchesDir = path.join(packageRoot, 'patches');
  return fs.existsSync(patchesDir) ? patchesDir : null;
}

module.exports = {
  adapterPackageNames,
  resolveWorkspacePackageRoot,
  resolveInstalledPackageRoot,
  resolveLocalAdaptersRoot,
  resolveLocalAdapterPackageRoot,
  resolveAdapterPackageRoot,
  resolveAdapterPatchesDir,
};
