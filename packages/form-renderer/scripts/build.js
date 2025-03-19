#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Run the TypeScript compiler
console.log('Building TypeScript...');
execSync('tsc', { stdio: 'inherit', cwd: root });

// Create CJS wrapper
console.log('Creating CommonJS wrapper...');
const cjsContent = `
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./index.prod.cjs');
} else {
  module.exports = require('./index.dev.cjs');
}
`;

writeFileSync(path.join(root, 'dist', 'index.cjs'), cjsContent);

// Create dev/prod variants
const indexPath = path.join(root, 'dist', 'index.js');
const indexContent = readFileSync(indexPath, 'utf8');

// Convert ESM to CJS
const cjsDevContent = indexContent
  .replace(/export\s+\{\s*([\w\s,]+)\s*\}\s*;?/g, 'module.exports = { $1 };')
  .replace(/export\s+default\s+(\w+)\s*;?/g, 'module.exports.default = $1;')
  .replace(
    /import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+['"]([^'"]+)['"]\s*;?/g,
    'const { $1 } = require("$2");'
  )
  .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, 'const $1 = require("$2");');

writeFileSync(path.join(root, 'dist', 'index.dev.cjs'), cjsDevContent);
writeFileSync(path.join(root, 'dist', 'index.prod.cjs'), cjsDevContent);

console.log('Build completed successfully.');
