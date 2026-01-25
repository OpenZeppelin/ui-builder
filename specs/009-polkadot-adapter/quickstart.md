# Quickstart: Polkadot Adapter

**Date**: 2026-01-08  
**Branch**: `009-polkadot-adapter`

## Overview

This guide covers using the Polkadot adapter to interact with EVM-compatible networks in the Polkadot ecosystem.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Familiarity with the [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md)
- Reference: [Official Polkadot Wagmi Guide](https://docs.polkadot.com/smart-contracts/libraries/wagmi/)

## Installation

```bash
pnpm add @openzeppelin/ui-builder-adapter-polkadot
```

**Note**: The adapter uses **Wagmi v2** (same as adapter-evm) for RainbowKit compatibility. While [official Polkadot docs](https://docs.polkadot.com/smart-contracts/libraries/wagmi/) show Wagmi v3 examples, the chain configuration format is identical - only hook names differ (`useAccount` in v2 vs `useConnection` in v3).

## Basic Usage

### 1. Import and Create Adapter

```typescript
import { PolkadotAdapter, polkadotHubMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';

// Create adapter for Polkadot Hub
const adapter = new PolkadotAdapter(polkadotHubMainnet);
```

### 2. Load a Contract

```typescript
// Load verified contract from Blockscout
const schema = await adapter.loadContract('0x1234567890123456789012345678901234567890');

console.log('Contract:', schema.name);
console.log('Functions:', schema.functions.map(f => f.name));
```

### 3. Query View Functions

```typescript
// Query a view function (no wallet needed)
const balance = await adapter.queryViewFunction(
  '0x1234567890123456789012345678901234567890',
  'balanceOf',
  ['0xabcdef...'],
  schema
);

// Format for display
const formatted = adapter.formatFunctionResult(balance, schema.functions[0].outputs, 'balanceOf');
console.log('Balance:', formatted);
```

### 4. Validate Addresses

```typescript
// Validate EVM address format
const isValid = adapter.isValidAddress('0x1234567890123456789012345678901234567890');
console.log('Valid:', isValid); // true
```

## Available Networks

### Hub Networks (P1 Priority)

| Network | Import | Chain ID | Currency |
|---------|--------|----------|----------|
| Polkadot Hub | `polkadotHubMainnet` | 420420419 | DOT |
| Kusama Hub | `kusamaHubMainnet` | 420420418 | KSM |
| Polkadot Hub TestNet | `polkadotHubTestnet` | 420420417 | PAS |

### Parachain Networks (P2 Priority)

| Network | Import | Chain ID | Currency |
|---------|--------|----------|----------|
| Moonbeam | `moonbeamMainnet` | 1284 | GLMR |
| Moonriver | `moonriverMainnet` | 1285 | MOVR |
| Moonbase Alpha | `moonbaseAlphaTestnet` | 1287 | DEV |

### Import Examples

```typescript
import {
  // Hub networks
  polkadotHubMainnet,
  kusamaHubMainnet,
  polkadotHubTestnet,
  
  // Parachain networks
  moonbeamMainnet,
  moonriverMainnet,
  moonbaseAlphaTestnet,
  
  // All networks
  networks,
  mainnetNetworks,
  testnetNetworks,
} from '@openzeppelin/ui-builder-adapter-polkadot';
```

## Wallet Integration

### Setup Wallet Provider

```tsx
import { PolkadotWalletUiRoot, ConnectButton, AccountDisplay } from '@openzeppelin/ui-builder-adapter-polkadot';
import { polkadotHubMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';

function App() {
  return (
    <PolkadotWalletUiRoot networkConfig={polkadotHubMainnet}>
      <div>
        <ConnectButton />
        <AccountDisplay />
      </div>
    </PolkadotWalletUiRoot>
  );
}
```

### Direct Wagmi Usage (Advanced)

For direct Wagmi v2 integration (same pattern as adapter-evm):

```tsx
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { polkadotHub } from '@openzeppelin/ui-builder-adapter-polkadot';
import { http, createConfig } from 'wagmi';

// Create Wagmi config with Polkadot Hub chain
// Note: This config format is identical in wagmi v2 and v3
const config = createConfig({
  chains: [polkadotHub],
  transports: {
    [polkadotHub.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

### Reading Contract Data (Wagmi v2)

```tsx
import { useReadContract, useAccount } from "wagmi";

function ContractReader() {
  const { address, isConnected } = useAccount(); // Wagmi v2 uses useAccount
  
  const { data: storedValue } = useReadContract({
    address: '0x...',
    abi: contractAbi,
    functionName: 'getValue',
  });

  return <div>Value: {storedValue?.toString()}</div>;
}
```

> **Note**: If you're following [official Polkadot docs](https://docs.polkadot.com/smart-contracts/libraries/wagmi/) which show Wagmi v3, replace `useConnection` with `useAccount` for v2 compatibility.

### Execute Transactions

```typescript
import { PolkadotAdapter, polkadotHubMainnet } from '@openzeppelin/ui-builder-adapter-polkadot';

const adapter = new PolkadotAdapter(polkadotHubMainnet);

// Execute a state-changing function
const result = await adapter.executeTransaction(
  '0x1234567890123456789012345678901234567890',
  'transfer',
  ['0xrecipient...', '1000000000000000000'], // 1 token with 18 decimals
  schema,
  {
    type: 'eoa', // or 'relayer'
    // Additional execution config...
  }
);
```

## Network Utilities

### Filter by Category

```typescript
import { getNetworksByCategory } from '@openzeppelin/ui-builder-adapter-polkadot';

// Get only Hub networks
const hubNetworks = getNetworksByCategory('hub');
// Returns: [polkadotHubMainnet, kusamaHubMainnet, polkadotHubTestnet]

// Get only parachain networks
const parachains = getNetworksByCategory('parachain');
// Returns: [moonbeamMainnet, moonriverMainnet, moonbaseAlphaTestnet]
```

### Filter by Relay Chain

```typescript
import { getNetworksByRelayChain } from '@openzeppelin/ui-builder-adapter-polkadot';

// Get Polkadot-connected networks
const polkadotNetworks = getNetworksByRelayChain('polkadot');
// Returns: [polkadotHubMainnet, polkadotHubTestnet, moonbeamMainnet, moonbaseAlphaTestnet]

// Get Kusama-connected networks
const kusamaNetworks = getNetworksByRelayChain('kusama');
// Returns: [kusamaHubMainnet, moonriverMainnet]
```

### Check Network Type

```typescript
import { isHubNetwork, isParachainNetwork } from '@openzeppelin/ui-builder-adapter-polkadot';

isHubNetwork(polkadotHubMainnet);    // true
isHubNetwork(moonbeamMainnet);        // false

isParachainNetwork(moonbeamMainnet);  // true
isParachainNetwork(polkadotHubMainnet); // false
```

## Custom viem Chains

For advanced viem/wagmi integration, use the exported chain definitions:

```typescript
import { polkadotHub, kusamaHub, polkadotHubTestNet } from '@openzeppelin/ui-builder-adapter-polkadot';
import { moonbeam, moonriver, moonbaseAlpha } from 'viem/chains';

// Use in wagmi config
const chains = [
  polkadotHub,
  kusamaHub,
  moonbeam,
  moonriver,
];
```

## Explorer API Behavior

### Hub Networks (Blockscout)

Hub networks use Blockscout explorers with Etherscan V1-compatible API:

```typescript
// Network config
{
  apiUrl: 'https://blockscout.polkadot.io/api',
  supportsEtherscanV2: false,  // Uses V1 API format
}
```

### Parachain Networks (Moonscan)

Parachain networks use Moonscan with Etherscan V2 API:

```typescript
// Network config
{
  apiUrl: 'https://api.etherscan.io/v2/api',
  supportsEtherscanV2: true,  // Uses V2 API format
}
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { PolkadotAdapter, polkadotHubTestnet } from '@openzeppelin/ui-builder-adapter-polkadot';

describe('PolkadotAdapter', () => {
  const adapter = new PolkadotAdapter(polkadotHubTestnet);

  it('validates addresses correctly', () => {
    expect(adapter.isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
    expect(adapter.isValidAddress('invalid')).toBe(false);
  });

  it('maps EVM types correctly', () => {
    expect(adapter.mapParameterTypeToFieldType('uint256')).toBe('number');
    expect(adapter.mapParameterTypeToFieldType('address')).toBe('address');
    expect(adapter.mapParameterTypeToFieldType('bool')).toBe('boolean');
  });

  it('returns correct network config', () => {
    const config = adapter.getNetworkConfig();
    expect(config.id).toBe('polkadot-hub-testnet');
    expect(config.chainId).toBe(420420417);
    expect(config.executionType).toBe('evm');
    expect(config.networkCategory).toBe('hub');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { PolkadotAdapter, polkadotHubTestnet } from '@openzeppelin/ui-builder-adapter-polkadot';

describe('PolkadotAdapter Integration', () => {
  const adapter = new PolkadotAdapter(polkadotHubTestnet);

  it('loads verified contract from Blockscout', async () => {
    // Use a known verified contract on testnet
    const schema = await adapter.loadContract('0xKnownVerifiedContract...');
    
    expect(schema).toBeDefined();
    expect(schema.address).toBe('0xKnownVerifiedContract...');
    expect(schema.functions.length).toBeGreaterThan(0);
  });
});
```

## Common Patterns

### Switch Between Networks

```typescript
import { PolkadotAdapter, networks } from '@openzeppelin/ui-builder-adapter-polkadot';

function createAdapter(networkId: string) {
  const config = networks[networkId];
  if (!config) {
    throw new Error(`Unknown network: ${networkId}`);
  }
  return new PolkadotAdapter(config);
}

// Usage
const adapter = createAdapter('polkadot-hub');
// or
const testAdapter = createAdapter('moonbase-alpha');
```

### Handle Network-Specific Logic

```typescript
import { PolkadotAdapter, TypedPolkadotNetworkConfig } from '@openzeppelin/ui-builder-adapter-polkadot';

function getExplorerLink(config: TypedPolkadotNetworkConfig, txHash: string): string {
  return `${config.explorerUrl}/tx/${txHash}`;
}

function getNetworkDisplayInfo(config: TypedPolkadotNetworkConfig) {
  return {
    name: config.name,
    category: config.networkCategory === 'hub' ? 'Official Hub' : 'Parachain',
    relay: config.relayChain === 'polkadot' ? 'Polkadot' : 'Kusama',
    currency: config.nativeCurrency.symbol,
  };
}
```

## Troubleshooting

### Contract Not Found

If `loadContract` fails:

1. Verify the contract is verified on the network's explorer
2. Check the address is correct (case-insensitive for EVM)
3. Ensure the network's explorer API is accessible

### Chain ID Mismatch

If wallet shows wrong network:

1. Configure MetaMask with the correct chain ID
2. Use `NetworkSwitcher` component to prompt user
3. Verify network config has correct `chainId`

### API Rate Limiting

If experiencing rate limits:

1. Hub networks (Blockscout) generally have generous limits
2. Moonscan may require an API key for high-volume usage
3. Configure API key via `AppConfigService` if needed
