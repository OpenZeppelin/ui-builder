# Contract Adapter Interface

This directory contains the base interface and type definitions for the contract adapter system. The adapter pattern allows the Transaction Form Builder to support multiple blockchains while keeping the core application chain-agnostic.

## ContractAdapter Interface

The `ContractAdapter` interface defines the methods that must be implemented by all chain-specific adapters. This interface acts as a contract between the application and the chain-specific code, ensuring a consistent API regardless of the underlying blockchain.

### Core Methods

- `formatTransactionData`: Formats the submitted form data into a transaction payload for the specific chain
- `isValidAddress`: Validates that an address follows the format for a specific chain
- `getCompatibleFieldTypes`: Returns field types that are compatible with a specific blockchain parameter type
- `generateDefaultField`: Generates a default form field configuration for a function parameter

### Wallet Connection Methods

The adapter interface includes methods for wallet connection functionality, allowing form-renderer components to work with any supported blockchain wallet in a chain-agnostic way:

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
