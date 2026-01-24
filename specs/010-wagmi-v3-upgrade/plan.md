# Implementation Plan: Wagmi v3 Upgrade

**Branch**: `010-wagmi-v3-upgrade` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-wagmi-v3-upgrade/spec.md`

## Summary

Upgrade the UI Builder monorepo from Wagmi v2 to Wagmi v3 to enable Polkadot Hub compatibility. The upgrade involves:
1. Verifying RainbowKit v3/Wagmi v3 compatibility (blocking if incompatible)
2. Updating package versions across `adapter-evm` and `apps/builder`
3. Migrating hook names (`useAccount` → `useConnection`)
4. Installing explicit connector dependencies (now optional peer deps in v3)

## Technical Context

**Language/Version**: TypeScript 5.9.2  
**Primary Dependencies**: wagmi@3, @wagmi/core@3, viem@^2.33.3, @tanstack/react-query@^5, @rainbow-me/rainbowkit@^2 (verify v3 compatibility)  
**Storage**: N/A (no data persistence changes)  
**Testing**: vitest  
**Target Platform**: Web (React 19)  
**Project Type**: Monorepo (pnpm workspaces)  
**Performance Goals**: No degradation from current behavior  
**Constraints**: Must maintain backward compatibility in adapter-evm public API  
**Scale/Scope**: 2 packages affected (adapter-evm, apps/builder), ~10 files to modify

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Chain-Agnostic Core, Adapter-Led | ✅ PASS | Wagmi is only in adapter-evm (chain-specific), not in core packages |
| II. Type Safety, Linting | ✅ PASS | TypeScript 5.9.2 meets wagmi v3 requirement (5.7.3+) |
| III. Tooling, Packaging | ✅ PASS | Using pnpm, tsup, Changesets as required |
| IV. UI/Design System | ✅ PASS | No UI changes, only library version upgrade |
| V. Testing, Exported Apps | ✅ PASS | Tests will be updated; exported apps use adapter interface |
| VI. Test-Driven Development | ✅ PASS | Will run existing tests after migration |
| VII. Reuse-First | ✅ PASS | Upgrading existing code, not introducing new patterns |

**Result**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/010-wagmi-v3-upgrade/
├── plan.md              # This file
├── research.md          # Phase 0: RainbowKit/Wagmi v3 compatibility research
├── data-model.md        # Phase 1: Hook migration mapping
├── quickstart.md        # Phase 1: Migration guide
├── contracts/           # Phase 1: Updated type exports
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (files to modify)

```text
# Root configuration
package.json                         # pnpm override for @wagmi/core

# adapter-evm package
packages/adapter-evm/
├── package.json                     # wagmi, @wagmi/core, @wagmi/connectors versions
└── src/
    ├── wallet/
    │   ├── hooks/facade-hooks.ts    # useAccount → useConnection
    │   ├── implementation/wagmi-implementation.ts
    │   ├── utils/connection.ts
    │   ├── utils/wallet-status.ts
    │   ├── components/EvmWalletUiRoot.tsx
    │   └── rainbowkit/config-service.ts
    └── __tests__/
        └── wallet-connect.test.ts   # Update test hook names

# Builder app
apps/builder/
└── package.json                     # wagmi, @wagmi/core versions
```

**Structure Decision**: Existing monorepo structure preserved. No new packages or directories needed.

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| RainbowKit v2.x incompatible with Wagmi v3 | **First task**: Verify compatibility. If blocked, wait for RainbowKit v3 release |
| Version conflicts in dependency tree | Use pnpm override to enforce single wagmi version |
| Connector dependencies missing | Explicitly install required connectors per Wagmi v3 migration guide |
| Test failures after hook renames | Run full test suite; hook renames are mechanical |

## Complexity Tracking

> No constitution violations to justify.
