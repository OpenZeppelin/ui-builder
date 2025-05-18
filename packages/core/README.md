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

The core package uses an adapter pattern to support multiple blockchain ecosystems:

- **Core**: Chain-agnostic components, types, services, and utilities. Key architectural pieces include:
  - `AdapterProvider`: Manages a registry of adapter instances, ensuring only one instance per network configuration (singleton pattern) throughout the application.
  - `WalletStateProvider`: Builds upon `AdapterProvider` to manage the globally selected active network, the corresponding active adapter instance, its loading state, and the facade hooks provided by the active adapter. It also renders any UI context provider (e.g., `WagmiProvider`) supplied by the active adapter, making facade hooks functional.
  - `useWalletState()`: The primary hook for components within the `core` application (and potentially `form-renderer` or exported apps, if they use this provider) to access the active network ID, active adapter, its facade hooks, and derived wallet status.
  - `ecosystemManager.ts`: Handles discovery of network configurations and adapter capabilities.
- **Adapters (`@openzeppelin/transaction-form-adapter-*`)**: Separate packages implementing the `ContractAdapter` interface. They are instantiated with a specific `NetworkConfig` by `AdapterProvider`. Adapters can optionally provide UI facilitation capabilities, which are orchestrated by `WalletStateProvider`:
  - **React UI Context Provider**: (e.g., for `wagmi` on EVM) Rendered by `WalletStateProvider` to establish the necessary environment for facade hooks.
  - **Facade Hooks**: (e.g., `useAccount`, `useSwitchChain`) Provided by the adapter and exposed via `useWalletState().walletFacadeHooks` for reactive wallet interactions.
  - **Standardized UI Components**: (e.g., `ConnectButton`) Retrieved via `useWalletState().activeAdapter.getEcosystemWalletComponents()` and are expected to use the facade hooks internally.
- **UI Components**: React components within this package (e.g., `WalletConnectionHeader`, `TransactionFormBuilder`, `NetworkSwitchManager`) utilize `useWalletState()` to access the active adapter, its facade hooks, and global wallet/network state to interact with different blockchains and manage UI accordingly.
- **Styling System**: Centralized CSS variables and styling approach from the `@openzeppelin/transaction-form-styles` package.

This architecture allows for easy extension to support additional blockchain ecosystems by creating new adapter packages and registering them in `ecosystemManager.ts`. The provider model (`AdapterProvider` and `WalletStateProvider`) ensures consistent state and adapter access throughout the application.

For more detailed documentation about the adapter pattern, see the main project [README.md](../../README.md#adding-new-adapters) and the [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.MD).
