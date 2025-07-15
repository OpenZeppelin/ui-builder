# Network Configuration Pattern

This document explains the pattern for defining network configurations in the Contracts UI Builder's ecosystem of packages.

## Overview

The Contracts UI Builder supports multiple blockchain ecosystems (EVM, Solana, Stellar, Midnight) with various networks (mainnet, testnets, etc.) within each ecosystem. To maintain a chain-agnostic architecture while preserving type safety and separation of concerns, we use a pattern where:

1. Network configurations are defined in their respective adapter packages
2. Each adapter exports its network configurations
3. The builder app discovers and aggregates these configurations

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

### 4. Builder App Network Discovery

The builder application, specifically the `ecosystemManager.ts` module, dynamically discovers and aggregates network configurations from all registered adapter packages. This is achieved by:

1.  Maintaining an `ecosystemRegistry` that maps each `Ecosystem` to its metadata, including the conventional export name for its network list (e.g., `evmNetworks`).
2.  Dynamically importing the main module of each adapter package (e.g., `@openzeppelin/contracts-ui-builder-adapter-evm`).
3.  Accessing the exported network list from the imported module using the conventional name (e.g., `module.evmNetworks`).

This allows the builder to remain decoupled from the specifics of each adapter package while still being able to gather all network configurations.

```typescript
// Simplified conceptual example from builder/src/core/ecosystemManager.ts

// Centralized configuration for each ecosystem
const ecosystemRegistry = {
  evm: {
    networksExportName: 'evmNetworks',
    // ... other metadata ...
  },
  solana: {
    networksExportName: 'solanaNetworks',
    // ... other metadata ...
  },
  // ... other ecosystems
};

async function loadAdapterPackageModule(ecosystem: Ecosystem): Promise<any> {
  switch (ecosystem) {
    case 'evm':
      return import('@openzeppelin/contracts-ui-builder-adapter-evm');
    case 'solana':
      return import('@openzeppelin/contracts-ui-builder-adapter-solana');
    // ... etc.
    default:
      throw new Error('...');
  }
}

export async function getNetworksByEcosystem(ecosystem: Ecosystem): Promise<NetworkConfig[]> {
  // ... (caching logic) ...
  const meta = ecosystemRegistry[ecosystem];
  const module = await loadAdapterPackageModule(ecosystem);
  const networks = module[meta.networksExportName] || [];
  // ... (caching and return logic) ...
}
```

## Template for Adapter Network Exports

Here's a template for implementing network configurations in an adapter:

```typescript
// In adapter-{ecosystem}/src/networks/mainnet.ts
import { {Ecosystem}NetworkConfig } from '@openzeppelin/contracts-ui-builder-types';

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
4. **Chain-Agnosticism**: Builder remains agnostic, only knowing about networks through adapters
5. **Type Safety**: Discriminated unions ensure type safety when accessing ecosystem-specific properties
