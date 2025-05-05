# Network Configuration Pattern

This document explains the pattern for defining network configurations in the Transaction Form Builder's ecosystem of packages.

## Overview

The Transaction Form Builder supports multiple blockchain ecosystems (EVM, Solana, Stellar, Midnight) with various networks (mainnet, testnets, etc.) within each ecosystem. To maintain a chain-agnostic architecture while preserving type safety and separation of concerns, we use a pattern where:

1. Network configurations are defined in their respective adapter packages
2. Each adapter exports its network configurations
3. The core app discovers and aggregates these configurations

This approach ensures that network details live alongside the code that knows how to use them.

## Pattern Details

### 1. Adapter-Owned Network Configurations

Each adapter package (e.g., `adapter-evm`) owns and exports the network configurations for its ecosystem:

```
packages/
  adapter-evm/
    src/
      networks/           # Network configs live here
        mainnet.ts        # Ethereum, Polygon, etc. mainnet configs
        testnet.ts        # Sepolia, Mumbai, etc. testnet configs
        index.ts          # Exports all networks
```

### 2. Network Configuration Types

The `packages/types` package defines the discriminated union types for network configurations:

```typescript
// Base interface with common properties
export interface BaseNetworkConfig {
  id: string;
  name: string;
  ecosystem: NetworkEcosystem; // discriminant
  // ...more common fields
}

// EVM-specific network config
export interface EvmNetworkConfig extends BaseNetworkConfig {
  ecosystem: 'evm';
  chainId: number;
  rpcUrl: string;
  // ...EVM-specific fields
}

// Solana-specific network config
export interface SolanaNetworkConfig extends BaseNetworkConfig {
  ecosystem: 'solana';
  // ...Solana-specific fields
}

// Union type
export type NetworkConfig = EvmNetworkConfig | SolanaNetworkConfig;
// ...other ecosystem configs
```

### 3. Adapter Network Exports

Each adapter should export its networks following this convention:

```typescript
// In adapter-evm/src/networks/index.ts
export const evmNetworks: EvmNetworkConfig[] = [...];
export const evmMainnetNetworks: EvmNetworkConfig[] = [...];
export const evmTestnetNetworks: EvmNetworkConfig[] = [...];
```

And re-export them from the adapter's main entry point:

```typescript
// In adapter-evm/src/index.ts
export { evmNetworks, evmMainnetNetworks, evmTestnetNetworks } from './networks';
```

### 4. Core App Network Discovery

The core app discovers and aggregates network configurations from all adapters:

```typescript
// In core/src/core/networks/registry.ts
import { evmNetworks } from '@openzeppelin/transaction-form-adapter-evm';
import { solanaNetworks } from '@openzeppelin/transaction-form-adapter-solana';

// ...other imports

export const allNetworks = [
  ...evmNetworks,
  ...solanaNetworks,
  // ...other networks
];
```

## Template for Adapter Network Exports

Here's a template for implementing network configurations in an adapter:

```typescript
// In adapter-{ecosystem}/src/networks/mainnet.ts
import { {Ecosystem}NetworkConfig } from '@openzeppelin/transaction-form-types';

export const {network}Mainnet: {Ecosystem}NetworkConfig = {
  id: '{network}-mainnet',
  name: '{Network} Mainnet',
  ecosystem: '{ecosystem}',
  network: '{network}',
  type: 'mainnet',
  isTestnet: false,
  // ...ecosystem-specific fields
};

// In adapter-{ecosystem}/src/networks/testnet.ts
export const {network}Testnet: {Ecosystem}NetworkConfig = {
  id: '{network}-testnet',
  name: '{Network} Testnet',
  ecosystem: '{ecosystem}',
  network: '{network}',
  type: 'testnet',
  isTestnet: true,
  // ...ecosystem-specific fields
};

// In adapter-{ecosystem}/src/networks/index.ts
import { {network}Mainnet } from './mainnet';
import { {network}Testnet } from './testnet';

export const {ecosystem}MainnetNetworks = [
  {network}Mainnet,
  // ...other mainnets
];

export const {ecosystem}TestnetNetworks = [
  {network}Testnet,
  // ...other testnets
];

export const {ecosystem}Networks = [
  ...{ecosystem}MainnetNetworks,
  ...{ecosystem}TestnetNetworks,
];
```

## Benefits of This Approach

1. **True Separation of Concerns**: Adapters own their network definitions
2. **Simpler Maintenance**: Add/update a network by changing just the relevant adapter
3. **Knowledge Co-location**: Network details live with the code that knows how to use them
4. **Chain-Agnosticism**: Core remains agnostic, only knowing about networks through adapters
5. **Type Safety**: Discriminated unions ensure type safety when accessing ecosystem-specific properties
