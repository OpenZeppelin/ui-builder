# EVM Adapter Wallet Module

This directory contains the wallet integration layer for the EVM adapter, providing all wallet-related UI, hooks, context, and utilities for EVM-compatible chains using the `wagmi` library.

## Architectural Approach: UI Kit Extensibility

The EVM ecosystem is mature and features a wide variety of wallet libraries and UI kits (e.g., RainbowKit, ConnectKit, Web3Modal). To accommodate this, the `EvmAdapter`'s wallet module is designed to be highly extensible. It uses a singleton manager (`EvmUiKitManager`) to dynamically configure and load different UI kits at runtime.

This architecture allows applications to switch between different wallet UIs (like RainbowKit or a set of custom-styled components) through configuration, without changing the application code.

**Note:** This complex, manager-based architecture is specific to the needs of the EVM ecosystem. Other adapters for ecosystems with a single, primary wallet (like the `MidnightAdapter` for the Lace wallet) can use a much simpler, more direct implementation. The `MidnightWalletProvider` serves as a good example of a minimal implementation without UI kit management.

## Purpose

- **UI Environment Provision**: Sets up a stable UI environment for EVM wallet interactions. The adapter exports `EvmWalletUiRoot`, a React component that internally uses a singleton `EvmUiKitManager` to manage the `WagmiConfig`, UI kit assets (like RainbowKit's provider and CSS), and overall state. This root component ensures `WagmiProvider` and `QueryClientProvider` are always rendered, aiming to prevent UI flicker during network or configuration changes.
- **Facade Hooks**: Exposes a standardized set of React hooks (`evmFacadeHooks`) for wallet, account, and network management, wrapping `wagmi` core hooks. These are primarily consumed via `useWalletState()` from `@openzeppelin/ui-react`.
- **UI Kit Integration**: Supports third-party UI kits like RainbowKit, as well as a default set of custom-styled wallet UI components (`CustomConnectButton`, `CustomAccountDisplay`, `CustomNetworkSwitcher`).
- **Configuration**: Provides a flexible, layered configuration system allowing applications to define UI kit preferences and kit-specific parameters through global application configuration (`AppConfigService`), user-authored native TypeScript configuration files, and programmatic overrides.

## Directory Structure

```text
wallet/
├── components/         # Core UI root (`EvmWalletUiRoot`) and custom wallet UI components
│   ├── EvmWalletUiRoot.tsx
│   ├── account/
│   ├── connect/
│   └── network/
├── context/            # React context (e.g., `WagmiProviderInitializedContext`)
├── evmUiKitManager.ts  # Singleton manager for UI kit state, WagmiConfig, and assets
├── hooks/              # Facade hooks (`facade-hooks.ts`), config access (`useUiKitConfig.ts` - for baseline)
├── implementation/     # Internal Wagmi core logic (`wagmi-implementation.ts`)
├── rainbowkit/         # RainbowKit-specific modules
│   ├── rainbowkitAssetManager.ts # Handles dynamic loading of RainbowKit JS & CSS
│   ├── config-service.ts         # Creates RainbowKit-specific WagmiConfig, caching
│   ├── components.tsx            # Lazy-loaded RainbowKitConnectButton wrapper
│   └── componentFactory.ts       # Provides RainbowKit components to the adapter
├── services/           # Utility services (e.g., `configResolutionService.ts`)
├── utils/              # General wallet utilities, connection logic, singleton manager for Wagmi impl.
└── index.ts            # Barrel export for key wallet module parts (excluding internal singletons like EvmUiKitManager)
```

## Key Components & Concepts

- **`EvmAdapter` UI Methods**:
  - `getEcosystemReactUiContextProvider()`: Returns the `EvmWalletUiRoot` component.
  - `configureUiKit(programmaticOverrides, options)`: Configures the desired UI kit (`kitName`, `kitConfig`) and triggers the `EvmUiKitManager`.
  - `getEcosystemWalletComponents()`: Returns UI components (e.g., ConnectButton) for the active kit.
  - `getEcosystemReactHooks()`: Returns `evmFacadeHooks`.
- **`EvmUiKitManager`**: Singleton, manages `WagmiConfig`, selected UI kit (e.g., RainbowKit), its assets (provider component, CSS status), and initialization/error states. Not directly used by consuming apps.
- **`EvmWalletUiRoot`**: Stable React component. Subscribes to `EvmUiKitManager`. Always renders `WagmiProvider` & `QueryClientProvider`. Conditionally renders the active UI kit's specific provider (e.g., RainbowKit's) inside. Provides `WagmiProviderInitializedContext`.
- **User Native Configuration Files**: For kits like RainbowKit, users provide detailed configuration in `src/config/wallet/[kitName].config.ts`.
- **`loadConfigModule` Prop**: Passed by the application to `WalletStateProvider`, enabling the adapter to dynamically load the user-native config files.

