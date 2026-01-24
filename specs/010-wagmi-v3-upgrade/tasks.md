# Tasks: Wagmi v3 Upgrade

**Input**: Design documents from `/specs/010-wagmi-v3-upgrade/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

**Tests**: No new test creation required. Existing tests will be updated to use new hook names. Run existing test suite for validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (RainbowKit Verification Gate)

**Purpose**: Verify RainbowKit compatibility with Wagmi v3 - BLOCKING if incompatible

**⚠️ CRITICAL**: This phase determines if the upgrade can proceed. If RainbowKit is incompatible and no v3 exists, STOP and wait for RainbowKit v3 release.

- [ ] T001 Check RainbowKit npm registry for v3.x release with Wagmi v3 support
- [ ] T002 If no v3.x, check RainbowKit v2.x peer dependencies for wagmi@3 compatibility
- [ ] T003 Create test branch and install wagmi@3 to verify RainbowKit modal renders
- [ ] T004 Verify go/no-go criteria: modal opens, wallet list displays, connection succeeds, disconnect works
- [ ] T005 Document verification result in research.md and proceed or STOP if blocked

**Checkpoint**: RainbowKit compatibility verified ✓ OR upgrade BLOCKED ❌

---

## Phase 2: Foundational (Package Version Updates)

**Purpose**: Update all package.json files to Wagmi v3 - MUST complete before hook migration

**⚠️ CRITICAL**: No hook migration can begin until all package versions are updated

- [ ] T006 Discover all hook usages: `rg "useAccount|useSwitchAccount|useAccountEffect" packages/ apps/ --type ts`
- [ ] T007 Update root package.json pnpm override: `@wagmi/core` from `^2.20.3` to `^3.0.0`
- [ ] T008 [P] Update packages/adapter-evm/package.json: wagmi, @wagmi/core, @wagmi/connectors to v3
- [ ] T009 [P] Update apps/builder/package.json: wagmi, @wagmi/core to v3
- [ ] T010 [P] Add connector peer dependencies to packages/adapter-evm/package.json: @coinbase/wallet-sdk@^4.3.6, @walletconnect/ethereum-provider@^2.21.1
- [ ] T011 Run `pnpm install` and verify no version conflicts (exit code 0, no wagmi peer warnings)
- [ ] T012 Run `pnpm typecheck` and document any initial type errors (expected: hook name errors)

**Checkpoint**: All packages updated to v3, dependencies resolve cleanly

---

## Phase 3: User Story 1 & 2 - EVM Adapter & Builder Working (Priority: P1) 🎯 MVP

**Goal**: Migrate all hook names so existing EVM applications and builder wallet features continue working

**Independent Test**: `pnpm test` passes, builder wallet connection works end-to-end

### Hook Migration in adapter-evm

- [ ] T013 [US1] [US2] Update imports in packages/adapter-evm/src/wallet/hooks/facade-hooks.ts: useAccount→useConnection, UseAccountReturnType→UseConnectionReturnType
- [ ] T014 [US1] [US2] Update evmFacadeHooks export in packages/adapter-evm/src/wallet/hooks/facade-hooks.ts: expose useConnection
- [ ] T015 [P] [US1] [US2] Update hook usages in packages/adapter-evm/src/wallet/implementation/wagmi-implementation.ts
- [ ] T016 [P] [US1] [US2] Update hook usages in packages/adapter-evm/src/wallet/utils/connection.ts
- [ ] T017 [P] [US1] [US2] Update hook usages in packages/adapter-evm/src/wallet/utils/wallet-status.ts
- [ ] T018 [P] [US1] [US2] Update hook usages in packages/adapter-evm/src/wallet/components/EvmWalletUiRoot.tsx
- [ ] T019 [P] [US1] [US2] Update hook usages in packages/adapter-evm/src/wallet/rainbowkit/config-service.ts (if present)

### Test Updates

- [ ] T020 [US1] [US2] Update test hook names in packages/adapter-evm/src/__tests__/wallet-connect.test.ts

### Verification

- [ ] T021 [US1] [US2] Run `pnpm typecheck` - verify no wagmi-related type errors
- [ ] T022 [US1] [US2] Run `pnpm test` - verify all existing tests pass (100% pass rate)
- [ ] T023 [US1] [US2] Run `pnpm build` - verify all packages build successfully

**Checkpoint**: US1 & US2 complete - adapter-evm works with v3, builder wallet features functional

---

## Phase 4: User Story 4 - RainbowKit Integration (Priority: P2)

**Goal**: Verify RainbowKit wallet connection UI remains functional after upgrade

**Independent Test**: RainbowKit modal opens, wallet list displays, connection/disconnection works

- [ ] T024 [US4] Start builder app: `pnpm dev`
- [ ] T025 [US4] Manual verification: Click "Connect Wallet" - verify modal appears with wallet options
- [ ] T026 [US4] Manual verification: Connect with MetaMask - verify address displays correctly
- [ ] T027 [US4] Manual verification: Switch network - verify UI updates
- [ ] T028 [US4] Manual verification: Disconnect - verify state clears, no console errors
- [ ] T029 [US4] Document any RainbowKit configuration changes needed (if any)

**Checkpoint**: US4 complete - RainbowKit integration verified working

---

## Phase 5: User Story 3 - Polkadot Adapter Compatibility (Priority: P2)

**Goal**: Verify future Polkadot adapter can use Wagmi v3 APIs without conflicts

**Independent Test**: Create test file importing useConnection from wagmi, TypeScript compiles

- [ ] T030 [US3] Create verification file: specs/010-wagmi-v3-upgrade/validation/wagmi-v3-import-test.ts
- [ ] T031 [US3] In validation file: import { useConnection } from 'wagmi' and verify TypeScript compiles
- [ ] T032 [US3] Verify no version conflicts when importing wagmi in a hypothetical new adapter
- [ ] T033 [US3] Document verification result for 009-polkadot-adapter spec reference

**Checkpoint**: US3 complete - Polkadot adapter can proceed with Wagmi v3

---

## Phase 6: Polish & Documentation

**Purpose**: Documentation, changeset, and final verification

- [ ] T034 [P] Run exported app test: `pnpm test:export` - verify exported apps work with v3
- [ ] T035 [P] Update any internal docs referencing wagmi v2 APIs
- [ ] T036 Create changeset with MAJOR bump for @openzeppelin/ui-builder-adapter-evm
- [ ] T037 Add migration notes to changeset per FR-015 template in spec.md
- [ ] T038 Run full validation: `pnpm build && pnpm test && pnpm typecheck`
- [ ] T039 Run quickstart.md validation steps
- [ ] T040 Update spec.md status to "Complete"

**Checkpoint**: All documentation complete, ready for PR

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup/Verification) ──► GATE: GO or BLOCKED
         │
         ▼ (if GO)
Phase 2 (Foundational) ──────► All packages on v3
         │
         ▼
Phase 3 (US1 & US2) ─────────► Hook migration complete
         │
         ├──► Phase 4 (US4) ──► RainbowKit verified
         │
         └──► Phase 5 (US3) ──► Polkadot compatibility verified
                   │
                   ▼
         Phase 6 (Polish) ───► Documentation complete
```

