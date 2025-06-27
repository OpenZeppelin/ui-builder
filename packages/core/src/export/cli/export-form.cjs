#!/usr/bin/env node

/**
 * Transaction Form Export CLI Tool
 *
 * This CLI tool provides a simple way to export, build, and test transaction forms.
 * It leverages the existing form export system to create complete projects that can
 * be used as starting points for customized implementations.
 *
 * Features:
 * - Export forms with different configurations
 * - Build exported forms for deployment
 * - Run exported forms in a local development server
 * - Verify the correctness of exported forms
 *
 * Usage:
 *   export-form [command] [options]
 *
 * Commands:
 *   export       Export a form with specified configuration
 *   build        Build an exported form
 *   serve        Start a local server to test an exported form
 *   verify       Verify form functionality
 *
 * Options:
 *   --help, -h                 Show help information
 *   --chain, -c [type]         Chain type (evm, solana, stellar) (default: evm)
 *   --func, -f [name]          Function name (default: transfer)
 *   --output, -o [name]        Subdirectory name within ./exports (default: transfer-form)
 *   --adapters, -a [boolean]   Include blockchain adapters (default: true)
 *   --template, -t [name]      Template to use (default: typescript-react-vite)
 *   --complex, -x              Use complex form with multiple fields
 *   --verbose, -v              Enable verbose output
 *   --env, -e [env]            Target environment: 'local' or 'production' (default: local)
 *
 * Examples:
 *   export-form export                                  # Export basic EVM transfer form
 *   export-form export -c solana -f stake -o stake-form # Export Solana staking form
 *   export-form export --env production -o prod-form    # Export form for production use
 *   export-form build ./exports/transfer-form           # Build exported form
 *   export-form serve ./exports/transfer-form           # Run exported form locally
 *   export-form export -x                               # Export complex form
 *
 * @module export-form
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Enable debug mode via environment variable
const DEBUG = process.env.DEBUG === 'true';

// ANSI color codes for formatting output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

/**
 * Debug logging utility - only logs when DEBUG=true
 * @param {string} message - Message to log
 */
function debug(message) {
  if (DEBUG) console.log(`${colors.cyan}[Debug] ${message}${colors.reset}`);
}

/**
 * Finds the monorepo root by searching upwards for pnpm-workspace.yaml
 * @param {string} startDir - The directory to start searching from.
 * @returns {string | null} The path to the monorepo root or null if not found.
 */
function findMonorepoRoot(startDir) {
  let currentDir = startDir;
  while (true) {
    const markerPath = path.join(currentDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(markerPath)) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached the filesystem root
      return null;
    }
    currentDir = parentDir;
  }
}

/**
 * Resolves a target directory path, handling common edge cases
 * @param {string} targetDirInput - Input path that might be relative
 * @param {string} rootDir - Root directory to resolve from if needed
 * @returns {string} Absolute path to the target directory
 */
function resolveTargetDir(targetDirInput, rootDir) {
  // Default to current directory if not specified
  const inputPath = targetDirInput || '.';
  debug(`Initial target directory: ${inputPath}`);

  // Handle paths that might be relative to monorepo root
  if (inputPath.startsWith('./packages/core') && process.cwd().includes('/packages/core')) {
    const adjusted = inputPath.replace('./packages/core', '.');
    debug(`Adjusted path from: ${inputPath} to: ${adjusted}`);
    return path.resolve(process.cwd(), adjusted);
  }

  // Resolve to absolute path
  const absolutePath = path.resolve(rootDir || process.cwd(), inputPath);
  debug(`Resolved absolute path: ${absolutePath}`);
  return absolutePath;
}

// Determine the monorepo root dynamically
const monorepoRoot = findMonorepoRoot(__dirname);
if (!monorepoRoot) {
  console.error(
    `${colors.red}Error: Could not find monorepo root (pnpm-workspace.yaml).${colors.reset}`
  );
  process.exit(1);
}
debug(`Found monorepo root: ${monorepoRoot}`);

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bold}${colors.cyan}Transaction Form Export CLI${colors.reset}

A utility for exporting, building, and testing transaction forms.

${colors.bold}Usage:${colors.reset}
  export-form [command] [options]

${colors.bold}Commands:${colors.reset}
  export       Export a form with specified configuration
  build        Build an exported form
  serve        Start a local server to test an exported form
  verify       Verify form functionality

