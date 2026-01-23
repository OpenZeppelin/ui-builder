# Data Model: Extract EVM Core Package

**Date**: 2026-01-09  
**Branch**: `008-extract-evm-core`

## Overview

This feature is a refactoring extraction - no new data entities are introduced. The existing types and interfaces are reorganized across packages.

## Module Boundaries

### adapter-evm-core Exports

```typescript
// Core module re-exports from index.ts

// ABI handling
export {
  loadEvmContract,
  loadAbiFromEtherscan,
  loadAbiFromEtherscanV2,
  loadAbiFromSourcify,
  transformAbiToSchema,
  compareEvmContracts,
} from './abi';

// Type mapping
export {
  mapEvmParamTypeToFieldType,
  getEvmCompatibleFieldTypes,
  generateEvmDefaultField,
  EVM_TYPE_MAPPINGS,
} from './mapping';

// Data transformation
export {
  parseEvmInput,
  formatEvmFunctionResult,
} from './transform';

// Query handling
export {
  queryEvmViewFunction,
  isEvmViewFunction,
} from './query';

// Transaction formatting
export {
  formatEvmTransactionData,
  ExecutionStrategy,  // Interface
} from './transaction';

// Configuration resolution
export {
  resolveRpcUrl,
  resolveExplorerConfig,
  testEvmRpcConnection,
} from './configuration';

// Proxy detection
export { detectEvmProxyImplementation } from './proxy';

// Validation
export {
  validateEvmEoaConfig,
  validateEvmRelayerConfig,
  isValidEvmAddress,
} from './validation';

// Utilities
export {
  stringifyWithBigInt,
  parseJsonWithBigInt,
  formatGasEstimate,
  formatWeiToEther,
} from './utils';

// Types
export type {
  EvmContractArtifacts,
  EvmAbiLoadResult,
  EvmProxyInfo,
  EvmTransactionData,
} from './types';
```

### adapter-evm Imports from Core

```typescript
// packages/adapter-evm/src/adapter.ts
import {
  loadEvmContract,
  transformAbiToSchema,
  mapEvmParamTypeToFieldType,
  getEvmCompatibleFieldTypes,
  generateEvmDefaultField,
  parseEvmInput,
  formatEvmFunctionResult,
  queryEvmViewFunction,
  isEvmViewFunction,
  formatEvmTransactionData,
  resolveRpcUrl,
  resolveExplorerConfig,
  isValidEvmAddress,
} from '@openzeppelin/ui-builder-adapter-evm-core';
```

## Type Dependencies

### From @openzeppelin/ui-types (unchanged)

```typescript
// Core modules use these shared types
import type {
  NetworkConfig,
  EvmNetworkConfig,
  ContractSchema,
  FormFieldType,
  FieldType,
  ExecutionConfig,
  TransactionResult,
} from '@openzeppelin/ui-types';
```

### From viem (direct dependency in core)

```typescript
// Core modules use viem types directly
import type {
  Abi,
  AbiFunction,
  AbiParameter,
  Address,
  PublicClient,
  Hash,
  TransactionReceipt,
} from 'viem';
```

## Interface Contracts

### Async vs Sync Classification

| Function Type | Async? | Reason |
|---------------|--------|--------|
| `loadEvmContract`, `loadAbiFrom*` | ✅ async | Network I/O (fetch ABI) |
| `queryEvmViewFunction` | ✅ async | RPC call |
| `testEvmRpcConnection` | ✅ async | Network I/O |
| `detectEvmProxyImplementation` | ✅ async | RPC calls |
| `transformAbiToSchema` | ❌ sync | Pure transformation |
| `mapEvmParamTypeToFieldType` | ❌ sync | Pure mapping |
| `parseEvmInput`, `formatEvmFunctionResult` | ❌ sync | Pure transformation |
| `resolveRpcUrl`, `resolveExplorerConfig` | ❌ sync | Config lookup |
| `isValidEvmAddress`, `isEvmViewFunction` | ❌ sync | Pure validation |
| `formatEvmTransactionData` | ❌ sync | Pure formatting |

### Core Module Function Signatures

All core functions accept configuration via parameters (dependency injection):

```typescript
// ABI loading - accepts network config
function loadEvmContract(
  address: string,
  networkConfig: EvmNetworkConfig,
  options?: { forcedProvider?: 'etherscan' | 'sourcify' }
): Promise<ContractSchema>;

// Query - accepts RPC URL or client
function queryEvmViewFunction(
  contractAddress: string,
  functionId: string,
  params: unknown[],
  schema: ContractSchema,
  rpcUrl: string,  // Resolved by caller
): Promise<unknown>;

// RPC resolution - pure function
function resolveRpcUrl(
  networkId: string,
  networkConfig: EvmNetworkConfig,
  userRpcConfig?: UserRpcConfig,
  appConfig?: AppConfig,
): string;
```

## State Management

### No Global State in Core

Core modules are stateless:
- No singletons
- No module-level mutable variables
- No implicit configuration (everything passed as parameters)

### State Remains in adapter-evm

```typescript
// packages/adapter-evm/src/adapter.ts
class EvmAdapter implements ContractAdapter {
  // Instance state (network-aware)
  private networkConfig: EvmNetworkConfig;
  private walletImplementation: WagmiWalletImplementation;
  
  // Delegates to stateless core functions
  async loadContract(address: string) {
    return loadEvmContract(address, this.networkConfig);
  }
}
```

## Validation Rules

No new validation rules - existing validation logic moves to core:

| Validation | Location | Rule |
|------------|----------|------|
| Address format | `validation/` | Must be valid 0x-prefixed 40-char hex |
| ABI structure | `abi/transformer.ts` | Must conform to viem Abi type |
| Network config | `configuration/rpc.ts` | Must have valid RPC URL |
| Transaction params | `transaction/formatter.ts` | Must match function ABI |
