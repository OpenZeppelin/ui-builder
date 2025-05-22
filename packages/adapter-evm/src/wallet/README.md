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
          "showInjectedConnector": true,
          "components": {
            "exclude": ["NetworkSwitcher"]
          }
        }
      }
    }
  }
}
```

The configuration is automatically loaded from AppConfigService when the module initializes.

### Available Options

- **kitName**: Specifies which UI kit to use:

  - `'custom'`: Default for EVM adapter - uses our custom UI components (`CustomConnectButton`, `CustomAccountDisplay`, `CustomNetworkSwitcher`).
  - `'none'`: Explicitly disables UI components and UI context provider.
  - `'rainbowkit'`: (Future support) RainbowKit UI components
    - **IMPORTANT**: When using `rainbowkit`, the consuming application MUST import its styles: `import '@rainbow-me/rainbowkit/styles.css';` (typically in your main `App.tsx` or `main.tsx`).
  - `'connectkit'`: (Future support) ConnectKit UI components
  - `'appkit'`: (Future support) AppKit UI components

- **kitConfig**: Configuration object with options specific to the chosen UI kit:
  - For the `'custom'` implementation:
    - **`showInjectedConnector?: boolean`**: When `true`, shows the injected connector in the wallet connection dialog. Defaults to `false` (hidden).
    - **`components?: { exclude?: Array<'ConnectButton' | 'AccountDisplay' | 'NetworkSwitcher'> }`**: Optional. Allows specifying an array of component names to _exclude_ from being provided by `getEcosystemWalletComponents`. For example, to hide the default network switcher, you could set `kitConfig: { components: { exclude: ['NetworkSwitcher'] } }`.

## Usage

The UI capabilities of the EVM Adapter (UI Context Provider, Facade Hooks, Custom UI Components) are primarily designed to be consumed through the `core` application's centralized state management when the `EvmAdapter` is the active adapter.

### 1. UI Context Setup (Orchestrated by `core`)

The `EvmAdapter` provides its `EvmBasicUiContextProvider` (which sets up Wagmi and React Query) via the `getEcosystemReactUiContextProvider` method of the `ContractAdapter` interface.

In the main application (`packages/core`):

- The `WalletStateProvider` (using `useWalletState` hook context) identifies the `EvmAdapter` as the active adapter.
- It then calls `activeAdapter.getEcosystemReactUiContextProvider()` and renders the returned `EvmBasicUiContextProvider` to wrap the application tree.
  This setup ensures that the necessary Wagmi context is available for the facade hooks and custom UI components to function correctly.

_Direct usage like `<EvmBasicUiContextProvider>{...}</EvmBasicUiContextProvider>` by a consuming application is generally not needed, as this is handled by `WalletStateProvider`._

### 2. Using Facade Hooks (via `useWalletState` in `core`)

While `evmFacadeHooks` (an object containing all `wagmi` hook facades like `useAccount`, `useConnect`, etc.) is exported directly from this package (`@openzeppelin/transaction-form-adapter-evm/wallet`), the primary way to access these hooks within the `core` application is via `useWalletState()`:

```typescript
// In a component within packages/core
import { useWalletState } from '@/core/hooks'; // Or correct path to core hooks

function MyWalletComponent() {
  const { walletFacadeHooks } = useWalletState();

  if (!walletFacadeHooks) {
    return <p>Wallet features not available for the current adapter.</p>;
  }

  // Now use the specific hooks from the walletFacadeHooks object
  // Call the hook once to get its result, then destructure. Provide defaults if hook or properties are missing.
  const accountInfo = walletFacadeHooks.useAccount ? walletFacadeHooks.useAccount() : {};
  const { isConnected = false, address } = accountInfo as { isConnected?: boolean; address?: string };

  const connectInfo = walletFacadeHooks.useConnect ? walletFacadeHooks.useConnect() : {};
  const { connect = () => {}, connectors = [] } = connectInfo as { connect?: () => void; connectors?: any[] };
  // etc.

  // Example usage:
  if (isConnected) {
    console.log('Connected address:', address);
  }

  // ... component logic ...
}
```

_Exported standalone applications that bundle only the `EvmAdapter` might import `evmFacadeHooks` directly if they don't use the full `WalletStateProvider` from `@core` (though ideally, exported apps would also have a similar provider setup)._

### 3. Using Wallet UI Components (via `activeAdapter` in `core`)

The custom UI components (`CustomConnectButton`, `CustomAccountDisplay`, `CustomNetworkSwitcher`) are made available by `EvmAdapter` via the `getEcosystemWalletComponents` method.

In the `core` application, these are typically accessed as follows:

```typescript
// In a component like WalletConnectionUI.tsx within packages/core
import { useWalletState } from '@/core/hooks';

function HeaderWalletDisplay() {
  const { activeAdapter } = useWalletState();

  if (!activeAdapter || typeof activeAdapter.getEcosystemWalletComponents !== 'function') {
    return null; // Or some fallback UI
  }

  const walletComponents = activeAdapter.getEcosystemWalletComponents();
  if (!walletComponents) return null;

  const { ConnectButton, AccountDisplay, NetworkSwitcher } = walletComponents;

  return (
    <div className="wallet-ui-container">
      {NetworkSwitcher && <NetworkSwitcher />}
      {AccountDisplay && <AccountDisplay />}
      {ConnectButton && <ConnectButton />}
    </div>
  );
}
```

These custom components (`CustomConnectButton`, etc.) are designed to internally use `useWalletState()` to get access to `walletFacadeHooks` for their functionality.

_Direct import of these components (e.g., `import { CustomConnectButton } from '@openzeppelin/transaction-form-adapter-evm/wallet'`) is also possible but bypasses the adapter's role in providing them via `getEcosystemWalletComponents`, which is the more chain-agnostic pattern when multiple adapters might be in play._

## Notes

- All wallet UI components and hooks are designed to be chain-agnostic and follow the project's design system and form styling standards.
- The internal Wagmi implementation is encapsulated and not exposed outside the adapter.
- For more details on the architecture and integration, see the main project README and the WAGMI implementation plan.
