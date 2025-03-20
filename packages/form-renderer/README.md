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

## Development

### Demo Application

The package includes a demo application to showcase and test the form renderer components during development.

#### Running the Demo

```bash
# Start the demo app in development mode
pnpm demo:dev

# Build the demo app for production
pnpm demo:build

# Preview the built demo app
pnpm demo:preview
```

The demo app serves as both a development environment and a showcase of the form renderer's capabilities. It demonstrates form rendering with sample form schemas and a mock adapter implementation.

#### Demo Features

- Vite-powered development environment with hot module replacement
- Tailwind CSS v4 for modern, responsive styling
- Sample form schemas demonstrating different field types
- Mock adapter implementation showing how to integrate with blockchain libraries
- Full TypeScript support

#### Demo App Structure

```
demo/
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
└── src/
    ├── App.tsx          # Demo application component
    ├── index.css        # Imports centralized styling from styles package
    └── main.tsx         # Application entry point
```

> Note: The demo app uses the centralized styling system from the `packages/styles` package, with symbolic links to configuration files at the monorepo root.

### Styling

This package uses the centralized styling system from the `packages/styles` package:

- **CSS Variables**: Direct OKLCH color values define the theme colors
- **Tailwind CSS 4.0**: Modern utility-first CSS with the latest features
- **Consistent Spacing**: Form components use `gap-2` for label-input spacing and `space-y-4` between fields
- **Component Library**: Built on shadcn/ui with consistent, accessible components
- **Dark Mode**: Built-in dark mode support with clear variable handling

For more details on the styling system, see the [Styles README](../styles/README.md).

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
