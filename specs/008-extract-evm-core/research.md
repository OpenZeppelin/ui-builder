# Research: Extract EVM Core Package

**Date**: 2026-01-09  
**Branch**: `008-extract-evm-core`

## Module Extraction Analysis

### Decision: Which modules belong in adapter-evm-core

**Analysis of current adapter-evm structure:**

| Module | Purpose | Extract to Core? | Rationale |
|--------|---------|------------------|-----------|
| `abi/` | ABI loading, transformation, Etherscan/Sourcify | ✅ Yes | Pure EVM logic, no wallet/UI dependencies |
| `mapping/` | Type mapping, field generation | ✅ Yes | Generic EVM type handling |
| `transform/` | Input parsing, output formatting | ✅ Yes | Pure data transformation |
| `query/` | View function querying | ✅ Yes | Uses viem PublicClient, no wallet state |
| `proxy/` | Proxy contract detection | ✅ Yes | EVM-specific logic |
| `utils/` | JSON, formatting, gas, validation | ✅ Yes | Generic utilities |
| `types.ts`, `types/` | Internal TypeScript types | ✅ Yes | Shared type definitions |
| `configuration/` | RPC/explorer resolution | ✅ Partial | Extract RPC resolution; keep network-services |
| `transaction/` | Formatter, strategies, execution | ✅ Yes | Extract formatter + execution strategies (EOA, Relayer) |
| `validation/` | EOA/Relayer validation | ✅ Yes | Pure validation logic |
| `wallet/implementation/` | WagmiWalletImplementation | ✅ Yes | Configurable wagmi wrapper, accepts chains as param |
| `wallet/utils/` | Wallet manager, connection utils | ✅ Partial | Extract walletImplementationManager; keep UI-specific utils |
| `adapter.ts` | Main adapter class | ❌ No | Orchestrator, consumes core modules |
| `networks/` | Network definitions | ❌ No | Ecosystem-specific configurations |
| `wallet/components/` | React UI (EvmWalletUiRoot, etc.) | ❌ No | React UI components, ecosystem-specific |
| `wallet/rainbowkit/` | RainbowKit integration | ❌ No | UI library integration |
| `config.ts` | Adapter config | ❌ No | Adapter-specific |
| `vite-config.ts` | Build config | ❌ No | Adapter-specific |

**Rationale**: Core modules must be:
1. Pure functions/classes OR configurable classes that accept dependencies as parameters
2. Not React components (React UI stays in adapters)
3. Reusable across EVM-compatible adapters (EVM, Polkadot, future L2s)
4. Free of ecosystem-specific branding

**2026-01-25 Update**: Revised to include wallet infrastructure (non-UI) for reuse by Polkadot adapter.
The wallet execution logic (signing, broadcasting) is EVM-generic and should be shared.
React components and RainbowKit remain in individual adapters for customization.

### Decision: tsup bundling strategy for internal packages

**Options Evaluated**:
1. **External dependency** - Mark adapter-evm-core as external in consuming adapters
2. **Bundled dependency** - Inline adapter-evm-core into consuming adapter dist
3. **Workspace protocol** - Use `workspace:*` and let pnpm handle resolution

**Selected**: Option 2 - Bundled dependency

**Rationale**: 
- Since adapter-evm-core is `"private": true`, it won't be published to npm
- Consuming adapters must be self-contained for npm publishing
- tsup's `noExternal` option inlines workspace dependencies
- Eliminates version mismatch concerns at runtime

**Configuration**:
```typescript
// packages/adapter-evm/tsup.config.ts
export default defineConfig({
  noExternal: ['@openzeppelin/ui-builder-adapter-evm-core'],
  // ... other config
});
```

### Decision: Dependency management for viem

**Options Evaluated**:
1. Direct dependency in core, bundled into adapters
2. Peer dependency, consumers provide viem
3. Abstract interface, inject viem client

**Selected**: Option 1 - Direct dependency (per clarification session)

**Rationale**:
- Core modules heavily use viem types (AbiFunction, Address, etc.)
- Bundling eliminates version conflicts between adapters
- Simpler DX - consuming adapters don't need to manage viem compatibility

### Decision: Test migration strategy

**Approach** (per clarification session):
- Unit tests move WITH their corresponding modules
- Tests that test extracted modules → move to adapter-evm-core
- Tests that test adapter orchestration → stay in adapter-evm

