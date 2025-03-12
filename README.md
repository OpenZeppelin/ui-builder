# Transaction Form Builder

A modern web application for building and customizing transaction forms for blockchain applications.

## Status

This project is currently in development.

[![CI](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/ci.yml)
[![Coverage](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/coverage.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/coverage.yml)
[![codecov](https://codecov.io/gh/OpenZeppelin/transaction-form-builder/branch/main/graph/badge.svg)](https://codecov.io/gh/OpenZeppelin/transaction-form-builder)
[![Release](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/release.yml/badge.svg)](https://github.com/OpenZeppelin/transaction-form-builder/actions/workflows/release.yml)
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

## Features

- Modern React components for building transaction forms
- Customizable UI with Tailwind CSS and shadcn/ui
- Type-safe with TypeScript
- Fast development with Vite
- Component documentation with Storybook
- Comprehensive test suite with Vitest
- Automated dependency management and security checks

## Tech Stack

- **React 19**: UI library with modern hooks API and concurrent features
- **TypeScript 5.8+**: Enhanced type safety with template literal types
- **Vite 6**: Fast, modern build tool and dev server
- **Tailwind CSS v4**: Next-gen utility-first CSS framework with new HSL theme syntax
- **shadcn/ui**: Unstyled, accessible component system built on Radix UI
- **pnpm**: Fast, disk-efficient package manager
- **Vitest**: Testing framework integrated with Vite
- **Storybook 8**: Component documentation and visual testing
- **Semantic Release**: Automated versioning and releases
- **ESLint 9**: Modern linting with improved TypeScript support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
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
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm lint:all-fix` - Fix ESLint issues across all file types
- `pnpm lint:config-files` - Fix linting in configuration files
- `pnpm fix-all` - Run all linting and formatting fixes at once
- `pnpm lint:imports` - Fix import sorting
- `pnpm preview` - Preview the production build
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check formatting without making changes
- `pnpm ui:add` - Add shadcn/ui components
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for production
- `pnpm check-deps` - Check for deprecated dependencies
- `pnpm update-deps` - Update dependencies to their latest versions
- `pnpm update-deps:major` - Update dependencies including major versions
- `pnpm outdated` - List outdated dependencies

## Project Structure

```
transaction-form-builder/
├── .github/             # GitHub workflows and templates
├── .storybook/          # Storybook configuration
├── public/              # Static assets
├── scripts/             # Utility scripts
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Custom components
│   ├── core/            # Chain-agnostic core functionality
│   │   ├── types/       # Type definitions
│   │   ├── utils/       # Utility functions
│   │   └── hooks/       # Shared hooks
│   ├── adapters/        # Chain-specific implementations
│   │   └── evm/         # Ethereum Virtual Machine adapter
│   ├── services/        # Core services
│   ├── test/            # Test setup and utilities
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles with Tailwind v4 theme
├── components.json      # shadcn/ui configuration
├── index.html           # HTML template
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── vitest.config.ts     # Vitest configuration
├── tailwind.config.cjs  # Tailwind CSS v4 configuration
└── ...                  # Other configuration files
```

## Code Style

### Git Hooks

This project uses Husky to enforce code quality using Git hooks:

- **pre-commit**: Runs lint-staged to format and lint staged files
- **pre-push**: Runs comprehensive linting and formatting before pushing to remote
- **commit-msg**: Enforces conventional commit message format

These hooks ensure that code pushed to the repository maintains consistent quality and style.

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

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for more details.

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
