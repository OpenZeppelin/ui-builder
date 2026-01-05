const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionsFilePath = path.resolve(__dirname, '../packages/builder/src/export/versions.ts');

// Local workspace packages (adapters in this monorepo)
const localPackages = [
  '@openzeppelin/ui-builder-adapter-evm',
  '@openzeppelin/ui-builder-adapter-midnight',
  '@openzeppelin/ui-builder-adapter-solana',
  '@openzeppelin/ui-builder-adapter-stellar',
];

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
 * Gets the version of a package directly from its package.json in the workspace.
 * @param {string} packageName - The full name of the package (e.g., '@openzeppelin/ui-builder-adapter-evm').
 * @returns {string | null} The version string or null if not found.
 */
const getWorkspaceVersion = (packageName) => {
  try {
    // Derives the directory name from the package name.
    // e.g., '@openzeppelin/ui-builder-adapter-evm' -> 'adapter-evm'
    const nameWithoutScope = packageName.split('/')[1];
    const packageDirName = nameWithoutScope.replace('ui-builder-', '');

    const packageJsonPath = path.resolve(__dirname, '../packages', packageDirName, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.error(`❌ Could not find package.json for ${packageName} at: ${packageJsonPath}`);
      return null;
    }

    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    const version = packageJson.version;
    console.log(`✅ Found workspace version for ${packageName}: ${version}`);
    return version;
  } catch (error) {
    console.error(`❌ Failed to read workspace version for ${packageName}.`, error);
    return null;
  }
};

/**
 * Gets the latest version of a package from npm registry.
 * @param {string} packageName - The full name of the package (e.g., '@openzeppelin/ui-types').
 * @returns {string | null} The version string or null if not found.
 */
const getNpmVersion = (packageName) => {
  try {
    const version = execSync(`npm view ${packageName} version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    console.log(`✅ Found npm version for ${packageName}: ${version}`);
    return version;
  } catch (error) {
    console.error(`❌ Failed to fetch npm version for ${packageName}. Is it published?`);
    return null;
  }
};

const updateVersionsFile = () => {
  console.log('🚀 Synchronizing versions.ts with package versions...\n');

  let fileContent = fs.readFileSync(versionsFilePath, 'utf8');
  let versionsUpdated = false;

  // Update local workspace packages
  console.log('📦 Checking local workspace packages...');
  for (const pkg of localPackages) {
    const version = getWorkspaceVersion(pkg);
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
    const version = getNpmVersion(pkg);
    if (version) {
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
  const { execSync } = require('child_process');

  try {
    // Update snapshots for the export tests specifically (these are the tests that use package versions)
    // Note: We use `exec vitest run -u` instead of `test -- -u` because the -u flag must come
    // before the test path for vitest to recognize it as the update snapshots flag
    execSync(
      'pnpm --filter @openzeppelin/ui-builder-app exec vitest run -u src/export/__tests__/',
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      }
    );
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
