# Cross-Package Imports in the Transaction Form Builder

This guide explains how to import files across package boundaries in our monorepo, including the special virtual module solution that addresses limitations in Vite's development server.

## The Problem

When using `import.meta.glob` to dynamically import files across package boundaries (e.g., from `packages/builder` to `packages/renderer`), Vite's development server has limitations that prevent it from correctly resolving these imports. This results in errors like:

```
Export failed: No form renderer configuration file found
```

## Our Solution: Virtual Modules

We use Vite's virtual module feature to create special import paths that can reliably load files from other packages in both development and production environments.

### How It Works

1. Instead of using `import.meta.glob`, we define virtual modules that act as bridges to the actual files
2. These virtual modules are created by a Vite plugin that transforms import paths
3. TypeScript declarations ensure type safety for these imports

### Benefits

- Works consistently in both development and production
- Preserves build-time optimization benefits
- Avoids hardcoding configuration values
- Maintains type safety

## Adding a New Cross-Package Import

When you need to access a file from another package in the monorepo, follow these steps:

### 1. Update `vite.config.ts`

Add your virtual module to the `crossPackageModules` object:

```typescript
const crossPackageModules: Record<string, string> = {
  // Existing modules
  'virtual:renderer-config': '../renderer/src/config.ts',

  // Add your new module
  'virtual:my-new-module': '../other-package/src/my-file.ts',
};
```

Then add a corresponding alias in the `resolve.alias` section:

```typescript
resolve: {
  alias: {
    // Existing aliases
    '@cross-package/renderer-config': path.resolve(__dirname, '../renderer/src/config.ts'),

    // Add your new alias
    '@cross-package/my-new-module': path.resolve(__dirname, '../other-package/src/my-file.ts'),
  },
},
```

### 2. Add Type Declarations

Add a type declaration for your virtual module in `packages/builder/src/types/virtual-modules.d.ts`:

```typescript
declare module 'virtual:my-new-module' {
  // Import the types you need
  import type { MyType } from '@other-package/types';

  // Declare what's exported from the module
  export const myExport: MyType;
  // Or if it has a default export
  export default MyClass;
}
```

### 3. Add Test Support

Add a mock implementation for tests in `packages/builder/vitest.config.ts`:

```typescript
const virtualModuleMocks: Record<string, string> = {
  // Existing mocks
  'virtual:renderer-config': `
    export const formRendererConfig = {
      coreDependencies: {},
      fieldDependencies: {}
    };
  `,

  // Add your new mock
  'virtual:my-new-module': `
    export const myExport = {
      // Mock properties
    };
  `,
};
```

### 4. Use the Virtual Module in Your Code

Import from the virtual module in your code:

```typescript
import { myExport } from 'virtual:my-new-module';
```

## Example: The Form Renderer Config

The original implementation using `import.meta.glob`:

```typescript
const formRendererConfigFile = import.meta.glob('../../renderer/src/config.ts', {
  eager: true,
}) as GlobImportResult;

// This works in production but fails in development
const formRendererConfig = this.getConfigFromGlobResult(formRendererConfigFile);
```

The new implementation using a virtual module:

```typescript
// This works in both development and production
import { formRendererConfig } from 'virtual:renderer-config';
```

## Troubleshooting

If you encounter issues with your virtual module:

1. **Check the naming consistency** - Make sure the module names match in all locations
2. **Verify path correctness** - Ensure the paths in `crossPackageModules` and aliases are correct
3. **Check type declarations** - Ensure your type declarations match the actual exports
4. **Update test mocks** - Make sure your test mocks provide all the necessary exports

For additional help, contact the core development team.
