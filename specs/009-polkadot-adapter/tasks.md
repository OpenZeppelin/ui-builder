# Tasks: Polkadot Adapter

**Input**: Design documents from `/specs/009-polkadot-adapter/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/module-exports.ts, quickstart.md

**Tests**: Tests are included per project's TDD standards (VI. Test-Driven Development in Constitution).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo package**: `packages/adapter-polkadot/`
- **Builder app**: `apps/builder/`

---

## Phase 1: Setup (Package Initialization)

**Purpose**: Create the adapter-polkadot package structure and configuration

- [x] T001 Create package directory structure per plan.md at `packages/adapter-polkadot/`
- [x] T002 Create `packages/adapter-polkadot/package.json` with dependencies (`adapter-evm-core`, `ui-types`, `ui-utils`, `viem`, `wagmi@2`)
- [x] T003 [P] Create `packages/adapter-polkadot/tsconfig.json` extending base config
- [x] T004 [P] Create `packages/adapter-polkadot/tsup.config.ts` with `noExternal: ['adapter-evm-core']`
- [x] T005 [P] Create `packages/adapter-polkadot/vite-config.ts` with minimal config (no WASM)
- [x] T006 Run `pnpm install` from monorepo root to link workspace dependencies

---

## Phase 2: Foundational (Core Types & Exports)

**Purpose**: Core types and module structure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create `packages/adapter-polkadot/src/types.ts` with `PolkadotExecutionType`, `PolkadotNetworkCategory`, `PolkadotRelayChain`, and `TypedPolkadotNetworkConfig` per data-model.md
- [ ] T008 [P] Create `packages/adapter-polkadot/src/__tests__/types.test.ts` with type validation tests
- [ ] T009 Create `packages/adapter-polkadot/src/handlers/evm-handler.ts` delegating to `adapter-evm-core` modules (includes execution strategies: EOA, Relayer via core)
- [ ] T010 Create `packages/adapter-polkadot/src/adapter.ts` with `PolkadotAdapter` class implementing `ContractAdapter` interface
- [ ] T011 [P] Create `packages/adapter-polkadot/src/__tests__/adapter.test.ts` with adapter method tests
- [ ] T012 Create `packages/adapter-polkadot/src/index.ts` aggregating all exports per contracts/module-exports.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Polkadot Hub Contract Interaction (Priority: P1) 🎯 MVP

**Goal**: Users can load and interact with contracts on Polkadot Hub, Kusama Hub, and Polkadot Hub TestNet using Blockscout (Etherscan V1 API)

**Independent Test**: Select Polkadot ecosystem → Polkadot Hub TestNet → load verified contract → query view function

### Tests for User Story 1

- [ ] T013 [P] [US1] Create `packages/adapter-polkadot/src/__tests__/networks.test.ts` with Hub network config validation tests
- [ ] T014 [P] [US1] Add Blockscout API mock tests in `packages/adapter-polkadot/src/__tests__/adapter.test.ts` for V1 ABI loading

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create custom viem chain definition `polkadotHub` (chain ID 420420419) in `packages/adapter-polkadot/src/networks/chains.ts`
- [ ] T016 [P] [US1] Create custom viem chain definition `kusamaHub` (chain ID 420420418) in `packages/adapter-polkadot/src/networks/chains.ts`
- [ ] T017 [P] [US1] Create custom viem chain definition `polkadotHubTestNet` (chain ID 420420417) in `packages/adapter-polkadot/src/networks/chains.ts`
- [ ] T018 [US1] Create `packages/adapter-polkadot/src/networks/mainnet.ts` with `polkadotHubMainnet` and `kusamaHubMainnet` configs (supportsEtherscanV2: false)
- [ ] T019 [US1] Create `packages/adapter-polkadot/src/networks/testnet.ts` with `polkadotHubTestnet` config (supportsEtherscanV2: false)
- [ ] T020 [US1] Create `packages/adapter-polkadot/src/networks/index.ts` aggregating network exports with Hub networks first
- [ ] T021 [US1] Verify `loadContract` works with Blockscout API URL via adapter-evm-core's `loadAbiFromEtherscanV1`
- [ ] T022 [US1] Update `packages/adapter-polkadot/src/index.ts` to export Hub networks and viem chains

**Checkpoint**: User Story 1 complete - Hub contract interaction works independently

---

## Phase 4: User Story 2 - Moonbeam Parachain Contract Interaction (Priority: P2)

**Goal**: Users can load and interact with contracts on Moonbeam, Moonriver, and Moonbase Alpha using Moonscan (Etherscan V2 API)

**Independent Test**: Select Polkadot ecosystem → Moonbase Alpha → load verified contract → query view function

### Tests for User Story 2

- [ ] T023 [P] [US2] Add parachain network config validation tests in `packages/adapter-polkadot/src/__tests__/networks.test.ts`
- [ ] T024 [P] [US2] Add Moonscan API mock tests in `packages/adapter-polkadot/src/__tests__/adapter.test.ts` for V2 ABI loading

### Implementation for User Story 2

- [ ] T025 [P] [US2] Add `moonbeamMainnet` config to `packages/adapter-polkadot/src/networks/mainnet.ts` (supportsEtherscanV2: true, uses viem's built-in `moonbeam` chain)
- [ ] T026 [P] [US2] Add `moonriverMainnet` config to `packages/adapter-polkadot/src/networks/mainnet.ts` (supportsEtherscanV2: true, uses viem's built-in `moonriver` chain)
- [ ] T027 [US2] Add `moonbaseAlphaTestnet` config to `packages/adapter-polkadot/src/networks/testnet.ts` (supportsEtherscanV2: true, uses viem's built-in `moonbaseAlpha` chain)
- [ ] T028 [US2] Update `packages/adapter-polkadot/src/networks/index.ts` to include parachain networks after Hub networks
- [ ] T029 [US2] Verify `loadContract` works with Moonscan API via adapter-evm-core's `loadAbiFromEtherscanV2`
- [ ] T030 [US2] Update `packages/adapter-polkadot/src/index.ts` to export all parachain networks

**Checkpoint**: User Stories 1 AND 2 complete - all networks functional

---

## Phase 5: User Story 3 - Export Polkadot App (Priority: P1)

**Goal**: Developers can export standalone Polkadot contract UI applications that work independently

**Independent Test**: Build a Polkadot Hub contract UI → export → run `npm install && npm run dev` → verify app connects to correct network

### Tests for User Story 3

- [ ] T031 [P] [US3] Add export configuration tests in `packages/adapter-polkadot/src/__tests__/adapter.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Create `packages/adapter-polkadot/src/wallet/index.ts` re-exporting wallet components from `adapter-evm`
- [ ] T033 [US3] Create `PolkadotWalletUiRoot` component wrapping wagmi provider with Polkadot chains in `packages/adapter-polkadot/src/wallet/index.ts`
- [ ] T034 [US3] Verify tsup bundles `adapter-evm-core` internally via `noExternal` config
- [ ] T035 [US3] Update `packages/adapter-polkadot/src/index.ts` to export wallet components
- [ ] T036 [US3] Test export flow: create contract UI → export → verify standalone app starts correctly

