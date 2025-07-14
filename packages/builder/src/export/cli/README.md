# Transaction Form Export CLI

This is the command-line tool for exporting, building, and testing transaction forms.

## Documentation

For complete documentation on using this CLI tool, please refer to:

- [Export CLI Tool Documentation](../../../docs/export-cli-tool.md)

## Quick Reference

```bash
# Display help
export-app --help

# Export a form for production
export-app export

# Export a form configured for local development
export-app export --env local

# Build an exported form
export-app build <directory>

# Serve a production-exported form
export-app serve <directory>

# Verify an exported form
export-app verify <directory>
```

## Local Development and Testing

When testing local changes to the form builder or its packages, the standard `export-app export` command generates a production-ready application that expects to fetch published packages from npm. To test against your local, unpublished code, you must use the `--env local` flag.

### `--env local` Workflow

The `export-app export --env local` command is specifically designed to streamline local development. It automatically:

1. Exports the form application.
2. Modifies the exported `package.json` to use `pnpm overrides`, pointing to your local monorepo packages with **absolute paths**.
3. Injects any necessary bundler-specific configurations (like Vite's `optimizeDeps`) to handle complex local dependencies.
4. Moves the fully configured project to a "safe" directory outside the monorepo (e.g., `~/transfer-form-test`) to create a clean, isolated test environment.

### Recommended Testing Steps

To test your local changes, follow these steps:

1. **Export for local development:**

   ```bash
   pnpm export-app export --env local
   ```

2. **Follow the CLI instructions:** The command will output the exact path to the prepared test directory. Navigate into it:

   ```bash
   cd ~/transfer-form-test
   ```

3. **Install and run:**
   ```bash
   pnpm install
   pnpm dev
   ```

This manual process of running `pnpm install` and `pnpm dev` in the isolated directory is the most reliable way to test, as it avoids the complex module resolution conflicts that can arise from nested projects and symlinks when using a command like `serve` from within the monorepo.

## Development

This CLI tool is implemented using CommonJS to ensure compatibility with node environments. The main entry point is `export-app.cjs` which is referenced in the package.json `bin` field to make it available as a CLI command.

For development and maintenance, please follow the project's contribution guidelines.
