# Quickstart: Extract EVM Core Package

**Date**: 2026-01-09  
**Branch**: `008-extract-evm-core`

## Overview

This guide covers creating a new EVM-compatible adapter using `adapter-evm-core`.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Familiarity with the [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md)

## Creating a New EVM-Compatible Adapter

### 1. Create Package Structure

```bash
mkdir -p packages/adapter-your-chain/src
cd packages/adapter-your-chain
```

### 2. Initialize package.json

```json
{
  "name": "@openzeppelin/ui-builder-adapter-your-chain",
  "version": "1.0.0",
  "private": false,
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@openzeppelin/ui-builder-adapter-evm-core": "workspace:*",
    "@openzeppelin/ui-types": "^1.3.0",
    "@openzeppelin/ui-utils": "^1.1.0"
  },
  "peerDependencies": {
    "viem": "^2.28.0",
    "wagmi": "^2.15.0"
  }
}
```

### 3. Configure tsup to Bundle Core

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // IMPORTANT: Bundle the internal core package
  noExternal: ['@openzeppelin/ui-builder-adapter-evm-core'],
});
```

### 4. Define Network Configurations

```typescript
// src/networks/mainnet.ts
import { yourChain } from 'viem/chains';
import type { TypedEvmNetworkConfig } from '../types';

export const yourChainMainnet: TypedEvmNetworkConfig = {
  id: 'your-chain-mainnet',
  name: 'Your Chain',
  ecosystem: 'evm',
  network: 'your-chain',
  type: 'mainnet',
  isTestnet: false,
  chainId: 12345,
  rpcUrl: yourChain.rpcUrls.default.http[0],
  explorerUrl: 'https://explorer.yourchain.io',
  apiUrl: 'https://api.etherscan.io/v2/api', // If Etherscan-compatible
  supportsEtherscanV2: true,
  nativeCurrency: {
    name: 'Your Token',
    symbol: 'YCH',
    decimals: 18,
  },
  viemChain: yourChain,
};
```

### 5. Create the Adapter Class

```typescript
// src/adapter.ts
import type {
  ContractAdapter,
  ContractFunction,
  ContractSchema,
  FunctionParameter,
  NetworkConfig,
} from '@openzeppelin/ui-types';
import {
  loadEvmContract,
  mapEvmParamTypeToFieldType,
  getEvmCompatibleFieldTypes,
  generateEvmDefaultField,
  parseEvmInput,
  formatEvmFunctionResult,
  queryEvmViewFunction,
  isEvmViewFunction,
  formatEvmTransactionData,
  resolveRpcUrl,
  isValidEvmAddress,
  type EvmContractArtifacts,
} from '@openzeppelin/ui-builder-adapter-evm-core';
import type { TypedEvmNetworkConfig } from './types';

export class YourChainAdapter implements ContractAdapter {
  private networkConfig: TypedEvmNetworkConfig;

  constructor(networkConfig: NetworkConfig) {
    this.networkConfig = networkConfig as TypedEvmNetworkConfig;
  }

  // Delegate to core modules
  async loadContract(address: string, options?: { artifacts?: unknown }): Promise<ContractSchema> {
    const evmArtifacts: EvmContractArtifacts = {
      contractAddress: address,
      contractDefinition: typeof options?.artifacts === 'string' ? options.artifacts : undefined,
    };
    const result = await loadEvmContract(evmArtifacts, this.networkConfig, {});
    return result.schema;
  }

  mapParameterTypeToFieldType(paramType: string) {
    return mapEvmParamTypeToFieldType(paramType);
  }

  getCompatibleFieldTypes(paramType: string) {
    return getEvmCompatibleFieldTypes(paramType);
  }

  generateDefaultField(param: FunctionParameter, _functionId: string, _paramIndex: number) {
    // Core function only needs the parameter
    return generateEvmDefaultField(param);
  }

