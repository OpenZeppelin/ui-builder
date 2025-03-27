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

## Getting Started

### Running Export Tests

To run all export tests:

```bash
pnpm --filter @openzeppelin/transaction-form-builder-core test src/export/__tests__/
```

To run a specific test suite:

```bash
pnpm --filter @openzeppelin/transaction-form-builder-core test src/export/__tests__/ExportStructureTests.test.ts
```

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
3. Exports the form using the FormExportSystem
4. Handles file cleanup differently based on context

### CLI Mode

The test framework uses the `EXPORT_CLI_MODE` environment variable to control cleanup behavior:

- When `EXPORT_CLI_MODE=true` (set by the CLI), exported files are preserved
- When not set (normal test runs), files are cleaned up after tests complete

This allows the same code to be used both for automated testing and for the CLI tool, while ensuring appropriate behavior in each context.

## Working with Snapshots

### Updating Snapshots

To update snapshots when expected changes occur:

```bash
pnpm --filter @openzeppelin/transaction-form-builder-core test src/export/__tests__/ExportSnapshotTests.test.ts -- -u
```

For specific test files, use the same pattern with the appropriate test file:

```bash
pnpm --filter @openzeppelin/transaction-form-builder-core test src/export/__tests__/YourTestFile.test.ts -- -u
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

## Best Practices

1. **Keep snapshots minimal** - Only snapshot the essential parts of files
2. **Use regex in snapshots** - For IDs or values that change between runs
3. **Test multiple chain types** - Ensure exports work for all supported chains
4. **Update tests when export format changes** - Keep tests in sync with implementation
5. **Run tests locally before committing** - Catch issues early
6. **Use CLI for manual exports** - Prefer the CLI tool over direct test runs for manual exports

## Resources

- [Test Configuration Utilities](../src/export/utils/testConfig.ts)
- [ZIP Inspector](../src/export/utils/zipInspector.ts)
- [Export System Implementation](../src/export/FormExportSystem.ts)
- [Export CLI Tool Documentation](./export-cli-tool.md)
