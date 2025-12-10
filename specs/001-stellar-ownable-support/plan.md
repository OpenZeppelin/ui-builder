# Implementation Plan: Stellar Ownable Two-Step Transfer Support

**Branch**: `001-stellar-ownable-support` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-stellar-ownable-support/spec.md`

## Summary

Extend the existing Stellar Access Control module to support the OpenZeppelin Stellar Ownable two-step ownership transfer with ledger-based expiration. The current implementation supports basic `get_owner` and single-step `transfer_ownership`, but the Stellar Ownable module requires:

1. Two-step transfer: `transfer_ownership(new_owner, live_until_ledger)` → `accept_ownership()`
2. Pending state tracking via indexer events (`ownership_transfer`, `ownership_transfer_completed`)
3. Ledger-based expiration checking against current ledger sequence

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: @stellar/stellar-sdk, existing adapter-stellar infrastructure  
**Storage**: N/A (stateless - reads from chain/indexer)  
**Testing**: Vitest (existing test infrastructure)  
**Target Platform**: Browser/Node.js (monorepo packages)
**Project Type**: Monorepo package extension  
**Performance Goals**: Ownership status queries < 3 seconds (SC-001)  
**Constraints**: Must maintain backward compatibility with existing AccessControlService interface  
**Scale/Scope**: Extends existing `packages/adapter-stellar/src/access-control/` module

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                           | Status  | Notes                                                                                        |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| I. Chain-Agnostic Core, Adapter-Led | ✅ PASS | All changes in `packages/adapter-stellar`; chain-agnostic types extended in `packages/types` |
| II. Type Safety, Linting            | ✅ PASS | TypeScript strict mode; no `any` types; JSDoc annotations required                           |
| III. Tooling, Packaging             | ✅ PASS | Uses existing pnpm/tsup/vitest infrastructure                                                |
| IV. UI/Design System                | N/A     | No UI changes in this feature                                                                |
| V. Testing, Documentation           | ✅ PASS | TDD required; Vitest for unit/integration tests                                              |
| VI. Test-Driven Development         | ✅ PASS | Must write failing tests first for all business logic                                        |
| VII. Reuse-First Development        | ✅ PASS | Extends existing service/client patterns; reuses query/indexer infrastructure                |

**Gate Status**: ✅ ALL GATES PASSED

## Project Structure

### Documentation (this feature)

```text
specs/001-stellar-ownable-support/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/
├── types/
│   └── src/
│       └── adapters/
│           └── access-control.ts    # Extend OwnershipInfo with pending state
│
└── adapter-stellar/
    └── src/
        └── access-control/
            ├── index.ts             # Re-export new functions
            ├── service.ts           # Extend getOwnership, add acceptOwnership
            ├── actions.ts           # Add assembleAcceptOwnershipAction, update transferOwnership
            ├── onchain-reader.ts    # Add getCurrentLedger, update readOwnership
            ├── indexer-client.ts    # Add ownership_transfer event support
            ├── feature-detection.ts # Update Ownable detection for two-step
            └── validation.ts        # Add expiration validation
    └── test/
        └── access-control/
            ├── ownable-two-step.test.ts     # New test file
            ├── indexer-ownership.test.ts    # New indexer tests
            └── service.test.ts              # Extend existing tests
```

**Structure Decision**: Extends existing `packages/adapter-stellar/src/access-control/` module following the established patterns. No new packages required.

## Complexity Tracking

No constitution violations requiring justification.

---

## Phase 0: Outline & Research

### Research Tasks

1. **OpenZeppelin Stellar Ownable Interface**
   - Verify exact function signatures for two-step transfer
   - Confirm event names and payloads (`ownership_transfer`, `ownership_transfer_completed`)
   - Document `live_until_ledger` parameter semantics

2. **Stellar Ledger Sequence Query**
   - Best practice for querying current ledger sequence
   - Horizon API vs Soroban RPC approach
   - Latency considerations

3. **Indexer Event Schema**
   - Verify indexer support for new event types
   - GraphQL query patterns for pending transfer detection

### Research Findings

See [research.md](./research.md) for detailed findings.

---

## Phase 1: Design & Contracts

### Prerequisites

- [x] Phase 0 research.md complete

### Data Model

See [data-model.md](./data-model.md) for entity definitions.

### API Contracts

See [contracts/](./contracts/) directory for:

- Extended `OwnershipInfo` interface
- New `PendingOwnershipTransfer` type
- Updated service method signatures

### Implementation Approach

#### 1. Type Extensions (`packages/types`)

Extend `OwnershipInfo` to support pending transfer state:

```typescript
export interface OwnershipInfo {
  owner: string | null;
  pendingTransfer?: PendingOwnershipTransfer;
  state: OwnershipState;
}

export interface PendingOwnershipTransfer {
  pendingOwner: string;
  expirationLedger: number;
  initiatedAt?: string;
  initiatedTxId?: string;
}

export type OwnershipState = 'owned' | 'pending' | 'expired' | 'renounced';
```

#### 2. Service Extensions (`packages/adapter-stellar`)

**getOwnership Enhancement**:

1. Call `get_owner()` for current owner
2. Query indexer for `ownership_transfer` events
3. Check for corresponding `ownership_transfer_completed`
4. If pending exists, compare `live_until_ledger` with current ledger
5. Return enriched `OwnershipInfo` with state

**New Methods**:

- `acceptOwnership()` - Submit `accept_ownership()` transaction
- `validateTransferExpiration()` - Client-side validation before initiate
- `getCurrentLedger()` - Query current ledger sequence via Soroban RPC `getLatestLedger`; returns `Promise<number>`

**Updated Methods**:

- `transferOwnership()` - Add `expirationLedger` parameter (must be > current ledger)

#### 3. Indexer Client Extensions

Add new event type support:

- `OWNERSHIP_TRANSFER_INITIATED` for `ownership_transfer` events
- Query pattern for pending transfer detection
- Extract `live_until_ledger` from event payload

#### 4. Feature Detection Updates

Update `detectAccessControlCapabilities()` to:

- Verify two-step Ownable by checking for `accept_ownership`
- Add capability flag for two-step transfer support

### Quickstart

See [quickstart.md](./quickstart.md) for integration guide.

---

## Post-Design Constitution Re-Check

| Principle              | Status | Notes                                                                   |
| ---------------------- | ------ | ----------------------------------------------------------------------- |
| I. Chain-Agnostic Core | ✅     | Types in `packages/types` are chain-agnostic; implementation in adapter |
| VI. TDD                | ✅     | Test files defined; tests written before implementation                 |
| VII. Reuse-First       | ✅     | Reuses existing query/indexer patterns; extends existing service        |

**Post-Design Gate Status**: ✅ PASSED

---

## Artifacts Generated

- [x] `research.md` - Phase 0 research findings
- [x] `data-model.md` - Entity definitions
- [x] `contracts/access-control-types.ts` - API contracts (TypeScript interfaces)
- [x] `quickstart.md` - Integration guide

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