**Checkpoint**: Export functionality complete - standalone apps work

---

## Phase 6: User Story 4 - Ecosystem UI Integration (Priority: P2)

**Goal**: Polkadot appears as a distinct ecosystem in the UI Builder, separate from Ethereum

**Independent Test**: Open ecosystem selector → verify "Polkadot" appears as distinct option → select Polkadot → verify Hub networks listed first

### Tests for User Story 4

- [ ] T037 [P] [US4] Add ecosystem registration tests in `packages/adapter-polkadot/src/__tests__/adapter.test.ts`

### Implementation for User Story 4

- [ ] T038 [US4] Create `registerPolkadotEcosystem()` function in `packages/adapter-polkadot/src/index.ts`
- [ ] T039 [US4] Register Polkadot ecosystem in `apps/builder/src/core/ecosystems/registry.ts` with lazy import
- [ ] T040 [US4] Add Polkadot icon/branding to ecosystem selector (use `lucide-react` icon or coordinate with design system for custom SVG; placeholder acceptable initially)
- [ ] T041 [US4] Verify network ordering: Hub networks (P1) appear before parachain networks (P2) in selector

**Checkpoint**: UI integration complete - Polkadot ecosystem visible in builder

---

## Phase 7: User Story 5 - Non-EVM Architecture Extensibility (Priority: P3)

