# Export Testing Framework

The Export Testing Framework provides tools for testing form exports without UI interaction. This document explains how to use the framework for testing, validating, and verifying exported form applications.

## Overview

The framework consists of several components:

1. **Test Utilities**:
   - `zipInspector.ts` - Extracts and analyzes ZIP files
   - `testConfig.ts` - Generates test form configurations
   - Snapshot testing capabilities

2. **Test Suites**:
   - Structure tests - Verify project structure and file integrity
   - Component tests - Validate form component implementation
   - Adapter tests - Check blockchain adapter functionality
   - Snapshot tests - Compare exports against known-good references

3. **CLI Wrapper**:
   - `export-cli-wrapper.test.ts` - Bridge between CLI tool and export functionality
   - Handles file preservation when run through the CLI
   - Enforces exports to be within the git-ignored ./exports directory
   - Supports configurable dependency handling for different environments

## Getting Started

### Running Export Tests

To run all export tests:

```bash
pnpm --filter @openzeppelin/ui-builder-app test src/export/__tests__/
```

To run a specific test suite:

```bash
pnpm --filter @openzeppelin/ui-builder-app test src/export/__tests__/ExportStructureTests.test.ts
```

### Testing Exported Apps Locally

To test an exported app (via UI) with local packages (useful for testing unreleased changes):

```bash
pnpm test:export "exports/your-app-name"
```

This command will:

1. Build all local packages
2. Pack them to `.tgz` files
3. Copy the exported app to a temporary directory
4. Replace all `@openzeppelin/ui-builder-*` dependencies with local `file:` paths
5. Copy Midnight SDK patches (if applicable)
6. Update Tailwind 4 import to use local monorepo source
7. Install dependencies with fresh lock file
8. Optionally start the dev server for manual testing

This is particularly useful for:

- Testing adapter changes before publishing
- Debugging export issues with local modifications
- Validating that exported apps work with the latest monorepo code

## Test Categories

### Structure Tests

Structure tests verify that exported projects have the correct file structure and dependencies.

File: `ExportStructureTests.test.ts`

These tests check:

- Basic project files (package.json, index.html, etc.)
- Chain-specific files and dependencies
- Adapter files (when includeAdapters is true)
- Project naming and configuration

### Component Tests

Component tests validate the generated form component.

File: `FormComponentTests.test.ts`

These tests check:

- Component structure and imports
- Form field definitions
- Schema transformation
- Chain-specific component features

### Adapter Integration Tests

Adapter tests verify blockchain adapter functionality.

File: `AdapterIntegrationTests.test.ts`

These tests check:

- Adapter file structure
- Type definitions
- Contract interaction functionality
- Dependencies in package.json

### Snapshot Tests

Snapshot tests compare exports against known-good references.

File: `ExportSnapshotTests.test.ts`

These tests check:

- Components match expected implementation
- Adapters match expected implementation
- Cross-chain consistency
- Package.json structure

## CLI Integration

The framework includes a special test file that bridges the CLI tool with the export system:

File: `export-cli-wrapper.test.ts`

This wrapper:

1. Reads configuration from environment variables
2. Creates form configurations based on these variables
3. Exports the form using the AppExportSystem
4. Handles file cleanup differently based on context

### CLI Mode

The test framework uses the `EXPORT_CLI_MODE` environment variable to control cleanup behavior:

- When `EXPORT_CLI_MODE=true` (set by the CLI), exported files are preserved
- When not set (normal test runs), files are cleaned up after tests complete

This allows the same code to be used both for automated testing and for the CLI tool, while ensuring appropriate behavior in each context.

### Environment Options

The CLI wrapper supports different dependency handling based on the target environment:

- **Local Development** (`EXPORT_CLI_ENV=local`):
  - Sets `workspace:*` for @openzeppelin packages
  - Ideal for local development in the monorepo
  - Allows testing changes without publishing

- **Production** (`EXPORT_CLI_ENV=production`):
  - Sets `latest` for @openzeppelin packages
  - For production builds and deployments
  - Works outside the monorepo context

This is controlled through the `env` option in the template options.

### Output Directory Management

For version control compatibility, the CLI and wrapper enforce:

1. All exports from the CLI are placed in the `./exports` directory
2. The CLI transforms any output path to extract only the subdirectory name
3. This ensures all generated files stay within the git-ignored directory
4. Test runs will still use the output directory specified in tests (but will clean up unless in CLI mode)

Example: If a user specifies `--output my-form`, the export will go to `./exports/my-form`.

## Working with Snapshots

### Updating Snapshots

To update snapshots when expected changes occur:

```bash
pnpm --filter @openzeppelin/ui-builder-app test src/export/__tests__/ExportSnapshotTests.test.ts -- -u
```

