# Stellar Adapter Wallet Module

This directory contains the wallet integration layer for the Stellar adapter, providing all wallet-related UI, hooks, context, and utilities for Stellar blockchain using the `@creit.tech/stellar-wallets-kit` library.

## Architectural Approach: Dual UI Support

The Stellar adapter supports two UI modes:

1. **Native UI Mode (`stellar-wallets-kit`)**: Uses the Stellar Wallets Kit's native button component, which provides a complete wallet management experience including:
   - Wallet connection/selection modal
   - Connected state with account address display
   - Account management dialog with copy address and disconnect options

2. **Custom UI Mode (`custom`)**: Uses custom React components for wallet UI, giving developers full control over the appearance and behavior of wallet interactions.

## Purpose

- **UI Environment Provision**: Sets up the UI environment for Stellar wallet interactions. The adapter exports `StellarWalletUiRoot`, a React component that manages the wallet state and provides context to child components.
- **Facade Hooks**: Exposes a standardized set of React hooks (`stellarFacadeHooks`) for wallet and account management, wrapping the Stellar Wallets Kit functionality.
- **UI Components**: Provides custom-styled wallet UI components (`CustomConnectButton`, `CustomAccountDisplay`) that work with the Stellar ecosystem.
- **Configuration**: Supports configuration through global application configuration (`AppConfigService`) and programmatic overrides.

## Directory Structure

```bash
wallet/
├── components/         # Custom wallet UI components
│   ├── StellarWalletUiRoot.tsx
│   ├── account/       # Account display component
│   ├── connect/       # Connect button and dialog
│   └── network/       # (Empty - Stellar doesn't support network switching)
├── context/           # React context for wallet state
│   ├── StellarWalletContext.ts
│   └── useStellarWalletContext.ts
├── hooks/             # Facade hooks and individual wallet hooks
│   ├── facade-hooks.ts
│   ├── useStellarAccount.ts
│   ├── useStellarConnect.ts
│   ├── useStellarDisconnect.ts
│   └── useUiKitConfig.ts
├── services/          # Configuration resolution service
│   └── configResolutionService.ts
├── stellar-wallets-kit/  # Stellar Wallets Kit integration
│   ├── stellarUiKitManager.ts    # Manages UI kit state and configuration
│   ├── StellarWalletsKitConnectButton.tsx  # ConnectButton component for Stellar Wallets Kit
│   ├── config-generator.ts       # Generates config for exported apps
│   └── export-service.ts         # Handles wallet config exports
├── utils/             # Utilities for filtering components and UI kit service
│   ├── filterWalletComponents.ts
│   └── uiKitService.ts
└── connection.ts      # Core wallet connection logic
```

## Key Components & Concepts

- **`StellarAdapter` UI Methods**:
  - `getEcosystemReactUiContextProvider()`: Returns the `StellarWalletUiRoot` component.
  - `configureUiKit(programmaticOverrides, options)`: Configures the UI kit and triggers the `stellarUiKitManager`.
  - `getEcosystemWalletComponents()`: Returns UI components (ConnectButton, AccountDisplay) for the active kit.
  - `getEcosystemReactHooks()`: Returns `stellarFacadeHooks`.

- **`stellarUiKitManager`**: Singleton that manages the Stellar Wallets Kit instance, network configuration, and UI kit state.

- **`StellarWalletUiRoot`**: The root provider component that:
  - Manages wallet connection state
  - Provides wallet context to child components
  - Handles UI kit configuration
  - Updates connection status periodically

- **Facade Hooks**: Standardized hooks that wrap Stellar-specific functionality:
  - `useStellarAccount`: Returns account connection status and address
  - `useStellarConnect`: Provides wallet connection functionality with error handling and loading states
  - `useStellarDisconnect`: Provides wallet disconnection functionality with error handling and loading states
  - `useUiKitConfig`: Loads initial UI kit configuration from AppConfigService

## Key Differences from EVM Adapter

1. **No Network Switching**: Stellar doesn't support dynamic network switching after wallet connection, so there's no NetworkSwitcher component.

2. **Different UI Kit Approach**: Supports both the Stellar Wallets Kit's built-in modal UI and custom components, but doesn't require the complex asset loading needed for libraries like RainbowKit.

3. **Single Wallet Kit**: Uses `@creit.tech/stellar-wallets-kit` as the primary wallet integration library, rather than supporting multiple wallet libraries.

4. **No Native Config Files**: Currently doesn't support loading TypeScript configuration files (though the infrastructure is in place if needed in the future).

## Configuration

The Stellar adapter supports ecosystem-namespaced configuration through:

1. **Global App Config** (`app.config.json`):

   Configuration is namespaced by ecosystem (e.g., `walletui.stellar`, `walletui.evm`) to support multi-ecosystem environments.

   For custom UI components:

   ```json
   {
     "globalServiceConfigs": {
       "walletui": {
         "stellar": {
           "kitName": "custom",
           "kitConfig": {
             "showInjectedConnector": false,
             "components": {
               "exclude": ["NetworkSwitcher"]
             }
           }
         }
       }
     }
   }
   ```

   For Stellar Wallets Kit native button (includes account management dialog):

   ```json
   {
     "globalServiceConfigs": {
       "walletui": {
         "stellar": {
           "kitName": "stellar-wallets-kit",
           "kitConfig": {}
         }
       }
     }
   }
   ```

2. **Programmatic Overrides**: Passed to `configureUiKit()` method

## Usage

The Stellar wallet module is automatically initialized when a Stellar network is selected in the application. The `StellarWalletUiRoot` component wraps the application content and provides wallet functionality through React context and hooks.
