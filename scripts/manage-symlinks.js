#!/usr/bin/env node

/**
 * Symlink Management Script
 *
 * This script helps manage the configuration symlinks across the monorepo.
 * It can check, fix, or recreate symlinks as needed.
 *
 * Usage:
 *   node scripts/manage-symlinks.js check   # Check all symlinks
 *   node scripts/manage-symlinks.js fix     # Fix broken symlinks
 *   node scripts/manage-symlinks.js create  # Create all symlinks (will overwrite)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration files to be symlinked
const CONFIG_FILES = ['tailwind.config.cjs', 'postcss.config.cjs', 'components.json'];

// Packages that need symlinks
const PACKAGES = [
  'packages/core',
  'packages/form-renderer',
  'packages/templates/typescript-react-vite',
];

// Map of relative paths from each package to the root
const ROOT_PATHS = {
  'packages/core': '../..',
  'packages/form-renderer': '../..',
  'packages/templates/typescript-react-vite': '../../..',
};

// Check if a path is a symlink
function isSymlink(filePath) {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch (error) {
    return false;
  }
}

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Get the target of a symlink
function getSymlinkTarget(filePath) {
  try {
    return fs.readlinkSync(filePath);
  } catch (error) {
    return null;
  }
}

// Create a symlink
function createSymlink(targetPath, linkPath) {
  try {
    // Ensure the target file exists
    if (!fileExists(path.resolve(path.dirname(linkPath), targetPath))) {
      console.error(`Target file does not exist: ${targetPath}`);
      return false;
    }

    // Remove existing symlink or file
    if (fileExists(linkPath)) {
      fs.unlinkSync(linkPath);
    }

    // Create the symlink
    fs.symlinkSync(targetPath, linkPath);
    console.log(`Created symlink: ${linkPath} -> ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating symlink ${linkPath}: ${error.message}`);
    return false;
  }
}

// Check all symlinks
function checkSymlinks() {
  let brokenCount = 0;
  let goodCount = 0;
  let missingCount = 0;

  PACKAGES.forEach((packagePath) => {
    CONFIG_FILES.forEach((configFile) => {
      const linkPath = path.join(packagePath, configFile);
      const targetPath = path.join(ROOT_PATHS[packagePath], configFile);

      if (!fileExists(linkPath)) {
        console.log(`❌ Missing: ${linkPath}`);
        missingCount++;
      } else if (!isSymlink(linkPath)) {
        console.log(`⚠️ Not a symlink: ${linkPath}`);
        brokenCount++;
      } else {
        const actualTarget = getSymlinkTarget(linkPath);
        if (actualTarget !== targetPath) {
          console.log(`⚠️ Wrong target: ${linkPath} -> ${actualTarget} (should be ${targetPath})`);
          brokenCount++;
        } else {
          const resolvedPath = path.resolve(path.dirname(linkPath), actualTarget);
          if (!fileExists(resolvedPath)) {
            console.log(`❌ Broken link: ${linkPath} -> ${actualTarget} (target doesn't exist)`);
            brokenCount++;
          } else {
            console.log(`✅ Good link: ${linkPath} -> ${actualTarget}`);
            goodCount++;
          }
        }
      }
    });
  });

  console.log('\nSummary:');
  console.log(`- ${goodCount} good symlinks`);
  console.log(`- ${brokenCount} broken symlinks`);
  console.log(`- ${missingCount} missing symlinks`);

  return { brokenCount, goodCount, missingCount };
}

// Fix broken symlinks
function fixSymlinks() {
  let fixedCount = 0;
  let errorCount = 0;

  PACKAGES.forEach((packagePath) => {
    CONFIG_FILES.forEach((configFile) => {
      const linkPath = path.join(packagePath, configFile);
      const targetPath = path.join(ROOT_PATHS[packagePath], configFile);

      // Check if it's a broken symlink or missing
      if (!fileExists(linkPath) || !isSymlink(linkPath)) {
        if (createSymlink(targetPath, linkPath)) {
          fixedCount++;
        } else {
          errorCount++;
        }
      } else {
        const actualTarget = getSymlinkTarget(linkPath);
        const resolvedPath = path.resolve(path.dirname(linkPath), actualTarget);

        if (actualTarget !== targetPath || !fileExists(resolvedPath)) {
          if (createSymlink(targetPath, linkPath)) {
            fixedCount++;
          } else {
            errorCount++;
          }
        }
      }
    });
  });

  console.log('\nFix Summary:');
  console.log(`- ${fixedCount} symlinks fixed`);
  console.log(`- ${errorCount} errors occurred`);

  return { fixedCount, errorCount };
}

// Create all symlinks (overwrite existing)
function createAllSymlinks() {
  let createdCount = 0;
  let errorCount = 0;

  PACKAGES.forEach((packagePath) => {
    CONFIG_FILES.forEach((configFile) => {
      const linkPath = path.join(packagePath, configFile);
      const targetPath = path.join(ROOT_PATHS[packagePath], configFile);

      if (createSymlink(targetPath, linkPath)) {
        createdCount++;
      } else {
        errorCount++;
      }
    });
  });

  console.log('\nCreate Summary:');
  console.log(`- ${createdCount} symlinks created`);
  console.log(`- ${errorCount} errors occurred`);

  return { createdCount, errorCount };
}

// Main function
function main() {
  const command = process.argv[2];

  if (!command || !['check', 'fix', 'create'].includes(command)) {
    console.log('Usage:');
    console.log('  node scripts/manage-symlinks.js check   # Check all symlinks');
    console.log('  node scripts/manage-symlinks.js fix     # Fix broken symlinks');
    console.log('  node scripts/manage-symlinks.js create  # Create all symlinks (will overwrite)');
    return;
  }

  console.log(`Running command: ${command}\n`);

  switch (command) {
    case 'check':
      checkSymlinks();
      break;
    case 'fix':
      fixSymlinks();
      break;
    case 'create':
      createAllSymlinks();
      break;
  }
}

main();
