# Contributing to Contracts UI Builder

Thank you for considering contributing to Contracts UI Builder! This document outlines the process for contributing to the project.

## Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit your changes following our [commit convention](./COMMIT_CONVENTION.md)
   - We recommend using our Commitizen setup: `pnpm commit`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Adding New Adapters

If you are contributing support for a new blockchain ecosystem, please follow the detailed instructions in the main **[README.md under the "Adding New Adapters" section](./README.md#adding-new-adapters)**.

Key steps include:

1.  **Familiarize Yourself:** Read the **[Adapter Architecture Guide](./docs/ADAPTER_ARCHITECTURE.md)** to understand the modular structure and responsibilities.
2.  **Package Setup**: Create a new `packages/adapter-<chain-name>` package with appropriate `package.json` (depending on `@openzeppelin/contracts-ui-builder-types`) and `tsconfig.json`.
3.  **Network Configurations**: Define `YourEcosystemNetworkConfig` objects in `src/networks/`, ensuring they provide all necessary details (RPC URLs, chain IDs, etc.). Export a combined list (e.g., `export const suiNetworks = [...]`) and individual configurations from `src/networks/index.ts`.
4.  **Adapter Implementation**: Implement the `ContractAdapter` interface from `@openzeppelin/contracts-ui-builder-types` in `src/adapter.ts`. The constructor must accept its specific `NetworkConfig` (e.g., `constructor(networkConfig: SuiNetworkConfig)`) and use `this.networkConfig` internally.
5.  **Exports**: Export your adapter class and the main networks array (and ideally individual network configs) from your adapter package's `src/index.ts`.
6.  **Ecosystem Registration**: Register your new ecosystem in `packages/builder/src/core/ecosystemManager.ts` by:
    - Adding an entry to `ecosystemRegistry` with the `AdapterClass` constructor and the `networksExportName` (the name of your exported network list).
    - Updating the `switch` statement in `loadAdapterPackageModule` to enable dynamic import of your adapter package.
7.  **Testing**: Add comprehensive unit and integration tests for your adapter's logic and network configurations.
8.  **Documentation**: Update any relevant documentation.

## Pull Request Process

1. Ensure your code follows the style guidelines of the project
2. Update the README.md with details of changes if applicable
3. The PR should work for Node.js version 20.11.1 or higher
4. Include tests for new features or bug fixes
5. Link any relevant issues in the PR description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/contracts-ui-builder.git

# Navigate to the project directory
cd contracts-ui-builder

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for production
- `pnpm commit` - Interactive commit message builder (Commitizen)

## Coding Standards

- Follow the existing code style
- Write tests for your changes
- Keep pull requests focused on a single topic
- Add proper documentation for new features
- Use the shared Prettier configuration at the root of the repository
  - Don't add package-specific `.prettierrc` files
  - Run `pnpm format` to format all code before committing
  - When making CSS changes with Tailwind, use the `fix-all` script: `pnpm fix-all`

## Build System

All library packages in this monorepo use `tsup` for building. Key points to remember:

- **tsup Configuration**: Each package has its own `tsup.config.ts` file.
- **Two-Stage Build**: The `build` script in each package's `package.json` first runs `tsup` to bundle the code, then runs `tsc --emitDeclarationOnly` to generate TypeScript declaration files.
- **ES Modules**: All packages output both ES modules and CommonJS formats.
- **Building Packages**: Run `pnpm build` at the root to build all packages, or `pnpm --filter <package-name> build` for a specific package.
- **TypeScript**: Each package has its own `tsconfig.json` that extends the base configuration.

When creating new packages:

1. Create a `tsup.config.ts` file for the package.
2. Update the `build` script in `package.json` to be `tsup && tsc --emitDeclarationOnly --outDir dist`.
3. Ensure your `package.json` has proper `exports` configuration for both ESM and CJS.
4. Set `"type": "module"` in your `package.json`.

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). See our [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for more details.

To make it easier to follow the convention, we've integrated Commitizen. Instead of using `git commit`, you can use:

```bash
pnpm commit
```

This will guide you through an interactive process to create a properly formatted commit message.

## License

By contributing, you agree that your contributions will be licensed under the project's license.
