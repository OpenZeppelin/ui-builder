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
 *   --output, -o [dir]         Output directory (default: ./exports)
 *   --adapters, -a [boolean]   Include blockchain adapters (default: true)
 *   --template, -t [name]      Template to use (default: typescript-react-vite)
 *   --complex, -x              Use complex form with multiple fields
 *   --verbose, -v              Enable verbose output
 *
 * Examples:
 *   export-form export                                  # Export basic EVM transfer form
 *   export-form export -c solana -f stake -o ./my-form  # Export Solana staking form
 *   export-form build ./exports/transfer-form           # Build exported form
 *   export-form serve ./exports/transfer-form           # Run exported form locally
 *   export-form export -x                               # Export complex form
 *
 * @module export-form
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
  --output, -o [dir]         Output directory (default: ./exports)
  --adapters, -a [boolean]   Include blockchain adapters (default: true)
  --template, -t [name]      Template to use (default: typescript-react-vite)
  --complex, -x              Use complex form with multiple fields
  --verbose, -v              Enable verbose output

${colors.bold}Examples:${colors.reset}
  export-form export                                  # Export basic EVM transfer form
  export-form export -c solana -f stake -o ./my-form  # Export Solana staking form
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
      options.output = args[++i];
    } else if (arg === '--adapters' || arg === '-a') {
      options.adapters = args[++i] !== 'false';
    } else if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--complex' || arg === '-x') {
      options.complex = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg.startsWith('-')) {
      options.targetDir = arg;
    }
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

    // Get current directory
    const currentDir = process.cwd();

    // Create absolute output directory path
    const outputDir = path.resolve(currentDir, options.output);
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
    console.log(`  Output Directory: ${colors.blue}${outputDir}${colors.reset}\n`);

    // Create the test environment variables
    const env = {
      EXPORT_TEST_CHAIN: options.chain,
      EXPORT_TEST_FUNCTION: options.func,
      EXPORT_TEST_TEMPLATE: options.template,
      EXPORT_TEST_INCLUDE_ADAPTERS: options.adapters.toString(),
      EXPORT_TEST_COMPLEX: options.complex.toString(),
      EXPORT_TEST_OUTPUT_DIR: outputDir,
      EXPORT_CLI_MODE: 'true', // Mark as running from CLI to prevent cleanup
      ...process.env,
    };

    // Run a simplified export test directly
    console.log(`${colors.blue}Generating export...${colors.reset}\n`);
    const command = 'npx vitest run src/export/__tests__/export-cli-wrapper.test.ts --silent';

    try {
      execSync(command, { cwd: currentDir, env, stdio: 'inherit', shell: true });
    } catch (error) {
      console.error(`${colors.red}Export failed:${colors.reset}`, error.message);
      process.exit(1);
    }

    console.log(`\n${colors.green}✓ Export completed${colors.reset}\n`);

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
      execInDir(`unzip -q -o "${zipPath}" -d "${extractDir}"`, currentDir);
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

    return extractDir;
  } catch (error) {
    console.error(`\n${colors.red}Export failed:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Build an exported form
 */
function buildExportedForm(options) {
  // Get absolute path of target directory
  const currentDir = process.cwd();
  // Handle paths correctly when run from package.json scripts
  let targetDir = options.targetDir || '.';

  // If the path starts with a relative path that includes 'packages/core',
  // it might be relative to the project root rather than the current directory
  if (targetDir.startsWith('./packages/core') && currentDir.includes('/packages/core')) {
    // Extract the part after packages/core and make it relative to the current directory
    targetDir = targetDir.replace('./packages/core', '.');
  }

  // Resolve to absolute path
  targetDir = path.resolve(currentDir, targetDir);

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
    console.log(`${colors.blue}Installing dependencies in:${colors.reset} ${targetDir}`);

    // Install dependencies
    execInDir('npm install', targetDir);

    console.log(`\n${colors.blue}Building project...${colors.reset}`);

    // Build the project
    execInDir('npm run build', targetDir);

    console.log(`\n${colors.green}✓ Build completed successfully${colors.reset}`);
    console.log(`\n${colors.cyan}Next step:${colors.reset}`);
    console.log(
      `  ${colors.bold}Serve the project:${colors.reset} export-form serve ${targetDir}\n`
    );
  } catch (error) {
    console.error(`\n${colors.red}Build failed${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Serve an exported form for testing
 */
function serveExportedForm(options) {
  // Get absolute path of target directory
  const currentDir = process.cwd();
  // Handle paths correctly when run from package.json scripts
  let targetDir = options.targetDir || '.';

  // If the path starts with a relative path that includes 'packages/core',
  // it might be relative to the project root rather than the current directory
  if (targetDir.startsWith('./packages/core') && currentDir.includes('/packages/core')) {
    // Extract the part after packages/core and make it relative to the current directory
    targetDir = targetDir.replace('./packages/core', '.');
  }

  // Resolve to absolute path
  targetDir = path.resolve(currentDir, targetDir);

  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
    console.error(`${colors.red}Error:${colors.reset} Not a valid project directory: ${targetDir}`);
    process.exit(1);
  }

  try {
    console.log(`\n${colors.bold}${colors.cyan}Serving Transaction Form${colors.reset}\n`);
    console.log(`${colors.blue}Starting development server for:${colors.reset} ${targetDir}`);

    // Install dependencies if needed
    if (!fs.existsSync(path.join(targetDir, 'node_modules'))) {
      console.log(`${colors.yellow}Installing dependencies first...${colors.reset}`);
      execInDir('npm install', targetDir);
    }

    // Serve the project
    execInDir('npm run dev', targetDir);
  } catch (error) {
    console.error(`\n${colors.red}Server failed${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Verify an exported form
 */
function verifyExportedForm(options) {
  // Get absolute path of target directory
  const currentDir = process.cwd();
  // Handle paths correctly when run from package.json scripts
  let targetDir = options.targetDir || '.';

  // If the path starts with a relative path that includes 'packages/core',
  // it might be relative to the project root rather than the current directory
  if (targetDir.startsWith('./packages/core') && currentDir.includes('/packages/core')) {
    // Extract the part after packages/core and make it relative to the current directory
    targetDir = targetDir.replace('./packages/core', '.');
  }

  // Resolve to absolute path
  targetDir = path.resolve(currentDir, targetDir);

  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  try {
    console.log(`\n${colors.bold}${colors.cyan}Verifying Transaction Form${colors.reset}\n`);

    // Check for key files
    const requiredFiles = [
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
      return false;
    }

    console.log(`${colors.green}✓ All required files present${colors.reset}`);

    // Check package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf8'));

    if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
      console.error(`${colors.red}No dependencies found in package.json${colors.reset}`);
      return false;
    }

    console.log(
      `${colors.green}✓ Dependencies verified (${Object.keys(packageJson.dependencies).length} found)${colors.reset}`
    );

    // Check for adapter files if applicable
    if (options.adapters !== false) {
      const adapterFiles = fs.existsSync(path.join(targetDir, 'src/adapters'))
        ? fs.readdirSync(path.join(targetDir, 'src/adapters'))
        : [];

      if (adapterFiles.length === 0) {
        console.warn(`${colors.yellow}Warning: No adapter files found${colors.reset}`);
      } else {
        console.log(
          `${colors.green}✓ Adapter files verified (${adapterFiles.length} found)${colors.reset}`
        );
      }
    }

    // Verify GeneratedForm.tsx
    const formContent = fs.readFileSync(
      path.join(targetDir, 'src/components/GeneratedForm.tsx'),
      'utf8'
    );

    if (!formContent.includes('import') || !formContent.includes('React')) {
      console.warn(
        `${colors.yellow}Warning: GeneratedForm.tsx may not include proper React imports${colors.reset}`
      );
    } else {
      console.log(`${colors.green}✓ GeneratedForm.tsx imports verified${colors.reset}`);
    }

    if (!formContent.includes('export') || !formContent.includes('function')) {
      console.warn(
        `${colors.yellow}Warning: GeneratedForm.tsx may not export a component${colors.reset}`
      );
    } else {
      console.log(`${colors.green}✓ GeneratedForm.tsx exports verified${colors.reset}`);
    }

    console.log(`\n${colors.green}Verification completed successfully${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}Verification failed:${colors.reset}`, error);
    return false;
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
