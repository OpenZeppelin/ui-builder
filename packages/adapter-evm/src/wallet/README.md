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
