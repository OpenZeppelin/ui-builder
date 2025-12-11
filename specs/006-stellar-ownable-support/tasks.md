# Tasks: Stellar Ownable Two-Step Transfer Support

**Input**: Design documents from `/specs/006-stellar-ownable-support/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅  
**Generated**: 2025-12-10

**Tests**: Included per Constitution VI (Test-Driven Development)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and project structure for two-step Ownable support

- [x] T001 [P] Extend `OwnershipInfo` interface with `state` and `pendingTransfer` fields in `packages/types/src/adapters/access-control.ts`
- [x] T002 [P] Add `PendingOwnershipTransfer` interface in `packages/types/src/adapters/access-control.ts`
- [x] T003 [P] Add `OwnershipState` type (`'owned' | 'pending' | 'expired' | 'renounced'`) in `packages/types/src/adapters/access-control.ts`
- [x] T004 [P] Extend `AccessControlCapabilities` with `hasTwoStepOwnable` flag in `packages/types/src/adapters/access-control.ts`
- [x] T005 Re-export new types from `packages/types/src/adapters/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational

- [x] T006 [P] Create test file `packages/adapter-stellar/test/access-control/ownable-two-step.test.ts` with test structure
- [x] T007 [P] Write failing test for `getCurrentLedger()` returning ledger sequence number
- [x] T008 [P] Write failing test for `OWNERSHIP_TRANSFER_STARTED` event parsing in indexer

### Implementation for Foundational

- [x] T009 [P] Add `getCurrentLedger()` method in `packages/adapter-stellar/src/access-control/onchain-reader.ts` using Soroban RPC `getLatestLedger`
- [x] T010 [P] Add `OWNERSHIP_TRANSFER_STARTED` event type to indexer client in `packages/adapter-stellar/src/access-control/indexer-client.ts`
- [x] T011 [P] Add `OwnershipTransferStartedEvent` interface in `packages/adapter-stellar/src/access-control/indexer-client.ts` (note: does NOT include `liveUntilLedger` - must query on-chain)
- [x] T011a [P] Add `readPendingOwner()` function in `packages/adapter-stellar/src/access-control/onchain-reader.ts` to query `get_pending_owner()` for expiration
- [x] T012 Add `queryPendingOwnershipTransfer()` method in `packages/adapter-stellar/src/access-control/indexer-client.ts`
- [x] T013 [P] Add expiration validation helper `validateExpirationLedger()` in `packages/adapter-stellar/src/access-control/validation.ts`
- [x] T014 Verify tests from T007-T008 now pass

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Contract Ownership Status (Priority: P1) 🎯 MVP

**Goal**: Users can view current ownership status (owned/pending/expired/renounced) for any Ownable Stellar contract

**Independent Test**: Query any Ownable contract and verify displayed owner matches on-chain state; verify pending/expired states display correctly

### Tests for User Story 1

- [x] T015 [P] [US1] Write failing test for `getOwnership()` returning basic owner (no pending) in `packages/adapter-stellar/test/access-control/service.test.ts`
- [x] T016 [P] [US1] Write failing test for `getOwnership()` returning pending state with pending owner and expiration
- [x] T017 [P] [US1] Write failing test for `getOwnership()` returning expired state when `currentLedger > expirationLedger`
- [x] T018 [P] [US1] Write failing test for `getOwnership()` returning renounced state when owner is null
- [x] T019 [P] [US1] Write failing test for graceful degradation when indexer unavailable (returns owner only with warning)

### Implementation for User Story 1

- [x] T020 [US1] Enhance `getOwnership()` method in `packages/adapter-stellar/src/access-control/service.ts` to call `get_owner()` for current owner
- [x] T021 [US1] Add indexer query for pending transfer in `getOwnership()` flow in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T022 [US1] Add expiration check logic comparing `live_until_ledger` with current ledger in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T023 [US1] Add state determination logic (owned/pending/expired/renounced) in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T024 [US1] Add graceful degradation for indexer unavailability in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T025 [US1] Add INFO logging for ownership queries per NFR-004 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T026 [US1] Add WARN logging for indexer unavailability per NFR-006 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T027 [US1] Verify tests T015-T019 now pass

**Checkpoint**: User Story 1 complete - ownership status viewing is fully functional and independently testable ✅

---

## Phase 4: User Story 2 - Initiate Ownership Transfer (Priority: P2)

**Goal**: Contract owners can initiate two-step ownership transfers with expiration

**Independent Test**: Owner initiates transfer, verify contract enters pending state with correct pending owner and expiration values

**Depends On**: US1 (to verify pending state after initiation)

### Tests for User Story 2

