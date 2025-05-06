# Transaction Form Builder Core

The main application for the Transaction Form Builder monorepo. This package contains the form builder UI and core functionality.

## Structure

```text
core/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   │   ├── ui/       # shadcn/ui components
│   │   ├── Common/   # Shared components across features
│   │   └── FormBuilder/ # Form builder components
│   ├── core/         # Chain-agnostic core functionality
│   │   ├── types/    # Local type definitions (shared types in @openzeppelin/transaction-form-types)
│   │   ├── utils/    # Utility functions
│   │   ├── hooks/    # Shared hooks
│   │   ├── factories/ # Schema factories
│   │   └── ecosystemManager.ts # Central management of ecosystems, adapters, and network configs
│   ├── export/       # Export system
│   │   ├── generators/ # Form code generators
│   │   ├── codeTemplates/ # Code template files for generation
│   │   ├── templates/ # Base project structures for export
│   │   │   ├── typescript-react-vite/ # React + Vite template structure
│   │   │   └── ...   # Future template structures
│   │   ├── cli/      # CLI tool for exporting
│   │   └── ...       # Other export utilities
│   ├── services/     # Core services
│   ├── stories/      # Centralized Storybook stories
│   │   ├── common/   # Stories for common components
│   │   ├── form-builder/ # Stories for form builder components
│   │   └── ui/       # Stories for UI components
│   ├── test/         # Test setup and utilities
│   ├── mocks/        # Mock data for development and testing
│   ├── App.tsx       # Main application component
│   ├── main.tsx      # Application entry point
│   └── index.css     # Imports centralized styling from styles package
├── index.html        # HTML template
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite configuration
└── ...               # Other configuration files
```

## Dependencies

This package relies on:

- **@openzeppelin/transaction-form-types**: Shared type definitions for contracts, adapters, and forms
- **@openzeppelin/transaction-form-renderer**: Form rendering components
- **@openzeppelin/transaction-form-styles**: Centralized styling system
- **@openzeppelin/transaction-form-adapter-{chain}**: Specific blockchain adapter packages (e.g., `-evm`, `-solana`)

## Styling

This package uses the centralized styling system from the `packages/styles` package:

- **CSS Variables**: Direct OKLCH color values define the theme colors
- **Tailwind CSS 4.0**: Modern utility-first CSS with the latest features
- **Component Library**: Built on shadcn/ui with consistent, accessible components
- **Dark Mode**: Built-in dark mode support

For more details on the styling system, see the [Styles README](../styles/README.md).

## Type System

The core package uses type definitions from the `@openzeppelin/transaction-form-types` package, which serves as the single source of truth for types used across the Transaction Form Builder ecosystem. These include:

- **Contract Types**: Definitions for blockchain contracts and their schemas
- **Adapter Types**: Interfaces for chain-specific adapters
- **Form Types**: Definitions for form fields, layouts, and validation

By using the shared types package, we ensure consistency across all packages and eliminate type duplication.

## Development

### Running the Core Application

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-builder-core dev

# Or from within the core package directory
pnpm dev
```

### Building

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-builder-core build

# Or from within the core package directory
pnpm build
```

### Testing

```bash
# From the monorepo root
pnpm --filter @openzeppelin/transaction-form-builder-core test

# Or from within the core package directory
pnpm test
```

## Architecture

The core package uses an adapter pattern to support multiple blockchain ecosystems:

- **Core**: Chain-agnostic components, types, services, and utilities. Manages ecosystem details, network configurations, and adapter instantiation via `src/core/ecosystemManager.ts`. The `ecosystemManager.getAdapter()` function is asynchronous, and UI components typically obtain configured adapter instances either through the `useConfiguredAdapter` hook for direct use, or via props from higher-level state management hooks (like `useFormBuilderState`) which handle the asynchronous loading.
- **Adapters (`@openzeppelin/transaction-form-adapter-*`)**: Separate packages containing chain-specific implementations conforming to the `ContractAdapter` interface (defined in `@openzeppelin/transaction-form-types`). Adapters are now instantiated with a specific `NetworkConfig` making them network-aware.
- **UI Components**: React components within this package that utilize the centrally managed, network-configured adapters to interact with different blockchains.
- **Styling System**: Centralized CSS variables and styling approach from the `@openzeppelin/transaction-form-styles` package.

This architecture allows for easy extension to support additional blockchain ecosystems by creating new adapter packages and registering them in `ecosystemManager.ts` without modifying core application logic significantly.

For more detailed documentation about the adapter pattern, see the main project [README.md](../../README.md#adding-new-adapters).
