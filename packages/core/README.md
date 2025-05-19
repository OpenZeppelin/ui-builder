# Transaction Form Builder Core

The main application for the Transaction Form Builder monorepo. This package contains the form builder UI and core functionality.

## Structure

```text
core/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable UI components
│   │   ├── Common/   # Shared components across features
│   │   └── FormBuilder/ # Form builder components
│   ├── core/         # Chain-agnostic core functionality specific to this app
│   │   ├── types/    # Local type definitions (shared types in @openzeppelin/transaction-form-types)
│   │   ├── utils/    # Utility functions
│   │   ├── hooks/    # Core-app-specific hooks (if any; shared providers/hooks like WalletStateProvider are in @openzeppelin/transaction-form-react-core)
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

- **@openzeppelin/transaction-form-react-core**: For core React context providers and hooks (AdapterProvider, WalletStateProvider, useWalletState) managing global wallet/network state and adapter interactions.
- **@openzeppelin/transaction-form-types**: Shared type definitions for contracts, adapters, and forms
- **@openzeppelin/transaction-form-renderer**: Form rendering components and logic.
- **@openzeppelin/transaction-form-ui**: Shared UI components (buttons, inputs, fields, etc.) used by both core and form-renderer.
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

The core package uses an adapter pattern to support multiple blockchain ecosystems, leveraging shared providers and types:

- **Core**: Chain-agnostic application logic, UI components, and the export system. It consumes providers and hooks (like `AdapterProvider`, `WalletStateProvider`, `useWalletState`) from the `@openzeppelin/transaction-form-react-core` package to manage global wallet/network state and adapter interactions.
  - `ecosystemManager.ts`: Handles discovery of network configurations and adapter capabilities, providing functions like `getAdapter` and `getNetworkById` which are passed as props to the providers from `@openzeppelin/transaction-form-react-core`.
- **Adapters (`@openzeppelin/transaction-form-adapter-*`)**: Separate packages implementing the `ContractAdapter` interface. They are instantiated and managed via `AdapterProvider` (from `@openzeppelin/transaction-form-react-core`). Their UI facilitation capabilities are orchestrated by `WalletStateProvider` (from `@openzeppelin/transaction-form-react-core`):
  - **React UI Context Provider**: (e.g., for `wagmi` on EVM) Rendered by `WalletStateProvider` to establish the necessary environment for facade hooks.
  - **Facade Hooks**: (e.g., `useAccount`, `useSwitchChain`) Provided by the adapter and exposed via `useWalletState().walletFacadeHooks` for reactive wallet interactions.
  - **Standardized UI Components**: (e.g., `ConnectButton`) Retrieved via `useWalletState().activeAdapter.getEcosystemWalletComponents()` and are expected to use the facade hooks internally.
- **UI Components**: React components within this package (e.g., `WalletConnectionHeader`, `TransactionFormBuilder`, `NetworkSwitchManager`) utilize `useWalletState()` to access the active adapter, its facade hooks, and global wallet/network state to interact with different blockchains and manage UI accordingly.
- **Styling System**: Centralized CSS variables and styling approach from the `@openzeppelin/transaction-form-styles` package.

This architecture allows for easy extension to support additional blockchain ecosystems by creating new adapter packages and registering them in `ecosystemManager.ts`. The provider model (from `@openzeppelin/transaction-form-react-core`) ensures consistent state and adapter access throughout the application.

For more detailed documentation about the adapter pattern, see the main project [README.md](../../README.md#adding-new-adapters) and the [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.MD).