- [x] T028 [P] [US2] Write failing test for `transferOwnership()` with valid expiration in `packages/adapter-stellar/test/access-control/service.test.ts`
- [x] T029 [P] [US2] Write failing test for `transferOwnership()` rejection when expiration <= current ledger
- [x] T030 [P] [US2] Write failing test for `assembleTransferOwnershipAction()` with `live_until_ledger` parameter in `packages/adapter-stellar/test/access-control/ownable-two-step.test.ts`
- [x] T031 [P] [US2] Write failing test for error message when non-owner attempts transfer

### Implementation for User Story 2

- [x] T032 [US2] Update `assembleTransferOwnershipAction()` to include `live_until_ledger` parameter in `packages/adapter-stellar/src/access-control/actions.ts`
- [x] T033 [US2] Update `transferOwnership()` method signature to require `expirationLedger` parameter in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T034 [US2] Add client-side expiration validation (must be > current ledger) in `transferOwnership()` in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T035 [US2] Add boundary condition check (expirationLedger == currentLedger is invalid) per FR-020 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T036 [US2] Add specific error messages per FR-018 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T037 [US2] Add INFO logging for transfer initiation per NFR-004 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T038 [US2] Verify tests T028-T031 now pass

**Checkpoint**: User Story 2 complete - ownership transfer initiation is fully functional ✅

---

## Phase 5: User Story 3 - Accept Ownership Transfer (Priority: P2)

**Goal**: Pending owners can accept transfers before expiration to complete ownership transition

**Independent Test**: Pending owner accepts transfer, verify ownership transitions to new owner

**Depends On**: US2 (to create pending transfer to accept)

### Tests for User Story 3

- [x] T039 [P] [US3] Write failing test for `acceptOwnership()` successfully completing transfer in `packages/adapter-stellar/test/access-control/service.test.ts`
- [x] T040 [P] [US3] Write failing test for `acceptOwnership()` rejection when transfer expired
- [x] T041 [P] [US3] Write failing test for `assembleAcceptOwnershipAction()` in `packages/adapter-stellar/test/access-control/ownable-two-step.test.ts`
- [x] T042 [P] [US3] Write failing test for error message when non-pending-owner attempts accept

### Implementation for User Story 3

- [x] T043 [US3] Add `assembleAcceptOwnershipAction()` function in `packages/adapter-stellar/src/access-control/actions.ts`
- [x] T044 [US3] Add `acceptOwnership()` method in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T045 [US3] Add expiration check before submitting accept transaction (no pre-check per clarification, but show error on failure) in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T046 [US3] Add specific error messages for expired/unauthorized acceptance per FR-018 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T047 [US3] Add INFO logging for acceptance operations per NFR-004 in `packages/adapter-stellar/src/access-control/service.ts`
- [x] T048 [US3] Verify tests T039-T042 now pass

**Checkpoint**: User Story 3 complete - ownership acceptance is fully functional ✅

---

## Phase 6: User Story 4 - Detect Ownable Contract Features (Priority: P3)

**Goal**: System automatically detects two-step Ownable contracts by checking entry points and events

**Independent Test**: Scan contracts with/without Ownable implementation, verify correct detection

**Depends On**: None (can run in parallel with US2/US3 after foundational)

### Tests for User Story 4

- [ ] T049 [P] [US4] Write failing test for detecting two-step Ownable via `accept_ownership` entry point in `packages/adapter-stellar/test/access-control/detection.test.ts`
- [ ] T050 [P] [US4] Write failing test for `hasTwoStepOwnable` capability flag in `packages/adapter-stellar/test/access-control/detection.test.ts`
- [ ] T051 [P] [US4] Write failing test for contracts WITHOUT `accept_ownership` returning `hasTwoStepOwnable: false`

### Implementation for User Story 4

- [ ] T052 [US4] Update `detectAccessControlCapabilities()` to check for `accept_ownership` entry point in `packages/adapter-stellar/src/access-control/feature-detection.ts`
- [ ] T053 [US4] Set `hasTwoStepOwnable` flag based on presence of `accept_ownership` in `packages/adapter-stellar/src/access-control/feature-detection.ts`
- [ ] T054 [US4] Update Ownable verification to require 3 of 4 optional functions for two-step in `packages/adapter-stellar/src/access-control/feature-detection.ts`
- [ ] T055 [US4] Add capability notes for two-step Ownable detection in `packages/adapter-stellar/src/access-control/feature-detection.ts`
- [ ] T056 [US4] Verify tests T049-T051 now pass

**Checkpoint**: User Story 4 complete - feature detection identifies two-step Ownable contracts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, documentation, and cleanup

- [ ] T057 [P] Update exports in `packages/adapter-stellar/src/access-control/index.ts` to include new functions
- [ ] T058 [P] Add JSDoc annotations to all new public methods per Constitution II
- [ ] T059 [P] Add integration test for full two-step transfer flow in `packages/adapter-stellar/test/access-control/ownable-two-step.test.ts`
- [ ] T060 [P] Add edge case tests (boundary conditions, network errors) in `packages/adapter-stellar/test/access-control/ownable-two-step.test.ts`
- [ ] T061 [P] Add performance benchmark tests verifying NFR-001 (3s ownership query), NFR-002 (1s indexer), NFR-003 (500ms ledger) in `packages/adapter-stellar/test/access-control/ownable-two-step.test.ts`
- [ ] T062 Run all tests and fix any regressions
- [ ] T063 Validate quickstart.md examples work against implementation
- [ ] T064 Update changeset for package version bump

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────────────────────────────────────────────────────┐
                                                                        │
