# Tasks: Add Midnight Adapter

**Input**: Design documents from `/specs/004-add-midnight-adapter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL – include only if requested by the spec. This plan keeps tests implicit unless noted.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Branching & PR Stacking Plan (Do first)

- [ ] T000 Define and create stacked branches [seq]
  - Branch order and base:
    1. midnight/01-wallet → base: main
    2. midnight/02-ingestion → base: midnight/01-wallet
    3. midnight/03-auto-views → base: midnight/02-ingestion
    4. midnight/04-write-export → base: midnight/03-auto-views
    5. midnight/05-status → base: midnight/04-write-export
    6. midnight/06-rpc → base: midnight/05-status
    7. midnight/90-polish → base: midnight/06-rpc
  - PR titles: “Midnight v1 – 01 Wallet”, “Midnight v1 – 02 Ingestion”, …
  - Commit messages: Conventional Commits; small, scoped edits per branch

## Phase 1: Setup (Shared)

- [x] T001 [US0] Configure feature branch context for developers [P]
  - Path: N/A
- [x] T002 [US0] Document dependency sync policy in README notes [P]
  - Path: specs/004-add-midnight-adapter/plan.md
  - Notes: Align adapter config vs export manifest per FR-017

## Phase 2: Foundational (Blocking)

- [x] T003 [US0] Ensure ecosystem registration for Midnight exists and loads adapter [seq]
  - Path: packages/builder/src/core/ecosystemManager.ts
- [x] T004 [US0] Persist contract definition inputs scaffolding [seq]
  - Path: packages/builder (storage service) + adapter-midnight integration
- [x] T005 [US0] Export manifest wiring for Midnight [seq]
  - Path: specs/004-add-midnight-adapter/contracts/export-manifest.md

- [x] Checkpoint: Foundation ready – user story implementation can begin

## Phase 3: [US1] Wallet connect + account (P1)

Goal: Connect Midnight wallet and reflect account status (wallet-only v1).
Independent Test: Select Midnight network, click Connect, see connected address.

- [x] T006 [US1] Add missing unit tests for wallet adapter surface [P]
  - Path: packages/adapter-midnight/src/wallet/_/**tests**/_.test.ts
- [x] T007 [US1] Verify provider root + hooks + components wiring [seq]
  - Path: packages/adapter-midnight/src/wallet/\*_/_
- [x] T008 [US1] Ensure supportsWalletConnection/getAvailableConnectors parity [seq]
  - Path: packages/adapter-midnight/src/adapter.ts

- [x] Checkpoint: User Story 1 is fully functional and independently testable

## Phase 4: [US2] Contract ingestion (P2)

Goal: Provide inputs and load contract schema; render functions list.
Independent Test: Submit valid inputs and see callable functions list.

- [x] T009 [US2] Implement persistence of `getContractDefinitionInputs()` values [seq]
  - Path: packages/builder storage + adapter-midnight bridge
- [x] T010 [US2] Build `loadContract` conversion to `ContractSchema` with validation [seq]
  - Path: packages/adapter-midnight/src/contract/loader.ts + adapter.ts
- [x] T011 [US2] Add validation errors for malformed inputs [P]
  - Path: packages/adapter-midnight/src/utils/artifacts.ts + adapter.ts

- [x] Checkpoint: User Stories 1 and 2 work independently

## Phase 5: [US3] Auto simple view rendering (P3)

Goal: Auto-display parameter-less view functions via ContractStateWidget.
Independent Test: Load a contract with simple views and see results/empty state.

- [x] T012 [US3] Confirm `isViewFunction` usage and schema compatibility [P]
  - Path: packages/adapter-midnight/src/adapter.ts
- [x] T013 [US3] Graceful error state integration [P]
  - Path: packages/renderer/src/components/ContractStateWidget/\*\*

- [x] Checkpoint: User Stories 1–3 are independently functional

## Phase 6: [US4] Write form customize, execute, export (P4)

Goal: Customize write form, execute via wallet, export working app.
Independent Test: Execute in Builder, then export and run same flow.

- [x] T014 [US4] Implement `formatTransactionData` for write payloads [seq]
  - Path: packages/adapter-midnight/src/adapter.ts
- [x] T015 [US4] Implement wallet-only `signAndBroadcast` (prepare/balance→prove→submit) [seq]
  - Path: packages/adapter-midnight/src/adapter.ts + utils
- [x] T016 [US4] Ensure export parity (packages, config, behavior) [seq]
  - Path: packages/adapter-midnight/src/config.ts + export manifest

- [x] Checkpoint: Write flow and export validated end-to-end

## Phase 7: [US5] Submit transaction status (P5)

Goal: Surface identifier + indexing summary on submission.
Independent Test: After approval, see identifier and indexing summary.

- [ ] T017 [US5] Add status mapping utilities and UI messages [P]
  - Path: packages/adapter-midnight/src/utils + builder messaging

- [ ] Checkpoint: Submission status requirements satisfied

## Phase 8: [US6] RPC connectivity (P6)

Goal: Test connectivity with latency/success/failure feedback.
Independent Test: Run Test Connection and see result with timing.

- [ ] T018 [US6] Implement/verify validateRpcEndpoint/testMidnightRpcConnection [seq]
  - Path: packages/adapter-midnight/src/configuration/\*_/_

- [ ] Checkpoint: Diagnostics requirements satisfied

## Phase 9: Polish & Cross-Cutting

- [ ] T019 [US9] Mapping parity (types/defaults/compatibility) per FR-018 [P]
  - Path: packages/adapter-midnight/src/mapping/\*_/_
- [ ] T020 [US9] Update docs: adapter integration and export manifest sync [P]
  - Path: specs/004-add-midnight-adapter/contracts/\*.md

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies – can start immediately
- Foundational (Phase 2): Depends on Setup completion – BLOCKS all user stories
- User Stories (Phase 3+): Depend on Foundational completion
  - Proceed in priority order (P1 → P2 → P3 → P4 → P5 → P6) or in parallel after Phase 2
- Polish (Final Phase): Depends on desired user stories being complete

### User Story Dependencies

- User Story 1 (P1): Starts after Foundational – independent
- User Story 2 (P2): Starts after Foundational – independent (may integrate with US1)
- User Story 3 (P3): Starts after Foundational – independent (may integrate with US1/US2)
- User Story 4 (P4): Starts after Foundational – independent (logically follows US2/US3 outputs)
- User Story 5 (P5): Starts after Foundational – independent
- User Story 6 (P6): Starts after Foundational – independent

## Parallel Opportunities

- [ ] US1: T006 [P]
- [ ] US2: T011 [P]
- [ ] US3: T012–T013 [P]
- [ ] US4: None (sequential payload→sign)
- [ ] US5: T017 [P]
- [ ] US6: None
- [ ] Polish: T019–T020 [P]

## Parallel Example: User Story 1

```bash
# Launch parallelizable tasks for US1 (if tests requested):
Task: "T006 [US1] Add missing unit tests for wallet adapter surface"

# Implementation tasks for US1 can proceed after tests:
Task: "T007 [US1] Verify provider root + hooks + components wiring"
Task: "T008 [US1] Ensure supportsWalletConnection/getAvailableConnectors parity"
```

## Implementation Strategy

- [ ] MVP: Complete US1 only (connect wallet & show account)
- [ ] Incrementally deliver US2 → US3 → US4 (export) → US5 → US6
