const fs = require('fs');
const path = require('path');

const versionsFilePath = path.resolve(__dirname, '../packages/builder/src/export/versions.ts');

// List of internal packages to update
const packagesToUpdate = [
  '@openzeppelin/contracts-ui-builder-adapter-evm',
  '@openzeppelin/contracts-ui-builder-adapter-midnight',
  '@openzeppelin/contracts-ui-builder-adapter-solana',
  '@openzeppelin/contracts-ui-builder-adapter-stellar',
  '@openzeppelin/contracts-ui-builder-react-core',
  '@openzeppelin/contracts-ui-builder-renderer',
  '@openzeppelin/contracts-ui-builder-storage',
  '@openzeppelin/contracts-ui-builder-types',
  '@openzeppelin/contracts-ui-builder-ui',
  '@openzeppelin/contracts-ui-builder-utils',
];

/**
 * Gets the version of a package directly from its package.json in the workspace.
 * @param {string} packageName - The full name of the package (e.g., '@openzeppelin/contracts-ui-builder-types').
 * @returns {string | null} The version string or null if not found.
 */
const getWorkspaceVersion = (packageName) => {
  try {
    // Derives the directory name from the package name.
    // e.g., '@openzeppelin/contracts-ui-builder-types' -> 'types'
    // e.g., '@openzeppelin/contracts-ui-builder-adapter-evm' -> 'adapter-evm'
    const nameWithoutScope = packageName.split('/')[1];
    let packageDirName = nameWithoutScope.replace('contracts-ui-builder-', '');

    // Handle special case for renderer
    if (packageName === '@openzeppelin/contracts-ui-builder-renderer') {
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
  } else {
    console.log('\n✅ All versions in versions.ts are already up to date.');
  }

  // Always update snapshots to ensure they match current versions
  console.log('\n📸 Ensuring snapshots match current versions...');
  updateSnapshots();
};

const updateSnapshots = () => {
  console.log('📸 Updating test snapshots due to version changes...');
  const { execSync } = require('child_process');

  try {
    // Update snapshots for the export tests specifically (these are the tests that use package versions)
    execSync(
      'pnpm --filter @openzeppelin/contracts-ui-builder-app test src/export/__tests__/ -- -u',
      {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
      }
    );
    console.log('✅ Snapshots updated successfully!');
  } catch (error) {
    console.error('❌ Failed to update snapshots:', error.message);
    console.log(
      '⚠️  Please run "pnpm --filter @openzeppelin/contracts-ui-builder-app test src/export/__tests__/ -- -u" manually'
    );
  }
};

updateVersionsFile();