**Test file mapping**:
| Current Location | New Location | Reason |
|------------------|--------------|--------|
| `abi/__tests__/` | `adapter-evm-core/src/abi/__tests__/` | Tests ABI loading/transform |
| `mapping/__tests__/` | `adapter-evm-core/src/mapping/__tests__/` | Tests type mapping |
| `configuration/__tests__/rpc.test.ts` | `adapter-evm-core/src/configuration/__tests__/` | Tests RPC resolution |
| `configuration/__tests__/explorer.test.ts` | `adapter-evm-core/src/configuration/__tests__/` | Tests explorer config |
| `utils/__tests__/` | `adapter-evm-core/src/utils/__tests__/` | Tests utilities |
| `types/__tests__/` | `adapter-evm-core/src/types/__tests__/` | Tests type guards |
| `__tests__/adapter-parsing.test.ts` | Stay in adapter-evm | Tests adapter output formatting |
| `__tests__/providerSelection.test.ts` | Stay in adapter-evm | Tests adapter-level orchestration |
| `__tests__/timeouts.test.ts` | Stay in adapter-evm | Tests adapter timeout handling |
| `__tests__/wallet-connect.test.ts` | Stay in adapter-evm | Tests wallet integration |
| `wallet/__tests__/` | Stay in adapter-evm | Tests wallet UI |
| `transaction/components/__tests__/` | Stay in adapter-evm | Tests UI components |

**Modules without dedicated unit tests** (tested via integration):
| Module | Reason | Test Coverage |
|--------|--------|---------------|
| `transform/` | Pure sync functions | Covered by adapter-parsing.test.ts |
| `query/` | Async RPC-dependent | Covered by providerSelection.test.ts |
| `proxy/` | Async RPC-dependent | Covered by integration tests |
| `transaction/` (formatter) | Simple data formatting | Covered by adapter-parsing.test.ts |
| `validation/` | Address validation | Covered by configuration/__tests__/ |

## Package Structure

### adapter-evm-core package.json

```json
{
  "name": "@openzeppelin/ui-builder-adapter-evm-core",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@openzeppelin/ui-types": "^1.3.0",
    "@openzeppelin/ui-utils": "^1.1.0",
    "viem": "^2.33.3",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "tsup": "^8.5.1",
    "vitest": "^3.2.4"
  }
}
```

### Directory Structure

```
packages/adapter-evm-core/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── src/
    ├── index.ts           # Re-exports all modules
    ├── abi/
    │   ├── index.ts
    │   ├── loader.ts
    │   ├── transformer.ts
    │   ├── etherscan.ts
    │   ├── etherscan-v2.ts
    │   ├── sourcify.ts
    │   ├── comparison.ts
    │   ├── types.ts
    │   └── __tests__/
    ├── mapping/
    │   ├── index.ts
    │   ├── type-mapper.ts
    │   ├── field-generator.ts
    │   ├── constants.ts
    │   └── __tests__/
    ├── transform/
    │   ├── index.ts
    │   ├── input-parser.ts
    │   └── output-formatter.ts
    ├── query/
    │   ├── index.ts
    │   ├── handler.ts
    │   └── view-checker.ts
    ├── transaction/
    │   ├── index.ts
    │   ├── formatter.ts
    │   └── execution-strategy.ts  # Interface only
    ├── configuration/
    │   ├── index.ts
    │   ├── rpc.ts
    │   ├── explorer.ts
    │   └── __tests__/
    ├── proxy/
    │   └── detection.ts
    ├── validation/
    │   ├── index.ts
    │   ├── eoa.ts
    │   └── relayer.ts
    ├── utils/
    │   ├── index.ts
    │   ├── json.ts
    │   ├── formatting.ts
    │   ├── gas.ts
    │   ├── validation.ts
    │   ├── artifacts.ts
    │   └── __tests__/
    └── types/
        ├── index.ts
        ├── artifacts.ts
        ├── providers.ts
        └── __tests__/
```

## Alternatives Considered

### Alternative 1: Publish adapter-evm-core to npm

**Rejected because**:
- Creates versioning complexity
- Requires coordinating releases across packages
- Increases maintenance burden
- Internal implementation detail shouldn't be a public API

### Alternative 2: Use TypeScript path aliases instead of separate package

**Rejected because**:
- Doesn't work with npm publishing
- Build tooling complications
- Harder to enforce boundaries between core and adapter

### Alternative 3: Extract to @openzeppelin/ui-utils (external repo)

**Rejected because**:
- Would require coordinating with openzeppelin-ui maintainers
- EVM-specific logic doesn't belong in chain-agnostic utils
- Slower iteration cycle