**Goal**: Adapter architecture allows future addition of non-EVM parachain handlers (Substrate/Wasm)

**Independent Test**: Code review confirms clear path to add Substrate handler without restructuring

### Implementation for User Story 5

- [ ] T042 [US5] Add JSDoc comments in `packages/adapter-polkadot/src/handlers/evm-handler.ts` documenting handler pattern for future Substrate handler
- [ ] T043 [US5] Ensure `executionType` routing is implemented in `PolkadotAdapter` (currently only 'evm', but extensible)
- [ ] T044 [US5] Document handler extension pattern in `packages/adapter-polkadot/README.md`

**Checkpoint**: Architecture documented and extensible for future non-EVM support

---

## Phase 8: Utilities & Polish

**Purpose**: Network utilities and cross-cutting improvements

- [ ] T045 [P] Create `getNetworksByCategory()` utility in `packages/adapter-polkadot/src/utils.ts`
- [ ] T046 [P] Create `getNetworksByRelayChain()` utility in `packages/adapter-polkadot/src/utils.ts`
- [ ] T047 [P] Create `isHubNetwork()` and `isParachainNetwork()` type guards in `packages/adapter-polkadot/src/utils.ts`
- [ ] T048 Add utility function tests in `packages/adapter-polkadot/src/__tests__/utils.test.ts`
- [ ] T049 [P] Create `packages/adapter-polkadot/README.md` with usage documentation
- [ ] T050 Update `packages/adapter-polkadot/src/index.ts` to export all utilities
- [ ] T051 Run full test suite: `pnpm --filter adapter-polkadot test`
- [ ] T052 Run quickstart.md validation scenarios manually
- [ ] T053 Verify build: `pnpm --filter adapter-polkadot build`
- [ ] T054 Verify package bundle size is within 25% of adapter-evm: `du -sh packages/adapter-polkadot/dist/ packages/adapter-evm/dist/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US3 (Phase 5) are both P1 - complete US1 first as US3 depends on networks
  - US2 (Phase 4) can start after US1 or in parallel
  - US4 (Phase 6) can start after US1 or in parallel
  - US5 (Phase 7) can be done anytime after Foundational
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1 (different network configs)
- **User Story 3 (P1)**: Depends on US1 (needs network configs for export)
- **User Story 4 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 5 (P3)**: Can start after Foundational - Architecture/documentation only

### Within Each User Story

- Tests FIRST (TDD approach)
- Types/configs before implementation
- Core functionality before integration
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005 (Setup configs) can run in parallel
- T008, T011 (Foundational tests) can run in parallel
- T013, T014 (US1 tests) can run in parallel
- T015, T016, T017 (viem chains) can run in parallel
- T023, T024 (US2 tests) can run in parallel
- T025, T026 (US2 mainnet configs) can run in parallel
- T045, T046, T047, T049 (utilities) can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: T013 "Hub network config validation tests in packages/adapter-polkadot/src/__tests__/networks.test.ts"
Task: T014 "Blockscout API mock tests in packages/adapter-polkadot/src/__tests__/adapter.test.ts"

# Launch all viem chain definitions together:
Task: T015 "polkadotHub chain definition"
Task: T016 "kusamaHub chain definition"
Task: T017 "polkadotHubTestNet chain definition"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Hub networks)
4. Complete Phase 5: User Story 3 (Export)
5. **STOP and VALIDATE**: Test Hub network contract interaction + export independently
6. Deploy/demo if ready - MVP delivers Hub network support + export!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Hub) → Test independently → MVP delivers Polkadot Hub support
3. Add User Story 3 (Export) → Test independently → MVP deliverable
4. Add User Story 2 (Moonbeam) → Test independently → Extended network support
5. Add User Story 4 (UI) → Test independently → Full ecosystem integration
6. Add User Story 5 (Architecture) → Code review → Future-proofed
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Hub networks)
   - Developer B: User Story 2 (Parachain networks) - can proceed in parallel
3. After US1 complete:
   - Developer A: User Story 3 (Export)
   - Developer B: User Story 4 (UI integration)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- adapter-evm-core dependency: Ensure spec 008 is complete before starting
- Wagmi v2: Use same version as adapter-evm for RainbowKit compatibility
- Blockscout uses Etherscan V1 API format - no new loaders needed
