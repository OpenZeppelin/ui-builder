#!/usr/bin/env node

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

function debug(message) {
  if (DEBUG) console.log(`${colors.cyan}[Debug] ${message}${colors.reset}`);
}

function findMonorepoRoot(startDir) {
  let currentDir = startDir;
  while (true) {
    const markerPath = path.join(currentDir, 'pnpm-workspace.yaml');
    if (fs.existsSync(markerPath)) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

function resolveTargetDir(targetDirInput, rootDir) {
  const inputPath = targetDirInput || '.';
  debug(`Initial target directory: ${inputPath}`);
  if (inputPath.startsWith('./packages/builder') && process.cwd().includes('/packages/builder')) {
    const adjusted = inputPath.replace('./packages/builder', '.');
    debug(`Adjusted path from: ${inputPath} to: ${adjusted}`);
    return path.resolve(process.cwd(), adjusted);
  }
  const absolutePath = path.resolve(rootDir || process.cwd(), inputPath);
  debug(`Resolved absolute path: ${absolutePath}`);
  return absolutePath;
}

const monorepoRoot = findMonorepoRoot(__dirname);
if (!monorepoRoot) {
  console.error(
    `${colors.red}Error: Could not find monorepo root (pnpm-workspace.yaml).${colors.reset}`
  );
  process.exit(1);
}
debug(`Found monorepo root: ${monorepoRoot}`);

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
  export-form export
  export-form export -c solana -f stake -o stake-form
  export-form export --env production -o prod-form
  export-form build ./exports/transfer-form
  export-form serve ./exports/transfer-form
  export-form export -x
`);
}

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

  if (args.length === 0 || command === '--help' || command === '-h' || command === 'help') {
    showHelp();
    process.exit(0);
  }

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--chain' || arg === '-c') {
      options.chain = args[++i];
    } else if (arg === '--func' || arg === '-f') {
      options.func = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      const requestedOutput = args[++i];
      const dirName = path.basename(requestedOutput);
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

  if (options.verbose) {
    process.env.DEBUG = 'true';
    debug('Verbose mode enabled');
  }

  return { command, options };
}

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

function exportFormSimple(options) {
  try {
    console.log(`\n${colors.bold}${colors.cyan}Exporting Transaction Form${colors.reset}\n`);
    const userCurrentDir = process.cwd();
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

    const env = {
      EXPORT_TEST_CHAIN: options.chain,
      EXPORT_TEST_FUNCTION: options.func,
      EXPORT_TEST_TEMPLATE: options.template,
      EXPORT_TEST_INCLUDE_ADAPTERS: options.adapters.toString(),
      EXPORT_TEST_COMPLEX: options.complex.toString(),
      EXPORT_TEST_OUTPUT_DIR: outputDir,
      EXPORT_CLI_MODE: 'true',
      EXPORT_CLI_ENV: options.env,
      ...process.env,
    };

    console.log(`${colors.blue}Generating export...${colors.reset}\n`);
    const builderPackageDir = path.join(monorepoRoot, 'packages/builder');
    const testPath = path.join(
      builderPackageDir,
      'src/export/__tests__/export-cli-wrapper.test.ts'
    );
    debug(`Monorepo root: ${monorepoRoot}`);
    debug(`Builder package dir: ${builderPackageDir}`);
    debug(`Test path: ${testPath}`);

    const configFilePath = path.join(builderPackageDir, 'vitest.config.cli-export.ts');
    const testFileRelativePath = path.relative(builderPackageDir, testPath);
    const vitestCommand = `npx vitest run --config ${configFilePath} ${testFileRelativePath} --silent`;

    try {
      console.log(`\n${colors.blue}Running export test via Vitest...${colors.reset}`);
      debug(`Executing in ${builderPackageDir}: ${vitestCommand}`);
      const testEnv = { ...process.env, ...env };
      execSync(vitestCommand, {
        cwd: builderPackageDir,
        env: testEnv,
        stdio: 'inherit',
        shell: true,
      });
      console.log(`\n${colors.green}✓ Export successful!${colors.reset}`);
      console.log(`Project exported to: ${colors.cyan}${outputDir}${colors.reset}`);
    } catch (error) {
      console.error(`\n${colors.red}Export test failed:${colors.reset}`);
      process.exit(1);
    }

    const zipFiles = fs.readdirSync(outputDir).filter((file) => file.endsWith('.zip'));
    if (zipFiles.length === 0) {
      console.error(`${colors.red}Error: No ZIP file found in output directory${colors.reset}`);
      return;
    }

    const zipFile = zipFiles[0];
    const zipPath = path.join(outputDir, zipFile);
    const extractDir = path.join(outputDir, zipFile.replace('.zip', ''));
    console.log(`${colors.blue}Extracting to ${extractDir}...${colors.reset}`);
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      execInDir(`unzip -q -o "${zipPath}" -d "${extractDir}"`, userCurrentDir);
    } catch (error) {
      console.log(`${colors.yellow}Could not extract automatically.${colors.reset}`);
      console.log(`${colors.yellow}Please manually extract:${colors.reset} ${zipPath}`);
    }

    if (options.env === 'local') {
      console.log(`\n${colors.blue}Configuring for local development...${colors.reset}`);
      try {
        const packageJsonPath = path.join(extractDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const packageOverrides = {
          '@openzeppelin/transaction-form-adapter-evm': `file:${path.join(monorepoRoot, 'packages/adapter-evm')}`,
          '@openzeppelin/transaction-form-adapter-solana': `file:${path.join(monorepoRoot, 'packages/adapter-solana')}`,
          '@openzeppelin/transaction-form-adapter-stellar': `file:${path.join(monorepoRoot, 'packages/adapter-stellar')}`,
          '@openzeppelin/transaction-form-adapter-midnight': `file:${path.join(monorepoRoot, 'packages/adapter-midnight')}`,
          '@openzeppelin/contracts-ui-builder-renderer': `file:${path.join(monorepoRoot, 'packages/renderer')}`,
          '@openzeppelin/transaction-form-react-core': `file:${path.join(monorepoRoot, 'packages/react-core')}`,
          '@openzeppelin/transaction-form-types': `file:${path.join(monorepoRoot, 'packages/types')}`,
          '@openzeppelin/contracts-ui-builder-ui': `file:${path.join(monorepoRoot, 'packages/ui')}`,
          '@openzeppelin/transaction-form-utils': `file:${path.join(monorepoRoot, 'packages/utils')}`,
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
      } catch (error) {
        console.error(
          `${colors.red}Failed to configure project for local development:${colors.reset}`,
          error
        );
      }
    }

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

function buildExportedForm(options) {
  const targetDir = resolveTargetDir(options.targetDir || '.', process.cwd());
  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  try {
    console.log(`\n${colors.bold}${colors.cyan}Building Transaction Form${colors.reset}\n`);
    console.log(`${colors.blue}Running 'pnpm install' in ${targetDir}...${colors.reset}`);
    execInDir('pnpm install', targetDir);
    console.log(`${colors.blue}Running 'pnpm build' in ${targetDir}...${colors.reset}`);
    execInDir('pnpm build', targetDir);
    console.log(`\n${colors.green}✓ Build successful!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Build failed${colors.reset}`);
    process.exit(1);
  }
}

function serveExportedForm(options) {
  const targetDir = resolveTargetDir(options.targetDir || '.', monorepoRoot);
  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  try {
    console.log(`\n${colors.bold}${colors.cyan}Serving Transaction Form${colors.reset}\n`);
    console.log(`${colors.blue}Running 'pnpm install' in ${targetDir}...${colors.reset}`);
    execInDir('pnpm install', targetDir);
    console.log(`${colors.blue}Running 'pnpm dev' in ${targetDir}...${colors.reset}`);
    execInDir('pnpm dev', targetDir);
  } catch (error) {
    console.error(`${colors.red}Failed to start server:${colors.reset}`, error);
    process.exit(1);
  }
}

function verifyExportedForm(options) {
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
    if (!fs.existsSync(path.join(targetDir, 'node_modules'))) {
      console.log(`${colors.yellow}Installing dependencies first...${colors.reset}`);
      execInDir('npm install', targetDir);
    }
    execInDir('npm test', targetDir);
    console.log(`\n${colors.green}✓ Tests passed successfully${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Verification failed${colors.reset}`);
    process.exit(1);
  }
}

function main() {
  const { command, options } = parseArgs();
  if (options.help) {
    showHelp();
    return;
  }
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

main();
