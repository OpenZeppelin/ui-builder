#!/usr/bin/env node

/**
 * Syncs patches from root patches/ directory to adapter packages.
 *
 * This script:
 * 1. Reads patch files from root patches/ directory
 * 2. Determines which adapter each patch belongs to based on dependencies
 * 3. Copies patches to the appropriate adapter's patches/ directory
 * 4. Updates the adapter's package.json with pnpm.patchedDependencies
 *
 * Run before publishing adapters to ensure patches are bundled correctly.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PATCHES_DIR = path.join(ROOT_DIR, 'patches');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');

/**
 * Maps package names to their adapter packages.
 * This determines which patches get copied to which adapters.
 */
const PATCH_TO_ADAPTER_MAP = {
  // Midnight SDK packages
  '@midnight-ntwrk/midnight-js-indexer-public-data-provider': 'adapter-midnight',
  '@midnight-ntwrk/midnight-js-types': 'adapter-midnight',
  '@midnight-ntwrk/midnight-js-network-id': 'adapter-midnight',
  '@midnight-ntwrk/midnight-js-utils': 'adapter-midnight',
  '@midnight-ntwrk/midnight-js-http-client-proof-provider': 'adapter-midnight',
  '@midnight-ntwrk/midnight-js-contracts': 'adapter-midnight',
  '@midnight-ntwrk/compact-runtime': 'adapter-midnight',

  // Add mappings for other adapters here as needed:
  // '@solana/web3.js': 'adapter-solana',
  // '@stellar/stellar-sdk': 'adapter-stellar',
};

/**
 * Extracts package name and version from a patch filename.
 * Example: @midnight-ntwrk__midnight-js-types@2.0.2.patch
 * Returns: { packageName: '@midnight-ntwrk/midnight-js-types', version: '2.0.2', fileName: '...' }
 */
function parsePatchFileName(fileName) {
  const match = fileName.match(/^(.+)@([^@]+)\.patch$/);
  if (!match) return null;

  // pnpm patch files use double underscores to encode slashes in scoped package names.
  // This converts names like '@scope__package' back to '@scope/package'.
  const packageName = match[1].replace(/__/g, '/');
  const version = match[2];

  return { packageName, version, fileName };
}

/**
 * Gets the adapter package for a given package name.
 */
function getAdapterForPackage(packageName) {
  return PATCH_TO_ADAPTER_MAP[packageName];
}

/**
 * Main sync function.
 */
function syncPatches() {
  // eslint-disable-next-line no-console
  console.log('🔄 Syncing patches from root to adapter packages...\n');

  // Check if patches directory exists
  if (!fs.existsSync(PATCHES_DIR)) {
    // eslint-disable-next-line no-console
    console.log('✅ No patches directory found. Nothing to sync.');
    return;
  }

  // Read all patch files
  const patchFiles = fs.readdirSync(PATCHES_DIR).filter((f) => f.endsWith('.patch'));

  if (patchFiles.length === 0) {
    // eslint-disable-next-line no-console
    console.log('✅ No patch files found. Nothing to sync.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Found ${patchFiles.length} patch file(s):\n`);

  // Group patches by adapter
  const adapterPatches = new Map();

  for (const patchFile of patchFiles) {
    const parsed = parsePatchFileName(patchFile);

    if (!parsed) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  Skipping invalid patch filename: ${patchFile}`);
      continue;
    }

    const adapter = getAdapterForPackage(parsed.packageName);

    if (!adapter) {
      // eslint-disable-next-line no-console
      console.warn(`⚠️  No adapter mapping found for ${parsed.packageName}, skipping ${patchFile}`);
      continue;
    }

    if (!adapterPatches.has(adapter)) {
      adapterPatches.set(adapter, []);
    }

    adapterPatches.get(adapter).push({
      fileName: patchFile,
      packageName: parsed.packageName,
      version: parsed.version,
    });

    // eslint-disable-next-line no-console
    console.log(`  📦 ${patchFile} → ${adapter}`);
  }

  // eslint-disable-next-line no-console
  console.log('');

  // Process each adapter
  for (const [adapter, patches] of adapterPatches.entries()) {
    const adapterDir = path.join(PACKAGES_DIR, adapter);
    const adapterPatchesDir = path.join(adapterDir, 'patches');
    const adapterPackageJsonPath = path.join(adapterDir, 'package.json');

    // Verify adapter exists
    if (!fs.existsSync(adapterDir)) {
      // eslint-disable-next-line no-console
      console.error(`❌ Adapter directory not found: ${adapterDir}`);
      continue;
    }

    // eslint-disable-next-line no-console
    console.log(`\n📂 Processing ${adapter}...`);

    // Create patches directory if it doesn't exist
    if (!fs.existsSync(adapterPatchesDir)) {
      fs.mkdirSync(adapterPatchesDir, { recursive: true });
      // eslint-disable-next-line no-console
      console.log(`  ✨ Created patches directory`);
    }

    // Copy patch files
    for (const patch of patches) {
      const srcPath = path.join(PATCHES_DIR, patch.fileName);
      const destPath = path.join(adapterPatchesDir, patch.fileName);

      fs.copyFileSync(srcPath, destPath);
      // eslint-disable-next-line no-console
      console.log(`  ✅ Copied ${patch.fileName}`);
    }

    // Update package.json
    if (fs.existsSync(adapterPackageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(adapterPackageJsonPath, 'utf8'));

      // Ensure pnpm.patchedDependencies exists
      if (!packageJson.pnpm) {
        packageJson.pnpm = {};
      }

      if (!packageJson.pnpm.patchedDependencies) {
        packageJson.pnpm.patchedDependencies = {};
      }

      // Add/overwrite patch references
      for (const patch of patches) {
        const key = `${patch.packageName}@${patch.version}`;
        const value = `patches/${patch.fileName}`;
        packageJson.pnpm.patchedDependencies[key] = value;
      }

      // Ensure patches directory is in files array
      if (!packageJson.files) {
        packageJson.files = [];
      }
      if (!packageJson.files.includes('patches')) {
        packageJson.files.push('patches');
      }

      // Write back package.json
      fs.writeFileSync(adapterPackageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

      // eslint-disable-next-line no-console
      console.log(`  ✅ Updated package.json with ${patches.length} patch reference(s)`);
    }
  }

  // eslint-disable-next-line no-console
  console.log('\n✅ Patch sync complete!\n');
}

// Run the script
try {
  syncPatches();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('❌ Error syncing patches:', error);
  process.exit(1);
}
