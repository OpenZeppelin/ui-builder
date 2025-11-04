#!/usr/bin/env node

/**
 * Remove sourcemap files from patched Midnight SDK packages
 * 
 * The patches fix browser compatibility but the sourcemaps reference
 * missing source files, causing harmless but noisy warnings in Vite.
 * This script removes those sourcemaps to clean up the dev console.
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧹 Removing sourcemaps from patched Midnight SDK packages...');

try {
  // Find all .map files in @midnight-ntwrk packages
  const result = execSync(
    'find node_modules/.pnpm -path "*/@midnight-ntwrk/*/dist/*.map" -type f 2>/dev/null || true',
    { encoding: 'utf-8' }
  ).trim();

  if (!result) {
    console.log('✅ No sourcemap files found (or already removed)');
    process.exit(0);
  }

  const mapFiles = result.split('\n').filter(Boolean);
  let removedCount = 0;

  for (const mapFile of mapFiles) {
    if (fs.existsSync(mapFile)) {
      fs.unlinkSync(mapFile);
      removedCount++;
    }
  }

  console.log(`✅ Removed ${removedCount} sourcemap file(s)`);
} catch (error) {
  console.log('⚠️  Could not remove sourcemaps:', error.message);
}
