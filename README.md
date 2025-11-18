# UI Builder 🧩

> Spin up a front-end for any contract call in seconds. Select the function, auto-generate a React UI with wallet connect and multi-network support, and export a complete app.

## Project Status

This project is currently in development.

[![CI](https://github.com/OpenZeppelin/ui-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenZeppelin/ui-builder/actions/workflows/ci.yml)
[![Coverage](https://github.com/OpenZeppelin/ui-builder/actions/workflows/coverage.yml/badge.svg)](https://github.com/OpenZeppelin/ui-builder/actions/workflows/coverage.yml)
[![codecov](https://codecov.io/gh/OpenZeppelin/ui-builder/branch/main/graph/badge.svg)](https://codecov.io/gh/OpenZeppelin/ui-builder)
[![Publish](https://github.com/OpenZeppelin/ui-builder/actions/workflows/publish.yml/badge.svg)](https://github.com/OpenZeppelin/ui-builder/actions/workflows/publish.yml)
[![Dependencies](https://github.com/OpenZeppelin/ui-builder/actions/workflows/dependencies.yml/badge.svg)](https://github.com/OpenZeppelin/ui-builder/actions/workflows/dependencies.yml)
[![Dependency Review](https://github.com/OpenZeppelin/ui-builder/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/OpenZeppelin/ui-builder/actions/workflows/dependency-review.yml)
[![Update Dependencies](https://github.com/OpenZeppelin/ui-builder/actions/workflows/update-dependencies.yml/badge.svg)](https://github.com/OpenZeppelin/ui-builder/actions/workflows/update-dependencies.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/OpenZeppelin/ui-builder/badge)](https://api.securityscorecards.dev/projects/github.com/OpenZeppelin/ui-builder)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Storybook](https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=white)](https://storybook.js.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintainability](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability)](https://codeclimate.com/github/OpenZeppelin/ui-builder/maintainability)

## Table of Contents

- [Monorepo Structure](#monorepo-structure)
- [Packages](#packages)
  - [Builder Package](#builder-package)
  - [React Core Package](#react-core-package)
  - [Renderer Package](#renderer-package)
  - [UI Package](#ui-package)
  - [Utils Package](#utils-package)
  - [Types Package](#types-package)
  - [Styles Package](#styles-package)
  - [Storage Package](#storage-package)
  - [EVM Adapter](#evm-adapter)
  - [Solana Adapter](#solana-adapter)
  - [Stellar Adapter](#stellar-adapter)
  - [Midnight Adapter](#midnight-adapter)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running with Docker (Recommended)](#running-with-docker-recommended)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
  - [Core Packages](#core-packages)
  - [Adapter Packages](#adapter-packages)
  - [Configuration Structure](#configuration-structure)
- [Architecture](#architecture)
- [Project Constitution](#project-constitution)
- [Build System](#build-system)
  - [Adapter Pattern Enforcement](#adapter-pattern-enforcement)
- [Component Architecture](#component-architecture)
  - [Renderer Components](#renderer-components)
  - [Storybook Integration](#storybook-integration)
- [Code Style](#code-style)
  - [Git Hooks](#git-hooks)
  - [CSS Class Name Sorting](#css-class-name-sorting)
  - [Shared Prettier Configuration](#shared-prettier-configuration)
  - [Import Sorting](#import-sorting)
- [Dependency Management](#dependency-management)
  - [Exported Package Versions](#exported-package-versions)
  - [Checking for Outdated Dependencies](#checking-for-outdated-dependencies)
  - [Updating Dependencies](#updating-dependencies)
  - [Automated Updates](#automated-updates)
- [Adding New Adapters](#adding-new-adapters)
- [Commit Convention](#commit-convention)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [CI/CD Pipeline](#cicd-pipeline)
  - [Package Publishing](#package-publishing)
- [Monorepo Configuration](#monorepo-configuration)
  - [Shared Configurations](#shared-configurations)
- [Runtime Configuration](#runtime-configuration)
  - [Builder Application Configuration (Development)](#builder-application-configuration-development)
  - [Exported Application Configuration](#exported-application-configuration)

## Monorepo Structure

This project is organized as a monorepo with the following packages:

- **packages/builder**: The main application with the builder app UI and core logic.
- **packages/react-core**: Contains core React context providers and hooks (AdapterProvider, WalletStateProvider, useWalletState) for managing global wallet/network state and adapter interactions. Used by `@builder` and exported apps.
- **packages/renderer**: The shared app rendering library (published to npm), responsible for dynamically rendering forms and other components based on schemas and an active adapter.
- **packages/ui**: Contains shared React UI components, including basic primitives (buttons, inputs, cards) and specialized form field components. Used by `builder` and `renderer` to ensure a consistent look and feel.
- **packages/storage**: Local storage services built on IndexedDB for persisting contract UI configurations, providing history, auto-save, and import/export capabilities.
- **packages/types**: Shared TypeScript type definitions for all packages (published to npm).
- **packages/styles**: Centralized styling system with shared CSS variables and configurations.
- **packages/utils**: Shared, framework-agnostic utility functions (e.g., logger, app configuration service).
- **packages/adapter-evm**: Adapter implementation for EVM-compatible chains.
- **packages/adapter-solana**: Adapter implementation for the Solana blockchain.
- **packages/adapter-stellar**: Adapter implementation for the Stellar network.
- **packages/adapter-midnight**: Adapter implementation for the Midnight blockchain.

## Packages

### Builder Package

The main application with the builder UI, export system, and core logic.

For more details, see the [Builder README](./packages/builder/README.md).

### React Core Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-react-core.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-react-core)

Core React providers and hooks (AdapterProvider, WalletStateProvider, useWalletState) for managing adapter and wallet state.

For more details, see the [React Core README](./packages/react-core/README.md).

### Renderer Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-renderer.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-renderer)

The `renderer` package provides a reusable library for rendering transaction forms and other components. It's published to npm and can be used independently of the main application.

Features:

- Lightweight app rendering components
- Framework-agnostic design
- TypeScript support with full type definitions
- Support for both ESM and CommonJS environments
- Customizable styling options

For more details, see the [Renderer README](./packages/renderer/README.md).

### Types Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-types.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-types)

The `types` package contains shared TypeScript type definitions for all packages in the ecosystem. It serves as the single source of truth for types used across the UI Builder.

Features:

- Centralized type definitions
- Organized namespaces for contracts, adapters, and forms
- Clear separation of concerns
- TypeScript project references for proper type checking

For more details, see the [Types README](./packages/types/README.md).

### Styles Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-styles.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-styles)

The `styles` package contains the centralized styling system used across all packages. It provides consistent theming, spacing, and component styles throughout the application.

Features:

- Shared CSS variables with direct OKLCH color values
- Consistent form component spacing
- Dark mode support
- Tailwind CSS v4 integration

For more details, see the [Styles README](./packages/styles/README.md).

### Storage Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-storage.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-storage)

The `storage` package provides local storage services built on IndexedDB using Dexie.js for persisting contract UI configurations. It enables a complete history and auto-save system for the builder application.

Features:

- Generic storage base class for extensible type-safe storage services
- Reactive updates with automatic UI synchronization across browser tabs
- Complete CRUD operations with performance optimization for 1000+ records
- Built-in auto-save functionality with debouncing and duplicate operation prevention
- Import/export capabilities for sharing configurations as JSON files
- Full TypeScript support with proper type definitions
- Integration with React hooks for seamless UI state management

For more details, see the [Storage README](./packages/storage/README.md).

### UI Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-ui.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-ui)

Shared UI primitives and form field components for a consistent UX across builder and renderer.

For more details, see the [UI README](./packages/ui/README.md).

### Utils Package

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-utils.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-utils)

Framework-agnostic utilities like logging, runtime configuration, validation, and helpers.

For more details, see the [Utils README](./packages/utils/README.md).

### EVM Adapter

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-adapter-evm.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-adapter-evm)

_Status: Fully implemented._

Adapter implementation for EVM-compatible chains.

For more details, see the [EVM Adapter README](./packages/adapter-evm/README.md).

### Solana Adapter

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-adapter-solana.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-adapter-solana)

_Status: Scaffolding._

Adapter implementation for Solana.

For more details, see the [Solana Adapter README](./packages/adapter-solana/README.md).

### Stellar Adapter

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-adapter-stellar.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-adapter-stellar)

_Status: Fully Implemented._

Adapter implementation for Stellar (Soroban).

For more details, see the [Stellar Adapter README](./packages/adapter-stellar/README.md).

### Midnight Adapter

[![npm version](https://img.shields.io/npm/v/@openzeppelin/ui-builder-adapter-midnight.svg)](https://www.npmjs.com/package/@openzeppelin/ui-builder-adapter-midnight)

_Status: In progress._

Adapter implementation for Midnight.

For more details, see the [Midnight Adapter README](./packages/adapter-midnight/README.md).

## Features

- Chain-agnostic architecture supporting multiple blockchain ecosystems
- Adapter pattern for easily adding support for new blockchains
- Modern React components for building transaction forms
- Customizable UI with Tailwind CSS and shadcn/ui
- **Local Storage & History**: Complete auto-save system with IndexedDB-based persistence for contract UI configurations
- **Import/Export**: Save and share configurations as JSON files with built-in validation
- **Multi-tab Synchronization**: Real-time synchronization of saved configurations across browser tabs
- Handles wallet connection state consistently in both builder app and exported forms
- Configure transaction execution methods (EOA, Relayer, Multisig) via a powerful Execution Strategy pattern
- Type-safe with TypeScript
- Fast development with Vite
- Component documentation with Storybook
- Comprehensive test suite with Vitest
- Automated dependency management and security checks

## Tech Stack

- **React**: UI library supporting both React 18 and 19 with modern hooks API
- **TypeScript 5.8+**: Enhanced type safety with template literal types
- **Vite 6**: Fast, modern build tool and dev server with standardized library builds
- **Tailwind CSS v4**: Next-gen utility-first CSS framework with OKLCH color format
- **shadcn/ui**: Unstyled, accessible component system built on Radix UI
- **pnpm (v9 or higher)**: Fast, disk-efficient package manager
- **Vitest**: Testing framework integrated with Vite
- **Storybook 8**: Component documentation and visual testing
- **Zustand**: Lightweight, performant state management for React
- **Changesets**: Automated versioning and package releases
- **ESLint 9**: Modern linting with improved TypeScript support
- **tsup**: Fast, modern bundler for TypeScript libraries
- **Vite**: Used for the builder application's dev server
- **Dexie.js**: Modern IndexedDB wrapper for local storage and offline capabilities
- **@openzeppelin/relayer-sdk**: For gasless transaction support via the Relayer execution method.

## Getting Started

### Prerequisites

- Node.js (v20.11.1 or higher)
- pnpm (v9 or higher)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OpenZeppelin/ui-builder.git
   cd ui-builder
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build all packages:

   ```bash
   pnpm build
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Running with Docker (Recommended)

For a consistent and reliable development environment, it is highly recommended to run the application using Docker. This avoids potential issues with local Node.js, pnpm, or operating system configurations.

1. **Prerequisites**: Make sure you have Docker and Docker Compose installed on your system.

2. **Build and Run the Container**:

   ```bash
   docker-compose up --build
   ```

   This command will build the Docker image and start the application. Once it's running, you can access it at `http://localhost:3000`.

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
- `pnpm changeset` - Create a changeset for your changes
- `pnpm update-deps` - Update all monorepo dependencies to their latest versions
- `pnpm update-deps:major` - Update dependencies including major versions
- `pnpm check-deps` - Check for deprecated dependencies
- `pnpm outdated` - List outdated dependencies across the monorepo
- `pnpm export-app [cmd] [opts]` - Export a standalone form project (see `pnpm export-app --help`)
- `pnpm update-export-versions` - Update the hardcoded versions of internal packages used in exported forms

## Project Structure

This monorepo is organized into several specialized packages, each with a specific purpose:

### Core Packages

- **[packages/builder/](./packages/builder/README.md)** - Main application with builder UI, export system, and core logic
- **[packages/renderer/](./packages/renderer/README.md)** - Shared library for rendering transaction forms and components (published to npm)
- **[packages/react-core/](./packages/react-core/README.md)** - Core React providers and hooks for wallet/adapter state management
- **[packages/ui/](./packages/ui/README.md)** - Shared UI components and form field components
- **[packages/storage/](./packages/storage/README.md)** - Local storage services with IndexedDB for configuration persistence
- **[packages/types/](./packages/types/README.md)** - Shared TypeScript type definitions (published to npm)
- **[packages/styles/](./packages/styles/README.md)** - Centralized styling system with CSS variables and configurations
- **[packages/utils/](./packages/utils/README.md)** - Framework-agnostic utility functions

### Adapter Packages

- **[packages/adapter-evm/](./packages/adapter-evm/README.md)** - EVM-compatible chains (Ethereum, Polygon, BSC, etc.)
- **[packages/adapter-solana/](./packages/adapter-solana/README.md)** - Solana blockchain implementation
- **[packages/adapter-stellar/](./packages/adapter-stellar/README.md)** - Stellar network implementation
- **[packages/adapter-midnight/](./packages/adapter-midnight/README.md)** - Midnight blockchain implementation

### Configuration Structure

```text
ui-builder/
├── .github/             # GitHub workflows and templates
├── .storybook/          # Storybook configuration
├── .husky/              # Git hooks
├── test/                # Shared test setup and utilities
├── packages/            # Monorepo packages (see individual READMEs for detailed structure)
├── scripts/             # Utility scripts
├── tailwind.config.cjs  # Central Tailwind CSS configuration
├── postcss.config.cjs   # Central PostCSS configuration
├── components.json      # Central shadcn/ui configuration
├── tsconfig.base.json   # Base TypeScript configuration for all packages
├── pnpm-workspace.yaml  # PNPM workspace configuration
└── ...                  # Other configuration files
```

For detailed internal structure of each package, please refer to the individual package README files linked above.

## Architecture

The application uses a modular, domain-driven adapter pattern to support multiple blockchain ecosystems. For a detailed explanation of the adapter architecture and module responsibilities, please see the **[Adapter Architecture Guide](./docs/ADAPTER_ARCHITECTURE.md)**.

**Key Components:**

- **Builder**: Chain-agnostic application logic, UI components, and the export system. It includes:
  - The `ecosystemManager.ts` for discovering network configurations and adapter capabilities.
  - **Modular State Management**: Decomposed hook architecture with specialized responsibilities.
  - **Application Sidebar**: Complete UI for managing saved configurations with import/export capabilities

- **Storage System (`packages/storage`)**: IndexedDB-based persistence layer built on Dexie.js providing:
  - **Auto-Save Engine**: Debounced saving with in-memory caching and global coordination
  - **Multi-Tab Synchronization**: Real-time updates across browser tabs
  - **Import/Export**: JSON-based configuration sharing with validation
  - **CRUD Operations**: Complete lifecycle management for contract UI configurations
  - **Performance Optimization**: Efficient handling of 1000+ records with reactive updates

- **Adapters (`packages/adapter-*`)**: Individual packages containing chain-specific implementations (e.g., `EvmAdapter`, `SolanaAdapter`). Each adapter conforms to the common `ContractAdapter` interface defined in `packages/types`. Adapters are instantiated with a specific `NetworkConfig`, making them network-aware. The `builder` package (via providers from `@openzeppelin/ui-builder-react-core`) dynamically loads and uses these adapters. Furthermore, adapters can optionally provide UI-specific functionalities:
  - **React UI Context Provider** (e.g., for `wagmi/react` on EVM): `WalletStateProvider` (from `@openzeppelin/ui-builder-react-core`) consumes this to set up the necessary app-wide context for the active adapter.
  - **Facade Hooks** (e.g., `useAccount`, `useSwitchChain`): These are exposed by `WalletStateProvider` (via `useWalletState().walletFacadeHooks` from `@openzeppelin/ui-builder-react-core`) for UI components to interact with wallet functionalities reactively and agnostically.
  - **Standardized UI Components** (e.g., `ConnectButton`): These components are retrieved via `activeAdapter.getEcosystemWalletComponents()` and are expected to internally use the facade hooks.

- **Renderer**: Shared library containing app rendering components and common utilities (like logging).

- **React Core (`packages/react-core`)**: Centralized React state management providing:
  - **Adapter Provider**: Singleton pattern for adapter instance management
  - **Wallet State Provider**: Global wallet/network state coordination
  - **Context Hooks**: `useWalletState()` and `useAdapterContext()` for consistent state access

- **UI Components (`packages/ui`)**: Comprehensive component library including:
  - **Basic Primitives**: Buttons, inputs, cards, dialogs following shadcn/ui patterns
  - **Form Fields**: Specialized components for React Hook Form integration
  - **Field Utilities**: Validation, accessibility, and layout helpers

- **Types**: Shared TypeScript type definitions across all packages, including the crucial `ContractAdapter` interface and types for adapter UI enhancements.

- **Styling System**: Centralized CSS variables and styling approach used across all packages.

This architecture allows for easy extension to support additional blockchain ecosystems without modifying the builder application logic. The `builder` package dynamically loads and uses adapters via `ecosystemManager.ts` and the provider model (from `@openzeppelin/ui-builder-react-core`) and the export system includes the specific adapter package needed for the target chain in exported forms. It utilizes **custom Vite plugins** to create **virtual modules**, enabling reliable loading of shared assets (like configuration files between packages) across package boundaries, ensuring consistency between development, testing, and exported builds.

## Project Constitution

This project is governed by the UI Builder Constitution. Please read it before contributing changes that affect architecture, adapters, or tooling:

- [./.specify/memory/constitution.md](./.specify/memory/constitution.md)

## Build System

The project uses a standardized `tsup`-based build system for all library packages, ensuring proper ES module output with correct import extensions:

- **tsup**: All library packages are built using `tsup` to generate both ES modules (`.js`) and CommonJS (`.cjs`) formats.
- **TypeScript**: The TypeScript compiler (`tsc`) is used alongside `tsup` to generate declaration files (`.d.ts`).
- **ES Module Support**: The dual-format build ensures packages can be consumed in both modern and legacy JavaScript environments.
- **Optimized Output**: Builds are configured for optimal tree-shaking and performance.

Each package contains its own `tsup.config.ts` and the `build` script in its `package.json` orchestrates the two-stage build process. This ensures consistency and reliability across the monorepo.

### Adapter Pattern Enforcement

To maintain the integrity of the adapter pattern, this project includes:

- **Custom ESLint Rule**: Enforces that adapter implementations only include methods defined in the `ContractAdapter` interface
- **Automated Validation**: The `lint:adapters` command automatically discovers and validates all adapter implementations
- **CI Integration**: Adapter pattern compliance is checked on every pull request
- **Pre-Push Hook**: Prevents pushing code that violates the adapter pattern

These enforcement mechanisms ensure that the adapter interface remains the single source of truth for adapter implementations, preventing interface drift and maintaining architectural consistency.

For more detailed documentation about the adapter pattern, implementation guidelines, and validation rules, see the documentation within the [`packages/types/src/adapters/base.ts`](./packages/types/src/adapters/base.ts) file where the `ContractAdapter` interface is defined.

## Component Architecture

The project follows a structured component architecture centered around app rendering:

### Renderer Components

The renderer package provides the core `TransactionForm` component for rendering transaction forms. It dynamically selects and renders appropriate field components using its `DynamicFormField` component. The actual UI primitives and field component implementations (like `TextField`, `AddressField`, `Button`, `Input`) are sourced from the `@openzeppelin/ui-builder-ui` package.

These field components are designed to work exclusively with React Hook Form and are orchestrated by `DynamicFormField`.

### Storybook Integration

The project uses Storybook 8 for component documentation and development:

```bash
# Start Storybook at the root level
pnpm storybook

# Or start Storybook for a specific package
pnpm --filter=@openzeppelin/ui-builder-renderer storybook
```

Storybook stories are organized to:

- Document component usage and API
- Showcase different component states and variations
- Provide interactive examples for development
- Serve as visual regression tests

Stories are located in the `stories` directory of each package, with renderer components having the most comprehensive documentation.

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

### Exported Package Versions

The versions of internal `@openzeppelin/` packages used in exported forms are centrally managed in the `packages/builder/src/export/versions.ts` file. This ensures that all exported projects use stable, tested, and reproducible dependency versions.

To update these versions to the latest published releases, run the following command from the root of the monorepo:

```bash
pnpm update-export-versions
```

This script will fetch the latest versions from the npm registry and update the `versions.ts` file automatically.

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

1. **Create Package**: Create a new directory `packages/adapter-<chain-name>` (e.g., `packages/adapter-sui`).
2. **Define `package.json`**:
   - Set the package name (e.g., `@openzeppelin/ui-builder-adapter-sui`).
   - Add a dependency on `@openzeppelin/ui-builder-types` (`workspace:*`).
   - Add any chain-specific SDKs or libraries required by the adapter.
   - Include standard build scripts (refer to existing adapter packages).
   - **Important**: Ensure your package exports a named array of its `NetworkConfig[]` objects (e.g., `export const suiNetworks = [...]`) and its main `Adapter` class from its entry point (`src/index.ts`).
3. **Define `tsconfig.json`**: Create a `tsconfig.json` extending the root `tsconfig.base.json`.
4. **Implement Adapter**:
   - Create `src/adapter.ts`.
   - Import `ContractAdapter`, the specific `YourEcosystemNetworkConfig` (e.g., `SuiNetworkConfig`), and related types from `@openzeppelin/ui-builder-types`.
   - Implement the `ContractAdapter` interface. The constructor **must** accept its specific `NetworkConfig` (e.g., `constructor(networkConfig: SuiNetworkConfig)`).
   - Implement methods to use `this.networkConfig` internally for network-specific operations (e.g., initializing HTTP clients with RPC URLs from the config).
5. **Define Network Configurations**:\
   - Create `src/networks/mainnet.ts`, `testnet.ts`, etc., defining `YourEcosystemNetworkConfig` objects for each supported network.
   - Each network config must provide all necessary details for the adapter to function, such as RPC endpoints (`rpcUrl` or `rpcEndpoint`), chain identifiers (`chainId` for EVM), explorer URLs, native currency details, etc., as defined by its `YourEcosystemNetworkConfig` interface.
   - Create `src/networks/index.ts` to export the combined list of networks (e.g., `export const suiNetworks = [...mainnetSuiNetworks, ...testnetSuiNetworks];`) and also export each network configuration individually by its constant name (e.g., `export { suiMainnet, suiTestnet } from './mainnet';`).
6. **Export Adapter & Networks**: Create `src/index.ts` in your adapter package and export the adapter class (e.g., `export { SuiAdapter } from './adapter';`) and the main networks array (e.g., `export { suiNetworks } from './networks';`). It's also good practice to re-export individual network configurations from the adapter's main entry point if they might be directly imported by consumers.
7. **Register Ecosystem in Builder**:
   - Open `packages/builder/src/core/ecosystemManager.ts`.
   - Import the new adapter class (e.g., `import { SuiAdapter } from '@openzeppelin/ui-builder-adapter-sui';`).
   - Add a new entry to the `ecosystemRegistry` object. This entry defines:
     - `networksExportName`: The string name of the exported network list (e.g., 'suiNetworks'). This is used by the `EcosystemManager` to dynamically load all network configurations for an ecosystem.
     - `AdapterClass`: The constructor of your adapter (e.g., `SuiAdapter as AnyAdapterConstructor`).
   - Add a case for your new ecosystem in the `switch` statement within `loadAdapterPackageModule` to enable dynamic import of your adapter package module (which should export the `AdapterClass` and the `networksExportName` list).
   - Note: If the adapter requires specific package dependencies for _exported projects_ (beyond its own runtime dependencies), these are typically managed by the `PackageManager` configuration within the adapter package itself (e.g., an `adapter.config.ts` file exporting dependency details).
8. **Workspace**: Ensure the new package is included in the `pnpm-workspace.yaml` (if not covered by `packages/*`).
9. **Build & Test**:
   - Build the new adapter package (`pnpm --filter @openzeppelin/ui-builder-adapter-<chain-name> build`).
   - Add relevant unit/integration tests.
   - Ensure the builder application (`pnpm --filter @openzeppelin/ui-builder-app build`) and the export system still function correctly.

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for
more details.

Example:

```text
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
- **Release Workflow**: Manages versioning and releases using Changesets
- **Renderer Publish Workflow**: Builds and tests the renderer package automatically when changes are merged to main
- **Security Workflow**: Checks for security vulnerabilities
- **Dependencies Workflow**: Checks for outdated dependencies
- **Update Dependencies Workflow**: Automatically updates dependencies

### Package Publishing

The project uses [Changesets](https://github.com/changesets/changesets) for managing package versions and releases. All public packages in the monorepo are published to the npm registry.

The publishing process:

1. Developers create changesets for their changes using `pnpm changeset`
2. Changesets are committed alongside the code changes
3. When changes are pushed to the main branch, the GitHub Action:
   - Creates a "Version Packages" PR that aggregates all changesets
   - Updates package versions according to the changesets
   - Updates changelogs for affected packages
4. When the Version Packages PR is merged:
   - Packages are automatically published to npm
   - Git tags are created for each published package version
   - GitHub releases are created with changelogs

To create a changeset for your changes:

```bash
pnpm changeset
```

This will prompt you to:

- Select which packages have changed
- Specify the type of change (major, minor, patch)
- Provide a description of the changes for the changelog

## Monorepo Configuration

This project uses a centralized configuration approach to maintain consistency across all packages:

### Shared Configurations

- **tailwind.config.cjs**: Root configuration for Tailwind CSS, used by all packages
- **postcss.config.cjs**: Root configuration for PostCSS, used by all packages
- **components.json**: Root configuration for shadcn/ui components, referenced by packages

Packages consume these root configs via:

- JS proxy files (`packages/*/tailwind.config.cjs` and `packages/*/postcss.config.cjs`) that require the root configs
- Per-package `components.json` files (regular JSON) that reference the package CSS entry (e.g., `../styles/global.css`)

During the export process, proxy configs and JSON are included to create standalone configuration files for the exported project.

## Runtime Configuration

Both the main UI Builder application and its exported forms support runtime configuration for certain parameters. This is primarily managed via an `AppConfigService` and allows customization without rebuilding the application code.

### Builder Application Configuration (Development)

During development of the builder application, configurations are typically provided via Vite environment variables defined in `.env` files (e.g., `.env.local`). These variables usually follow a prefix like `VITE_APP_CFG_...`.

Key configurable items include:

- **Explorer API Keys:** For services like Etherscan, PolygonScan, etc., used by adapters to fetch ABIs. Example: `VITE_APP_CFG_API_KEY_ETHERSCAN_MAINNET="your_key"`.
- **WalletConnect Project ID:** For EVM adapter's WalletConnect functionality. Example: `VITE_APP_CFG_SERVICE_WALLETCONNECT_PROJECT_ID="your_id"`.
- **RPC URL Overrides:** To use custom RPC endpoints instead of public defaults for specific networks. Example: `VITE_APP_CFG_RPC_ENDPOINT_ETHEREUM_MAINNET="https://your_custom_rpc.com"`.
- **Indexer Endpoint Overrides:** To configure GraphQL indexer endpoints for historical blockchain data queries (e.g., access control events). Example: `VITE_APP_CFG_INDEXER_ENDPOINT_STELLAR_TESTNET="https://your_indexer.com/graphql"`.

### Exported Application Configuration

Exported forms include a `public/app.config.json` file. Users of the exported form should edit this file to provide their own API keys and RPC URLs.

The structure of this JSON file includes sections for:

- `networkServiceConfigs`: For explorer API keys, keyed by a service identifier (e.g., `"etherscan-mainnet"`).
- `globalServiceConfigs`: For global service parameters (e.g., `walletconnect.projectId`).
- `rpcEndpoints`: For RPC URL overrides, keyed by the network ID (e.g., `"ethereum-mainnet"`).
- `indexerEndpoints`: For indexer endpoint overrides, keyed by the network ID (e.g., `"stellar-testnet"`). Values can be strings (HTTP URL) or objects with `http` and `ws` properties.

Refer to the README included with the exported application for detailed instructions on configuring `public/app.config.json`.

<!-- Adapter-specific guides are documented in their respective package READMEs. -->
