# UI Builder App

The main application for the UI Builder monorepo. This package contains the application builder UI and core functionality.

## Structure

```text
builder/
├── public/           # Static assets
├── src/
│   ├── assets/       # Static assets like images and icons used within the app
│   ├── components/   # Application-specific React components
│   ├── config/       # User-facing configuration files (e.g., for UI kits like RainbowKit)
│   ├── core/         # Core application logic and type definitions
│   ├── docs/         # Internal documentation files relevant to the builder package
│   ├── export/       # The complete form export system
│   ├── services/     # Application-level services (e.g., ContractLoader)
│   ├── test/         # Vitest test setup and configuration for this package
│   ├── types/        # TypeScript type declaration files for virtual modules/environment
│   ├── App.tsx       # Main application component and layout
│   └── main.tsx      # Application entry point
├── index.html        # HTML template for Vite
├── tsconfig.json     # TypeScript configuration for the package
├── vite.config.ts    # Vite configuration
└── README.md
```

## Dependencies

This package relies on:

- **@openzeppelin/ui-react**: For core React context providers and hooks (`RuntimeProvider`, `WalletStateProvider`, `useWalletState`).
- **@openzeppelin/ui-types**: Shared type definitions for contracts, adapters, and forms.
- **@openzeppelin/ui-renderer**: The shared library for rendering the final transaction form and other components.
- **@openzeppelin/ui-components**: The shared library for all common UI and form field components.
- **@openzeppelin/ui-storage**: Local storage services for persisting contract UI configurations with auto-save functionality.
- **@openzeppelin/ui-styles**: The centralized styling system.
- **@openzeppelin/ui-utils**: Shared utility functions like the logger and `appConfigService`.
- **@openzeppelin/adapter-{chain}**: Specific blockchain adapter packages (e.g., `-evm`, `-solana`).

## Styling

This package uses the centralized styling system from the `@openzeppelin/ui-styles` package (published from [openzeppelin-ui](https://github.com/OpenZeppelin/openzeppelin-ui)):

- **CSS Variables**: Direct OKLCH color values define the theme colors
- **Tailwind CSS 4.0**: Modern utility-first CSS with the latest features
- **Component Library**: Built on shadcn/ui with consistent, accessible components
- **Dark Mode**: Built-in dark mode support

## Type System

The builder package uses type definitions from the `@openzeppelin/ui-types` package, which serves as the single source of truth for types used across the UI Builder ecosystem. These include:

- **Contract Types**: Definitions for blockchain contracts and their schemas
- **Adapter Types**: Interfaces for chain-specific adapters
- **Form Types**: Definitions for form fields, layouts, and validation

By using the shared types package, we ensure consistency across all packages and eliminate type duplication.

## Development

### Running the Builder Application

```bash
# From the monorepo root
pnpm --filter @openzeppelin/ui-builder-app dev

# Or from within the builder package directory
pnpm dev
```

### Building

```bash
# From the monorepo root
pnpm --filter @openzeppelin/ui-builder-app build

# Or from within the builder package directory
pnpm build
```

### Testing

```bash
# From the monorepo root
pnpm --filter @openzeppelin/ui-builder-app test

# Or from within the builder package directory
pnpm test
```

### Running with Docker (Recommended)

For the most consistent and reliable development experience, it is highly recommended to run the entire application using Docker from the **root of the monorepo**. This avoids potential issues with local Node.js, pnpm, or operating system configurations.

Please see the instructions in the [main project README](../../README.md#running-with-docker-recommended) for details on how to set up and run the application with Docker.

## Architecture

The builder package uses an adapter pattern to support multiple blockchain ecosystems, leveraging shared providers and types:

- **Builder**: Chain-agnostic application logic, UI components, and the export system. It consumes providers and hooks (like `RuntimeProvider`, `WalletStateProvider`, `useWalletState`) from the `@openzeppelin/ui-react` package to manage global wallet/network state and runtime interactions.
  - `ecosystemManager.ts`: Handles discovery of network configurations and runtime capabilities, providing functions like `getRuntime` and `getNetworkById` which are passed as props to the providers from `@openzeppelin/ui-react`.
- **Adapters (`@openzeppelin/adapter-*`)**: Separate packages exposing profile-based runtimes and capabilities. They are instantiated and managed via `RuntimeProvider` (from `@openzeppelin/ui-react`). Their UI facilitation capabilities are orchestrated by `WalletStateProvider` (from `@openzeppelin/ui-react`):
  - **React UI Context Provider**: Each adapter can provide its own React context provider to manage wallet state (e.g., `WagmiProvider` for EVM, or `MidnightWalletUiRoot` for the Midnight adapter). `WalletStateProvider` renders the appropriate provider for the active runtime's ecosystem, keeping wallet sessions alive across same-ecosystem network switches.
  - **Facade Hooks**: (e.g., `useAccount`, `useSwitchChain`, `connect`, `disconnect`) Provided by the adapter and exposed via `useWalletState().walletFacadeHooks` for reactive wallet interactions.
  - **Standardized UI Components**: (e.g., `ConnectButton`) Retrieved via `activeRuntime.uiKit.getEcosystemWalletComponents()` and are expected to use the facade hooks internally.
  - **UI Components**: React components within this package (e.g., `WalletConnectionHeader`, `UIBuilder`, `NetworkSwitchManager`) utilize `useWalletState()` to access the active runtime, its facade hooks, and global wallet/network state to interact with different blockchains and manage UI accordingly.
  - **Styling System**: Centralized CSS variables and styling approach from the `@openzeppelin/ui-styles` package.

This architecture allows for easy extension to support additional blockchain ecosystems by creating new adapter packages and registering them in `ecosystemManager.ts`. The provider model (from `@openzeppelin/ui-react`) ensures consistent state and runtime access throughout the application.

For more detailed documentation about the adapter pattern, see the main project [README.md](../../README.md#adding-new-adapters) and the [Adapter Architecture Guide](https://github.com/OpenZeppelin/openzeppelin-adapters/blob/main/docs/ADAPTER_ARCHITECTURE.md).
