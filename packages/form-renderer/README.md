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
const formSchema = {
  // Your form schema here
};

function App() {
  const handleSubmit = (data) => {
    console.log('Form submitted with data:', data);
    // Process transaction
  };

  return <TransactionForm schema={formSchema} onSubmit={handleSubmit} />;
}
```

## API Reference

### `<TransactionForm>`

The main component for rendering transaction forms.

#### Props

| Prop            | Type                       | Description                               |
| --------------- | -------------------------- | ----------------------------------------- |
| `schema`        | `FormSchema`               | The schema definition for the form        |
| `onSubmit`      | `(data: FormData) => void` | Callback function when form is submitted  |
| `initialValues` | `FormData`                 | (Optional) Initial values for form fields |
| `disabled`      | `boolean`                  | (Optional) Disables all form fields       |
| `loading`       | `boolean`                  | (Optional) Shows loading state            |
| `theme`         | `ThemeOptions`             | (Optional) Custom theme options           |

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
- `dist/index.dev.cjs` - CommonJS module (development version)
- `dist/index.prod.cjs` - CommonJS module (production version)
- `dist/*.d.ts` - TypeScript declaration files

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
