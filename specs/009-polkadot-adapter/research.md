# Research: Polkadot Adapter

**Date**: 2026-01-08  
**Branch**: `009-polkadot-adapter`

## Overview

This document records research findings for implementing the Polkadot adapter.

---

## 1. Blockscout API Compatibility

### Decision
Use existing `loadAbiFromEtherscanV1` function from `adapter-evm-core` for Blockscout explorers.

### Rationale
Blockscout implements the Etherscan V1 API format (`?module=contract&action=getabi&address=...`). The response format is identical:

```json
{
  "status": "1",
  "message": "OK",
  "result": "[{...ABI JSON...}]"
}
```

This means no new ABI loader is needed - we simply configure networks with Blockscout API URLs and set `supportsEtherscanV2: false`.

### Alternatives Considered
- **Blockscout REST API v2**: Uses `/api/v2/smart-contracts/{address}` with a different response format. Would require a new loader function. Rejected because V1 format is already supported.
- **Custom Blockscout loader**: Unnecessary given V1 compatibility.

### Verification
- Blockscout docs confirm Etherscan-compatible API: https://docs.blockscout.com/devs/apis/rpc/contract
- Polkadot Hub Blockscout endpoint: `https://blockscout.polkadot.io/api`
- Kusama Hub Blockscout endpoint: `https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api`

---

## 2. Network Configuration Strategy

### Decision
Define 6 initial networks across two files (`mainnet.ts`, `testnet.ts`) with priority ordering.

### Rationale
Following the established pattern in `adapter-evm`, networks are organized by mainnet/testnet categories. The `networkCategory` field enables UI grouping (Hub networks first, parachains second).

### Network Configurations

| Network | Chain ID | Priority | File |
|---------|----------|----------|------|
| Polkadot Hub | 420420419 | P1 | mainnet.ts |
| Kusama Hub | 420420418 | P1 | mainnet.ts |
| Moonbeam | 1284 | P2 | mainnet.ts |
| Moonriver | 1285 | P2 | mainnet.ts |
| Polkadot Hub TestNet | 420420417 | P1 | testnet.ts |
| Moonbase Alpha | 1287 | P2 | testnet.ts |

### Explorer Configuration

| Network | Explorer Type | API URL | supportsEtherscanV2 |
|---------|--------------|---------|---------------------|
| Polkadot Hub | Blockscout | `https://blockscout.polkadot.io/api` | false |
| Kusama Hub | Blockscout | `https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/api` | false |
| Polkadot Hub TestNet | Blockscout | `https://blockscout.polkadot.io/api` (testnet) | false |
| Moonbeam | Moonscan | `https://api.etherscan.io/v2/api` | true |
| Moonriver | Moonscan | `https://api.etherscan.io/v2/api` | true |
| Moonbase Alpha | Moonscan | `https://api.etherscan.io/v2/api` | true |

### Alternatives Considered
- **Single networks file**: Rejected for consistency with `adapter-evm` pattern.
- **Separate files per network**: Overkill for 6 networks.

---

## 3. viem/wagmi Chain Support

### Decision
Use `viem/chains` for Moonbeam networks; define custom chain configs for Polkadot Hub networks. **Use Wagmi v2** (same as adapter-evm).

### Rationale
viem provides built-in support for `moonbeam`, `moonriver`, and `moonbaseAlpha` chains. Polkadot Hub networks (chain IDs 420420417-420420419) are not yet in viem's chain registry and require custom definitions.

**Key finding:** The chain configuration format is **identical in Wagmi v2 and v3**. The only difference is hook naming (`useAccount` vs `useConnection`). Since:
1. RainbowKit v2 requires Wagmi v2
2. The existing adapter-evm uses Wagmi v2
3. Polkadot Hub doesn't require any v3-specific features

We use **Wagmi v2** for consistency and RainbowKit compatibility.

### Implementation
```typescript
// For Moonbeam (viem built-in) - works with both wagmi v2 and v3
import { moonbeam, moonriver, moonbaseAlpha } from 'viem/chains';

// For Polkadot Hub (custom definition) - works with both wagmi v2 and v3
export const polkadotHub = {
  id: 420420419,
  name: 'Polkadot Hub',
  network: 'polkadot-hub',
  nativeCurrency: { name: 'DOT', symbol: 'DOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://services.polkadothub-rpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://blockscout.polkadot.io' },
  },
} as const;

// For Polkadot Hub TestNet
export const polkadotHubTestNet = {
  id: 420420417,
  name: 'polkadot-hub-testnet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: { decimals: 18, name: 'PAS', symbol: 'PAS' },
  rpcUrls: {
    default: { http: ['https://services.polkadothub-rpc.com/testnet'] },
  },
} as const;
```

### Official Reference
- **Polkadot Docs**: https://docs.polkadot.com/smart-contracts/libraries/wagmi/ (shows v3 examples, but config format is v2-compatible)

### Alternatives Considered
- **Use Wagmi v3**: Would break RainbowKit compatibility; no functional benefit for Polkadot Hub
- **Wait for viem to add Polkadot Hub**: Unknown timeline; custom definitions work fine
- **Don't use viem chains**: Would lose type safety and wagmi integration benefits

---

## 4. Ecosystem Registration

### Decision
Register "Polkadot" as a new ecosystem in the ecosystem manager.

### Rationale
The UI Builder's ecosystem manager (`apps/builder/src/core/ecosystemManager.ts`) maintains a registry of available ecosystems. Polkadot needs to be registered as a distinct ecosystem (not a sub-ecosystem of Ethereum) to appear in the ecosystem selector.

