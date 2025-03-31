# Form Renderer Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/transaction-form-builder-form-renderer.svg)](https://www.npmjs.com/package/@openzeppelin/transaction-form-builder-form-renderer)
[![License](https://img.shields.io/npm/l/@openzeppelin/transaction-form-builder-form-renderer.svg)](https://github.com/OpenZeppelin/transaction-form-builder/blob/main/LICENSE)

A specialized library for rendering customizable transaction forms for blockchain applications. Part of the Transaction Form Builder ecosystem.

## Installation

```bash
# Using npm
npm install @openzeppelin/transaction-form-builder-form-renderer

# Using yarn
yarn add @openzeppelin/transaction-form-builder-form-renderer

# Using pnpm
pnpm add @openzeppelin/transaction-form-builder-form-renderer
```

## Features

- Lightweight form rendering components
- Framework-agnostic design
- TypeScript support with full type definitions
- Support for both ESM and CommonJS environments
- Customizable styling options
- Optimized for blockchain transaction data

## Component Styling

Components within this package are styled using Tailwind CSS utility classes. During the build process (`pnpm build`), these classes are compiled into `dist/index.css` using the Tailwind CLI.

Consuming packages (like `core` or exported applications) **must import this `dist/index.css` file** to ensure components rendered from this library are styled correctly.

## Usage

```tsx
import { TransactionForm } from '@openzeppelin/transaction-form-builder-form-renderer';

// Example form schema
const schema = {
  id: 'example-form',
  title: 'Example Form',
  fields: [
    // Your form fields here
  ],
  layout: {
    columns: 1,
    spacing: 'normal',
    labelPosition: 'top',
  },
  validation: {
    mode: 'onChange',
    showErrors: 'inline',
  },
  submitButton: {
    text: 'Submit',
    loadingText: 'Submitting...',
  },
};

// Simple adapter implementation
const adapter = {
  formatTransactionData: (functionId, inputs) => inputs,
  isValidAddress: (address) => address.length > 0,
};

function App() {
  const handleSubmit = (data) => {
    console.log('Form submitted with data:', data);
    // Process transaction
  };

  return <TransactionForm schema={schema} adapter={adapter} onSubmit={handleSubmit} />;
}
```

## API Reference

### `<TransactionForm>`

The main component for rendering transaction forms.

#### Props

| Prop            | Type                       | Description                                      |
| --------------- | -------------------------- | ------------------------------------------------ |
| `schema`        | `RenderFormSchema`         | The schema definition for the form               |
| `previewMode`   | `boolean`                  | (Optional) Renders form in preview mode          |
| `onSubmit`      | `(data: FormData) => void` | Callback function when form is submitted         |
| `initialValues` | `FormData`                 | (Optional) Initial values for form fields [TODO] |
| `disabled`      | `boolean`                  | (Optional) Disables all form fields [TODO]       |
| `loading`       | `boolean`                  | (Optional) Shows loading state [TODO]            |
| `theme`         | `ThemeOptions`             | (Optional) Custom theme options [TODO]           |

## Configuration System

The form-renderer package includes a configuration system that defines dependencies and other settings. This configuration is used when forms are exported to ensure proper dependencies are included in the generated project.

### Form Renderer Configuration File

Create a `config.ts` file in the form-renderer package:

```typescript
// packages/form-renderer/src/config.ts
import type { FormRendererConfig } from './types/FormRendererConfig';

/**
 * Configuration for the form-renderer package
 */
export const formRendererConfig: FormRendererConfig = {
  /**
   * Dependencies for specific field types
   * Only dependencies for fields used in a form will be included in exports
   */
  fieldDependencies: {
    // Date field dependencies
    date: {
      runtimeDependencies: {
        'react-datepicker': '^4.14.0',
      },
      devDependencies: {
        '@types/react-datepicker': '^4.11.2',
      },
    },

    // Select field dependencies
    select: {
      runtimeDependencies: {
        'react-select': '^5.7.3',
      },
      devDependencies: {
        '@types/react-select': '^5.0.1',
      },
    },

    // Complex fields like file uploads
    file: {
      runtimeDependencies: {
        'react-dropzone': '^14.2.3',
      },
    },

    // Basic fields don't need additional dependencies
    text: { runtimeDependencies: {} },
    number: { runtimeDependencies: {} },
    checkbox: { runtimeDependencies: {} },
    radio: { runtimeDependencies: {} },
  },

  /**
   * Core dependencies required by form-renderer
   * These will be included in all exported projects
   */
  coreDependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    'react-hook-form': '^7.43.9',
    '@openzeppelin/transaction-form-builder-form-renderer': '^1.0.0',
  },
};
```

### Dependency Management

The FormRendererConfig is used by the export system to:

1. Include core dependencies required by all forms
2. Add field-specific dependencies based on the fields used in a form
3. Separate runtime from development dependencies

#### Field-specific Dependencies

When a user exports a form, the system analyzes the fields used in the form and only includes dependencies for those specific field types. For example, if a form doesn't use a date picker, the 'react-datepicker' dependency won't be included.

#### Versioning Strategy

The system applies a semantic versioning strategy to dependencies:

1. For form-renderer packages, it uses caret ranges (^) to allow minor and patch updates
2. This enables exported forms to receive updates without needing to re-export the entire form

### Configuration Discovery

The Package Management System automatically discovers the form-renderer configuration using Vite's `import.meta.glob`. The exported `formRendererConfig` constant name is expected by the system.

## Development

### Build System

This package uses a custom build system that generates both ESM and CommonJS output for maximum compatibility.

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

### Build Output

The build process creates the following outputs:

- `dist/index.js` - ESM module
- `dist/index.cjs` - CommonJS module
- `dist/index.d.ts` - TypeScript declaration files
- `dist/types/*.js` - Type utilities as ESM modules
- `dist/types/*.cjs` - Type utilities as CommonJS modules
- `dist/types/*.d.ts` - Type declarations for utilities

### Release Process

> **Note**: Automatic publishing is currently disabled during early development. The workflow is configured but commented out until the package is ready for production release.

This package will be automatically published to npm when changes are merged to the main branch, using GitHub Actions and semantic-release, once enabled. The workflow is in place but currently only runs build and test steps without publishing.

The release workflow (when enabled):

1. Runs when code is pushed to the main branch or via manual trigger
2. Runs tests and builds the package
3. Uses semantic-release to determine the next version based on commit messages
4. Publishes to npm with appropriate tags
5. Creates a GitHub release with generated release notes

Manual releases can be triggered through the GitHub Actions interface with a version parameter when needed during development.

### Commit Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) standard to automate version management and changelog generation.

Commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Common types:

- `feat`: A new feature (triggers a minor version bump)
- `fix`: A bug fix (triggers a patch version bump)
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Breaking changes should be indicated by adding `BREAKING CHANGE:` in the commit body, which will trigger a major version bump.

## License

[MIT](https://github.com/OpenZeppelin/transaction-form-builder/blob/main/LICENSE) © OpenZeppelin
