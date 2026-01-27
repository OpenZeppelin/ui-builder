# @openzeppelin/ui-builder-adapter-evm-core

Core EVM blockchain functionality extracted from `adapter-evm`. This package provides reusable, stateless modules for building EVM-compatible blockchain adapters.

> **Note**: This is an **internal workspace package** (`"private": true`). It is not published to npm. Consuming adapters bundle this package internally via `tsup` with `noExternal` configuration.

## Purpose

This package enables code reuse across multiple EVM-compatible adapters:

- **adapter-evm**: The primary Ethereum/EVM adapter
- **adapter-polkadot**: Polkadot ecosystem adapter with EVM support (Moonbeam, Polkadot Hub)
- **Future adapters**: Any new EVM-compatible blockchain adapter

## Module Structure

```
adapter-evm-core/
├── src/
│   ├── abi/            # ABI loading, transformation, comparison
│   ├── configuration/  # RPC and Explorer configuration
│   ├── mapping/        # Type mapping and form field generation
│   ├── proxy/          # Proxy detection and implementation resolution
│   ├── query/          # View function querying
│   ├── transaction/    # Transaction formatting, execution strategies
│   ├── transform/      # Input parsing and output formatting
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── validation/     # Execution configuration validation
│   ├── wallet/         # Wallet infrastructure and RainbowKit utilities
│   └── index.ts        # Public exports
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## Key Modules

### ABI Module

Load and transform contract ABIs from various sources:

```typescript
import {
  loadEvmContract,
  loadAbiFromEtherscan,
  loadAbiFromSourcify,
  transformAbiToSchema,
  abiComparisonService,
} from '@openzeppelin/ui-builder-adapter-evm-core';
```

### Transaction Module

Execute transactions with different strategies:

```typescript
import {
  EoaExecutionStrategy,
  RelayerExecutionStrategy,
  executeEvmTransaction,
  formatEvmTransactionData,
} from '@openzeppelin/ui-builder-adapter-evm-core';
```

### Wallet Module

Wallet implementation interface and RainbowKit utilities:

```typescript
import {
  WagmiWalletImplementation,
  createUiKitManager,
  generateRainbowKitConfigFile,
  connectAndEnsureCorrectNetworkCore,
} from '@openzeppelin/ui-builder-adapter-evm-core';
```

### Configuration Module

RPC and explorer configuration:

```typescript
import {
  resolveRpcUrl,
  resolveExplorerConfig,
  validateEvmRpcEndpoint,
  testEvmRpcConnection,
} from '@openzeppelin/ui-builder-adapter-evm-core';
```

## Usage in Adapters

### Adding as a Dependency

In your adapter's `package.json`:

```json
{
  "dependencies": {
    "@openzeppelin/ui-builder-adapter-evm-core": "workspace:*"
  }
}
```

### Bundling Configuration

In your adapter's `tsup.config.ts`, ensure the core package is bundled:

```typescript
export default defineConfig({
  // ...
  noExternal: ['@openzeppelin/ui-builder-adapter-evm-core'],
});
```

### Implementing Wallet Functionality

Adapters implement the `EvmWalletImplementation` interface:

```typescript
import { WagmiWalletImplementation } from '@openzeppelin/ui-builder-adapter-evm-core';

// The WagmiWalletImplementation class provides a ready-to-use implementation
const walletImpl = new WagmiWalletImplementation(config);
```

## Design Principles

1. **Stateless Modules**: All functions accept configuration as parameters (no global state)
2. **Dependency Injection**: Network configs, RPC URLs, and wallet implementations passed explicitly
3. **Error Propagation**: Descriptive errors with context, no silent failures
4. **Type Safety**: Full TypeScript with strict mode enabled
5. **Tree-Shakeable**: Individual function exports for optimal bundling

## Relationship with Adapters

```
┌─────────────────────────────────────────────────┐
│                  adapter-evm                     │
│  (Ethereum mainnet/testnet specific logic)      │
│  - Network configurations                        │
│  - Ecosystem-specific UI components             │
│                      │                           │
│                      ▼                           │
│     ┌───────────────────────────────┐           │
│     │      adapter-evm-core          │           │
│     │   (Shared EVM functionality)   │           │
│     │   - ABI loading/transformation │           │
│     │   - Transaction execution      │           │
│     │   - Wallet infrastructure      │           │
│     └───────────────────────────────┘           │
│                      ▲                           │
│                      │                           │
├─────────────────────────────────────────────────┤
│               adapter-polkadot                   │
│  (Polkadot ecosystem specific logic)            │
│  - Polkadot Hub, Moonbeam networks              │
│  - Polkadot-specific UI components              │
└─────────────────────────────────────────────────┘
```

## Testing

Run tests with:

```bash
pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test
```

## License

AGPL-3.0
