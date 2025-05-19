# @openzeppelin/transaction-form-react-core

This package provides core React Context providers and hooks for the OpenZeppelin Transaction Form Builder ecosystem. It centralizes the management of global wallet state, active network selection, active adapter instances, and the consumption of adapter-specific UI capabilities (like facade hooks and UI context providers).

It is a foundational package intended to be used by the main `@openzeppelin/transaction-form-core` application and can also be leveraged by exported standalone applications to ensure consistent wallet and adapter integration patterns.

## Core Responsibilities

- **Adapter Instance Management:** Provides `AdapterProvider` which maintains a registry of `ContractAdapter` instances, ensuring only one instance exists per network configuration (singleton pattern).
- **Global Wallet/Network State Management:** Provides `WalletStateProvider` which builds upon `AdapterProvider` to manage:
  - The globally selected active network ID and its corresponding `NetworkConfig`.
  - The active `ContractAdapter` instance for this global network and its loading state.
  - The `EcosystemSpecificReactHooks` (facade hooks) provided by the active adapter.
  - Orchestration of rendering the active adapter's UI context provider (e.g., `WagmiProvider` for EVM adapters), which is crucial for the functionality of facade hooks.
- **Consistent State Access:** Exports consumer hooks `useAdapterContext()` and `useWalletState()` for components to access this managed state and functionality.

## Key Exports

- **Providers:**
  - `AdapterProvider`: Manages adapter instances. Requires a `resolveAdapter` prop to fetch/create adapters.
  - `WalletStateProvider`: Manages global active network/adapter/wallet state. Requires a `getNetworkConfigById` prop and is typically nested within an `AdapterProvider`.
- **Contexts (Primarily for advanced use or typing):**
  - `AdapterContext`
  - `WalletStateContext`
- **Hooks:**
  - `useAdapterContext()`: To access `AdapterProvider`'s `getAdapterForNetwork` function.
  - `useWalletState()`: To access global state like `activeNetworkId`, `activeAdapter`, `walletFacadeHooks`, and the `setActiveNetworkId` dispatcher.
- **Types:**
  - `AdapterProviderProps`
  - `WalletStateProviderProps`
  - `AdapterContextValue`, `AdapterRegistry`
  - `WalletStateContextValue`

## Installation

This package is typically used as a workspace dependency (e.g., `"@openzeppelin/transaction-form-react-core": "workspace:^"`) within the Transaction Form Builder monorepo.

It has peer dependencies on `react` and `react-dom`, and direct dependencies on `@openzeppelin/transaction-form-types` and `@openzeppelin/transaction-form-utils`.

## Usage Example (Application Setup)

```tsx
// In your main application setup (e.g., App.tsx)
import { AdapterProvider, WalletStateProvider } from '@openzeppelin/transaction-form-react-core';

import { getAdapter, getNetworkById } from './core/ecosystemManager';

// App-specific adapter/network resolvers

function AppRoot() {
  return (
    <AdapterProvider resolveAdapter={getAdapter}>
      <WalletStateProvider
        initialNetworkId="ethereum-mainnet" // Optional: Set a default active network
        getNetworkConfigById={getNetworkById}
      >
        {/* Your application components that can now use useWalletState() */}
      </WalletStateProvider>
    </AdapterProvider>
  );
}
```

## Consuming Global State in Components

```tsx
import { useWalletState } from '@openzeppelin/transaction-form-react-core';

function MyWalletComponent() {
  const {
    activeNetworkId,
    activeNetworkConfig,
    activeAdapter,
    isAdapterLoading,
    walletFacadeHooks,
    setActiveNetworkId,
  } = useWalletState();

  if (isAdapterLoading || !activeAdapter) {
    return <p>Loading wallet information...</p>;
  }

  // Example: Using a facade hook if available
  const accountInfo = walletFacadeHooks?.useAccount ? walletFacadeHooks.useAccount() : null;
  const isConnected = accountInfo?.isConnected;

  return (
    <div>
      <p>Current Network: {activeNetworkConfig?.name || 'None'}</p>
      <p>Wallet Connected: {isConnected ? 'Yes' : 'No'}</p>
      {/* Further UI using adapter or facade hooks */}
    </div>
  );
}
```

This package aims to decouple the core application logic from the direct management of adapter instances and their UI contexts, promoting a cleaner and more maintainable architecture.
