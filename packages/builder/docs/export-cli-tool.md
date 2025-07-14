# Export CLI Tool

The `export-app` CLI tool provides a convenient way to export, build, and test transaction forms without manual UI interaction. This document explains how to use the CLI for various form export operations.

## Overview

The Export CLI tool enables developers to:

1. **Export Forms** - Create forms for different blockchain types and functions
2. **Build Forms** - Compile and prepare exported forms for deployment
3. **Serve Forms** - Run forms locally for testing and verification
4. **Verify Forms** - Check that forms meet expected requirements

## Getting Started

### Installation

The CLI tool is included with the Transaction Form Builder package. You can use it directly with pnpm:

```bash
pnpm export-app
```

For a list of available commands and options:

```bash
pnpm export-app --help
```

### Basic Usage

Here are some common use cases:

```bash
# Export a basic EVM transfer form for local development
pnpm export-app export

# Export a Solana staking form
pnpm export-app export --chain solana --func stake

# Export a complex form with multiple fields
pnpm export-app export --complex

# Export a form for production use
pnpm export-app export --env production --output prod-form
```

## Environment Options

The CLI supports two target environments for exports:

### Local Development (`--env local`)

- Default if no environment is specified
- Uses `workspace:*` for `@openzeppelin` dependencies to link to local packages
- Ideal for local development and testing changes in the monorepo
- Requires pnpm for dependency resolution across workspaces

### Production (`--env production`)

- Specified with `--env production`
- Uses `latest` for `@openzeppelin` dependencies to fetch from npm registry
- Suitable for deployment or sharing with users outside the monorepo
- Works with standard npm/yarn without workspace context

## CLI Commands

### export

Exports a form with the specified configuration.

```bash
pnpm export-app export [options]
```

Options:

- `--chain, -c [type]` - Chain type (evm, solana, stellar) (default: evm)
- `--func, -f [name]` - Function name (default: transfer)
- `--output, -o [name]` - Subdirectory name within `./exports` (default: transfer-form)
- `--adapters, -a [boolean]` - Include blockchain adapters (default: true)
- `--template, -t [name]` - Template to use (default: typescript-react-vite)
- `--complex, -x` - Use complex form with multiple fields
- `--verbose, -v` - Enable verbose output
- `--env, -e [env]` - Target environment: 'local' or 'production' (default: local)

Example:

```bash
pnpm export-app export --chain solana --func stake --output solana-stake-form --complex --env production
```

This will:

1. Create a form for the Solana stake function
2. Use a complex form configuration with multiple fields
3. Save the output to the `./exports/solana-stake-form` directory
4. Configure it for production use with published npm dependencies

### build

Builds an exported form by installing dependencies and running the build process.

```bash
pnpm export-app build <directory>
```

Example:

```bash
pnpm export-app build ./exports/transfer-form
```

This will:

1. Detect whether the form uses workspace dependencies or production dependencies
2. Provide appropriate build instructions based on the environment

### serve

Starts a local development server to test an exported form.

```bash
pnpm export-app serve <directory>
```

Example:

```bash
pnpm export-app serve ./exports/transfer-form
```

This will:

1. Detect the environment type (local or production)
2. For local development forms, use pnpm to resolve workspace dependencies
3. For production forms, provide manual instructions for npm/yarn

### verify

Verifies an exported form's structure and content.

```bash
pnpm export-app verify <directory>
```

Example:

```bash
pnpm export-app verify ./exports/transfer-form
```

This will check:

1. Required files are present
2. Dependencies are correctly defined
3. Form components are properly implemented
4. Adapter files are included (if applicable)

## Workflow Examples

### Local Development Workflow

For developing and testing against local packages:

```bash
# Export a form for local development
pnpm export-app export --output local-dev

# Serve the form with workspace dependencies
pnpm export-app serve ./exports/local-dev/transfer-form
```

### Production Deployment Workflow

For creating forms that can be shared or deployed:

```bash
# Export a form for production
pnpm export-app export --env production --output prod-deploy

# Build the form for production
pnpm export-app build ./exports/prod-deploy/transfer-form
```

### Testing Multiple Chain Types

To compare forms for different chains:

```bash
# Export EVM form
pnpm export-app export --chain evm --func transfer --output evm-transfer

# Export Solana form
pnpm export-app export --chain solana --func transfer --output solana-transfer

# Verify both forms
pnpm export-app verify ./exports/evm-transfer/transfer-form
pnpm export-app verify ./exports/solana-transfer/transfer-form
```

## Implementation Details

### CLI and Testing Framework Integration

The CLI tool uses the export testing framework internally, but with special handling to preserve exported files:

1. The `export` command sets the `EXPORT_CLI_MODE` environment variable to `true`
2. The testing framework detects this flag and skips its normal cleanup process
3. This ensures exported files remain available for the build, serve, and verify commands

### Output Directory Behavior

For better Git compatibility and to prevent unwanted files from being tracked:

1. All exported forms are placed in the `./exports` directory, which is already Git-ignored
2. The `--output` option specifies a subdirectory name within `./exports`, not a complete path
3. This ensures that all generated files remain outside of version control

### Dependency Management

The CLI handles dependencies differently based on the target environment:

1. For `--env local` (default):
   - @openzeppelin packages use `workspace:*` syntax
   - Dependencies are resolved through the monorepo using pnpm
   - Ideal for testing local changes to the renderer and other packages

2. For `--env production`:
   - @openzeppelin packages use `latest` version
   - Dependencies are fetched from the npm registry
   - Works outside the monorepo context with standard npm/yarn

## Troubleshooting

### Common Issues

**Build Failures**

If the build process fails with dependency errors:

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

Try running the build with legacy dependencies:

```bash
cd ./exports/transfer-form
npm install --legacy-peer-deps
npm run build
```

**Serve Command Not Starting**

If the serve command fails to start the development server:

```
Error: Cannot find module 'vite'
```

Try installing dependencies manually:

```bash
cd ./exports/transfer-form
npm install
npm run dev
```

**Files Missing After Export**

If files are missing after export, make sure you're using the CLI commands properly:

```bash
# Correct usage
pnpm export-app export --output my-form
pnpm export-app build ./exports/my-form/transfer-form

# Incorrect usage (running test directly)
pnpm test src/export/__tests__/export-cli-wrapper.test.ts
```

Direct test runs will clean up files, while the CLI preserves them.

**Workspace Dependencies Not Resolving**

If you're getting errors about missing workspace dependencies:

```
ERROR: No matching version found for @openzeppelin/contracts-ui-builder-renderer@workspace:*
```

Make sure you're:

1. Using pnpm (not npm or yarn)
2. Running the command from within the monorepo
3. Using the `serve` command for local development exports

### Debugging Exports

To debug an export with verbose output:

```bash
pnpm export-app export --verbose --output debug-form
```

Then examine the output files to identify issues.

## Best Practices

1. **Use descriptive subdirectory names** - Choose names that reflect the content (e.g., `evm-transfer`, `solana-stake`)
2. **Export multiple configurations** - Test different chain types and functions
3. **Verify before building** - Check form structure before spending time on builds
4. **Use workspace dependencies for development** - Use `--env local` (default) when testing changes to the renderer
5. **Use production dependencies for deployment** - Use `--env production` when sharing forms outside the monorepo
6. **Keep exports small** - Only include adapters when necessary

## Related Resources

- [Export Testing Framework Documentation](./export-testing-framework.md)
- [Export System Implementation](../src/export/FormExportSystem.ts)
- [CLI Source Code](../src/export/cli/export-app.cjs)
- [CLI Documentation](../src/export/cli/README.md)
