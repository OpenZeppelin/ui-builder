const fs = require('fs');
const path = require('path');

const versionsFilePath = path.resolve(__dirname, '../packages/builder/src/export/versions.ts');

// List of internal packages to update
const packagesToUpdate = [
  '@openzeppelin/ui-builder-adapter-evm',
  '@openzeppelin/ui-builder-adapter-midnight',
  '@openzeppelin/ui-builder-adapter-solana',
  '@openzeppelin/ui-builder-adapter-stellar',
  '@openzeppelin/ui-react',
  '@openzeppelin/ui-renderer',
  '@openzeppelin/ui-storage',
  '@openzeppelin/ui-types',
  '@openzeppelin/ui-components',
  '@openzeppelin/ui-utils',
];

/**
 * Gets the version of a package directly from its package.json in the workspace.
 * @param {string} packageName - The full name of the package (e.g., '@openzeppelin/ui-types').
 * @returns {string | null} The version string or null if not found.
 */
const getWorkspaceVersion = (packageName) => {
  try {
    // Derives the directory name from the package name.
    // e.g., '@openzeppelin/ui-types' -> 'types'
    // e.g., '@openzeppelin/ui-builder-adapter-evm' -> 'adapter-evm'
    const nameWithoutScope = packageName.split('/')[1];
    let packageDirName = nameWithoutScope.replace('ui-builder-', '');

    // Handle special case for renderer
    if (packageName === '@openzeppelin/ui-renderer') {
      packageDirName = 'renderer';
    }

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

const updateVersionsFile = () => {
  console.log('🚀 Synchronizing versions.ts with local workspace package versions...');

  let fileContent = fs.readFileSync(versionsFilePath, 'utf8');
  let versionsUpdated = false;

  for (const pkg of packagesToUpdate) {
    const workspaceVersion = getWorkspaceVersion(pkg);
    if (workspaceVersion) {
      // Regex to find the package line and update its version
      const regex = new RegExp(`('${pkg}':\\s*')([^']+)(')`);
      const currentVersionMatch = fileContent.match(regex);

      if (currentVersionMatch && currentVersionMatch[2] !== workspaceVersion) {
        fileContent = fileContent.replace(regex, `$1${workspaceVersion}$3`);
        console.log(`   Updating ${pkg} to ${workspaceVersion}`);
        versionsUpdated = true;
      }
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
