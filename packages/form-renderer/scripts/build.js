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

// Create a simple index.js if there isn't one yet - this is temporary
// for development and testing the build process
const srcIndexPath = path.join(root, 'src', 'index.ts');
if (fs.existsSync(srcIndexPath)) {
  const srcContent = fs.readFileSync(srcIndexPath, 'utf8');
  console.log(`Source index.ts exists with ${srcContent.length} bytes`);
} else {
  console.warn('Warning: src/index.ts not found. Using a placeholder for testing.');
  const tempDir = path.join(root, 'src');

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const placeholderContent = `/**
 * Temporary index file for testing build process
 */
export const VERSION = '0.1.0';
export const add = (a: number, b: number): number => a + b;
`;
  fs.writeFileSync(srcIndexPath, placeholderContent, 'utf8');
}

// Build TypeScript with more specific options
console.log('Building TypeScript...');
try {
  // Use tsc with project reference to build all files
  execSync('tsc --project tsconfig.json', { stdio: 'inherit', cwd: root });
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
console.log('Creating CommonJS wrapper...');

// Read the ESM output
const esmCode = fs.readFileSync(indexPath, 'utf8');
console.log(`Read ${esmCode.length} bytes from ESM output`);

// Create development CJS version
const devCjsWrapper = `'use strict';

// This is an auto-generated CommonJS wrapper
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.prod.cjs');
} else {
  module.exports = require('./index.dev.cjs');
}`;

// Create development CJS version with a simpler approach
const devCjs = `'use strict';

// CommonJS development version
${esmCode.replace(/export /g, 'module.exports.').replace(/import .* from ['"](.*)['"]/g, "const $1 = require('$1')")}`;

// Create production CJS version (same as dev but could be optimized differently)
const prodCjs = devCjs;

// Write the files
fs.writeFileSync(path.join(root, 'dist', 'index.cjs'), devCjsWrapper, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'index.dev.cjs'), devCjs, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'index.prod.cjs'), prodCjs, 'utf8');

console.log('Build completed successfully!');