### User Story Dependencies

| Story | Priority | Depends On | Can Parallel With |
|-------|----------|------------|-------------------|
| US1 & US2 | P1 | Phase 2 complete | - |
| US3 | P2 | Phase 3 complete | US4 |
| US4 | P2 | Phase 3 complete | US3 |

### Within Phase 3 (Hook Migration)

- T013 must complete before T014 (same file)
- T015-T019 can run in parallel (different files)
- T020 can run after T013-T019
- T021-T023 must be sequential (validation)

### Parallel Opportunities

**Phase 2**:
- T008, T009, T010 can run in parallel (different package.json files)

**Phase 3**:
- T015, T016, T017, T018, T019 can run in parallel (different source files)

**Phase 4 & 5**:
- Can run in parallel after Phase 3 completes

**Phase 6**:
- T034, T035 can run in parallel

---

## Parallel Example: Phase 3 Hook Migration

```bash
# After T013-T014 complete (facade-hooks.ts), launch parallel:
Task T015: "Update hook usages in wagmi-implementation.ts"
Task T016: "Update hook usages in connection.ts"
Task T017: "Update hook usages in wallet-status.ts"
Task T018: "Update hook usages in EvmWalletUiRoot.tsx"
Task T019: "Update hook usages in config-service.ts"
```

---

## Implementation Strategy

### MVP First (Phase 1-3 Only)

1. Complete Phase 1: RainbowKit verification (GATE)
2. If GO: Complete Phase 2: Package version updates
3. Complete Phase 3: Hook migration (US1 & US2)
4. **STOP and VALIDATE**: Run full test suite, verify builder works
5. At this point, the core upgrade is complete and functional

### Full Delivery

1. Complete MVP (Phases 1-3)
2. Complete Phase 4: RainbowKit verification (US4)
3. Complete Phase 5: Polkadot compatibility verification (US3)
4. Complete Phase 6: Documentation and changeset
5. Submit PR

### Rollback Procedure

If upgrade fails after Phase 2:
```bash
git checkout -- package.json pnpm-lock.yaml packages/*/package.json apps/*/package.json
pnpm install
pnpm test  # Verify v2 restored
```

---

## Notes

- Phase 1 is a BLOCKING GATE - do not proceed if RainbowKit incompatible
- US1 and US2 share implementation (both depend on hook migration)
- US3 and US4 are verification tasks, not new implementation
- No new tests required - existing tests updated with new hook names
- Commit after each phase checkpoint
- Stop at MVP (Phase 3) if time-constrained - core functionality complete

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 40 |
| **Phase 1 (Setup)** | 5 tasks |
| **Phase 2 (Foundational)** | 7 tasks |
| **Phase 3 (US1 & US2)** | 11 tasks |
| **Phase 4 (US4)** | 6 tasks |
| **Phase 5 (US3)** | 4 tasks |
| **Phase 6 (Polish)** | 7 tasks |
| **Parallel Opportunities** | 15 tasks marked [P] |
| **MVP Scope** | Phases 1-3 (23 tasks) |
