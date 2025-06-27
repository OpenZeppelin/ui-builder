const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionsFilePath = path.resolve(__dirname, '../packages/core/src/export/versions.ts');

// List of internal packages to update
const packagesToUpdate = [
  '@openzeppelin/transaction-form-adapter-evm',
  '@openzeppelin/transaction-form-adapter-midnight',
  '@openzeppelin/transaction-form-adapter-solana',
  '@openzeppelin/transaction-form-adapter-stellar',
  '@openzeppelin/transaction-form-react-core',
  '@openzeppelin/transaction-form-renderer',
  '@openzeppelin/transaction-form-types',
  '@openzeppelin/transaction-form-ui',
  '@openzeppelin/transaction-form-utils',
];

const getLatestVersion = (packageName) => {
  try {
    const version = execSync(`npm view ${packageName} version`).toString().trim();
    console.log(`✅ Fetched latest version for ${packageName}: ${version}`);
    return version;
  } catch (error) {
    console.error(`❌ Failed to fetch version for ${packageName}.`);
    // Return null to indicate failure
    return null;
  }
};

const updateVersionsFile = () => {
  console.log('🚀 Starting to update package versions...');

  let fileContent = fs.readFileSync(versionsFilePath, 'utf8');
  let versionsUpdated = false;

  for (const pkg of packagesToUpdate) {
    const latestVersion = getLatestVersion(pkg);
    if (latestVersion) {
      // Regex to find the package line and update its version
      const regex = new RegExp(`('${pkg}':\\s*')([^']+)(')`);
      const currentVersionMatch = fileContent.match(regex);

      if (currentVersionMatch && currentVersionMatch[2] !== latestVersion) {
        fileContent = fileContent.replace(regex, `$1${latestVersion}$3`);
        console.log(`   Updating ${pkg} to ${latestVersion}`);
        versionsUpdated = true;
      }
    }
  }

  if (versionsUpdated) {
    fs.writeFileSync(versionsFilePath, fileContent, 'utf8');
    console.log('\n🎉 Successfully updated versions.ts!');
  } else {
    console.log('\n✅ All versions are already up to date.');
  }
};

updateVersionsFile();