${colors.bold}Options:${colors.reset}
  --help, -h                 Show this help information
  --chain, -c [type]         Chain type (evm, solana, stellar) (default: evm)
  --func, -f [name]          Function name (default: transfer)
  --output, -o [name]        Subdirectory name within ./exports (default: transfer-form)
  --adapters, -a [boolean]   Include blockchain adapters (default: true)
  --template, -t [name]      Template to use (default: typescript-react-vite)
  --complex, -x              Use complex form with multiple fields
  --verbose, -v              Enable verbose output
  --env, -e [env]            Target environment: 'local' or 'production' (default: local)

${colors.bold}Examples:${colors.reset}
  export-form export                                  # Export basic EVM transfer form
  export-form export -c solana -f stake -o stake-form # Export Solana staking form
  export-form export --env production -o prod-form    # Export form for production use
  export-form build ./exports/transfer-form           # Build exported form
  export-form serve ./exports/transfer-form           # Run exported form locally
  export-form export -x                               # Export complex form
`);
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {
    chain: 'evm',
    func: 'transfer',
    output: './exports',
    adapters: true,
    template: 'typescript-react-vite',
    complex: false,
    verbose: false,
    env: 'local',
  };

  // Check for help flag as direct argument
  if (args.length === 0 || command === '--help' || command === '-h' || command === 'help') {
    showHelp();
    process.exit(0);
  }

  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--chain' || arg === '-c') {
      options.chain = args[++i];
    } else if (arg === '--func' || arg === '-f') {
      options.func = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      // Force all exports to be in the ./exports parent directory
      const requestedOutput = args[++i];
      // Extract just the final directory name if a path is provided
      const dirName = path.basename(requestedOutput);
      // Construct a path within ./exports
      options.output = path.join('./exports', dirName);
    } else if (arg === '--adapters' || arg === '-a') {
      options.adapters = args[++i] !== 'false';
    } else if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--complex' || arg === '-x') {
      options.complex = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--env' || arg === '-e') {
      options.env = args[++i];
    } else if (!arg.startsWith('-')) {
      options.targetDir = arg;
    }
  }

  // If verbose flag is set, enable debug output
  if (options.verbose) {
    process.env.DEBUG = 'true';
    debug('Verbose mode enabled');
  }

  return { command, options };
}

/**
 * Execute a command in a directory
 */
function execInDir(command, dir, stdio = 'inherit') {
  console.log(`${colors.dim}Executing in ${dir}:${colors.reset} ${command}`);
  try {
    return execSync(command, { cwd: dir, stdio, shell: true });
  } catch (error) {
    console.error(`${colors.red}Command failed:${colors.reset} ${command}`);
    if (error.stdout)
      console.error(`${colors.yellow}stdout:${colors.reset} ${error.stdout.toString()}`);
    if (error.stderr)
      console.error(`${colors.red}stderr:${colors.reset} ${error.stderr.toString()}`);
    throw error;
  }
}

/**
 * Export a form using a direct approach that executes tests
 */
function exportFormSimple(options) {
  try {
    console.log(`\n${colors.bold}${colors.cyan}Exporting Transaction Form${colors.reset}\n`);

    // Get user's current directory for resolving output path
    const userCurrentDir = process.cwd();

    // Create absolute output directory path relative to user's CWD
    const outputDir = path.resolve(userCurrentDir, options.output);
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`${colors.green}Using configuration:${colors.reset}`);
    console.log(`  Chain Type:      ${colors.blue}${options.chain}${colors.reset}`);
    console.log(`  Function:        ${colors.blue}${options.func}${colors.reset}`);
    console.log(`  Template:        ${colors.blue}${options.template}${colors.reset}`);
    console.log(
      `  Include Adapters: ${options.adapters ? colors.green + 'Yes' : colors.yellow + 'No'}${colors.reset}`
    );
    console.log(
      `  Form Complexity: ${options.complex ? colors.blue + 'Complex' : colors.blue + 'Simple'}${colors.reset}`
    );
    console.log(`  Output Directory: ${colors.blue}${outputDir}${colors.reset}`);
    console.log(`  Environment:      ${colors.blue}${options.env}${colors.reset}\n`);

    // Create the test environment variables
    const env = {
      EXPORT_TEST_CHAIN: options.chain,
      EXPORT_TEST_FUNCTION: options.func,
      EXPORT_TEST_TEMPLATE: options.template,
      EXPORT_TEST_INCLUDE_ADAPTERS: options.adapters.toString(),
      EXPORT_TEST_COMPLEX: options.complex.toString(),
      EXPORT_TEST_OUTPUT_DIR: outputDir,
      EXPORT_CLI_MODE: 'true', // Mark as running from CLI to prevent cleanup
      EXPORT_CLI_ENV: options.env, // Pass environment setting to control dependency handling
      ...process.env,
    };

    // Run a simplified export test directly
    console.log(`${colors.blue}Generating export...${colors.reset}\n`);

    // Determine paths relative to the monorepo root
    const corePackageDir = path.join(monorepoRoot, 'packages/core');
    const testPath = path.join(corePackageDir, 'src/export/__tests__/export-cli-wrapper.test.ts');

    debug(`Monorepo root: ${monorepoRoot}`);
    debug(`Core package dir: ${corePackageDir}`);
    debug(`Test path: ${testPath}`);

    // Define the Vitest command - explicitly use the CLI export config
    const configFilePath = path.join(corePackageDir, 'vitest.config.cli-export.ts');
    const testFileRelativePath = path.relative(corePackageDir, testPath);
    const vitestCommand = `npx vitest run --config ${configFilePath} ${testFileRelativePath} --silent`;

    try {
      console.log(`\n${colors.blue}Running export test via Vitest...${colors.reset}`);
      debug(`Executing in ${corePackageDir}: ${vitestCommand}`);

      // Set environment variables for the Vitest process
      const testEnv = { ...process.env, ...env };

      execSync(vitestCommand, {
        cwd: corePackageDir, // Run vitest from the core package directory
        env: testEnv,
        stdio: 'inherit',
        shell: true,
      });

      console.log(`\n${colors.green}✓ Export successful!${colors.reset}`);
      console.log(`Project exported to: ${colors.cyan}${outputDir}${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.red}Export test failed:${colors.reset}`);
      // Error details are usually printed by execSync with stdio: 'inherit'
      process.exit(1);
    }

    // Find the zip file
    const zipFiles = fs.readdirSync(outputDir).filter((file) => file.endsWith('.zip'));
    if (zipFiles.length === 0) {
      console.error(`${colors.red}Error: No ZIP file found in output directory${colors.reset}`);
      return;
    }

    const zipFile = zipFiles[0];
    const zipPath = path.join(outputDir, zipFile);
    const extractDir = path.join(outputDir, zipFile.replace('.zip', ''));

    // Extract the zip file
    console.log(`${colors.blue}Extracting to ${extractDir}...${colors.reset}`);
    fs.mkdirSync(extractDir, { recursive: true });

    // Try to use unzip if available
    try {
      execInDir(`unzip -q -o "${zipPath}" -d "${extractDir}"`, userCurrentDir);
    } catch (error) {
      // Fallback to manual extraction message
      console.log(`${colors.yellow}Could not extract automatically.${colors.reset}`);
      console.log(`${colors.yellow}Please manually extract:${colors.reset} ${zipPath}`);
    }

    console.log(`\n${colors.green}✓ Files extracted to:${colors.reset} ${extractDir}`);
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log(
      `  ${colors.bold}Build the project:${colors.reset} export-form build ${extractDir}`
    );
    console.log(
      `  ${colors.bold}Serve the project:${colors.reset} export-form serve ${extractDir}\n`
    );

    // --- Automatically configure the project for local development ---
    if (options.env === 'local') {
      console.log(`\n${colors.blue}Configuring for local development...${colors.reset}`);
      try {
        // 1. Configure package.json with overrides
        const packageJsonPath = path.join(extractDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const packageOverrides = {
          '@openzeppelin/transaction-form-adapter-evm': `file:${path.join(monorepoRoot, 'packages/adapter-evm')}`,
          '@openzeppelin/transaction-form-adapter-solana': `file:${path.join(monorepoRoot, 'packages/adapter-solana')}`,
          '@openzeppelin/transaction-form-adapter-stellar': `file:${path.join(monorepoRoot, 'packages/adapter-stellar')}`,
          '@openzeppelin/transaction-form-adapter-midnight': `file:${path.join(monorepoRoot, 'packages/adapter-midnight')}`,
          '@openzeppelin/transaction-form-renderer': `file:${path.join(monorepoRoot, 'packages/form-renderer')}`,
          '@openzeppelin/transaction-form-react-core': `file:${path.join(monorepoRoot, 'packages/react-core')}`,
          '@openzeppelin/transaction-form-types': `file:${path.join(monorepoRoot, 'packages/types')}`,
          '@openzeppelin/transaction-form-ui': `file:${path.join(monorepoRoot, 'packages/ui')}`,
          '@openzeppelin/transaction-form-utils': `file:${path.join(monorepoRoot, 'packages/utils')}`,
          '@openzeppelin/tailwind-config': `file:${path.join(monorepoRoot, 'packages/tailwind-config')}`,
        };

        packageJson.pnpm = {
          ...(packageJson.pnpm || {}),
          overrides: {
            ...(packageJson.pnpm?.overrides || {}),
            ...packageOverrides,
          },
        };
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(
          `${colors.green}✓ package.json configured with local overrides.${colors.reset}`
        );

        // 2. Configure vite.config.ts for the EVM hanging issue
        const viteConfigPath = path.join(extractDir, 'vite.config.ts');
        if (fs.existsSync(viteConfigPath)) {
          let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
          const optimizeDepsString = `
  optimizeDeps: {
    include: ['@openzeppelin/transaction-form-adapter-evm'],
  },`;
          if (!viteConfig.includes('optimizeDeps')) {
            viteConfig = viteConfig.replace(/(\s*plugins:.*,)/, `$1\n${optimizeDepsString}`);
            fs.writeFileSync(viteConfigPath, viteConfig);
            console.log(
              `${colors.green}✓ vite.config.ts configured for EVM adapter.${colors.reset}`
            );
          }
        }
      } catch (error) {
        console.error(
          `${colors.red}Failed to configure project for local development:${colors.reset}`,
          error
        );
      }
    }

    // --- Move project to a temporary directory for isolated testing if in local env ---
    if (options.env === 'local') {
      const tempDir = path.join(os.homedir(), 'transfer-form-test');
      console.log(
        `\n${colors.blue}Moving project to a test directory for isolated testing...${colors.reset}`
      );
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.renameSync(extractDir, tempDir);
        console.log(`${colors.green}✓ Project moved to:${colors.reset} ${tempDir}`);
        console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
        console.log(`  1. cd ${tempDir}`);
        console.log(`  2. pnpm install`);
        console.log(`  3. pnpm dev`);
      } catch (error) {
        console.error(
          `${colors.red}Failed to move project to temporary directory:${colors.reset}`,
          error
        );
        console.log(
          `${colors.yellow}You may need to manually move the directory:${colors.reset} ${extractDir}`
        );
      }
    } else {
      console.log(`\n${colors.green}✓ Files extracted to:${colors.reset} ${extractDir}`);
      console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
      console.log(`  Build the project: export-form build ${extractDir}`);
      console.log(`  Serve the project: export-form serve ${extractDir}`);
    }

    return extractDir;
  } catch (error) {
    console.error(`\n${colors.red}An unexpected error occurred:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Build an exported form
 */
