# Contract Adapter Interface

This directory contains the base interface and type definitions for the contract adapter system. The adapter pattern allows the Contracts UI Builder to support multiple blockchains while keeping the builder application chain-agnostic.

## ContractAdapter Interface

The `ContractAdapter` interface defines the methods that must be implemented by all chain-specific adapters. This interface acts as a contract between the application and the chain-specific code, ensuring a consistent API regardless of the underlying blockchain.

### Core Methods

- `formatTransactionData`: Formats the submitted form data into a transaction payload for the specific chain
- `isValidAddress`: Validates that an address follows the format for a specific chain
- `getCompatibleFieldTypes`: Returns field types that are compatible with a specific blockchain parameter type
- `generateDefaultField`: Generates a default form field configuration for a function parameter

### Wallet Connection Methods

The adapter interface includes methods for wallet connection functionality, allowing renderer components to work with any supported blockchain wallet in a chain-agnostic way:

#### `supportsWalletConnection(): boolean`

Indicates whether this adapter supports wallet connection. Adapters that don't support wallet connection should return `false`, which allows UI components to conditionally render wallet features.

Example:

```typescript
// In EVM adapter
supportsWalletConnection(): boolean {
  return true; // EVM adapter supports wallet connection
}

// In minimal adapter
supportsWalletConnection(): boolean {
  return false; // This adapter doesn't support wallet connection
}
```

#### `connectWallet(): Promise<{ connected: boolean; address?: string; error?: string }>`

Initiates the wallet connection process. Returns a Promise that resolves to an object containing:

- `connected`: Whether the connection was successful
- `address`: The connected wallet address (if successful)
- `error`: An error message (if the connection failed)

Example:

```typescript
async connectWallet(): Promise<{ connected: boolean; address?: string; error?: string }> {
  try {
    // Chain-specific wallet connection code
    const address = await this.internalConnectMethod();
    return { connected: true, address };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}
```

#### `disconnectWallet(): Promise<{ disconnected: boolean; error?: string }>`

Disconnects the currently connected wallet. Returns a Promise that resolves to an object containing:

- `disconnected`: Whether the disconnection was successful
- `error`: An error message (if the disconnection failed)

Example:

```typescript
async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
  try {
    // Chain-specific wallet disconnection code
    await this.internalDisconnectMethod();
    return { disconnected: true };
  } catch (err) {
    return { disconnected: false, error: err.message };
  }
}
```

#### `getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string }`

Gets the current wallet connection status. Returns an object containing:

- `isConnected`: Whether a wallet is currently connected
- `address`: The connected wallet address (if connected)
- `chainId`: The ID of the connected chain (if available)

Example:

```typescript
getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
  // Chain-specific status check
  const status = this.internalGetStatus();
  return {
    isConnected: status.connected,
    address: status.account,
    chainId: status.network
  };
}
```

#### `onWalletConnectionChange?(callback: (status: { isConnected: boolean; address?: string }) => void): () => void`

Optional method to subscribe to wallet connection changes. Takes a callback function that will be called whenever the connection status changes. Returns a cleanup function to unsubscribe.

Example:

```typescript
onWalletConnectionChange(
  callback: (status: { isConnected: boolean; address?: string }) => void
): () => void {
  // Chain-specific subscription code
  const unsubscribe = this.internalSubscribe((newStatus) => {
    callback({
      isConnected: newStatus.connected,
      address: newStatus.account
    });
  });

  return unsubscribe;
}
```

## Implementation Guidelines

When implementing the wallet connection methods in a chain-specific adapter:

1. Fully encapsulate all chain-specific wallet connection logic within the adapter
2. Do not expose any chain-specific libraries or interfaces outside the adapter
3. Handle errors gracefully and return appropriate error messages
4. Ensure the adapter properly cleans up resources when disconnecting

For adapters that don't support wallet connection, implement stub methods:

```typescript
supportsWalletConnection(): boolean {
  return false;
}

async connectWallet(): Promise<{ connected: boolean; address?: string; error?: string }> {
  return { connected: false, error: "Wallet connection not supported" };
}

async disconnectWallet(): Promise<{ disconnected: boolean; error?: string }> {
  return { disconnected: true };
}

getWalletConnectionStatus(): { isConnected: boolean; address?: string; chainId?: string } {
  return { isConnected: false };
}
```

## UI Facilitation Capabilities (Optional)

In addition to the core contract interaction and wallet connection methods, the `ContractAdapter` interface supports optional methods that allow adapters to provide enhanced UI facilitation for richer, ecosystem-specific user experiences. These methods enable the builder application and UI components to leverage underlying libraries (like `wagmi/react` for EVM) in a chain-agnostic manner.

These capabilities are defined in `packages/types/src/adapters/ui-enhancements.ts` and include:

- **`configureUiKit?(config: UiKitConfiguration): void;`**
  - Allows the consuming application (typically via a central provider like `WalletStateProvider` in `builder`) to inform the adapter about the desired UI kit (e.g., 'custom' for adapter-provided basic components, or names of third-party kits like 'rainbowkit') and pass any kit-specific configuration. The `kitConfig` can include general options for the chosen kit, as well as a `components: { exclude: Array<keyof EcosystemWalletComponents> }` field to selectively prevent the adapter from providing certain default UI components (like `NetworkSwitcher` or `AccountDisplay`).

- **`getEcosystemReactUiContextProvider?(): React.ComponentType<EcosystemReactUiProviderProps> | undefined;`**
  - Adapters can return a React component that, when rendered, sets up the entire necessary UI context for that adapter's ecosystem. For example, an EVM adapter would return a component that internally renders `<WagmiProvider>` (and potentially a `<QueryClientProvider>`). This context is essential for the facade React hooks to function.

- **`getEcosystemReactHooks?(): EcosystemSpecificReactHooks | undefined;`**
  - Returns an object containing facade React hooks for common wallet and blockchain interactions. Consumers (like `NetworkSwitchManager` or UI components in `builder`) use these hooks for reactive state and actions.
  - **Convention for Hook Return Objects:** Adapters implementing this should ensure their facade hooks return objects with conventionally named properties for common states and actions. For example:
    - A `useAccount` facade should aim to return `{ isConnected: boolean, address?: string, chainId?: number, ... }`.
    - A `useSwitchChain` facade should aim to return `{ switchChain: Function, isPending: boolean, error: Error | null, ... }`.
    - If the underlying library uses different property names (e.g., `isLoading` instead of `isPending`), the adapter's facade implementation is responsible for mapping to the conventional names to ensure consistent consumption by chain-agnostic components.

- **`getEcosystemWalletComponents?(): EcosystemWalletComponents | undefined;`**
  - Returns an object mapping standardized names (e.g., `ConnectButton`, `AccountDisplay`, `NetworkSwitcher`) to React components. These components are sourced either from a configured third-party UI kit or are basic custom implementations provided by the adapter itself. These components are expected to internally use the facade hooks provided by `getEcosystemReactHooks` (typically accessed via a global state hook like `useWalletState` in the `builder` application).

By implementing these optional methods, adapters can offer a deeply integrated and reactive UI experience while allowing the builder application to remain decoupled from the specifics of any particular wallet library or UI kit.

For details on how the `builder` application consumes these capabilities (e.g., via `WalletStateProvider` and `useWalletState()`), see the main [Adapter Architecture Guide](../../../docs/ADAPTER_ARCHITECTURE.md).
