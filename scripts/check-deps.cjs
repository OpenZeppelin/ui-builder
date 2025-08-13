#!/usr/bin/env node

/**
 * This script checks for deprecated dependencies in your project.
 * Run with: node scripts/check-deps.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}Checking for deprecated dependencies...${colors.reset}`);

try {
  // Run npm ls to check for deprecated packages
  const output = execSync('pnpm ls --json', { encoding: 'utf8' });
  const packages = JSON.parse(output);

  // Find deprecated packages
  const deprecatedPackages = findDeprecatedPackages(packages);

  if (deprecatedPackages.length === 0) {
    console.log(`${colors.green}No deprecated packages found!${colors.reset}`);
  } else {
    console.log(
      `${colors.yellow}Found ${deprecatedPackages.length} deprecated packages:${colors.reset}`
    );

    deprecatedPackages.forEach((pkg) => {
      console.log(`${colors.red}${pkg.name}@${pkg.version}${colors.reset} - ${pkg.deprecated}`);

      if (pkg.isDirectDependency) {
        console.log(
          `${colors.cyan}This is a direct dependency. Consider updating or replacing it.${colors.reset}`
        );
      } else {
        console.log(
          `${colors.blue}This is a subdependency. You may need to update its parent package.${colors.reset}`
        );
      }

      console.log('');
    });

    console.log(`${colors.magenta}Recommendations:${colors.reset}`);
    console.log(
      `1. Run ${colors.green}pnpm update${colors.reset} to update packages within their version range`
    );
    console.log(
      `2. Run ${colors.green}pnpm update --latest${colors.reset} to update to the latest versions (may include breaking changes)`
    );
    console.log(
      `3. For subdependencies, check if newer versions of their parent packages are available`
    );
  }
} catch (error) {
  console.error(`${colors.red}Error checking dependencies:${colors.reset}`, error.message);
  process.exit(1);
}

function findDeprecatedPackages(packagesData, isDirectDependency = true, result = []) {
  if (!packagesData) return result;

  // If it's an array, process each item
  if (Array.isArray(packagesData)) {
    packagesData.forEach((pkg) => {
      findDeprecatedPackages(pkg, isDirectDependency, result);
    });
    return result;
  }

  // Process a single package
  if (packagesData.deprecated) {
    result.push({
      name: packagesData.name,
      version: packagesData.version,
      deprecated: packagesData.deprecated,
      isDirectDependency,
    });
  }

  // Process dependencies
  if (packagesData.dependencies) {
    Object.values(packagesData.dependencies).forEach((dep) => {
      findDeprecatedPackages(dep, false, result);
    });
  }

  return result;
}
