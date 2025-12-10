# @openzeppelin/ui-builder-react-core

This package provides core React Context providers and hooks for the OpenZeppelin UI Builder ecosystem. It centralizes the management of global wallet state, active network selection, active adapter instances, and the consumption of adapter-specific UI capabilities (like facade hooks and UI context providers).

It is a foundational package intended to be used by the main `@openzeppelin/ui-builder-app` application and can also be leveraged by exported standalone applications to ensure consistent wallet and adapter integration patterns.

## Core Responsibilities

- **Adapter Instance Management:** Provides `AdapterProvider` which maintains a registry of `ContractAdapter` instances, ensuring only one instance exists per network configuration (singleton pattern).
- **Global Wallet/Network State Management:** Provides `WalletStateProvider` which builds upon `AdapterProvider` to manage:
  - The globally selected active network ID and its corresponding `NetworkConfig`.
  - The active `ContractAdapter` instance for this global network and its loading state.
  - The `EcosystemSpecificReactHooks` (facade hooks) provided by the active adapter.
  - Orchestration of rendering the active adapter's UI context provider (e.g., `WagmiProvider` for EVM adapters), which is crucial for the functionality of facade hooks.
- **Consistent State Access:** Exports consumer hooks `useAdapterContext()` and `useWalletState()` for components to access this managed state and functionality.

## Key Exports

### Providers

- `AdapterProvider`: Manages adapter instances. Requires a `resolveAdapter` prop to fetch/create adapters.
- `WalletStateProvider`: Manages global active network/adapter/wallet state. Requires a `getNetworkConfigById` prop and is typically nested within an `AdapterProvider`.

### Contexts (Primarily for advanced use or typing)

- `AdapterContext`
- `WalletStateContext`

### Hooks

- `useAdapterContext()`: To access `AdapterProvider`'s `getAdapterForNetwork` function.
- `useWalletState()`: To access global state like `activeNetworkId`, `activeAdapter`, `walletFacadeHooks`, and the `setActiveNetworkId` dispatcher.

### Derived Hooks

These hooks abstract wallet interactions and work with any adapter implementing the facade pattern:

- `useDerivedAccountStatus()`: Returns connection status, address, and current chain ID.
- `useDerivedSwitchChainStatus()`: Returns the `switchChain` function and switching state.
- `useDerivedChainInfo()`: Returns current chain information.
- `useDerivedConnectStatus()`: Returns wallet connection functions and state.
- `useDerivedDisconnect()`: Returns the disconnect function.
- `useWalletReconnectionHandler()`: Detects wallet reconnection and triggers network switch re-queue via callback.

### UI Components

- `WalletConnectionHeader`: Compact wallet connection status display.
- `WalletConnectionUI`: Full wallet connection interface with connect/disconnect functionality.
- `WalletConnectionWithSettings`: Wallet connection UI with additional settings controls.
- `NetworkSwitchManager`: Handles automatic wallet network switching for EVM chains. Renders nothing visually but manages the network switch lifecycle.

### Types

- `AdapterProviderProps`
- `WalletStateProviderProps`
- `AdapterContextValue`, `AdapterRegistry`
- `WalletStateContextValue`
- `DerivedAccountStatus`, `DerivedSwitchChainStatus`, `DerivedChainInfo`, `DerivedConnectStatus`, `DerivedDisconnectStatus`
- `NetworkSwitchManagerProps`

## Installation

This package is typically used as a workspace dependency (e.g., `"@openzeppelin/ui-builder-react-core": "workspace:^"`) within the UI Builder monorepo.

It has peer dependencies on `react` and `react-dom`, and direct dependencies on `@openzeppelin/ui-builder-types` and `@openzeppelin/ui-builder-utils`.

## Usage Example (Application Setup)

```tsx
// In your main application setup (e.g., App.tsx)
import { AdapterProvider, WalletStateProvider } from '@openzeppelin/ui-builder-react-core';

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
import { useWalletState } from '@openzeppelin/ui-builder-react-core';

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

This package aims to decouple the builder application logic from the direct management of adapter instances and their UI contexts, promoting a cleaner and more maintainable architecture.

## Using NetworkSwitchManager

The `NetworkSwitchManager` component handles automatic wallet network switching when users select a different EVM network. It's a headless component (renders nothing) that manages the switch lifecycle.

```tsx
import { NetworkSwitchManager } from '@openzeppelin/ui-builder-react-core';

function MyApp() {
  const [networkToSwitchTo, setNetworkToSwitchTo] = useState<string | null>(null);
  const adapter = useMyAdapter(); // Your adapter for the target network

  const handleNetworkSwitchComplete = () => {
    // Called when switch completes (success or error)
    setNetworkToSwitchTo(null);
  };

  return (
    <>
      {/* Mount only when you need to trigger a network switch */}
      {adapter && networkToSwitchTo && (
        <NetworkSwitchManager
          adapter={adapter}
          targetNetworkId={networkToSwitchTo}
          onNetworkSwitchComplete={handleNetworkSwitchComplete}
        />
      )}
      {/* Rest of your app */}
    </>
  );
}
```

**Key behaviors:**

- Automatically initiates network switch when mounted with a target network
- Gracefully handles non-EVM networks (no-op)
- Tracks switch attempts to prevent duplicate operations
- Calls `onNetworkSwitchComplete` when the operation finishes

## Using useWalletReconnectionHandler

The `useWalletReconnectionHandler` hook detects when a wallet reconnects to a different chain than expected and invokes a callback to re-queue the network switch.

```tsx
import { useWalletReconnectionHandler } from '@openzeppelin/ui-builder-react-core';

function MyApp() {
  const [networkToSwitchTo, setNetworkToSwitchTo] = useState<string | null>(null);
  const selectedNetworkId = 'ethereum-mainnet';
  const adapter = useMyAdapter();

  // Callback invoked when wallet reconnects with wrong chain
  const handleRequeueSwitch = useCallback((networkId: string) => {
    setNetworkToSwitchTo(networkId);
  }, []);

  useWalletReconnectionHandler(
    selectedNetworkId, // Currently selected network
    adapter, // Active adapter instance
    networkToSwitchTo, // Current switch queue state
    handleRequeueSwitch // Callback to re-queue switch
  );

  return <>{/* Your app */}</>;
}
```

**When to use:**

- After a user disconnects and reconnects their wallet
- The wallet may reconnect to a different chain than the app expects
- This hook detects that mismatch and calls your callback to trigger a switch

## Package Structure

```text
react-core/
├── src/
│   ├── components/             # UI components (WalletConnection*, NetworkSwitchManager)
│   ├── hooks/                  # Context providers and consumer hooks
│   └── index.ts                # Main package exports
├── package.json                # Package configuration
├── tsconfig.json               # TypeScript configuration
├── tsup.config.ts              # Build configuration
└── README.md                   # This documentation
```

## Dependencies

This package has minimal dependencies to maintain a lightweight footprint:

- **@openzeppelin/ui-builder-types**: Shared type definitions
- **@openzeppelin/ui-builder-utils**: Shared utility functions (logger)
- **react**: Peer dependency for React hooks and context
- **react-dom**: Peer dependency for React DOM utilities