## Configuration

The EVM adapter's wallet UI and behavior are configured through a layered system:

### 1. Application-Level Configuration (via `AppConfigService`)

This is the baseline configuration, typically set in `app.config.json` (for exported apps) or Vite environment variables (for the builder `@openzeppelin/ui-builder-app` app).

**Path in `app.config.json`**: `globalServiceConfigs.walletui.config`

**Example `app.config.json` snippet:**

```json
{
  "globalServiceConfigs": {
    "walletui": {
      "_comment": "Optional: Configure the Wallet UI Kit...",
      "config": {
        "kitName": "rainbowkit", // or "custom", "none"
        "kitConfig": {
          // Baseline/default kit-specific options, e.g., for custom kit:
          "showInjectedConnector": true,
          "components": {
            "exclude": ["NetworkSwitcher"]
          }
          // For RainbowKit, AppConfigService might provide a default projectId if not in native file,
          // but wagmiParams & providerProps are best defined in the native .ts file.
        }
      }
    }
  }
}
```

- **`kitName`**: Determines the UI kit. Supported: `'rainbowkit'`, `'custom'` (default), `'none'`.
- **`kitConfig`**: An object for kit-specific baseline settings.

### 2. User-Native Kit-Specific Configuration File (Recommended for Detailed Kit Setup)

For UI kits requiring detailed setup (like RainbowKit), applications should provide a TypeScript configuration file in their `src` directory following this convention:
`src/config/wallet/[kitName].config.ts`

**Example for RainbowKit (`src/config/wallet/rainbowkit.config.ts`):**

```typescript
// Example: src/config/wallet/rainbowkit.config.ts
// Users should import types from '@rainbow-me/rainbowkit' for their config for type safety.
// import type { RainbowKitProviderProps } from '@rainbow-me/rainbowkit';
// import { mainnet } from 'viem/chains'; // etc.

const rainbowKitAppConfig = {
  // Parameters for RainbowKit's getDefaultConfig() from '@rainbow-me/rainbowkit'
  wagmiParams: {
    appName: 'My Awesome dApp',
    projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Essential for WalletConnect via RainbowKit
    // chains: [], // Note: `chains` and `transports` will be overridden by the adapter based on its networkConfig
    // Other options like `wallets`, `ssr`, etc., can be set here.
  },
  // Props for the <RainbowKitProvider {...} /> component
  providerProps: {
    // theme: darkTheme(),
    // initialChain: mainnet,
    // modalSize: 'compact',
    // appInfo: { appName: 'My dApp', learnMoreUrl: 'https://learnmore.example' }
  }, // as RainbowKitProviderProps (or a subset for type safety)

  // Enhanced UI customizations using RainbowKit's native prop types
  customizations: {
    connectButton: {
      // Uses RainbowKit's native ConnectButton props - no custom types needed!
      // Refer to RainbowKit docs: https://www.rainbowkit.com/docs/connect-button

      chainStatus: 'none', // Hide network switcher dropdown
      accountStatus: 'full', // Show full account info when connected
      label: 'Connect Wallet', // Custom connect button text
      showBalance: true, // Show/hide balance display

      // Responsive configurations are also supported:
      // showBalance: {
      //   smallScreen: false,
      //   largeScreen: true,
      // },
      // accountStatus: {
      //   smallScreen: 'avatar',
      //   largeScreen: 'full',
      // },
    },
  },
};

export default rainbowKitAppConfig;
```

- **`wagmiParams`**: Contains parameters for RainbowKit's `getDefaultConfig()` (e.g., `appName`, `projectId`). The adapter will use these but will override `chains` and `transports` based on its own `networkConfig` and `AppConfigService` RPC overrides.
- **`providerProps`**: Contains props to be spread onto the `<RainbowKitProvider />` component (e.g., `theme`, `modalSize`).
- **`customizations`**: Enhanced UI customizations that leverage RainbowKit's native prop types directly. This section allows you to configure the ConnectButton component using RainbowKit's official props.

#### RainbowKit ConnectButton Customizations

The `customizations.connectButton` section supports all native RainbowKit ConnectButton props:

- **`chainStatus`**: Controls network switcher visibility
  - `'full'`: Show full chain name and icon (default)
  - `'icon'`: Show only chain icon
  - `'name'`: Show only chain name
  - `'none'`: Hide network switcher completely
