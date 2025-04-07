#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Ensure the dist directory exists
if (!fs.existsSync(path.join(root, 'dist'))) {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
}

// Check for source index file - provide guidance if missing
const srcIndexPath = path.join(root, 'src', 'index.ts');
if (fs.existsSync(srcIndexPath)) {
  const srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  console.log(`Source index.ts exists with ${srcContent.length} bytes`);
} else {
  console.warn('ERROR: src/index.ts not found. This file is required for the build.');
  console.warn('Please create a src/index.ts file that exports your components and utilities.');
  console.warn(`Example: 
/**
 * Form Renderer Package
 * 
 * Main entry point that exports all public components and utilities.
 */
export { TransactionForm } from "./components/TransactionForm";
export { useFormField } from "./hooks/useFormField";
export * from "./types";
`);
  process.exit(1);
}

// Build TypeScript
console.log('Building TypeScript...');
try {
  // Use tsc -b to build the project respecting references
  execSync('tsc -b tsconfig.json', { stdio: 'inherit', cwd: root });
  console.log('TypeScript compilation successful');
} catch (error) {
  console.error('TypeScript build failed:', error);
  process.exit(1);
}

// Check if index.js was generated
const indexPath = path.join(root, 'dist', 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('Error: TypeScript compilation did not generate dist/index.js');
  console.log('Checking compilation output...');

  try {
    const files = fs.readdirSync(path.join(root, 'dist'));
    console.log('Files in dist directory:', files);
  } catch (err) {
    console.error('Could not read dist directory:', err);
  }

  process.exit(1);
}

// Create CommonJS wrapper
console.log('Creating CommonJS wrappers...');

// Read the ESM output
const esmCode = fs.readFileSync(indexPath, 'utf8');
console.log(`Read ${esmCode.length} bytes from ESM output`);

// Create a more robust CJS wrapper using a dual approach:
// 1. A main CJS entry that selects dev/prod based on NODE_ENV
// 2. Simple but functional dev/prod implementations

// Main entry point with conditional loading
const cjsWrapper = `'use strict';

/**
 * Form Renderer CommonJS Entry Point
 * 
 * This wrapper selects between development and production builds
 * based on the NODE_ENV environment variable.
 */
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.prod.cjs');
} else {
  module.exports = require('./index.dev.cjs');
}`;

// Create development CJS version that works for basic use cases
// Note: For complex ESM features, a proper transpiler like esbuild would be better
const devCjs = `'use strict';

/**
 * Form Renderer CommonJS Development Version
 * 
 * Simple CommonJS conversion of the ESM module.
 * Handles basic exports and imports, but complex ESM features may not work.
 * For production use cases, consider using ESM directly.
 */
${esmCode
  .replace(/export /g, 'module.exports.')
  .replace(/import (.+?) from ['"](.*?)['"]/g, "const $1 = require('$2')")
  .replace(
    /export \{ (.*?) \} from ['"](.*?)['"]/g,
    "Object.assign(module.exports, require('$2'))"
  )}`;

// Production version (uses the same simple transformation for now)
// In a more advanced setup, this could use a proper bundler with tree-shaking
const prodCjs = devCjs.replace('Development Version', 'Production Version');

// Write the files
fs.writeFileSync(path.join(root, 'dist', 'index.cjs'), cjsWrapper, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'index.dev.cjs'), devCjs, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'index.prod.cjs'), prodCjs, 'utf8');

// Create package.json for the dist directory with proper exports (no CSS)
const packageJson = {
  type: 'module',
  main: './index.cjs',
  module: './index.js',
  types: './index.d.ts',
  exports: {
    '.': {
      import: './index.js',
      require: './index.cjs',
      types: './index.d.ts',
    },
    // Removed ./style.css export
  },
  // Removed sideEffects for CSS
};

fs.writeFileSync(
  path.join(root, 'dist', 'package.json'),
  JSON.stringify(packageJson, null, 2),
  'utf8'
);

console.log('Build completed successfully!');
console.log('Output files:');
console.log('- ESM: dist/index.js');
console.log('- CJS wrapper: dist/index.cjs');
console.log('- Package exports configuration: dist/package.json');
