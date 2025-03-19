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

// Build TypeScript
console.log('Building TypeScript...');
try {
  execSync('tsc', { stdio: 'inherit', cwd: root });
} catch (error) {
  console.error('TypeScript build failed:', error);
  process.exit(1);
}

// Check if index.js was generated
const indexPath = path.join(root, 'dist', 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('Error: TypeScript compilation did not generate dist/index.js');
  console.log('Checking src directory for index.ts...');

  if (!fs.existsSync(path.join(root, 'src', 'index.ts'))) {
    console.error('Error: src/index.ts does not exist. Please create an entry file.');
    process.exit(1);
  }

  process.exit(1);
}

// Create CommonJS wrapper
console.log('Creating CommonJS wrapper...');

// Read the ESM output
const esmCode = fs.readFileSync(indexPath, 'utf8');

// Create development CJS version
const devCjsWrapper = `'use strict';

// This is an auto-generated CommonJS wrapper
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.prod.cjs');
} else {
  module.exports = require('./index.dev.cjs');
}`;

// Create development CJS version
const devCjs = `'use strict';

// CommonJS development version
${esmCode.replace(/export /g, 'exports.').replace(/import .* from ['"](.*)['"]/g, "const $1 = require('$1')")}`;

// Create production CJS version (same as dev but could be optimized differently)
const prodCjs = devCjs;

// Write the files
fs.writeFileSync(path.join(root, 'dist', 'index.cjs'), devCjsWrapper, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'index.dev.cjs'), devCjs, 'utf8');
fs.writeFileSync(path.join(root, 'dist', 'index.prod.cjs'), prodCjs, 'utf8');

console.log('Build completed successfully!');