- **`accountStatus`**: Controls account info display when connected
  - `'full'`: Show full account info (default)
  - `'avatar'`: Show only avatar
  - `'address'`: Show only address
- **`label`**: Custom text for the connect button when disconnected
- **`showBalance`**: Show/hide balance in the button (boolean or responsive object)

### 3. `loadConfigModule` (Application-Provided Importer)

The consuming application (via the `loadConfigModule` prop on `WalletStateProvider` in `react-core`) must provide a function that can dynamically import the user-native kit-specific configuration file described above. The adapter uses this callback to load the file.

**Example from `packages/builder/src/App.tsx` or exported app's `main.tsx`:**

```typescript
import { logger } from '@openzeppelin/ui-utils';

const loadAppConfigModule = async (
  relativePath: string
): Promise<Record<string, unknown> | null> => {
  try {
    // Vite resolves paths like './config/wallet/rainbowkit.config' relative to this file.
    logger.info('[App] loadAppConfigModule', `Attempting to load: ${relativePath}`);
    const module = await import(/* @vite-ignore */ relativePath);
    logger.info('[App] loadAppConfigModule', `Successfully loaded: ${relativePath}`, module);
    return module.default || module;
  } catch (error) {
    logger.warn('[App] loadAppConfigModule', `Failed to load ${relativePath}:`, error);
    return null; // Expected if file is optional and doesn't exist
  }
};

// This function is then passed to <WalletStateProvider loadConfigModule={loadAppConfigModule} />
```

### 4. Programmatic Overrides (via `EvmAdapter.configureUiKit`)

Applications can also call `adapter.configureUiKit(programmaticUiKitConfig, { loadUiKitNativeConfig: loadAppConfigModule })` at runtime to provide specific overrides.

### Configuration Precedence

1. **Programmatic Overrides**: Settings passed directly to `configureUiKit` (for `kitName` or other top-level `UiKitConfiguration` flags, and `kitConfig` properties).
2. **User-Native `.ts` File**: Content from files like `src/config/wallet/rainbowkit.config.ts` (for `kitConfig` properties).
3. **`AppConfigService` (`app.config.json` / Env Vars)**: Baseline settings (for `kitName` and `kitConfig` properties).
4. **Adapter Defaults**: Internal defaults (e.g., `kitName: 'custom'`).

## Automatic CSS Loading (RainbowKit)

When `kitName` is configured to `'rainbowkit'`, the `EvmAdapter` (via `EvmUiKitManager` and `rainbowkitAssetManager.ts`) will automatically attempt to dynamically import and inject RainbowKit's required CSS (`@rainbow-me/rainbowkit/styles.css`). **Manual import of this CSS file in the application's entry point is no longer necessary.**

## Usage within Application

The primary way to interact with wallet functionalities and UI components is through `@openzeppelin/ui-react`:

- **`WalletStateProvider`**: Wraps the application (or relevant parts) to provide wallet context.
- **`useWalletState()`**: Hook to access `activeAdapter`, `activeNetworkConfig`, `walletFacadeHooks`, `isAdapterLoading`, etc.
- **Derived Hooks** (e.g., `useDerivedAccountStatus`, `useDerivedConnectStatus`): Provide convenient, memoized state from facade hooks.

### Example: Rendering Wallet UI in a Header

```typescript
import {
  useWalletState,
  useDerivedAccountStatus,
} from '@openzeppelin/ui-react';

function WalletConnectionHeader() {
  const { activeAdapter, isAdapterLoading } = useWalletState();
  const { isConnected } = useDerivedAccountStatus();

  if (isAdapterLoading && !activeAdapter) {
    return <div>Loading Wallet Adapter...</div>;
  }

  if (!activeAdapter?.supportsWalletConnection()) {
    return null; // Or message indicating wallet connection not supported
  }

  const walletComponents = activeAdapter.getEcosystemWalletComponents?.();
  const ConnectButton = walletComponents?.ConnectButton;
  const AccountDisplay = walletComponents?.AccountDisplay;

  return (
    <div>
      {isConnected && AccountDisplay ? <AccountDisplay /> : null}
      {!isConnected && ConnectButton ? <ConnectButton /> : null}
      {/* Add NetworkSwitcher if needed and available */}
    </div>
  );
}
```

## Notes

- The internal Wagmi implementation (`WagmiWalletImplementation`) and UI kit state management (`EvmUiKitManager`) are encapsulated within this adapter.
- For adding support for new UI kits, refer to the pattern established by the RainbowKit integration. See [Adding New UI Kits](./ADDING_NEW_UI_KITS.md) for detailed instructions.
