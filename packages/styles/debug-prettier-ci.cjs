#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== COMPREHENSIVE CI PRETTIER DEBUG ===');
console.log('Date:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('PATH:', process.env.PATH);
console.log('NODE_PATH:', process.env.NODE_PATH || '(not set)');

// Check for prettier binary
console.log('\n=== Prettier Binary ===');
try {
  const whichPrettier = execSync('which prettier 2>&1', { encoding: 'utf8' }).trim();
  console.log('which prettier:', whichPrettier);
} catch (e) {
  console.log('which prettier failed:', e.message);
}

// Check local node_modules
console.log('\n=== Local node_modules ===');
if (fs.existsSync('./node_modules')) {
  console.log('./node_modules exists');

  if (fs.existsSync('./node_modules/.bin/prettier')) {
    console.log('./node_modules/.bin/prettier exists');
    const prettierBinStat = fs.statSync('./node_modules/.bin/prettier');
    console.log('prettier binary stats:', {
      size: prettierBinStat.size,
      mode: prettierBinStat.mode.toString(8),
      isFile: prettierBinStat.isFile(),
      isSymlink: prettierBinStat.isSymbolicLink(),
    });

    // Check if it's a symlink
    try {
      const realPath = fs.realpathSync('./node_modules/.bin/prettier');
      console.log('prettier real path:', realPath);
    } catch (e) {
      console.log('Could not resolve prettier symlink:', e.message);
    }
  } else {
    console.log('./node_modules/.bin/prettier NOT FOUND');
  }

  // List prettier-related packages
  const prettierPackages = fs
    .readdirSync('./node_modules')
    .filter((d) => d.includes('prettier') || d === '@ianvs');
  console.log('Prettier-related packages:', prettierPackages);

  // Check each prettier package
  prettierPackages.forEach((pkg) => {
    const pkgPath = `./node_modules/${pkg}`;
    if (fs.existsSync(`${pkgPath}/package.json`)) {
      const pkgJson = JSON.parse(fs.readFileSync(`${pkgPath}/package.json`, 'utf8'));
      console.log(`${pkg} version:`, pkgJson.version);
    }
  });
} else {
  console.log('./node_modules NOT FOUND!');
}

// Check parent node_modules
console.log('\n=== Parent node_modules ===');
if (fs.existsSync('../../node_modules')) {
  const parentPrettierPackages = fs
    .readdirSync('../../node_modules')
    .filter((d) => d.includes('prettier') || d === '@ianvs');
  console.log('Parent prettier packages:', parentPrettierPackages);
} else {
  console.log('../../node_modules NOT FOUND!');
}

// Check prettier config
console.log('\n=== Prettier Config ===');
const configFiles = ['.prettierrc.cjs', '.prettierrc.js', '.prettierrc.json', '.prettierrc'];
configFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`Found ${file}`);
    if (file.endsWith('.cjs') || file.endsWith('.js')) {
      try {
        const config = require(`./${file}`);
        console.log(`${file} plugins:`, config.plugins);
      } catch (e) {
        console.log(`Error loading ${file}:`, e.message);
      }
    }
  }
});

// Test prettier execution
console.log('\n=== Testing Prettier Execution ===');

// 1. Direct execution
console.log('\n1. Direct execution test:');
try {
  const result = execSync('./node_modules/.bin/prettier --version 2>&1', { encoding: 'utf8' });
  console.log('Success:', result.trim());
} catch (e) {
  console.log('Failed:', e.message);
  if (e.stdout) console.log('stdout:', e.stdout.toString());
  if (e.stderr) console.log('stderr:', e.stderr.toString());
}

// 2. Via npx
console.log('\n2. Via npx test:');
try {
  const result = execSync('npx prettier --version 2>&1', { encoding: 'utf8' });
  console.log('Success:', result.trim());
} catch (e) {
  console.log('Failed:', e.message);
}

// 3. Check global.css with and without config
console.log('\n=== Testing global.css formatting ===');

// Show current content
console.log('\nCurrent global.css quotes:');
const globalCss = fs.readFileSync('./global.css', 'utf8');
const lines = globalCss.split('\n');
lines.forEach((line, i) => {
  if (line.includes('Inter') || line.includes('data-slot')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});

// Test without config
console.log('\n3. Prettier check without config:');
try {
  execSync('./node_modules/.bin/prettier --check global.css --no-config 2>&1', {
    encoding: 'utf8',
  });
  console.log('PASS (no changes needed)');
} catch (e) {
  console.log('FAIL (changes needed)');
}

// Test with config
console.log('\n4. Prettier check with config:');
try {
  execSync('./node_modules/.bin/prettier --check global.css --config ./.prettierrc.cjs 2>&1', {
    encoding: 'utf8',
  });
  console.log('PASS (no changes needed)');
} catch (e) {
  console.log('FAIL (changes needed)');
}

// Test what prettier wants
console.log('\n5. What prettier expects (without config):');
try {
  const formatted = execSync('./node_modules/.bin/prettier global.css --no-config 2>&1', {
    encoding: 'utf8',
  });
  const formattedLines = formatted.split('\n');
  formattedLines.forEach((line, i) => {
    if (line.includes('Inter') || line.includes('data-slot')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\n6. What prettier expects (with config):');
try {
  const formatted = execSync(
    './node_modules/.bin/prettier global.css --config ./.prettierrc.cjs 2>&1',
    { encoding: 'utf8' }
  );
  const formattedLines = formatted.split('\n');
  formattedLines.forEach((line, i) => {
    if (line.includes('Inter') || line.includes('data-slot')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
} catch (e) {
  console.log('Error:', e.message);
}

// Check if plugins are actually loading
console.log('\n=== Plugin Loading Test ===');
try {
  // Create a test file with Tailwind syntax
  const testContent = `div { @apply text-red-500 bg-blue-100; }`;
  fs.writeFileSync('./test-tailwind.css', testContent);

  console.log('Test Tailwind CSS:', testContent);

  // Format with config
  const formatted = execSync(
    './node_modules/.bin/prettier test-tailwind.css --config ./.prettierrc.cjs 2>&1',
    { encoding: 'utf8' }
  );
  console.log('Formatted result:', formatted.trim());

  // Clean up
  fs.unlinkSync('./test-tailwind.css');

  if (formatted.includes('bg-blue-100 text-red-500')) {
    console.log('✓ Tailwind plugin IS working (classes were sorted)');
  } else {
    console.log('✗ Tailwind plugin NOT working (classes were not sorted)');
  }
} catch (e) {
  console.log('Plugin test error:', e.message);
  // Clean up on error
  if (fs.existsSync('./test-tailwind.css')) {
    fs.unlinkSync('./test-tailwind.css');
  }
}

console.log('\n=== END DEBUG ===');