function buildExportedForm(options) {
  // Use the shared target directory resolver
  const targetDir = resolveTargetDir(options.targetDir || '.', process.cwd());

  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
    console.error(`${colors.red}Error:${colors.reset} Not a valid project directory: ${targetDir}`);
    process.exit(1);
  }

  try {
    console.log(`\n${colors.bold}${colors.cyan}Building Transaction Form${colors.reset}\n`);

    // Check for vite.config.ts
    if (fs.existsSync(path.join(targetDir, 'vite.config.ts'))) {
      console.log(`${colors.green}✓ vite.config.ts found${colors.reset}`);
    } else {
      console.error(`${colors.red}Error: vite.config.ts not found${colors.reset}`);
      process.exit(1);
    }

    // Check for workspace dependencies
    let hasWorkspaceDeps = false;
    let isProductionBuild = false;
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
      const deps = packageJson.dependencies || {};

      // Check if there are any workspace dependencies
      Object.entries(deps).forEach(([name, version]) => {
        if (typeof version === 'string' && version.startsWith('workspace:')) {
          hasWorkspaceDeps = true;
          debug(`Workspace dependency: ${name}@${version}`);
        } else if (name.startsWith('@openzeppelin/') && version === 'latest') {
          isProductionBuild = true;
          debug(`Production dependency: ${name}@${version}`);
        }
      });

      // Check if the Tailwind configuration is using Tailwind v4 format
      const hasTailwind =
        fs.existsSync(path.join(targetDir, 'tailwind.config.js')) ||
        fs.existsSync(path.join(targetDir, 'tailwind.config.cjs'));

      if (hasTailwind) {
        console.log(`${colors.green}✓ Tailwind configuration found${colors.reset}`);
        debug('Generated project uses Tailwind CSS. Ensure it has v4 compatible configuration.');
      }

      if (hasWorkspaceDeps) {
        console.log(`\n${colors.yellow}This project uses workspace dependencies.${colors.reset}`);
        console.log(`These will be resolved from your local monorepo when you run the dev server.`);
        console.log(`\n${colors.green}✓ Ready for local development${colors.reset}`);
      } else if (isProductionBuild) {
        console.log(`\n${colors.yellow}This project uses production dependencies.${colors.reset}`);
        console.log(`These will be fetched from npm registries when building.`);
        console.log(`\n${colors.green}✓ Ready for production build${colors.reset}`);
      }
    } catch (error) {
      console.warn(
        `${colors.yellow}Warning:${colors.reset} Could not parse package.json: ${error.message}`
      );
    }

    // For running in the CLI context, we'll just validate the setup
    console.log(`\n${colors.cyan}Next step:${colors.reset}`);
    console.log(
      `  ${colors.bold}Serve the project:${colors.reset} export-form serve ${targetDir}\n`
    );

    if (hasWorkspaceDeps) {
      console.log(
        `${colors.yellow}To manually develop with workspace dependencies:${colors.reset}`
      );
      console.log(`  1. cd ${targetDir}`);
      console.log(`  2. pnpm install`);
      console.log(`  3. pnpm dev`);
    } else if (isProductionBuild) {
      console.log(`${colors.yellow}To manually build for production:${colors.reset}`);
      console.log(`  1. cd ${targetDir}`);
      console.log(`  2. npm install --legacy-peer-deps`);
      console.log(`  3. npm run build`);
    } else {
      console.log(`${colors.yellow}To manually build:${colors.reset}`);
      console.log(`  1. cd ${targetDir}`);
      console.log(`  2. npm install --legacy-peer-deps`);
      console.log(`  3. npm run build`);
    }
  } catch (error) {
    console.error(`\n${colors.red}Build failed${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Serve an exported form for testing
 */
function serveExportedForm(options) {
  console.log(`\n${colors.cyan}Starting server for exported form...${colors.reset}`);

  // Find the monorepo root reliably
  const monorepoRoot = findMonorepoRoot(__dirname);
  if (!monorepoRoot) {
    console.error(
      `${colors.red}Error: Could not find monorepo root (pnpm-workspace.yaml).${colors.reset}`
    );
    process.exit(1);
  }
  debug(`Found monorepo root: ${monorepoRoot}`);

  // Use the shared target directory resolver
  const targetDir = resolveTargetDir(options.targetDir || '.', monorepoRoot);
  debug(`Resolved target directory: ${targetDir}`);

  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
    console.error(
      `${colors.red}Error:${colors.reset} Not a valid project directory (missing package.json): ${targetDir}`
    );
    process.exit(1);
  }

  try {
    console.log(`\n${colors.bold}${colors.cyan}Serving Transaction Form${colors.reset}\n`);

    // Check for key files
    const requiredFiles = [
      'vite.config.ts',
      'package.json',
      'index.html',
      'src/App.tsx',
      'src/components/GeneratedForm.tsx',
      'src/main.tsx',
    ];

    const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(targetDir, file)));

    if (missingFiles.length > 0) {
      console.error(`${colors.red}Missing required files:${colors.reset}`);
      missingFiles.forEach((file) => console.error(`  - ${file}`));
      process.exit(1);
    }

    console.log(`${colors.green}✓ All required files present${colors.reset}`);

    // Check for workspace dependencies and environment type
    let hasWorkspaceDeps = false;
    let isProductionBuild = false;
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));
      const deps = packageJson.dependencies || {};
      debug(`Dependencies found in package.json`);

      // Check if there are any workspace dependencies
      Object.entries(deps).forEach(([name, version]) => {
        if (typeof version === 'string' && version.startsWith('workspace:')) {
          hasWorkspaceDeps = true;
          debug(`Found workspace dependency: ${name}@${version}`);
        } else if (name.startsWith('@openzeppelin/') && version === 'latest') {
          isProductionBuild = true;
          debug(`Found potential production dependency: ${name}@${version}`);
        }
      });

      if (hasWorkspaceDeps) {
        console.log(`\n${colors.yellow}This project uses workspace dependencies.${colors.reset}`);
        console.log(`These will be resolved from your local monorepo when using pnpm.`);
      } else if (isProductionBuild) {
        console.log(`\n${colors.yellow}This project uses production dependencies.${colors.reset}`);
        console.log(`Dependencies will be fetched from npm registries.`);
      } else {
        console.log(
          `\n${colors.yellow}This project uses standard npm dependencies.${colors.reset}`
        );
      }
    } catch (error) {
      console.warn(
        `${colors.yellow}Warning:${colors.reset} Could not parse package.json: ${error.message}`
      );
    }

    // Add check for Tailwind v4 configuration
    const tailwindConfig = path.join(targetDir, 'tailwind.config.js');
    const tailwindConfigCjs = path.join(targetDir, 'tailwind.config.cjs');

    if (fs.existsSync(tailwindConfig) || fs.existsSync(tailwindConfigCjs)) {
      console.log(`${colors.green}✓ Tailwind configuration found${colors.reset}`);
      // Could add more detailed verification of Tailwind v4 format here
    }

    // Recommend appropriate steps based on the dependency type
    if (hasWorkspaceDeps) {
      console.log(
        `\n${colors.green}Attempting to launch development server with workspace dependencies...${colors.reset}`
      );
      try {
        // Use pnpm to start the dev server with monorepo context
        console.log(`${colors.blue}Running 'pnpm install' in ${targetDir}...${colors.reset}`);
        execInDir('pnpm install', targetDir);
        console.log(`${colors.blue}Running 'pnpm dev' in ${targetDir}...${colors.reset}`);
        execInDir('pnpm dev', targetDir); // This command will block if successful
      } catch (error) {
        console.error(`\n${colors.red}Server failed to start automatically:${colors.reset}`);
        // Log more details from the error object
        if (error.stdout)
          console.error(`${colors.yellow}stdout:${colors.reset} ${error.stdout.toString()}`);
        if (error.stderr)
          console.error(`${colors.red}stderr:${colors.reset} ${error.stderr.toString()}`);

        console.log(`\n${colors.yellow}Please try running manually:${colors.reset}`);
        console.log(`  1. cd ${targetDir}`);
        console.log(`  2. pnpm install`);
        console.log(`  3. pnpm dev`);
        process.exit(1); // Exit if auto-start fails
      }
    } else if (isProductionBuild) {
      console.log(
        `\n${colors.yellow}Detected production dependencies. Start the server manually:${colors.reset}`
      );
      console.log(`  1. cd ${targetDir}`);
      console.log(`  2. npm install --legacy-peer-deps`); // or pnpm install if pnpm is preferred
      console.log(`  3. npm run dev`); // or pnpm dev

      console.log(`\n${colors.yellow}To build for production:${colors.reset}`);
      console.log(`  1. cd ${targetDir}`);
      console.log(`  2. npm install --legacy-peer-deps`); // or pnpm install
      console.log(`  3. npm run build`); // or pnpm build
    } else {
      console.log(
        `\n${colors.yellow}Detected standard npm dependencies. Start the server manually:${colors.reset}`
      );
      console.log(`  1. cd ${targetDir}`);
      console.log(`  2. npm install --legacy-peer-deps`); // or pnpm install
      console.log(`  3. npm run dev`); // or pnpm dev
    }
  } catch (error) {
    console.error(`\n${colors.red}An error occurred in the serve command:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Verify an exported form
 */
function verifyExportedForm(options) {
  // Use the shared target directory resolver
  const targetDir = resolveTargetDir(options.targetDir || '.', process.cwd());

  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
    console.error(`${colors.red}Error:${colors.reset} Not a valid project directory: ${targetDir}`);
    process.exit(1);
  }

  try {
    console.log(`\n${colors.bold}${colors.cyan}Verifying Transaction Form${colors.reset}\n`);
    console.log(`${colors.blue}Running tests for:${colors.reset} ${targetDir}`);

    // Install dependencies if needed
    if (!fs.existsSync(path.join(targetDir, 'node_modules'))) {
      console.log(`${colors.yellow}Installing dependencies first...${colors.reset}`);
      execInDir('npm install', targetDir);
    }

    // Run tests
    execInDir('npm test', targetDir);

    console.log(`\n${colors.green}✓ Tests passed successfully${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Verification failed${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Main CLI execution
 */
function main() {
  const { command, options } = parseArgs();

  // Show help if requested for a specific command
  if (options.help) {
    showHelp();
    return;
  }

  // Execute command
  switch (command) {
    case 'export':
      exportFormSimple(options);
      break;

    case 'build':
      buildExportedForm(options);
      break;

    case 'serve':
      serveExportedForm(options);
      break;

    case 'verify':
      verifyExportedForm(options);
      break;

    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      showHelp();
      process.exit(1);
  }
}

// Run the main function
main();
