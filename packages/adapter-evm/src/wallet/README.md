# EVM Adapter Wallet Module

This directory contains the wallet integration layer for the EVM adapter, providing all wallet-related UI, hooks, context, and utilities for EVM-compatible chains using the `wagmi` library.

## Purpose

- **UI Environment Provider**: Sets up the Wagmi context and React Query provider for EVM wallet interactions.
- **Facade Hooks**: Exposes a standardized set of React hooks for wallet/account/network management, wrapping `wagmi` hooks.
- **Custom Wallet UI Components**: Provides chain-agnostic, design-system-compliant wallet UI components (Connect Button, Account Display, Network Switcher) for use in the core app, form-renderer, and exported forms.
- **Utilities**: Contains helpers for wallet connection, singleton management, and safe usage of Wagmi hooks.

## Directory Structure

```
wallet/
├── components/         # Custom wallet UI components (ConnectButton, AccountDisplay, NetworkSwitcher)
│   ├── account/
│   ├── connect/
│   └── network/
├── context/            # React context for Wagmi provider initialization
├── hooks/              # Facade hooks and provider state hooks
├── implementation/     # Internal Wagmi implementation (not exported)
├── provider/           # UI context provider for Wagmi + React Query
├── utils/              # Connection logic, singleton manager, safe wrappers
└── index.ts            # Barrel export for wallet module
```

## Key Exports

- **UI Components**: `CustomConnectButton`, `CustomAccountDisplay`, `CustomNetworkSwitcher`
- **Facade Hooks**: `evmFacadeHooks` (see `hooks/facade-hooks.ts`)
- **Provider**: `EvmBasicUiContextProvider` (see `provider/ui-provider.tsx`)
- **Context**: `WagmiProviderInitializedContext`
- **Utils**: `getEvmWalletImplementation`, `SafeWagmiComponent`, connection helpers

## Configuration Options

The wallet UI components can be configured in two ways:

### 1. Using the adapter's configureUiKit method:

```tsx
const adapter = new EvmAdapter(networkConfig);
adapter.configureUiKit({
  kitName: 'none', // Default internal implementation
  kitConfig: {
    showInjectedConnector: true, // Show the injected connector (e.g., MetaMask) in the wallet selection dialog
  },
});
```

### 2. Using app.config.json (recommended for exported applications):

```json
{
  "globalServiceConfigs": {
    "walletui": {
      "config": {
        "kitName": "custom",
        "kitConfig": {
          "showInjectedConnector": true
        }
      }
    }
  }
}
```

The configuration is automatically loaded from AppConfigService when the module initializes.

### Available Options

- **kitName**: Specifies which UI kit to use:

  - `'custom'`: Default for EVM adapter - uses our custom UI components
  - `'none'`: Explicitly disables UI components (used for adapters without UI support)
  - `'rainbowkit'`: (Future support) RainbowKit UI components
  - `'connectkit'`: (Future support) ConnectKit UI components
  - `'appkit'`: (Future support) AppKit UI components

- **kitConfig**: Configuration object with options specific to the chosen UI kit:
  - For the `'custom'` implementation:
    - **showInjectedConnector**: When `true`, shows the injected connector (browser extension wallets like MetaMask) in the wallet connection dialog. Defaults to `false` (hidden).

## Usage

### Setting up the UI Provider

```tsx
import { EvmBasicUiContextProvider } from '@openzeppelin/transaction-form-adapter-evm/wallet';

<EvmBasicUiContextProvider>{/* App content */}</EvmBasicUiContextProvider>;
```

### Using Wallet UI Components

```tsx
import {
  CustomConnectButton,
  CustomAccountDisplay,
  CustomNetworkSwitcher,
} from '@openzeppelin/transaction-form-adapter-evm/wallet';

<CustomConnectButton />
<CustomAccountDisplay />
<CustomNetworkSwitcher />
```

### Using Facade Hooks

```tsx
import { evmFacadeHooks } from '@openzeppelin/transaction-form-adapter-evm/wallet';

const { useAccount, useConnect } = evmFacadeHooks;
const { address, isConnected } = useAccount();
```

## Notes

- All wallet UI components and hooks are designed to be chain-agnostic and follow the project's design system and form styling standards.
- The internal Wagmi implementation is encapsulated and not exposed outside the adapter.
- For more details on the architecture and integration, see the main project README and the WAGMI implementation plan.
