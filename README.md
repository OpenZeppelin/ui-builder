# Transaction Form Builder 🧩

> A modern web application for building and customizing transaction forms for blockchain applications.

## Status

This project is currently in development.

[![CI](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/ci.yml)
[![Coverage](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/coverage.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/coverage.yml)
[![codecov](https://codecov.io/gh/OpenZeppelin/transaction-form-builder/branch/main/graph/badge.svg)](https://codecov.io/gh/OpenZeppelin/transaction-form-builder)
[![Release](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/release.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/release.yml)
[![Form-Renderer](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/publish-form-renderer.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/publish-form-renderer.yml)
[![Security](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/security.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/security.yml)
[![Dependencies](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/dependencies.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/dependencies.yml)
[![Dependency Review](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/dependency-review.yml)
[![Update Dependencies](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/update-dependencies.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/update-dependencies.yml)

<!-- TODO: Add license badge when we have a license -->
<!-- [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) -->

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Storybook](https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=white)](https://storybook.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintainability](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability)](https://codeclimate.com/github/OpenZeppelin/transaction-form-builder/maintainability)

## Monorepo Structure

This project is organized as a monorepo with the following packages:

- **packages/core**: The main application with the form builder UI and core logic.
- **packages/form-renderer**: The shared form rendering library (published to npm).
- **packages/types**: Shared TypeScript type definitions for all packages (published to npm).
- **packages/styles**: Centralized styling system with shared CSS variables and configurations.
- **packages/adapter-evm**: Adapter implementation for EVM-compatible chains.
- **packages/adapter-solana**: Adapter implementation for the Solana blockchain.
- **packages/adapter-stellar**: Adapter implementation for the Stellar network.
- **packages/adapter-midnight**: Adapter implementation for the Midnight blockchain.

## Packages

### Form-Renderer Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/transaction-form-renderer.svg)](https://www.npmjs.com/package/@openzeppelin/transaction-form-renderer)

The `form-renderer` package provides a reusable library for rendering transaction forms. It's published to npm and can be used independently of the main application.

Features:

- Lightweight form rendering components
- Framework-agnostic design
- TypeScript support with full type definitions
- Support for both ESM and CommonJS environments
- Customizable styling options

For more details, see the [Form-Renderer README](./packages/form-renderer/README.md).

### Types Package

The `types` package contains shared TypeScript type definitions for all packages in the ecosystem. It serves as the single source of truth for types used across the Transaction Form Builder.

Features:

- Centralized type definitions
- Organized namespaces for contracts, adapters, and forms
- Clear separation of concerns
- TypeScript project references for proper type checking

For more details, see the [Types README](./packages/types/README.md).

### Styles Package

The `styles` package contains the centralized styling system used across all packages. It provides consistent theming, spacing, and component styles throughout the application.

Features:

- Shared CSS variables with direct OKLCH color values
- Consistent form component spacing
- Dark mode support
- Tailwind CSS v4 integration

For more details, see the [Styles README](./packages/styles/README.md).

## Features

- Chain-agnostic architecture supporting multiple blockchain ecosystems
- Adapter pattern for easily adding support for new blockchains
- Modern React components for building transaction forms
- Customizable UI with Tailwind CSS and shadcn/ui
- Handles wallet connection state consistently in both core app and exported forms
- Configure transaction execution methods (EOA, Relayer, Multisig) via adapters
- Type-safe with TypeScript
- Fast development with Vite
- Component documentation with Storybook
- Comprehensive test suite with Vitest
- Automated dependency management and security checks

## Tech Stack

- **React**: UI library supporting both React 18 and 19 with modern hooks API
- **TypeScript 5.8+**: Enhanced type safety with template literal types
- **Vite 6**: Fast, modern build tool and dev server
- **Tailwind CSS v4**: Next-gen utility-first CSS framework with OKLCH color format
- **shadcn/ui**: Unstyled, accessible component system built on Radix UI
- **pnpm (v9 or higher)**: Fast, disk-efficient package manager
- **Vitest**: Testing framework integrated with Vite
- **Storybook 8**: Component documentation and visual testing
- **Semantic Release**: Automated versioning and releases
- **ESLint 9**: Modern linting with improved TypeScript support

## Getting Started

### Prerequisites

- Node.js (v20.11.1 or higher)
- pnpm (v9 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OpenZeppelin/transaction-form-builder.git
   cd transaction-form-builder
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm lint:adapters` - Validate adapter implementations against the ContractAdapter interface
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm lint:all-fix` - Fix ESLint issues across all file types
- `pnpm lint:config-files` - Fix linting in configuration files
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check formatting without making changes
- `pnpm fix-all` - Run Prettier first, then ESLint to avoid conflicts with CSS class sorting
- `pnpm preview` - Preview the production build
- `pnpm ui:add` - Add shadcn/ui components
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for production
- `pnpm commit` - Run commitizen for guided commits
- `pnpm update-deps` - Update dependencies to their latest versions
- `pnpm update-deps:major` - Update dependencies including major versions
- `pnpm check-deps` - Check for deprecated dependencies
- `pnpm outdated` - List outdated dependencies
- `pnpm export-form [cmd] [opts]` - Export a standalone form project (see `pnpm export-form --help`)

## Project Structure

```
transaction-form-builder/
├── .github/             # GitHub workflows and templates
├── .storybook/          # Storybook configuration
├── .husky/              # Git hooks
├── test/                # Shared test setup and utilities
├── packages/            # Monorepo packages
│   ├── core/            # Main application
│   │   ├── public/      # Static assets
│   │   ├── src/
│   │   │   ├── components/      # UI components
│   │   │   │   ├── ui/          # shadcn/ui components
│   │   │   │   ├── Common/      # Shared components across features
│   │   │   │   └── FormBuilder/ # Form builder components
│   │   │   ├── core/            # Chain-agnostic core functionality
│   │   │   │   ├── types/       # Core-specific Type definitions (distinct from packages/types)
│   │   │   │   ├── utils/       # Utility functions
│   │   │   │   ├── hooks/       # Shared hooks
│   │   │   │   ├── factories/   # Schema factories
│   │   │   │   └── adapterRegistry.ts # Central registration of adapter instances
│   │   │   ├── export/          # Export system
│   │   │   │   ├── generators/  # Form code generators
│   │   │   │   ├── codeTemplates/ # Individual file templates for generation
│   │   │   │   ├── templates/   # Base project structures for export
│   │   │   │   │   ├── typescript-react-vite/  # React + Vite template structure
│   │   │   │   │   └── ...                     # Future template structures
│   │   │   │   ├── cli/         # CLI tool for exporting forms
│   │   │   │   ├── ...          # Other export utilities
│   │   │   ├── services/        # Core services
│   │   │   ├── stories/         # Centralized Storybook stories
│   │   │   │   ├── common/      # Stories for common components
│   │   │   │   ├── form-builder/# Stories for form builder components
│   │   │   │   └── ui/          # Stories for UI components
│   │   │   ├── test/            # Package-specific tests
│   │   │   ├── mocks/           # Mock data for development and testing
│   │   │   ├── App.tsx          # Main application component
│   │   │   ├── main.tsx         # Application entry point
│   │   │   └── index.css        # Main CSS entry point (imports from @styles)
│   │   ├── vite-plugins/      # Custom Vite plugins (e.g., virtual modules)
│   │   ├── index.html           # HTML template
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   ├── vite.config.ts       # Vite configuration
│   │   └── ...                  # Other configuration files
│   ├── form-renderer/           # Shared form rendering library
│   │   ├── src/
│   │   │   ├── components/      # Form rendering components
│   │   │   │   ├── fields/      # Form field components
│   │   │   │   ├── layout/      # Form layout components
│   │   │   │   └── ui/          # UI components
│   │   │   ├── hooks/           # Form rendering hooks
│   │   │   ├── types/           # Type definitions
│   │   │   ├── utils/           # Utility functions
│   │   │   ├── stories/         # Form renderer specific stories
│   │   │   ├── test/            # Package-specific tests
│   │   │   └── index.ts         # Public API exports
│   │   ├── scripts/             # Build scripts
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   └── package.json         # Package configuration
│   ├── types/                   # Shared TypeScript type definitions
│   │   ├── src/
│   │   │   ├── adapters/        # Contract adapter interfaces
│   │   │   ├── contracts/       # Contract and blockchain types
│   │   │   ├── forms/           # Form field and layout definitions
│   │   │   └── index.ts         # Main entry point
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   └── package.json         # Package configuration
│   ├── styles/                  # Centralized styling system
│   │   ├── global.css           # Global CSS variables and base styles
│   │   ├── src/                 # Source directory for styles
│   │   ├── utils/               # Styling utilities
│   │   └── README.md            # Styling documentation
│   ├── adapter-evm/             # NEW: EVM Adapter Package
│   │   └── src/                 # Contains EvmAdapter implementation
│   ├── adapter-solana/          # NEW: Solana Adapter Package
│   │   └── src/                 # Contains SolanaAdapter implementation
│   ├── adapter-stellar/         # NEW: Stellar Adapter Package
│   │   └── src/                 # Contains StellarAdapter implementation
│   └── adapter-midnight/        # NEW: Midnight Adapter Package
│       └── src/                 # Contains MidnightAdapter implementation
├── tailwind.config.cjs  # Central Tailwind CSS configuration
├── postcss.config.cjs   # Central PostCSS configuration
├── components.json      # Central shadcn/ui configuration
├── scripts/             # Utility scripts
├── .eslint/             # Custom ESLint plugins and rules
├── tsconfig.base.json   # Base TypeScript configuration for all packages
├── tsconfig.json        # Root TypeScript configuration
├── vitest.shared.config.ts # Shared Vitest configuration
├── eslint.config.cjs    # Shared ESLint configuration
├── pnpm-workspace.yaml  # PNPM workspace configuration
├── package.json         # Root package configuration
└── ...                  # Other configuration files
```

## Architecture

The application uses a modular, domain-driven adapter pattern to support multiple blockchain ecosystems. For a detailed explanation of the adapter architecture and module responsibilities, please see the **[Adapter Architecture Guide](./docs/ADAPTER_ARCHITECTURE.md)**.

**Key Components:**

- **Core**: Chain-agnostic application logic, UI components, export system, and the central `adapterRegistry` for managing adapter instances.
- **Adapters (`packages/adapter-*`)**: Individual packages containing chain-specific implementations (e.g., `EvmAdapter`, `SolanaAdapter`). Each adapter conforms to the common `ContractAdapter` interface defined in `packages/types`. This includes methods for field mapping, transaction formatting, address validation, and discovering/validating execution methods.
- **Form Renderer**: Shared library containing form rendering components and common utilities (like logging).
- **Types**: Shared TypeScript type definitions across all packages, including the crucial `ContractAdapter` interface.
- **Styling System**: Centralized CSS variables and styling approach used across all packages.

This architecture allows for easy extension to support additional blockchain ecosystems without modifying the core application logic. The core package dynamically loads and uses adapters via the `adapterRegistry`, and the export system includes the specific adapter package needed for the target chain in exported forms. It utilizes **custom Vite plugins** to create **virtual modules**, enabling reliable loading of shared assets (like configuration files between packages) across package boundaries, ensuring consistency between development, testing, and exported builds.

### Adapter Pattern Enforcement

To maintain the integrity of the adapter pattern, this project includes:

- **Custom ESLint Rule**: Enforces that adapter implementations only include methods defined in the `ContractAdapter` interface
- **Automated Validation**: The `lint:adapters` command automatically discovers and validates all adapter implementations
- **CI Integration**: Adapter pattern compliance is checked on every pull request
- **Pre-Push Hook**: Prevents pushing code that violates the adapter pattern

These enforcement mechanisms ensure that the adapter interface remains the single source of truth for adapter implementations, preventing interface drift and maintaining architectural consistency.

For more detailed documentation about the adapter pattern, implementation guidelines, and validation rules, see the documentation within the [`packages/types/src/adapters/base.ts`](./packages/types/src/adapters/base.ts) file where the `ContractAdapter` interface is defined.

## Component Architecture

The project follows a structured component architecture centered around form rendering:

### Form Renderer Components

The form-renderer package provides a set of specialized components:

- **TransactionForm**: The main entry point for rendering transaction forms
- **DynamicFormField**: Renders appropriate field components based on field type
- **Field Components**: Specialized field implementations (TextField, NumberField, AddressField, etc.)

These components are designed to work exclusively with React Hook Form and should not be used standalone. All field components should be rendered through the DynamicFormField component, which handles field type mapping and validation integration.

### Storybook Integration

The project uses Storybook 8 for component documentation and development:

```bash
# Start Storybook at the root level
pnpm storybook

# Or start Storybook for a specific package
pnpm --filter=@openzeppelin/transaction-form-renderer storybook
```

Storybook stories are organized to:

- Document component usage and API
- Showcase different component states and variations
- Provide interactive examples for development
- Serve as visual regression tests

Stories are located in the `stories` directory of each package, with form-renderer components having the most comprehensive documentation.

## Code Style

### Git Hooks

This project uses Husky to enforce code quality using Git hooks:

- **pre-commit**: Runs lint-staged to format and lint staged files (Prettier first, then ESLint)
- **pre-push**: Runs comprehensive linting and formatting before pushing to remote
- **commit-msg**: Enforces conventional commit message format

These hooks ensure that code pushed to the repository maintains consistent quality and style.

### CSS Class Name Sorting

For consistent CSS class name sorting in Tailwind CSS, always run Prettier first, then ESLint:

```bash
# Recommended approach (runs formatting, then linting)
pnpm fix-all
```

This approach ensures that Tailwind CSS classes are consistently sorted by the prettier-plugin-tailwindcss plugin and prevents conflicts between formatting and linting tools.

### Shared Prettier Configuration

This project uses a single, shared Prettier configuration at the root of the monorepo. Individual packages **should not** include their own `.prettierrc` files. The root configuration includes:

- Common code style settings (single quotes, semi-colons, etc.)
- Tailwind CSS class sorting via prettier-plugin-tailwindcss
- Configuration for special utility functions like `cva`, `cn`, `clsx`, and `twMerge`

To format all packages:

```bash
pnpm format
```

### Import Sorting

Imports are automatically sorted in the following order:

1. React and related packages
2. External packages
3. Internal packages (alias imports starting with `@/`)
4. Parent imports (starting with `..`)
5. Other relative imports (starting with `.`)
6. Style imports
7. Type imports

This ordering is enforced by ESLint and automatically fixed on commit.

## Dependency Management

This project uses several tools to manage dependencies effectively:

- **pnpm**: Fast, disk space efficient package manager
- **check-deps script**: Custom utility to identify deprecated dependencies
- **update-deps script**: Easily update all dependencies to their latest versions
- **Dependencies workflow**: Regular checks for outdated dependencies
- **Update Dependencies workflow**: Weekly automated updates

### Checking for Outdated Dependencies

To see which dependencies are outdated:

```bash
pnpm outdated
```

### Updating Dependencies

For regular updates (respecting semver):

```bash
pnpm update-deps
```

For major version updates (may include breaking changes):

```bash
pnpm update-deps:major
```

### Automated Updates

The project is configured with:

1. **Update Dependencies workflow**: Runs weekly to check for and apply updates

## Adding New Adapters

To add support for a new blockchain ecosystem:

1.  **Create Package**: Create a new directory `packages/adapter-<chain-name>` (e.g., `packages/adapter-sui`).
2.  **Define `package.json`**:
    - Set the package name (e.g., `@openzeppelin/transaction-form-adapter-sui`).
    - Add a dependency on `@openzeppelin/transaction-form-types` (`workspace:*`).
    - Add any chain-specific SDKs or libraries required by the adapter.
    - Include standard build scripts (refer to existing adapter packages).
3.  **Define `tsconfig.json`**: Create a `tsconfig.json` extending the root `tsconfig.base.json`.
4.  **Implement Adapter**:
    - Create `src/adapter.ts`.
    - Import `ContractAdapter` and related types from `@openzeppelin/transaction-form-types/adapters`.
    - Implement the `ContractAdapter` interface with chain-specific logic.
5.  **Export Adapter**: Create `src/index.ts` and export the adapter class (e.g., `export { SuiAdapter } from './adapter';`).
6.  **Register Adapter**:
    - Open `packages/core/src/core/adapterRegistry.ts`.
    - Import the new adapter class.
    - Add an entry to the `adapterInstances` map (e.g., `sui: new SuiAdapter()`).
    - Add an entry to the `adapterPackageMap` (e.g., `sui: '@openzeppelin/transaction-form-adapter-sui'`).
7.  **Workspace**: Ensure the new package is included in the `pnpm-workspace.yaml` (if not covered by `packages/*`).
8.  **Build & Test**:
    - Build the new adapter package (`pnpm --filter @openzeppelin/transaction-form-adapter-<chain-name> build`).
    - Add relevant unit/integration tests.
    - Ensure the core application (`pnpm --filter @openzeppelin/transaction-form-core build`) and the export system still function correctly.

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for
more details.

Example:

```
feat(ui): add button component
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Security

Please read [SECURITY.md](./SECURITY.md) for details on our security policy and how to report vulnerabilities.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and delivery:

- **CI Workflow**: Runs tests, linting, and type checking for all packages
- **Coverage Workflow**: Generates and uploads test coverage reports
- **Release Workflow**: Manages semantic versioning and releases for the main application
- **Form-Renderer Publish Workflow**: Builds and tests the form-renderer package automatically when changes are merged to main
- **Security Workflow**: Checks for security vulnerabilities
- **Dependencies Workflow**: Checks for outdated dependencies
- **Update Dependencies Workflow**: Automatically updates dependencies

### Package Publishing

> **Note**: Automatic publishing is currently disabled during early development. The workflow is configured but commented out until the package is
> ready for production release.

The form-renderer package will be automatically published to npm when changes are merged to the main branch once publishing is enabled. Currently,
the workflow only builds and tests the package without publishing.

The publishing process (when enabled):

1. Runs when code is pushed to the main branch or via manual trigger
2. Runs tests and builds the package
3. Uses semantic-release to determine the next version based on commit messages
4. Publishes to npm with appropriate tags
5. Creates a GitHub release with generated release notes

Manual releases can be triggered through the GitHub Actions interface with a version parameter when needed during development.

## Monorepo Configuration

This project uses a centralized configuration approach to maintain consistency across all packages:

### Shared Configurations

- **tailwind.config.cjs**: Root configuration for Tailwind CSS, used by all packages
- **postcss.config.cjs**: Root configuration for PostCSS, used by all packages
- **components.json**: Root configuration for shadcn/ui components, used by all packages

Each package has symlinks to these root configuration files, ensuring consistent styling, processing, and component behavior across the entire
monorepo.

### Symlink Structure

To ensure consistency, the following packages use symlinks pointing to the root configuration files (`tailwind.config.cjs`, `postcss.config.cjs`, `components.json`):

- **Core Package**: Links to root configuration files.
- **Form Renderer Package**: Links to root configuration files.
- **Styles Package**: Links to root configuration files.

During the export process, these symlinks are resolved to create standalone configuration files with the appropriate settings for the exported
project.
