# Implementation Plan: EVM Adapter Access Control Module

**Branch**: `011-evm-access-control` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-evm-access-control/spec.md`

## Summary

Add an Access Control module to the EVM adapter that implements the unified `AccessControlService` interface with 1:1 parity to the existing Stellar adapter. The module lives in `packages/adapter-evm-core` and provides capability detection (Ownable, Ownable2Step, AccessControl, AccessControlDefaultAdminRules, AccessControlEnumerable), on-chain reads via viem public client, transaction assembly as `WriteContractParameters`, and historical queries via GraphQL indexer client. The `EvmAdapter` exposes it through `getAccessControlService()`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, monorepo-wide)
**Primary Dependencies**: viem ^2.33.3 (on-chain reads + tx assembly), @openzeppelin/ui-types 1.6.0 (unified interfaces), @openzeppelin/ui-utils (logger, utilities)
**Storage**: N/A (stateless; caches contract contexts in-memory Map)
**Testing**: Vitest (unit + integration), TDD for all business logic per constitution
**Target Platform**: Browser + Node.js (ESM + CJS dual output via tsup)
**Project Type**: Monorepo package (adapter-evm-core + adapter-evm)
**Performance Goals**: Capability detection <3s, on-chain reads consistent with latest block available from RPC endpoint (freshness depends on node sync status), indexer queries <2s for 50 events
**Constraints**: Must not break existing adapter-evm API surface; must use existing viem/WriteContractParameters patterns; indexer endpoint added to network config without breaking changes
**Scale/Scope**: All 30+ EVM networks, mirrors Stellar module's 7 source files + 8 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Chain-Agnostic Core, Adapter-Led Architecture | PASS | Module lives in adapter-evm-core; chain-specific logic stays in adapter package; implements ContractAdapter.getAccessControlService() |
| II | Type Safety, Linting, Code Quality | PASS | Uses @openzeppelin/ui-types interfaces; logger from ui-utils; no console; JSDoc on public APIs |
| III | Tooling, Packaging, Releases | PASS | pnpm workspace; tsup build; Changeset required for adapter-evm and adapter-evm-core |
| IV | UI/Design System Consistency | N/A | No UI components in this feature (programmatic API only) |
| V | Testing, Documentation, Exported Apps | PASS | Vitest test suite mirrors Stellar structure; no exported app changes |
| VI | Test-Driven Development | PASS | TDD for all service, validation, detection, reader, indexer, and actions modules |
| VII | Reuse-First Development | PASS | Reuses viem public client pattern from query/handler.ts; reuses WriteContractParameters from transaction/types; reuses shared types from ui-types; mirrors proven Stellar architecture |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/011-evm-access-control/
├── plan.md              # This file
├── research.md          # Phase 0: Technical decisions
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Implementation guide
├── contracts/           # Phase 1: API contracts
│   ├── access-control-service.ts    # Service interface contract
│   ├── indexer-queries.graphql      # GraphQL query contracts
│   └── feature-detection.ts        # Detection contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/adapter-evm-core/
├── src/
│   ├── access-control/               # NEW: Access Control Module
│   │   ├── index.ts                  # Module exports
│   │   ├── service.ts                # EvmAccessControlService implementation
│   │   ├── actions.ts                # Transaction data assembly (WriteContractParameters)
│   │   ├── feature-detection.ts      # ABI-based capability detection
│   │   ├── indexer-client.ts         # GraphQL indexer client
│   │   ├── onchain-reader.ts         # On-chain reads via viem
│   │   ├── validation.ts            # EVM address + role validation
│   │   ├── constants.ts             # DEFAULT_ADMIN_ROLE, ZERO_ADDRESS, labels
│   │   ├── types.ts                 # EvmAccessControlContext, EvmTransactionExecutor
│   │   └── abis.ts                  # ABI fragment constants for all AC functions
│   ├── types/
│   │   ├── network.ts                # MODIFIED: Add accessControlIndexerUrl
│   │   └── ...
│   └── index.ts                      # MODIFIED: Export access-control module
├── test/
│   └── access-control/               # NEW: Test suite
│       ├── service.test.ts
│       ├── actions.test.ts
│       ├── feature-detection.test.ts
│       ├── indexer-client.test.ts
│       ├── onchain-reader.test.ts
│       └── validation.test.ts
└── package.json

packages/adapter-evm/
├── src/
│   ├── adapter.ts                    # MODIFIED: Add getAccessControlService()
│   └── networks/
│       ├── mainnet.ts                # MODIFIED: Add indexer URLs
│       └── testnet.ts                # MODIFIED: Add indexer URLs
└── package.json
```

**Structure Decision**: Access control module in `adapter-evm-core/src/access-control/` mirrors the Stellar adapter's `adapter-stellar/src/access-control/` directory exactly. Network config type extended in adapter-evm-core; network config values with indexer URLs in adapter-evm. The adapter-evm delegates to core, maintaining the existing core/adapter split.

**Reference Note**: For the access control feature specifically, the Stellar adapter was implemented first and serves as the architectural reference. This is an intentional inversion of the general convention (Constitution I: "EVM adapter is the reference implementation") because the Stellar access control module predates the EVM one. The EVM module mirrors Stellar's proven structure for this feature.

## Pre-Requisite: `openzeppelin-ui` Types Update

These PRs to the `openzeppelin-ui` repo must be merged and a new `@openzeppelin/ui-types` version published before or in parallel with the EVM adapter work. They can be done as a single PR or separate PRs.

**Target files in `openzeppelin-ui`**:
- `packages/types/src/adapters/access-control.ts`
- `packages/types/src/networks/config.ts`

| PR | Change | File | Impact |
|----|--------|------|--------|
| PR-1 | Make `expirationBlock` optional (`number → number \| undefined`) in `PendingOwnershipTransfer` and `PendingAdminTransfer`. Also make `expirationBlock` parameter optional in `transferOwnership()` and `transferAdminRole()` method signatures. | `access-control.ts` | Non-breaking (widens type). Stellar adapter unaffected (still passes `number`). |
| PR-2 | Add `ADMIN_TRANSFER_CANCELED`, `ADMIN_DELAY_CHANGE_SCHEDULED`, `ADMIN_DELAY_CHANGE_CANCELED` to `HistoryChangeType` union. | `access-control.ts` | Non-breaking at runtime (union extension). **Compile-breaking** for Role Manager — requires updating `CHANGE_TYPE_TO_ACTION` mapping in `apps/role-manager/src/types/role-changes.ts`. |
| PR-3 | Add `accessControlIndexerUrl?: string` to `EvmNetworkConfig`. | `config.ts` | Non-breaking (optional field). All existing network configs remain valid. |

**Sequencing**: These PRs can be developed and merged independently. The EVM adapter implementation starts immediately targeting the final values (`undefined` for expirationBlock, proper event mappings) with temporary workarounds (`0` sentinel, `UNKNOWN` fallback, local type extension) and `// TODO` comments where PR-1/2/3 are required. Workarounds are removed once the new `@openzeppelin/ui-types` version is published and consumed. PR-2 additionally requires a coordinated update to the Role Manager repo.

**Changesets**: Separate changesets for `adapter-evm-core` (minor — new feature) and `adapter-evm` (minor — new feature).

## Complexity Tracking

No violations to justify. The design reuses existing patterns (viem client, WriteContractParameters, GraphQL client) and mirrors the proven Stellar architecture.
