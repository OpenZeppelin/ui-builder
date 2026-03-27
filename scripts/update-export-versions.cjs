const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const {
  ADAPTER_PACKAGES,
  resolveAdapterVersion,
  getNpmVersion,
} = require('./lib/update-export-versions-core.cjs');

const versionsFilePath = path.resolve(__dirname, '../apps/builder/src/export/versions.ts');

// Adapter versions are resolved from published npm metadata (or LOCAL_ADAPTERS_PATH override).
const localPackages = ADAPTER_PACKAGES;

// External packages from @openzeppelin/ui-* (published to npm from openzeppelin-ui repo)
const externalPackages = [
  '@openzeppelin/ui-react',
  '@openzeppelin/ui-renderer',
  '@openzeppelin/ui-storage',
  '@openzeppelin/ui-types',
  '@openzeppelin/ui-components',
  '@openzeppelin/ui-utils',
  '@openzeppelin/ui-styles',
];

/**
 * Gets the stable version for an adapter: local checkout when LOCAL_ADAPTERS_PATH is set, else npm.
 * @param {string} packageName
 * @returns {string | null}
 */
const getAdapterVersionForExport = (packageName) => {
  try {
    const version = resolveAdapterVersion(packageName);
    if (version) {
      console.log(`✅ Resolved adapter version for ${packageName}: ${version}`);
      return version;
    }
    console.error(
      `❌ Could not resolve published (or local override) version for ${packageName}. ` +
        `Set LOCAL_ADAPTERS_PATH to a checkout of openzeppelin-adapters or ensure the package is on npm.`
    );
    return null;
  } catch (error) {
    console.error(`❌ Failed to resolve version for ${packageName}.`, error);
    return null;
  }
};

const updateVersionsFile = () => {
  console.log('🚀 Synchronizing versions.ts with package versions...\n');

  let fileContent = fs.readFileSync(versionsFilePath, 'utf8');
  let versionsUpdated = false;

  // Update adapter packages (published npm metadata or LOCAL_ADAPTERS_PATH)
  console.log('📦 Checking adapter packages (npm / LOCAL_ADAPTERS_PATH)...');
  for (const pkg of localPackages) {
    const version = getAdapterVersionForExport(pkg);
    if (version) {
      versionsUpdated =
        updatePackageVersion(fileContent, pkg, version, (newContent) => {
          fileContent = newContent;
        }) || versionsUpdated;
    }
  }

  // Update external npm packages
  console.log('\n🌐 Checking external npm packages...');
  for (const pkg of externalPackages) {
    const version = getNpmVersion(pkg, execSync);
    if (version) {
      console.log(`✅ Found npm version for ${pkg}: ${version}`);
      versionsUpdated =
        updatePackageVersion(fileContent, pkg, version, (newContent) => {
          fileContent = newContent;
        }) || versionsUpdated;
    }
  }

  if (versionsUpdated) {
    fs.writeFileSync(versionsFilePath, fileContent, 'utf8');
    console.log('\n🎉 Successfully synchronized versions.ts!');

    // Only update snapshots when versions actually changed
    // This requires packages to be built, so we only do it when necessary
    console.log('\n📸 Updating snapshots to match new versions...');
    updateSnapshots();
  } else {
    console.log('\n✅ All versions in versions.ts are already up to date.');
    console.log('   Skipping snapshot update (no version changes detected).');
  }
};

/**
 * Updates a package version in the file content if it differs from current.
 * @param {string} fileContent - Current file content
 * @param {string} pkg - Package name
 * @param {string} newVersion - New version to set
 * @param {function} setContent - Callback to update content
 * @returns {boolean} Whether the version was updated
 */
const updatePackageVersion = (fileContent, pkg, newVersion, setContent) => {
  const regex = new RegExp(`('${pkg}':\\s*')([^']+)(')`);
  const currentVersionMatch = fileContent.match(regex);

  if (currentVersionMatch && currentVersionMatch[2] !== newVersion) {
    setContent(fileContent.replace(regex, `$1${newVersion}$3`));
    console.log(`   📝 Updating ${pkg}: ${currentVersionMatch[2]} → ${newVersion}`);
    return true;
  }
  return false;
};

const updateSnapshots = () => {
  console.log('📸 Updating test snapshots due to version changes...');
  const { execSync: exec } = require('child_process');

  try {
    // Update snapshots for the export tests specifically (these are the tests that use package versions)
    // Note: We use `exec vitest run -u` instead of `test -- -u` because the -u flag must come
    // before the test path for vitest to recognize it as the update snapshots flag
    exec('pnpm --filter @openzeppelin/ui-builder-app exec vitest run -u src/export/__tests__/', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('✅ Snapshots updated successfully!');
  } catch (error) {
    console.error('❌ Failed to update snapshots:', error.message);
    console.error(
      '⚠️  Snapshot update failed. This will cause CI failures if versions.ts is committed without matching snapshots.'
    );
    console.error(
      '   To fix manually, run: pnpm --filter @openzeppelin/ui-builder-app exec vitest run -u src/export/__tests__/'
    );
    // Exit with error code to prevent committing mismatched versions
    process.exit(1);
  }
};

updateVersionsFile();