Phase 2: Foundational ──────────────────────────────────────────────────┤
         (BLOCKS all user stories)                                      │
                                                                        ▼
    ┌───────────────────────────────────────────────────────────────────┤
    │                                                                   │
    ▼                                                                   │
Phase 3: US1 View Status (P1) 🎯 MVP                                    │
    │                                                                   │
    ├──────────────────┐                                                │
    │                  │                                                │
    ▼                  ▼                                                │
Phase 4: US2      Phase 6: US4                                          │
Initiate (P2)     Detection (P3)                                        │
    │              (parallel)                                           │
    ▼                                                                   │
Phase 5: US3                                                            │
Accept (P2)                                                             │
    │                                                                   │
    └───────────────────────────────────────────────────────────────────┤
                                                                        │
Phase 7: Polish ◄───────────────────────────────────────────────────────┘
```

### User Story Dependencies

| Story    | Depends On                    | Can Run Parallel With |
| -------- | ----------------------------- | --------------------- |
| US1 (P1) | Foundational only             | -                     |
| US2 (P2) | US1 (to verify pending state) | US4                   |
| US3 (P2) | US2 (needs pending transfer)  | US4                   |
| US4 (P3) | Foundational only             | US2, US3              |

### Within Each User Story

1. Tests MUST be written first and FAIL before implementation
2. Implementation in order: helpers → core logic → error handling → logging
3. Verify tests pass after implementation
4. Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase (T001-T005)**:

```bash
# All type extensions can run in parallel:
T001: Extend OwnershipInfo interface
T002: Add PendingOwnershipTransfer interface
T003: Add OwnershipState type
T004: Extend AccessControlCapabilities
```

**Foundational Phase (T006-T014)**:

```bash
# Tests can run in parallel:
T006, T007, T008

# Implementation can run in parallel:
T009: getCurrentLedger()
T010: Event type
T011: Event interface
T013: Validation helper
```

**User Story Phases**:

```bash
# All tests for a story can run in parallel
# Models/helpers for a story can run in parallel
# US2 and US4 can run in parallel after US1
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T014)
3. Complete Phase 3: User Story 1 (T015-T027)
4. **STOP and VALIDATE**: Test ownership viewing independently
5. Deploy/demo - users can view ownership status ✅

### Incremental Delivery

| Increment  | Stories         | Value Delivered                               |
| ---------- | --------------- | --------------------------------------------- |
| MVP        | US1             | View ownership status (owned/pending/expired) |
| +Transfer  | US1 + US2       | Initiate ownership transfers                  |
| +Accept    | US1 + US2 + US3 | Complete two-step transfer workflow           |
| +Detection | All             | Auto-detect Ownable contracts                 |

### Parallel Team Strategy

With multiple developers after Foundational complete:

- **Developer A**: US1 → US2 → US3 (core workflow)
- **Developer B**: US4 (feature detection) → Polish tasks

---

## Task Summary

| Phase           | Task Count | Parallel Tasks |
| --------------- | ---------- | -------------- |
| Setup           | 5          | 4              |
| Foundational    | 9          | 6              |
| US1 View Status | 13         | 5              |
| US2 Initiate    | 11         | 4              |
| US3 Accept      | 10         | 4              |
| US4 Detection   | 8          | 3              |
| Polish          | 8          | 5              |
| **Total**       | **64**     | **31**         |

---

## Notes

- All tasks follow TDD per Constitution VI
- [P] tasks can run in parallel (different files, no dependencies)
- [Story] label maps task to user story for traceability
- Each user story is independently testable at its checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Implementation Notes (Post-Phase 3)

### Indexer Schema Discovery (2025-12-10)

During integration testing, we discovered the actual indexer schema differs from initial assumptions:

**Event Types:**

- Contract emits: `ownership_transfer` → Indexed as: `OWNERSHIP_TRANSFER_STARTED`
- Contract emits: `ownership_transfer_completed` → Indexed as: `OWNERSHIP_TRANSFER_COMPLETED`

**Schema Fields:**

- `account` = pending new owner
- `admin` = previous owner who initiated transfer
- `ledger` = block height of event
- ⚠️ `live_until_ledger` is **NOT stored** in the indexer

**Architecture Decision:**
Since the indexer doesn't store expiration, the service now:

1. Uses indexer to detect IF a pending transfer exists
2. Calls on-chain `get_pending_owner()` to get the actual expiration ledger
3. Compares with current ledger to determine state (pending vs expired)
