# Export CLI Tool

The `export-form` CLI tool provides a convenient way to export, build, and test transaction forms without manual UI interaction. This document explains how to use the CLI for various form export operations.

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
pnpm export-form
```

For a list of available commands and options:

```bash
pnpm export-form --help
```

### Basic Usage

Here are some common use cases:

```bash
# Export a basic EVM transfer form
pnpm export-form export

# Export a Solana staking form
pnpm export-form export --chain solana --func stake

# Export a complex form with multiple fields
pnpm export-form export --complex

# Export to a specific directory
pnpm export-form export --output ./my-forms
```

## CLI Commands

### export

Exports a form with the specified configuration.

```bash
pnpm export-form export [options]
```

Options:

- `--chain, -c [type]` - Chain type (evm, solana, stellar) (default: evm)
- `--func, -f [name]` - Function name (default: transfer)
- `--output, -o [dir]` - Output directory (default: ./exports)
- `--adapters, -a [boolean]` - Include blockchain adapters (default: true)
- `--template, -t [name]` - Template to use (default: typescript-react-vite)
- `--complex, -x` - Use complex form with multiple fields
- `--verbose, -v` - Enable verbose output

Example:

```bash
pnpm export-form export --chain solana --func stake --output ./solana-forms --complex
```

This will:

1. Create a form for the Solana stake function
2. Use a complex form configuration with multiple fields
3. Save the output to the `./solana-forms` directory

### build

Builds an exported form by installing dependencies and running the build process.

```bash
pnpm export-form build <directory>
```

Example:

```bash
pnpm export-form build ./exports/transfer-form
```

This will:

1. Install dependencies using npm
2. Build the project using the configured build script

### serve

Starts a local development server to test an exported form.

```bash
pnpm export-form serve <directory>
```

Example:

```bash
pnpm export-form serve ./exports/transfer-form
```

This will:

1. Install dependencies if needed
2. Start a development server
3. Open the form in your default browser

### verify

Verifies an exported form's structure and content.

```bash
pnpm export-form verify <directory>
```

Example:

```bash
pnpm export-form verify ./exports/transfer-form
```

This will check:

1. Required files are present
2. Dependencies are correctly defined
3. Form components are properly implemented
4. Adapter files are included (if applicable)

## Workflow Examples

### Complete Export-to-Test Workflow

This example shows a full workflow from export to testing:

```bash
# Export a form
pnpm export-form export --chain evm --func transfer --output ./my-forms

# Build the exported form
pnpm export-form build ./my-forms/transfer-form

# Run the form locally
pnpm export-form serve ./my-forms/transfer-form
```

### Testing Multiple Chain Types

To compare forms for different chains:

```bash
# Export EVM form
pnpm export-form export --chain evm --func transfer --output ./chain-comparison

# Export Solana form
pnpm export-form export --chain solana --func transfer --output ./chain-comparison

# Verify both forms
pnpm export-form verify ./chain-comparison/transfer-form-evm
pnpm export-form verify ./chain-comparison/transfer-form-solana
```

## Implementation Details

### CLI and Testing Framework Integration

The CLI tool uses the export testing framework internally, but with special handling to preserve exported files:

1. The `export` command sets the `EXPORT_CLI_MODE` environment variable to `true`
2. The testing framework detects this flag and skips its normal cleanup process
3. This ensures exported files remain available for the build, serve, and verify commands

This integration allows the CLI to leverage the same robust export functionality used in tests while providing a user-friendly interface.

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
pnpm export-form export --output ./my-forms
pnpm export-form build ./my-forms/transfer-form

# Incorrect usage (running test directly)
pnpm test src/export/__tests__/export-cli-wrapper.test.ts
```

Direct test runs will clean up files, while the CLI preserves them.

### Debugging Exports

To debug an export with verbose output:

```bash
pnpm export-form export --verbose --output ./debug-exports
```

Then examine the output files to identify issues.

## Best Practices

1. **Use specific output directories** - Keep exports organized by purpose
2. **Export multiple configurations** - Test different chain types and functions
3. **Verify before building** - Check form structure before spending time on builds
4. **Use verbose output for debugging** - Get detailed progress information
5. **Keep exports small** - Only include adapters when necessary

## Related Resources

- [Export Testing Framework Documentation](./export-testing-framework.md)
- [Export System Implementation](../src/export/FormExportSystem.ts)
- [CLI Source Code](../src/export/cli/export-form.cjs)
- [CLI Documentation](../src/export/cli/README.md)