For specific test files, use the same pattern with the appropriate test file:

```bash
pnpm --filter @openzeppelin/ui-builder-app test src/export/__tests__/YourTestFile.test.ts -- -u
```

### Creating New Snapshots

When adding new test cases:

1. Write the test in `ExportSnapshotTests.test.ts`
2. Run the test with the update flag to create initial snapshots
3. Review the snapshots to ensure they're correct
4. Commit the snapshots to version control

## CI/CD Integration

The export testing framework is integrated with the CI/CD pipeline:

- Export tests run automatically on pull requests
- Tests trigger when changes are made to export-related files
- Test reports are available as artifacts in CI

## Creating Custom Tests

To create a custom test for a specific form export:

1. Use the `testExportStructure` helper in `ExportStructureTests.test.ts`
2. Create a form configuration using `createMinimalFormConfig` or `createComplexFormConfig`
3. Add assertions specific to your use case

Example:

```typescript
it('should export a custom form with specific fields', async () => {
  // Create custom form config
  const formConfig = createMinimalFormConfig('customFunction', 'evm');

  // Add custom fields
  formConfig.fields.push({
    id: 'customField',
    type: 'text',
    label: 'Custom Field',
    placeholder: 'Enter custom value',
    required: true,
  });

  // Export and validate
  const { files } = await testExportStructure(formConfig, 'evm', 'customFunction');

  // Check for custom field in form component
  expect(files['src/components/GeneratedForm.tsx']).toContain('customField');
  expect(files['src/components/GeneratedForm.tsx']).toContain('Custom Field');
});
```

## Testing Different Environments

To test different dependency configurations:

```typescript
it('should export with workspace dependencies for local development', async () => {
  const formConfig = createMinimalFormConfig('transfer', 'evm');
  const options = { env: 'local' as const };

  const { files } = await testExportStructure(formConfig, 'evm', 'transfer', options);

  const packageJson = JSON.parse(files['package.json']);
  expect(packageJson.dependencies['@openzeppelin/ui-builder-renderer']).toBe('workspace:*');
});

it('should export with published dependencies for production', async () => {
  const formConfig = createMinimalFormConfig('transfer', 'evm');
  const options = { env: 'production' as const };

  const { files } = await testExportStructure(formConfig, 'evm', 'transfer', options);

  const packageJson = JSON.parse(files['package.json']);
  expect(packageJson.dependencies['@openzeppelin/ui-builder-renderer']).toBe('latest');
});
```

## Troubleshooting

### Common Issues

**Missing Dependencies**

If tests fail with missing dependencies:

```
Error: Cannot find module 'tsx'
```

Run:

```bash
pnpm install
```

**Snapshot Test Failures**

If snapshot tests fail unexpectedly:

1. Review the diff to understand what changed
2. If changes are expected, update snapshots
3. If changes are unexpected, investigate the cause

**File Cleanup Issues**

If you need to preserve files for inspection during testing:

```typescript
// Temporarily disable cleanup for a specific test
process.env.EXPORT_CLI_MODE = 'true';

it('should export files for inspection', async () => {
  // Test code here
  // Files will be preserved due to the environment variable
});

// Reset for other tests
process.env.EXPORT_CLI_MODE = undefined;
```

**Output Directory Issues**

For CLI development and testing:

1. Remember that CLI exports always go to subdirectories within `./exports`
2. When testing the CLI locally, look for files in `./exports/[subdirectory]`
3. For programmatic tests, the output directory behavior depends on whether the `EXPORT_CLI_MODE` flag is set

**Environment-Specific Dependencies**

To test different dependency handling:

```typescript
// For testing local development dependencies
process.env.EXPORT_CLI_ENV = 'local';
// or
// For testing production dependencies
process.env.EXPORT_CLI_ENV = 'production';
```

## Best Practices

1. **Keep snapshots minimal** - Only snapshot the essential parts of files
2. **Use regex in snapshots** - For IDs or values that change between runs
3. **Test multiple chain types** - Ensure exports work for all supported chains
4. **Update tests when export format changes** - Keep tests in sync with implementation
5. **Run tests locally before committing** - Catch issues early
6. **Use CLI for manual exports** - Prefer the CLI tool over direct test runs for manual exports
7. **Test both environment types** - Include tests for both local and production dependencies
8. **Use descriptive subdirectory names** - When testing the CLI, use names that reflect the content (e.g., `evm-transfer`)

## Resources

- [Test Configuration Utilities](../src/export/utils/testConfig.ts)
- [ZIP Inspector](../src/export/utils/zipInspector.ts)
- [Export System Implementation](../src/export/AppExportSystem.ts)
- [Export CLI Tool Documentation](./export-cli-tool.md)
