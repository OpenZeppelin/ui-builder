# Data Model: Polkadot Adapter

**Date**: 2026-01-08  
**Branch**: `009-polkadot-adapter`

## Overview

This document defines the type system and data structures for the Polkadot adapter.

---

## Core Types

### PolkadotExecutionType

Discriminator for routing requests to the appropriate handler.

```typescript
/**
 * Polkadot network execution types.
 * - 'evm': Networks using EVM via PolkaVM/REVM or native EVM (Moonbeam)
 * - 'substrate': Future - Native Substrate/Wasm chains (not implemented)
 */
export type PolkadotExecutionType = 'evm' | 'substrate';
```

| Value | Description | Status |
|-------|-------------|--------|
| `'evm'` | EVM-compatible networks (PolkaVM, Moonbeam) | Implemented |
| `'substrate'` | Native Substrate/Wasm networks | Reserved for future |

---

### PolkadotNetworkCategory

Grouping for UI display and ordering.

```typescript
/**
 * Network category for UI grouping.
 * - 'hub': Official Polkadot/Kusama system chains (displayed first)
 * - 'parachain': Independent parachains (displayed after hub networks)
 */
export type PolkadotNetworkCategory = 'hub' | 'parachain';
```

| Value | Description | Display Order |
|-------|-------------|---------------|
| `'hub'` | System chains (Polkadot Hub, Kusama Hub) | 1 (first) |
| `'parachain'` | Independent chains (Moonbeam, Moonriver) | 2 (second) |

---

### PolkadotRelayChain

Optional metadata for relay chain association.

```typescript
/**
 * The Polkadot/Kusama relay chain this network connects to.
 */
export type PolkadotRelayChain = 'polkadot' | 'kusama';
```

| Value | Description |
|-------|-------------|
| `'polkadot'` | Connected to Polkadot relay chain |
| `'kusama'` | Connected to Kusama relay chain |

---

### TypedPolkadotNetworkConfig

Extended network configuration for Polkadot ecosystem.

```typescript
import type { TypedEvmNetworkConfig } from '@openzeppelin/ui-builder-adapter-evm-core';

/**
 * Extended network configuration for Polkadot ecosystem.
 * Inherits all EVM fields for EVM-compatible networks.
 */
export interface TypedPolkadotNetworkConfig extends Omit<TypedEvmNetworkConfig, 'ecosystem'> {
  ecosystem: 'polkadot';
  /**
   * Execution type determines which handler processes requests.
   * Currently only 'evm' is implemented; 'substrate' reserved for future.
   */
  executionType: PolkadotExecutionType;

  /**
   * Network category for UI grouping.
   * Hub networks appear before parachain networks in selectors.
   */
  networkCategory: PolkadotNetworkCategory;

  /**
   * Optional: The relay chain this network is connected to.
   * Used for display purposes and filtering.
   */
  relayChain?: PolkadotRelayChain;
}
```

#### Inherited Fields (from TypedEvmNetworkConfig)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique network identifier |
| `name` | `string` | Yes | Display name |
| `ecosystem` | `string` | Yes | Always `'polkadot'` |
| `network` | `string` | Yes | Network slug |
| `type` | `'mainnet' \| 'testnet'` | Yes | Network type |
| `isTestnet` | `boolean` | Yes | Whether this is a testnet |
| `chainId` | `number` | Yes | EVM chain ID |
| `rpcUrl` | `string` | Yes | Primary RPC endpoint |
| `explorerUrl` | `string` | No | Block explorer URL |
| `apiUrl` | `string` | No | Explorer API URL |
| `supportsEtherscanV2` | `boolean` | No | Whether to use Etherscan V2 API |
| `nativeCurrency` | `NativeCurrency` | Yes | Native currency config |
| `viemChain` | `Chain` | No | viem chain definition |

#### Polkadot-Specific Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `executionType` | `PolkadotExecutionType` | Yes | Handler routing discriminator |
| `networkCategory` | `PolkadotNetworkCategory` | Yes | UI grouping category |
| `relayChain` | `PolkadotRelayChain` | No | Associated relay chain |

---

## Network Configurations

### Mainnet Networks

#### Polkadot Hub (P1)

```typescript
export const polkadotHubMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-hub',
  name: 'Polkadot Hub',
  ecosystem: 'polkadot',
  network: 'polkadot-hub',
  type: 'mainnet',
  isTestnet: false,
  chainId: 420420419,
  rpcUrl: 'https://services.polkadothub-rpc.com',
  explorerUrl: 'https://blockscout.polkadot.io',
  apiUrl: 'https://blockscout.polkadot.io/api',
  supportsEtherscanV2: false,
  nativeCurrency: {
    name: 'Polkadot',
    symbol: 'DOT',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'polkadot',
};
```

#### Kusama Hub (P1)

```typescript
export const kusamaHubMainnet: TypedPolkadotNetworkConfig = {
  id: 'kusama-hub',
  name: 'Kusama Hub',
  ecosystem: 'polkadot',
  network: 'kusama-hub',
  type: 'mainnet',
  isTestnet: false,
  chainId: 420420418,
  rpcUrl: 'https://kusama-asset-hub-eth-rpc.polkadot.io',
  explorerUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io',
  apiUrl: 'https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api',
  supportsEtherscanV2: false,
  nativeCurrency: {
    name: 'Kusama',
    symbol: 'KSM',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'kusama',
};
```

#### Moonbeam (P2)