  parseInput(value: string, type: string) {
    // Build a minimal FunctionParameter from the type string
    const param: FunctionParameter = { name: '', type };
    return parseEvmInput(param, value);
  }

  formatFunctionResult(result: unknown, outputs: FunctionParameter[], functionId: string) {
    // Build a minimal ContractFunction for the core formatter
    const functionDetails: ContractFunction = {
      name: functionId,
      inputs: [],
      outputs,
      stateMutability: 'view',
    };
    return formatEvmFunctionResult(result, functionDetails);
  }

  isViewFunction(func: { stateMutability?: string }) {
    return isEvmViewFunction(func);
  }

  async queryViewFunction(address: string, functionId: string, params: unknown[], schema: ContractSchema) {
    const rpcUrl = resolveRpcUrl(this.networkConfig);
    return queryEvmViewFunction(address, functionId, params, schema, rpcUrl);
  }

  isValidAddress(address: string) {
    return isValidEvmAddress(address);
  }

  // ... implement remaining ContractAdapter methods
  // Wallet methods - implement with your chain's wallet library
}
```

### 6. Export Package API

```typescript
// src/index.ts
export { YourChainAdapter } from './adapter';
export { yourChainMainnet, yourChainTestnet } from './networks';
export type { TypedEvmNetworkConfig } from './types';
```

## Using Core Modules Directly

For advanced use cases, import specific modules:

```typescript
// Load ABI from Etherscan-compatible explorer
import { loadAbiFromEtherscanV2 } from '@openzeppelin/ui-builder-adapter-evm-core';

const abi = await loadAbiFromEtherscanV2(
  '0x1234...',
  networkConfig.chainId,
  networkConfig.apiUrl,
  apiKey
);

// Transform ABI to ContractSchema
import { transformAbiToSchema } from '@openzeppelin/ui-builder-adapter-evm-core';

const schema = transformAbiToSchema(abi, 'MyContract');

// Query a view function
import { queryEvmViewFunction } from '@openzeppelin/ui-builder-adapter-evm-core';

const result = await queryEvmViewFunction(
  contractAddress,
  'balanceOf',
  [ownerAddress],
  schema,
  rpcUrl
);
```

## Testing Your Adapter

```typescript
// src/__tests__/adapter.test.ts
import { describe, it, expect } from 'vitest';
import { YourChainAdapter } from '../adapter';
import { yourChainTestnet } from '../networks';

describe('YourChainAdapter', () => {
  const adapter = new YourChainAdapter(yourChainTestnet);

  it('validates addresses correctly', () => {
    expect(adapter.isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
    expect(adapter.isValidAddress('invalid')).toBe(false);
  });

  it('maps types correctly', () => {
    expect(adapter.mapParameterTypeToFieldType('uint256')).toBe('number');
    expect(adapter.mapParameterTypeToFieldType('address')).toBe('address');
  });
});
```

## Common Patterns

### Overriding Core Behavior

Use composition to customize core module behavior:

```typescript
async loadContract(address: string): Promise<ContractSchema> {
  // Custom pre-processing
  const normalizedAddress = address.toLowerCase();
  
  // Call core module with proper artifacts structure
  const evmArtifacts: EvmContractArtifacts = { contractAddress: normalizedAddress };
  const result = await loadEvmContract(evmArtifacts, this.networkConfig, {});
  
  // Custom post-processing
  result.schema.name = `${this.networkConfig.name}: ${result.schema.name}`;
  
  return result.schema;
}
```

### Adding Chain-Specific Features

Keep chain-specific logic in your adapter, not in core:

```typescript
// Your adapter can add methods beyond ContractAdapter interface
// (though they won't be accessible through the generic interface)
class YourChainAdapter implements ContractAdapter {
  // Standard ContractAdapter methods...
  
  // Chain-specific extension (use sparingly)
  async getYourChainSpecificData(): Promise<YourChainData> {
    // Implementation
  }
}
```
