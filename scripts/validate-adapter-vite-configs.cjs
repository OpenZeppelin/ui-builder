/**
 * Script to validate that all adapter packages follow the vite-config pattern
 * Ensures each adapter has:
 * - src/vite-config.ts file
 * - package.json export for vite-config
 * - tsup.config.ts entry including vite-config.ts
 * - Valid export function
 */

const path = require('path');
const fs = require('fs');

// Find all adapter packages
function findAdapterPackages() {
  const packagesDir = path.resolve(__dirname, '../packages');
  const adapters = [];

  if (!fs.existsSync(packagesDir)) {
    console.error(`Error: packages directory not found: ${packagesDir}`);
    process.exit(1);
  }

  const items = fs.readdirSync(packagesDir, { withFileTypes: true });

  for (const item of items) {
    if (!item.isDirectory()) continue;

    const packageName = item.name;
    if (!packageName.startsWith('adapter-')) continue;

    const adapterPath = path.join(packagesDir, packageName);
    const packageJsonPath = path.join(adapterPath, 'package.json');

    // Verify it's actually an adapter package
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.name && packageJson.name.includes('ui-builder-adapter')) {
          adapters.push({
            name: packageJson.name,
            path: adapterPath,
            packageJsonPath,
          });
        }
      } catch (error) {
        console.warn(`Warning: Could not parse package.json for ${packageName}:`, error.message);
      }
    }
  }

  return adapters;
}

// Validate a single adapter package
function validateAdapter(adapter) {
  const errors = [];
  const warnings = [];

  const { name, path: adapterPath, packageJsonPath } = adapter;
  const viteConfigPath = path.join(adapterPath, 'src', 'vite-config.ts');
  const tsupConfigPath = path.join(adapterPath, 'tsup.config.ts');

  // Check 1: vite-config.ts exists
  if (!fs.existsSync(viteConfigPath)) {
    errors.push(`${name}: Missing src/vite-config.ts file`);
    return { errors, warnings };
  }

  // Check 2: vite-config.ts exports the correct function
  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
  // Convert hyphenated adapter name to PascalCase (e.g., "evm-core" -> "EvmCore")
  const adapterName = name
    .replace('@openzeppelin/ui-builder-adapter-', '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const expectedFunctionName = `get${adapterName}ViteConfig`;
  const hasExport =
    viteConfigContent.includes(`export function ${expectedFunctionName}`) ||
    viteConfigContent.includes(`export const ${expectedFunctionName}`);

  if (!hasExport) {
    errors.push(`${name}: vite-config.ts must export function '${expectedFunctionName}()'`);
  }

  // Check 3: package.json has vite-config export
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const exports = packageJson.exports || {};

    if (!exports['./vite-config']) {
      errors.push(
        `${name}: package.json must export './vite-config' (see ADAPTER_ARCHITECTURE.md § 11.2.2)`
      );
    } else {
      // Validate export structure
      const viteConfigExport = exports['./vite-config'];
      if (!viteConfigExport.types || !viteConfigExport.import) {
        warnings.push(`${name}: vite-config export should include 'types' and 'import' fields`);
      }
    }
  } catch (error) {
    errors.push(`${name}: Could not parse package.json: ${error.message}`);
  }

  // Check 4: tsup.config.ts includes vite-config.ts in entry
  if (fs.existsSync(tsupConfigPath)) {
    try {
      const tsupConfigContent = fs.readFileSync(tsupConfigPath, 'utf8');
      if (!tsupConfigContent.includes('vite-config.ts')) {
        errors.push(`${name}: tsup.config.ts must include 'src/vite-config.ts' in entry array`);
      }
    } catch (error) {
      warnings.push(`${name}: Could not read tsup.config.ts: ${error.message}`);
    }
  } else {
    errors.push(`${name}: Missing tsup.config.ts file`);
  }

  return { errors, warnings };
}

// Main validation function
function validateAllAdapters() {
  console.log('Validating adapter vite-config pattern compliance...\n');

  const adapters = findAdapterPackages();

  if (adapters.length === 0) {
    console.error('No adapter packages found.');
    process.exit(1);
  }

  console.log(`Found ${adapters.length} adapter packages:\n`);
  adapters.forEach((adapter) => {
    console.log(`  - ${adapter.name}`);
  });
  console.log();

  const allErrors = [];
  const allWarnings = [];

  adapters.forEach((adapter) => {
    const { errors, warnings } = validateAdapter(adapter);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });

  // Report results
  if (allWarnings.length > 0) {
    console.log('⚠️  Warnings:');
    allWarnings.forEach((warning) => console.log(`  ${warning}`));
    console.log();
  }

  if (allErrors.length > 0) {
    console.error('❌ Validation failed with the following errors:\n');
    allErrors.forEach((error) => console.error(`  ${error}`));
    console.error(
      '\nSee docs/ADAPTER_ARCHITECTURE.md § 11.2 for the required vite-config pattern.'
    );
    process.exit(1);
  }

  console.log('✅ All adapters comply with the vite-config pattern!');
  console.log(
    '\nEach adapter has:\n' +
      '  ✓ src/vite-config.ts file\n' +
      '  ✓ package.json export for vite-config\n' +
      '  ✓ tsup.config.ts entry including vite-config.ts\n' +
      '  ✓ Valid export function'
  );
}

// Run validation
validateAllAdapters();
