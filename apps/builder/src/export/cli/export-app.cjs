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
  if (inputPath.startsWith('./apps/builder') && process.cwd().includes('/apps/builder')) {
    const adjusted = inputPath.replace('./apps/builder', '.');
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
${colors.bold}${colors.cyan}UI Builder Export CLI${colors.reset}
A utility for exporting, building, and testing UI Builder apps.
${colors.bold}Usage:${colors.reset}
  export-app [command] [options]
${colors.bold}Commands:${colors.reset}
  export       Export a UI Builder app with specified configuration
  build        Build an exported UI Builder app
  serve        Start a local server to test an exported UI Builder app
  verify       Verify UI Builder app functionality
${colors.bold}Options:${colors.reset}
  --help, -h                 Show this help information
  --chain, -c [type]         Chain type (evm, solana, stellar) (default: evm)
  --func, -f [name]          Function name (default: transfer)
  --output, -o [name]        Subdirectory name within ./exports (default: transfer-app)
  --adapters, -a [boolean]   Include blockchain adapters (default: true)
  --template, -t [name]      Template to use (default: typescript-react-vite)
  --complex, -x              Use complex app with multiple fields
  --verbose, -v              Enable verbose output
  --env, -e [env]            Target environment: 'local', 'packed', or 'production' (default: local)
                             local      - file: links to workspace packages (fast, for dev)
                             packed     - pnpm pack tarballs (simulates real npm install, catches .d.ts issues)
                             production - uses published npm versions
${colors.bold}Examples:${colors.reset}
  export-app export
  export-app export -c solana -f stake -o stake-app
  export-app export --env packed -c polkadot -o polkadot-test
  export-app export --env production -o prod-app
  export-app build ./exports/transfer-app
  export-app serve ./exports/transfer-app
  export-app export -x
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

/**
 * Builds and packs all publishable monorepo packages into tarballs.
 * Returns { packDir, packedMap } where packedMap maps package names to tarball paths.
 */
function packMonorepoPackages() {
  const packDir = path.join(monorepoRoot, '.packed-packages');

  fs.rmSync(packDir, { recursive: true, force: true });
  fs.mkdirSync(packDir, { recursive: true });

  console.log(`\n${colors.blue}Building monorepo packages...${colors.reset}`);
  execInDir('pnpm build', monorepoRoot);
  console.log(`${colors.green}✓ Build complete${colors.reset}\n`);

  const packagesDir = path.join(monorepoRoot, 'packages');
  const packageDirs = fs
    .readdirSync(packagesDir)
    .map((dir) => path.join(packagesDir, dir))
    .filter((dir) => {
      return (
        fs.statSync(dir).isDirectory() &&
        fs.existsSync(path.join(dir, 'package.json')) &&
        fs.existsSync(path.join(dir, 'dist'))
      );
    });

  const packedMap = {};

  console.log(`${colors.blue}Packing ${packageDirs.length} packages...${colors.reset}`);
  for (const pkgDir of packageDirs) {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    const pkgName = pkgJson.name;

    try {
      const output = execInDir(`pnpm pack --pack-destination "${packDir}"`, pkgDir, 'pipe');
      const tarball = output.toString().trim().split('\n').pop();
      const tarballPath = path.join(packDir, path.basename(tarball));

      if (fs.existsSync(tarballPath)) {
        packedMap[pkgName] = tarballPath;
        console.log(
          `  ${colors.green}✓${colors.reset} ${pkgName} → ${path.basename(tarballPath)}`
        );
      }
    } catch (error) {
      console.log(`  ${colors.yellow}⚠${colors.reset} Skipping ${pkgName} (pack failed)`);
    }
  }

  console.log(
    `\n${colors.green}✓ Packed ${Object.keys(packedMap).length} packages${colors.reset}`
  );
  return { packDir, packedMap };
}

/**
 * Configures an extracted export app to use locally packed tarballs
 * instead of published npm versions. Also handles Midnight SDK patches.
 */
function configureForPackedMode(extractDir, packedMap) {
  const packageJsonPath = path.join(extractDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  console.log(`\n${colors.blue}Replacing dependencies with packed tarballs...${colors.reset}`);
  for (const depType of ['dependencies', 'devDependencies']) {
    if (!packageJson[depType]) continue;
    for (const dep of Object.keys(packageJson[depType])) {
      if (packedMap[dep]) {
        console.log(
          `  ${colors.green}✓${colors.reset} ${dep}: ${packageJson[depType][dep]} → file:${packedMap[dep]}`
        );
        packageJson[depType][dep] = `file:${packedMap[dep]}`;
      }
    }
  }

  if (!packageJson.pnpm) packageJson.pnpm = {};
  if (!packageJson.pnpm.overrides) packageJson.pnpm.overrides = {};

  for (const [pkgName, tarballPath] of Object.entries(packedMap)) {
    packageJson.pnpm.overrides[pkgName] = `file:${tarballPath}`;
  }

  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
  };
  const hasMidnight = Object.keys(allDeps).some((k) => k.startsWith('@midnight-ntwrk/'));

  if (hasMidnight) {
    const adapterPatchesDir = path.join(monorepoRoot, 'packages/adapter-midnight/patches');
    if (fs.existsSync(adapterPatchesDir)) {
      console.log(`\n${colors.blue}Configuring Midnight SDK patches...${colors.reset}`);
      const targetPatchesDir = path.join(extractDir, 'patches');
      fs.mkdirSync(targetPatchesDir, { recursive: true });

      const patchFiles = fs.readdirSync(adapterPatchesDir).filter((f) => f.endsWith('.patch'));
      for (const patchFile of patchFiles) {
        fs.copyFileSync(
          path.join(adapterPatchesDir, patchFile),
          path.join(targetPatchesDir, patchFile)
        );
      }

      if (!packageJson.pnpm.patchedDependencies) packageJson.pnpm.patchedDependencies = {};

      for (const patchFile of patchFiles) {
        // Format: @scope__package@version.patch → @scope/package@version
        const match = patchFile.match(/^(@[^_]+)__(.+)@(.+)\.patch$/);
        if (match) {
          const patchKey = `${match[1]}/${match[2]}@${match[3]}`;
          const pkgNameFromPatch = `${match[1]}/${match[2]}`;

          if (allDeps[pkgNameFromPatch]) {
            packageJson.pnpm.patchedDependencies[patchKey] = `patches/${patchFile}`;
            packageJson.pnpm.overrides[pkgNameFromPatch] = match[3];
            console.log(`  ${colors.green}✓${colors.reset} Patching ${patchKey}`);
          }
        }
      }
    }
  } else {
    debug('No Midnight packages detected, skipping patches');
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  const lockfilePath = path.join(extractDir, 'pnpm-lock.yaml');
  if (fs.existsSync(lockfilePath)) {
    fs.unlinkSync(lockfilePath);
  }

  console.log(`${colors.green}✓ package.json configured with packed tarballs${colors.reset}`);
}

function exportAppSimple(options) {
  try {
    console.log(`\n${colors.bold}${colors.cyan}Exporting UI Builder App${colors.reset}\n`);
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
      `  App Complexity: ${options.complex ? colors.blue + 'Complex' : colors.blue + 'Simple'}${colors.reset}`
    );
    console.log(`  Output Directory: ${colors.blue}${outputDir}${colors.reset}`);
    console.log(`  Environment:      ${colors.blue}${options.env}${colors.reset}\n`);

    let packedResult = null;
    if (options.env === 'packed') {
      packedResult = packMonorepoPackages();
    }

    // For packed mode, tell the export system to use production versions
    // (they'll be overridden with tarball paths after extraction)
    const exportEnv = options.env === 'packed' ? 'production' : options.env;

    const env = {
      EXPORT_TEST_CHAIN: options.chain,
      EXPORT_TEST_FUNCTION: options.func,
      EXPORT_TEST_TEMPLATE: options.template,
      EXPORT_TEST_INCLUDE_ADAPTERS: options.adapters.toString(),
      EXPORT_TEST_COMPLEX: options.complex.toString(),
      EXPORT_TEST_OUTPUT_DIR: outputDir,
      EXPORT_CLI_MODE: 'true',
      EXPORT_CLI_ENV: exportEnv,
      ...process.env,
    };

    console.log(`${colors.blue}Generating export...${colors.reset}\n`);
    const builderPackageDir = path.join(monorepoRoot, 'apps/builder');
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
          '@openzeppelin/ui-builder-adapter-evm': `file:${path.join(monorepoRoot, 'packages/adapter-evm')}`,
          '@openzeppelin/ui-builder-adapter-solana': `file:${path.join(monorepoRoot, 'packages/adapter-solana')}`,
          '@openzeppelin/ui-builder-adapter-stellar': `file:${path.join(monorepoRoot, 'packages/adapter-stellar')}`,
          '@openzeppelin/ui-builder-adapter-midnight': `file:${path.join(monorepoRoot, 'packages/adapter-midnight')}`,
          '@openzeppelin/ui-renderer': `file:${path.join(monorepoRoot, 'packages/renderer')}`,
          '@openzeppelin/ui-react': `file:${path.join(monorepoRoot, 'packages/react-core')}`,
          '@openzeppelin/ui-types': `file:${path.join(monorepoRoot, 'packages/types')}`,
          '@openzeppelin/ui-components': `file:${path.join(monorepoRoot, 'packages/ui')}`,
          '@openzeppelin/ui-utils': `file:${path.join(monorepoRoot, 'packages/utils')}`,
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

    if (options.env === 'packed' && packedResult) {
      configureForPackedMode(extractDir, packedResult.packedMap);

      const tempDir = path.join(os.tmpdir(), `ui-builder-packed-test-${Date.now()}`);
      console.log(
        `\n${colors.blue}Moving project to isolated test directory...${colors.reset}`
      );
      fs.cpSync(extractDir, tempDir, { recursive: true });
      console.log(`${colors.green}✓ Project copied to:${colors.reset} ${tempDir}`);

      console.log(`\n${colors.blue}Installing dependencies...${colors.reset}`);
      execInDir('pnpm install --no-frozen-lockfile', tempDir);
      console.log(`${colors.green}✓ Dependencies installed${colors.reset}`);

      console.log(`\n${colors.blue}Building exported app (verifying types and bundling)...${colors.reset}`);
      execInDir('pnpm build', tempDir);
      console.log(`\n${colors.green}${colors.bold}✓ Packed build verification passed!${colors.reset}`);
      console.log(`  ${colors.dim}Types, bundling, and Tailwind all resolved correctly.${colors.reset}`);
      console.log(`\n${colors.cyan}Test directory:${colors.reset} ${tempDir}`);
      console.log(`\n${colors.cyan}To clean up:${colors.reset}`);
      console.log(`  rm -rf ${tempDir}`);
      console.log(`  rm -rf ${packedResult.packDir}`);
      return extractDir;
    }

    if (options.env === 'local') {
      const tempDir = path.join(os.homedir(), 'ui-builder-app-test');
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
      console.log(`  Build the project: export-app build ${extractDir}`);
      console.log(`  Serve the project: export-app serve ${extractDir}`);
    }
    return extractDir;
  } catch (error) {
    console.error(`\n${colors.red}An unexpected error occurred:${colors.reset}`, error);
    process.exit(1);
  }
}

function buildExportedApp(options) {
  const targetDir = resolveTargetDir(options.targetDir || '.', process.cwd());
  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  try {
    console.log(`\n${colors.bold}${colors.cyan}Building UI Builder App${colors.reset}\n`);
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

/**
 * Configures Tailwind CSS @source directive for local monorepo testing.
 * When running within the monorepo, pnpm hoists packages to the root node_modules.
 * The template's @source "../node_modules/@openzeppelin" won't find them.
 * This function updates the path to point to the monorepo root.
 */
function configureTailwindForLocalServe(targetDir) {
  const stylesPath = path.join(targetDir, 'src', 'styles.css');
  if (!fs.existsSync(stylesPath)) {
    debug(`No styles.css found at ${stylesPath}, skipping Tailwind configuration`);
    return;
  }

  let content = fs.readFileSync(stylesPath, 'utf8');

  // Check if this is a pnpm workspace (packages are hoisted to root)
  const localNodeModulesOz = path.join(targetDir, 'node_modules', '@openzeppelin');
  const rootNodeModulesOz = path.join(monorepoRoot, 'node_modules', '@openzeppelin');

  // If @openzeppelin packages exist at root but not locally, update the path
  if (!fs.existsSync(localNodeModulesOz) && fs.existsSync(rootNodeModulesOz)) {
    console.log(
      `${colors.blue}Configuring Tailwind CSS for local monorepo testing...${colors.reset}`
    );

    // Replace the relative @source path with absolute path to monorepo root
    const originalPattern = /@source\s+["']\.\.\/node_modules\/@openzeppelin["'];?/g;
    const newSource = `@source "${rootNodeModulesOz}";`;

    if (originalPattern.test(content)) {
      content = content.replace(originalPattern, newSource);
      fs.writeFileSync(stylesPath, content, 'utf8');
      console.log(
        `  ${colors.green}✓${colors.reset} Updated @source directive to use monorepo root`
      );
    }
  }
}

function serveExportedApp(options) {
  const targetDir = resolveTargetDir(options.targetDir || '.', monorepoRoot);
  if (!fs.existsSync(targetDir)) {
    console.error(`${colors.red}Error:${colors.reset} Directory does not exist: ${targetDir}`);
    process.exit(1);
  }
  try {
    console.log(`\n${colors.bold}${colors.cyan}Serving UI Builder App${colors.reset}\n`);
    console.log(`${colors.blue}Running 'pnpm install' in ${targetDir}...${colors.reset}`);
    execInDir('pnpm install', targetDir);

    // Configure Tailwind for local testing (after install, before dev)
    configureTailwindForLocalServe(targetDir);

    console.log(`${colors.blue}Running 'pnpm dev' in ${targetDir}...${colors.reset}`);
    execInDir('pnpm dev', targetDir);
  } catch (error) {
    console.error(`${colors.red}Failed to start server:${colors.reset}`, error);
    process.exit(1);
  }
}

function verifyExportedApp(options) {
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
    console.log(`\n${colors.bold}${colors.cyan}Verifying UI Builder App${colors.reset}\n`);
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
      exportAppSimple(options);
      break;
    case 'build':
      buildExportedApp(options);
      break;
    case 'serve':
      serveExportedApp(options);
      break;
    case 'verify':
      verifyExportedApp(options);
      break;
    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      showHelp();
      process.exit(1);
  }
}

main();