### Implementation
```typescript
// In adapter-polkadot/src/index.ts
import { ecosystemManager } from '@openzeppelin/ui-builder-core';
import { PolkadotAdapter } from './adapter';
import { networks } from './networks';

ecosystemManager.register({
  id: 'polkadot',
  name: 'Polkadot',
  adapter: PolkadotAdapter,
  networks: Object.values(networks),
  icon: 'polkadot-icon', // Standard icon reference
});
```

### Alternatives Considered
- **Add as Ethereum sub-networks**: Would confuse users; Polkadot is a distinct ecosystem.
- **Separate ecosystem per network**: Overkill; all Polkadot networks share the same adapter logic.

---

## 5. TypedPolkadotNetworkConfig Design

### Decision
Extend `TypedEvmNetworkConfig` with Polkadot-specific fields.

### Rationale
Since all initial networks are EVM-compatible, we can extend the existing EVM config type. Additional fields support future non-EVM networks and UI grouping.

### Type Definition
```typescript
export type PolkadotExecutionType = 'evm' | 'substrate';

export interface TypedPolkadotNetworkConfig extends TypedEvmNetworkConfig {
  executionType: PolkadotExecutionType;
  networkCategory: 'hub' | 'parachain';
  relayChain?: 'polkadot' | 'kusama';
}
```

### Field Purposes
- `executionType`: Routes requests to appropriate handler (only 'evm' implemented initially)
- `networkCategory`: Groups networks in UI (Hub networks appear first)
- `relayChain`: Optional metadata for display/filtering

### Alternatives Considered
- **Flat union type**: Less extensible for future non-EVM support.
- **Separate config types**: Would require conditional logic throughout adapter.

---

## 6. Wallet Component Strategy

### Decision
Re-export wallet components from `adapter-evm` with Polkadot-specific chain configurations. **RainbowKit v2 works** since we use Wagmi v2.

### Rationale
EVM wallets (MetaMask, WalletConnect) work identically on Polkadot EVM networks. The existing wallet components from `adapter-evm` (including RainbowKit integration) can be reused with different chain configurations.

**Key benefit of using Wagmi v2:** RainbowKit v2 provides a polished wallet connection UI out of the box. No need to implement custom wallet UI or wait for RainbowKit v3.

### Implementation
```typescript
// adapter-polkadot/src/wallet/index.ts
export {
  EvmWalletUiRoot,
  ConnectButton,
  AccountDisplay,
  NetworkSwitcher,
} from '@openzeppelin/ui-builder-adapter-evm/wallet';

// Polkadot-specific config - same pattern as adapter-evm
export function createPolkadotWagmiConfig(networks: TypedPolkadotNetworkConfig[]) {
  // Uses Wagmi v2 + RainbowKit v2, same as adapter-evm
}
```

### Alternatives Considered
- **Copy wallet components**: Violates reuse-first principle.
- **Create new wallet abstraction**: Unnecessary for EVM-compatible networks.
- **Use Wagmi v3 without RainbowKit**: Would lose the polished wallet UI; no functional benefit.

---

## 7. Dependency on adapter-evm-core

### Decision
Depend on spec 008 completion; use workspace dependency.

### Rationale
The Polkadot adapter consumes `adapter-evm-core` for all EVM operations. The 008-extract-evm-core spec must be completed first, but implementation can proceed in parallel with careful coordination.

### Dependency Declaration
```json
{
  "dependencies": {
    "@openzeppelin/ui-builder-adapter-evm-core": "workspace:*"
  }
}
```

### Build Configuration
```typescript
// tsup.config.ts
export default defineConfig({
  noExternal: ['@openzeppelin/ui-builder-adapter-evm-core'],
});
```

### Alternatives Considered
- **Copy EVM adapter code**: Violates DRY, creates maintenance burden.
- **Wait for 008 completion**: Unnecessary; can develop against planned API.

---

## 8. Official Documentation Reference

### Source
- **URL**: https://docs.polkadot.com/smart-contracts/libraries/wagmi/
- **Title**: "Wagmi for Polkadot Hub Smart Contracts"

### Key Confirmations from Official Docs
1. **Chain ID 420420417** for Polkadot Hub TestNet
2. **RPC URL**: `https://services.polkadothub-rpc.com/testnet` for testnet
3. **Native currency**: PAS (Paseo) with 18 decimals for testnet
4. **Custom chain config pattern** - matches our implementation approach (works with both v2 and v3)

### Note on Wagmi Version in Official Docs
The official docs demonstrate Wagmi v3 (`npm install wagmi@3`), however:
- The **chain configuration format is identical** in v2 and v3
- The only difference is **hook naming** (`useAccount` vs `useConnection`)
- Polkadot Hub doesn't require any v3-specific features
- We use **Wagmi v2** for RainbowKit compatibility and consistency with adapter-evm

### Wagmi v2 vs v3 Hook Differences (for reference)
| Wagmi v2 | Wagmi v3 |
|----------|----------|
| `useAccount` | `useConnection` |
| `useSwitchAccount` | `useSwitchConnection` |
| `useAccountEffect` | `useConnectionEffect` |

Both versions use `@tanstack/react-query` and the same connector pattern for MetaMask/WalletConnect.

---

## Summary

All research items resolved. Key findings:

1. **No `adapter-evm-core` changes needed** - Blockscout is Etherscan V1 compatible
2. **6 networks in 2 files** - Following existing pattern
3. **Custom viem chains for Polkadot Hub** - Not yet in viem registry; custom definitions work with both v2 and v3
4. **Extend `TypedEvmNetworkConfig`** - For future non-EVM support
5. **Re-export wallet components** - Same EVM wallet logic applies (RainbowKit works!)
6. **Wagmi v2** - Use same version as adapter-evm; chain configs are v2/v3 compatible, RainbowKit requires v2
7. **No dependency on 010-wagmi-v3-upgrade** - Polkadot adapter can proceed independently
