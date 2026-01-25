# Implementation Plan: Polkadot Adapter

**Branch**: `009-polkadot-adapter` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-polkadot-adapter/spec.md`

## Summary

Create a new `adapter-polkadot` package that represents the Polkadot ecosystem in the UI Builder, initially supporting EVM-compatible networks (Polkadot Hub, Kusama Hub, Moonbeam, Moonriver). The adapter consumes `adapter-evm-core` for all EVM operations, requiring no core package modifications since Blockscout supports the Etherscan V1 API format.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: `@openzeppelin/ui-builder-adapter-evm-core`, `@openzeppelin/ui-types`, `@openzeppelin/ui-utils`, `viem`, `wagmi@2` (same as adapter-evm)  
**Storage**: N/A (network configurations only)  
**Testing**: Vitest  
**Target Platform**: Web (React + Vite)  
**Project Type**: Monorepo package  
**Performance Goals**: Same as EVM adapter - sub-second ABI loading, instant type mapping  
**Constraints**: Must bundle `adapter-evm-core` internally via tsup `noExternal`  
**Scale/Scope**: ~15 source files, 6 network configurations

**Note on Wagmi version**: While [official Polkadot docs](https://docs.polkadot.com/smart-contracts/libraries/wagmi/) show Wagmi v3, the chain configuration format is identical in v2 and v3. We use v2 for RainbowKit compatibility and consistency with existing adapters. See spec.md clarifications for details.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Chain-Agnostic Core, Adapter-Led Architecture | ✅ PASS | New adapter in `packages/adapter-polkadot`, implements `ContractAdapter`, all chain logic in adapter |
| II. Type Safety, Linting, and Code Quality | ✅ PASS | TypeScript strict mode, uses `logger` from `ui-utils`, JSDoc for public APIs |
| III. Tooling, Packaging, and Releases | ✅ PASS | Uses `pnpm`, `tsup` for bundling, follows adapter versioning pattern |
| IV. UI/Design System Consistency | ✅ PASS | Follows existing adapter wallet component patterns |
| V. Testing, Documentation, and Exported Apps | ✅ PASS | Vitest tests, exports work standalone with `AppConfigService` |
| VI. Test-Driven Development for Business Logic | ✅ PASS | TDD for adapter methods, validation, network configs |
| VII. Reuse-First Development | ✅ PASS | Reuses `adapter-evm-core` entirely, no duplication of EVM logic |

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/009-polkadot-adapter/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (module-exports.ts)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
packages/adapter-polkadot/
├── package.json
├── tsconfig.json
├── tsup.config.ts                   # Bundle adapter-evm-core internally
├── vite-config.ts                   # Minimal config for EVM mode
├── src/
│   ├── index.ts                     # Main exports
│   ├── adapter.ts                   # PolkadotAdapter class
│   ├── types.ts                     # TypedPolkadotNetworkConfig
│   ├── utils.ts                     # Network utility functions
│   ├── networks/
│   │   ├── index.ts                 # Aggregate exports
│   │   ├── chains.ts                # Custom viem chain definitions (Polkadot Hub, Kusama Hub)
│   │   ├── mainnet.ts               # Polkadot Hub, Kusama Hub, Moonbeam, Moonriver
│   │   └── testnet.ts               # Polkadot Hub TestNet, Moonbase Alpha
│   ├── handlers/
│   │   └── evm-handler.ts           # Delegates to adapter-evm-core
│   ├── wallet/
│   │   └── index.ts                 # Re-exports from adapter-evm wallet components
│   └── __tests__/
│       ├── adapter.test.ts
│       ├── networks.test.ts
│       ├── types.test.ts
│       └── utils.test.ts
```

**Structure Decision**: Single package following the established adapter pattern (mirrors `adapter-evm` structure). The `handlers/` directory is added to support future non-EVM execution types.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Blockscout API behavior differs from Etherscan V1 | Verify API responses in research phase; tests include Blockscout-specific mocks |
| Network RPC endpoints become unavailable | Use well-known public endpoints; document fallback options |
| `adapter-evm-core` extraction incomplete | Spec 008 must be completed first; verify core exports before implementation |

## Next Steps

1. Complete Phase 0: Generate `research.md` with API verification
2. Complete Phase 1: Generate `data-model.md`, `contracts/`, `quickstart.md`
3. Run `/speckit.tasks` to generate task breakdown
