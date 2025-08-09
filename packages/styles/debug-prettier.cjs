const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== DEBUG: Prettier Plugin Resolution ===');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('NODE_PATH:', process.env.NODE_PATH);

// Check node_modules
console.log('\nLocal node_modules contents (prettier-related):');
try {
  const localModules = fs
    .readdirSync('./node_modules')
    .filter((d) => d.includes('prettier') || d === '@ianvs');
  console.log(localModules);
} catch (e) {
  console.log('No local node_modules or error:', e.message);
}

// Check parent node_modules
console.log('\nParent node_modules contents (prettier-related):');
try {
  const parentModules = fs
    .readdirSync('../../node_modules')
    .filter((d) => d.includes('prettier') || d === '@ianvs');
  console.log(parentModules);
} catch (e) {
  console.log('No parent node_modules or error:', e.message);
}

// Check if .prettierrc.cjs exists and can be loaded
console.log('\nChecking prettier configs:');
const configs = ['.prettierrc.cjs', '.prettierrc', '.prettierrc.json', '.prettierrc.js'];
for (const configName of configs) {
  if (fs.existsSync(configName)) {
    console.log(`Found: ${configName}`);
  }
}

console.log('\nLoading local .prettierrc.cjs:');
try {
  const config = require('./.prettierrc.cjs');
  console.log('Config loaded successfully');
  console.log('Plugins in config:', config.plugins);
} catch (e) {
  console.log('Error loading config:', e.message);
}

// Try to resolve plugins
console.log('\nTrying to resolve plugins:');
const plugins = ['prettier-plugin-tailwindcss', '@ianvs/prettier-plugin-sort-imports'];
for (const plugin of plugins) {
  try {
    const resolved = require.resolve(plugin);
    console.log(`✓ ${plugin} resolved to:`, resolved);
  } catch (e) {
    console.log(`✗ ${plugin} failed:`, e.message);
  }
}

// Test prettier CLI directly
console.log('\n=== Testing Prettier CLI ===');
try {
  console.log('\n1. Without config (should fail):');
  execSync('pnpm exec prettier --check global.css --no-config', { stdio: 'inherit' });
} catch (e) {
  console.log('Failed as expected');
}

try {
  console.log('\n2. With local config (should pass):');
  execSync('pnpm exec prettier --check global.css', { stdio: 'inherit' });
  console.log('Passed!');
} catch (e) {
  console.log('Failed!');
}

try {
  console.log('\n3. With explicit config path (should pass):');
  execSync('pnpm exec prettier --check global.css --config .prettierrc.cjs', { stdio: 'inherit' });
  console.log('Passed!');
} catch (e) {
  console.log('Failed!');
}