```typescript
export const moonbeamMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-moonbeam-mainnet',
  name: 'Moonbeam',
  ecosystem: 'polkadot',
  network: 'moonbeam',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1284,
  rpcUrl: 'https://rpc.api.moonbeam.network',
  explorerUrl: 'https://moonbeam.moonscan.io',
  apiUrl: 'https://api-moonbeam.moonscan.io/api',
  supportsEtherscanV2: true,
  nativeCurrency: {
    name: 'Glimmer',
    symbol: 'GLMR',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'polkadot',
};
```

#### Moonriver (P2)

```typescript
export const moonriverMainnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-moonriver-mainnet',
  name: 'Moonriver',
  ecosystem: 'polkadot',
  network: 'moonriver',
  type: 'mainnet',
  isTestnet: false,
  chainId: 1285,
  rpcUrl: 'https://rpc.api.moonriver.moonbeam.network',
  explorerUrl: 'https://moonriver.moonscan.io',
  apiUrl: 'https://api-moonriver.moonscan.io/api',
  supportsEtherscanV2: true,
  nativeCurrency: {
    name: 'Moonriver',
    symbol: 'MOVR',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'kusama',
};
```

### Testnet Networks

#### Polkadot Hub TestNet (P1)

Per [official Polkadot documentation](https://docs.polkadot.com/smart-contracts/libraries/wagmi/):

```typescript
export const polkadotHubTestnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-hub-testnet',
  name: 'Polkadot Hub TestNet',
  ecosystem: 'polkadot',
  network: 'polkadot-hub-testnet',
  type: 'testnet',
  isTestnet: true,
  chainId: 420420417,  // Confirmed in official docs
  rpcUrl: 'https://services.polkadothub-rpc.com/testnet',  // Confirmed in official docs
  explorerUrl: 'https://polkadot.testnet.routescan.io',
  apiUrl: 'https://polkadot.testnet.routescan.io/api',
  supportsEtherscanV2: false,
  nativeCurrency: {
    name: 'PAS',  // Per official docs
    symbol: 'PAS',
    decimals: 18,  // Confirmed in official docs
  },
  executionType: 'evm',
  networkCategory: 'hub',
  relayChain: 'polkadot',
};
```

#### Moonbase Alpha (P2)

```typescript
export const moonbaseAlphaTestnet: TypedPolkadotNetworkConfig = {
  id: 'polkadot-moonbase-alpha-testnet',
  name: 'Moonbase Alpha',
  ecosystem: 'polkadot',
  network: 'moonbase-alpha',
  type: 'testnet',
  isTestnet: true,
  chainId: 1287,
  rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  explorerUrl: 'https://moonbase.moonscan.io',
  apiUrl: 'https://api-moonbase.moonscan.io/api',
  supportsEtherscanV2: true,
  nativeCurrency: {
    name: 'Dev',
    symbol: 'DEV',
    decimals: 18,
  },
  executionType: 'evm',
  networkCategory: 'parachain',
  relayChain: 'polkadot',
};
```

---

## Network Ordering

Networks are exported in priority order for UI display:

```typescript
// mainnet.ts
export const mainnetNetworks = [
  polkadotHubMainnet,    // P1 - Hub
  kusamaHubMainnet,      // P1 - Hub
  moonbeamMainnet,       // P2 - Parachain
  moonriverMainnet,      // P2 - Parachain
] as const;

// testnet.ts
export const testnetNetworks = [
  polkadotHubTestnet,    // P1 - Hub
  moonbaseAlphaTestnet,  // P2 - Parachain
] as const;

// index.ts
export const networks = {
  ...Object.fromEntries(mainnetNetworks.map(n => [n.id, n])),
  ...Object.fromEntries(testnetNetworks.map(n => [n.id, n])),
};
```

---

## Validation Rules

### Network ID Format
- Must be lowercase kebab-case
- Must be unique within the adapter
- Pattern: `/^[a-z][a-z0-9-]*$/`

### Chain ID Uniqueness
- Each network must have a unique chain ID
- Must not conflict with EVM adapter networks

### Required Fields Validation
- All `TypedPolkadotNetworkConfig` required fields must be present
- `executionType` must be `'evm'` (for now)
- `networkCategory` must be `'hub'` or `'parachain'`

---

## State Transitions

Not applicable - network configurations are static/immutable.

---

## Relationships

```
┌─────────────────────────────────────────────────────────┐
│                    PolkadotAdapter                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         TypedPolkadotNetworkConfig                │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │      TypedEvmNetworkConfig (inherited)      │ │   │
│  │  │  - id, name, chainId, rpcUrl, apiUrl, etc.  │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  │                                                   │   │
│  │  + executionType: PolkadotExecutionType          │   │
│  │  + networkCategory: PolkadotNetworkCategory      │   │
│  │  + relayChain?: PolkadotRelayChain               │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Handler Routing                      │   │
│  │                                                   │   │
│  │  executionType === 'evm'                          │   │
│  │    └──► adapter-evm-core modules                  │   │
│  │                                                   │   │
│  │  executionType === 'substrate' (future)           │   │
│  │    └──► substrate-handler (not implemented)       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## References

- **Official Polkadot Wagmi Guide**: https://docs.polkadot.com/smart-contracts/libraries/wagmi/ (shows v3, but chain config format is v2-compatible)
- **Wagmi v2 Documentation**: https://wagmi.sh/ (adapter uses v2 for RainbowKit compatibility)
- **viem Chains**: https://viem.sh/docs/chains/introduction

## Version Notes

The adapter uses **Wagmi v2** (same as adapter-evm). The chain configuration format shown above is identical in both v2 and v3. See `research.md` for the decision rationale.
