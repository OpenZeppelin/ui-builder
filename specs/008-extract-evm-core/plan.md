# Implementation Plan: Extract EVM Core Package

**Branch**: `008-extract-evm-core` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/008-extract-evm-core/spec.md`

## Summary

Extract reusable EVM core logic from `adapter-evm` into a new internal package `adapter-evm-core` to enable creating EVM-compatible adapters (e.g., for Polkadot parachains, L2 rollups) without code duplication. The core package is bundled into consuming adapters at build time (not published to npm).

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: viem ^2.33.3, @openzeppelin/ui-types ^1.3.0, @openzeppelin/ui-utils ^1.1.0  
**Storage**: N/A (stateless modules)  
**Testing**: Vitest 3.2+ (migrate tests with modules)  
**Target Platform**: Browser (via consuming adapters)  
**Project Type**: Monorepo internal package  
**Performance Goals**: No runtime overhead vs current implementation  
**Constraints**: Bundle size increase <5% for adapter-evm  
**Scale/Scope**: ~25 source files + tests migrated (10 modules with 2-3 files each)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Chain-Agnostic Core | ✅ Pass | Core package contains only EVM logic; no ecosystem branding |
| I. Adapter-Led Architecture | ✅ Pass | adapter-evm-core consumed by adapters only |
| I. ContractAdapter Interface | ✅ Pass | Core provides utilities; adapters implement interface |
| II. Type Safety | ✅ Pass | TypeScript strict mode, no `any` |
| II. No console | ✅ Pass | Uses logger from ui-utils |
| III. pnpm Workspace | ✅ Pass | Standard workspace package |
| III. tsup Bundling | ✅ Pass | Core bundled into consuming adapters |
| III. Changesets | ✅ Pass | Private package - no changesets needed |
| IV. Design System | N/A | No UI components in core |
| V. Vitest Testing | ✅ Pass | Tests migrate with modules |
| VI. TDD | ✅ Pass | Existing tests migrate; verify coverage |
| VII. Reuse-First | ✅ Pass | This IS the reuse enablement feature |

**Gate Result**: ✅ All applicable gates pass

## Project Structure

### Documentation (this feature)

```text
specs/008-extract-evm-core/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Module analysis, bundling strategy
├── data-model.md        # Phase 1: Module boundaries, type dependencies
├── quickstart.md        # Phase 1: Usage guide for new adapters
├── contracts/           # Phase 1: API contracts
│   └── module-exports.ts
└── tasks.md             # Phase 2: Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── adapter-evm-core/           # NEW: Internal core package
│   ├── package.json            # private: true, dependencies
│   ├── tsconfig.json           # strict: true
│   ├── tsup.config.ts          # entry: [index.ts, vite-config.ts]
│   ├── vitest.config.ts
│   └── src/
│       ├── vite-config.ts      # getEvmCoreViteConfig() - minimal config
│       │
│       ├── index.ts            # Re-exports all modules
│       ├── abi/                # ABI loading, transformation
│       │   ├── index.ts
│       │   ├── loader.ts
│       │   ├── transformer.ts
│       │   ├── etherscan.ts
│       │   ├── etherscan-v2.ts
│       │   ├── sourcify.ts
│       │   ├── comparison.ts
│       │   ├── types.ts
│       │   └── __tests__/
│       ├── mapping/            # Type mapping, field generation
│       │   ├── index.ts
│       │   ├── type-mapper.ts
│       │   ├── field-generator.ts
│       │   ├── constants.ts
│       │   └── __tests__/
│       ├── transform/          # Input/output transformation
│       │   ├── index.ts
│       │   ├── input-parser.ts
│       │   └── output-formatter.ts
│       ├── query/              # View function querying
│       │   ├── index.ts
│       │   ├── handler.ts
│       │   └── view-checker.ts
│       ├── transaction/        # Transaction formatting (no UI)
│       │   ├── index.ts
│       │   ├── formatter.ts
│       │   └── execution-strategy.ts
│       ├── configuration/      # RPC/Explorer resolution
│       │   ├── index.ts
│       │   ├── rpc.ts
│       │   ├── explorer.ts
│       │   └── __tests__/
│       ├── proxy/              # Proxy detection
│       │   └── detection.ts
│       ├── validation/         # Address/config validation
│       │   ├── index.ts
│       │   ├── eoa.ts
│       │   └── relayer.ts
│       ├── utils/              # Utilities
│       │   ├── index.ts
│       │   ├── json.ts
│       │   ├── formatting.ts
│       │   ├── gas.ts
│       │   ├── validation.ts
│       │   ├── artifacts.ts
│       │   └── __tests__/
│       └── types/              # Internal types
│           ├── index.ts
│           ├── artifacts.ts
│           ├── providers.ts
│           └── __tests__/
│
├── adapter-evm/                # MODIFIED: Imports from core
│   ├── package.json            # Add workspace:* dependency
│   ├── tsup.config.ts          # Add noExternal for core
│   └── src/
│       ├── adapter.ts          # Refactor to use core imports
│       ├── index.ts            # Unchanged public API
│       ├── networks/           # STAYS: Ecosystem-specific
│       ├── wallet/             # STAYS: UI components
│       ├── transaction/
│       │   ├── components/     # STAYS: UI components
│       │   ├── eoa.ts          # STAYS: Strategy implementation
│       │   ├── relayer.ts      # STAYS: Strategy implementation
│       │   └── sender.ts       # STAYS: Orchestration
│       └── __tests__/          # STAYS: Integration tests
│           ├── adapter-parsing.test.ts
│           ├── providerSelection.test.ts
│           ├── timeouts.test.ts
│           └── wallet-connect.test.ts
```

**Structure Decision**: Monorepo with new internal package. Core package bundled into consuming adapters via tsup `noExternal` configuration.

## Complexity Tracking

> No constitution violations requiring justification.

## Implementation Phases

### Phase 1: Create adapter-evm-core Package Structure
- Initialize package with package.json, tsconfig, tsup, vitest configs
- Set up directory structure
- Configure build to produce ESM + CJS

### Phase 2: Extract Core Modules
- Move modules from adapter-evm to adapter-evm-core
- Move corresponding tests
- Update imports in moved files

### Phase 3: Refactor adapter-evm
- Add workspace dependency on adapter-evm-core
- Update adapter.ts to import from core
- Configure tsup to bundle core (noExternal)
- Verify all tests pass

### Phase 4: Validation
- Run full test suite
- Verify bundle size constraint
- Test with builder app

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking adapter-evm public API | No changes to index.ts exports; only internal refactoring |
| Test failures | Migrate tests atomically with modules; run after each move |
| Circular dependencies | Core cannot import from adapter-evm; enforced by package boundary |
| Build failures | Test build after each phase |

## Next Steps

Run `/speckit.tasks` to generate implementation task breakdown.
