# Tasks: EVM Adapter Access Control Module

**Input**: Design documents from `/specs/011-evm-access-control/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required — TDD mandated per project constitution (SC-008). Write failing tests first, then implement.

**Organization**: Tasks grouped by user story. Each story is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story (US1–US9)

## Path Conventions

- **Core module**: `packages/adapter-evm-core/src/access-control/`
- **Core tests**: `packages/adapter-evm-core/test/access-control/`
- **Adapter**: `packages/adapter-evm/src/`
- **Stellar reference**: `packages/adapter-stellar/src/access-control/` (read-only reference)

---

## Phase 0: Pre-Requisite — Upstream Types & Consumer Updates

**Purpose**: Track upstream changes in `openzeppelin-ui` and `role-manager` repos that unblock final integration. Implementation can start immediately using workarounds (sentinel values, UNKNOWN mappings, local type extensions), but these tasks must complete before the workarounds are removed.

- [x] T000a [P] **PR-1**: Make `expirationBlock` optional in `PendingOwnershipTransfer` and `PendingAdminTransfer` in `openzeppelin-ui/packages/types/src/adapters/access-control.ts`. Also make `expirationBlock` parameter optional in `transferOwnership()` and `transferAdminRole()` method signatures. Verify Stellar adapter still compiles. Reference: spec.md §PR-1, quickstart.md §Step 0a.
- [x] T000b [P] **PR-2**: Add `ADMIN_TRANSFER_CANCELED`, `ADMIN_DELAY_CHANGE_SCHEDULED`, `ADMIN_DELAY_CHANGE_CANCELED` to `HistoryChangeType` union in `openzeppelin-ui/packages/types/src/adapters/access-control.ts`. Reference: spec.md §PR-2, quickstart.md §Step 0b.
- [x] T000c [P] **PR-3**: Add `accessControlIndexerUrl?: string` to `BaseNetworkConfig` in `openzeppelin-ui/packages/types/src/networks/config.ts`. (Originally on `EvmNetworkConfig`, moved to `BaseNetworkConfig` so both EVM and Stellar adapters share the same field.) Reference: spec.md §PR-3, quickstart.md §Step 0c.
- [x] T000c-stellar [P] **PR-3a**: Migrate Stellar adapter to use `accessControlIndexerUrl` instead of `indexerUri` for access control. Updated: `mainnet.ts`, `testnet.ts` (network configs), `indexer-client.ts` (resolution logic: `accessControlIndexerUrl ?? indexerUri`), `generateAndAddAppConfig.ts` (builder app export). Added temporary type augmentation `src/types/access-control-indexer-url.d.ts` in both Stellar adapter and builder app. Updated 6 test files. Reference: spec.md §PR-3.
- [x] T000d **Role Manager update** (blocked by T000b): Update `CHANGE_TYPE_TO_ACTION` mapping in `role-manager/apps/role-manager/src/types/role-changes.ts` to include new `HistoryChangeType` variants. Must be done before or simultaneously with bumping `@openzeppelin/ui-types` in the Role Manager. Reference: spec.md §PR-2 Impact, quickstart.md §Step 0d.
- [x] T000e **Publish & consume** (blocked by T000a–T000c): Published `@openzeppelin/ui-types` v1.7.0. Updated dependency to `^1.7.0` in `ui-builder` (adapter-stellar, adapter-evm-core, adapter-evm, builder) and `role-manager`. Removed temporary type augmentation files (`access-control-indexer-url.d.ts`). Uncommented `CHANGE_TYPE_TO_ACTION` entries in role-manager. Added EVM-only `HistoryChangeType` mappings to Stellar adapter's `mapChangeTypeToGraphQLEnum`. Reference: quickstart.md §Step 0e.

**Note**: EVM adapter implementation (Phase 1+) can proceed in parallel using workarounds. Phase 0 completion is required before final integration (Phase 12) removes workarounds.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure, constants, and type extensions needed by all stories

- [x] T001 Create directory structure: `packages/adapter-evm-core/src/access-control/` and `packages/adapter-evm-core/test/access-control/`. Mirror the Stellar adapter's `packages/adapter-stellar/src/access-control/` layout.
- [x] T002 [P] Define EVM access control constants (DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE_LABEL, ZERO_ADDRESS) in `packages/adapter-evm-core/src/access-control/constants.ts`. Reference: data-model.md §Constants.
- [x] T003 [P] Define `EvmAccessControlContext` interface and `EvmTransactionExecutor` callback type in `packages/adapter-evm-core/src/access-control/types.ts`. Reference: data-model.md §1, contracts/access-control-service.ts §Factory.
- [x] T004 [P] ~~Add temporary type augmentation for `accessControlIndexerUrl`~~ — SKIPPED: `accessControlIndexerUrl` already exists on `BaseNetworkConfig` in `@openzeppelin/ui-types@1.7.0` (published as part of T000e). No type augmentation needed.
- [x] T005 [P] Define ABI fragment constants for all access control functions (Ownable, Ownable2Step, AccessControl, AccessControlEnumerable, AccessControlDefaultAdminRules, admin delay operations) in `packages/adapter-evm-core/src/access-control/abis.ts`. Reference: contracts/feature-detection.ts for the full signature matrix.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Input validation — all modules depend on this. MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests (TDD — write first, verify they fail)

- [x] T006 [P] Write validation tests in `packages/adapter-evm-core/test/access-control/validation.test.ts`. Cover: valid/invalid EVM addresses (checksummed, non-checksummed, wrong length, missing 0x), valid/invalid bytes32 role IDs, DEFAULT_ADMIN_ROLE, array validation, error messages, custom paramName for contextual errors. Reference: research.md §R8.

### Implementation

- [x] T007 Implement `validateAddress`, `validateRoleId`, `validateRoleIds` in `packages/adapter-evm-core/src/access-control/validation.ts`. Reuses existing `isValidEvmAddress()` from `../utils/validation.ts` for address checks (single function — EVM has no contract/account address distinction). Regex `/^0x[0-9a-fA-F]{64}$/` for role IDs. Throws `ConfigurationInvalid` from `@openzeppelin/ui-types` on failure. Callers pass contextual `paramName` (e.g. `'contractAddress'`, `'account'`, `'newOwner'`) for descriptive errors. Reference: quickstart.md §Step 1.

**Checkpoint**: Validation module complete. All input validation tests pass. User story implementation can begin.

---

## Phase 3: User Story 1 — Register Contract & Detect Capabilities (Priority: P1) 🎯 MVP

**Goal**: Register an EVM contract with its ABI and detect which access control patterns it supports (Ownable, Ownable2Step, AccessControl, etc.)

**Independent Test**: Register a known OZ contract ABI and verify all capability flags match expected values.

### Tests (TDD)

- [x] T008 [P] [US1] Write feature-detection tests in `packages/adapter-evm-core/test/access-control/feature-detection.test.ts`. Cover: Ownable-only ABI, Ownable2Step ABI, AccessControl ABI, AccessControlEnumerable ABI, AccessControlDefaultAdminRules ABI, combined patterns, empty ABI, ABI with similar-but-wrong function signatures. Reference: contracts/feature-detection.ts §Detection matrix.
- [x] T009 [P] [US1] Write service registration + capability tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (initial file — registration suite only). Cover: successful registration, invalid address rejection, invalid role ID rejection, addKnownRoleIds, getCapabilities returning cached capabilities, supportsHistory flag tied to indexer availability. Reference: spec.md §US1 acceptance scenarios 1–5.

### Implementation

- [x] T010 [P] [US1] Implement `detectAccessControlCapabilities(contractSchema)` and `validateAccessControlSupport(capabilities)` in `packages/adapter-evm-core/src/access-control/feature-detection.ts`. Check function names AND parameter types against the ABI signature constants from T005. Return `AccessControlCapabilities` flags. Reference: quickstart.md §Step 2, research.md §R4.
- [x] T011 [US1] Implement `registerContract()`, `addKnownRoleIds()`, `getCapabilities()`, and the `EvmAccessControlService` class constructor (accepting `networkConfig` and `executeTransaction` callback) in `packages/adapter-evm-core/src/access-control/service.ts`. Store context in `Map<string, EvmAccessControlContext>`. `getCapabilities()` delegates to feature-detection and checks indexer availability for `supportsHistory`. Reference: quickstart.md §Step 6, contracts/access-control-service.ts §Contract Registration + §Capability Detection.

**Checkpoint**: US1 complete. Can register a contract and detect all capability patterns. Tests pass.

---

## Phase 4: User Story 2 — View Current Ownership and Admin State (Priority: P1)

**Goal**: Query the current ownership state (Ownable/Ownable2Step) and default admin state (AccessControlDefaultAdminRules) from on-chain data, enriched with indexer data when available.

**Independent Test**: Query ownership on a mock Ownable2Step contract and verify owner, pending owner, and state classification. Query admin info on a mock AccessControlDefaultAdminRules contract.

### Tests (TDD)

- [x] T012 [P] [US2] Write on-chain reader ownership and admin tests in `packages/adapter-evm-core/test/access-control/onchain-reader.test.ts` (initial file — ownership + admin suites). Cover: `readOwnership` returning owner/pendingOwner, zero address as renounced, `getAdmin` returning defaultAdmin/pendingDefaultAdmin with acceptSchedule. Mock viem `readContract`. Reference: quickstart.md §Step 3 (readOwnership, getAdmin functions).
- [x] T013 [P] [US2] Write indexer client construction and availability tests in `packages/adapter-evm-core/test/access-control/indexer-client.test.ts` (initial file — constructor + availability + pending transfer suites). Cover: endpoint resolution precedence, `isAvailable()` health check, `queryPendingOwnershipTransfer`, `queryPendingAdminTransfer`, graceful failure when indexer is down. **Verify indexer queries use `networkConfig.id` (kebab-case) as the `network` filter value (FR-027).** Mock `fetch`. Reference: quickstart.md §Step 4.
- [x] T014 [P] [US2] Write service ownership and admin tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add ownership + admin suites). Cover: `getOwnership()` with owned/pending/renounced states, never returning `expired`, indexer enrichment for pending transfer details, graceful degradation without indexer. `getAdminInfo()` with active/pending/renounced states, acceptSchedule mapping to expirationBlock. Reference: spec.md §US2 scenarios 1–6.

### Implementation

- [x] T015 [P] [US2] Implement `readOwnership(rpcUrl, contractAddress, viemChain?)` and `getAdmin(rpcUrl, contractAddress, viemChain?)` in `packages/adapter-evm-core/src/access-control/onchain-reader.ts`. Use viem `createPublicClient` + `readContract` with single-function ABI fragments. `readOwnership` calls `owner()` and `pendingOwner()`. `getAdmin` calls `defaultAdmin()`, `pendingDefaultAdmin()`, `defaultAdminDelay()`. Reference: quickstart.md §Step 3.
- [x] T016 [P] [US2] Implement `EvmIndexerClient` class (constructor, `isAvailable()`, `queryPendingOwnershipTransfer()`, `queryPendingAdminTransfer()`) and `createIndexerClient` factory in `packages/adapter-evm-core/src/access-control/indexer-client.ts`. Use `fetch()` for GraphQL POST. Endpoint resolution: user config > runtime override > `networkConfig.accessControlIndexerUrl`. Reference: quickstart.md §Step 4, contracts/indexer-queries.graphql §GetPendingOwnershipTransfer + §GetPendingAdminTransfer.
- [x] T017 [US2] Implement `getOwnership()` and `getAdminInfo()` in `packages/adapter-evm-core/src/access-control/service.ts`. Orchestrate on-chain reader + indexer enrichment. Map states: owned/pending/renounced (never expired per FR-023). For admin pending transfers, map `acceptSchedule` to `expirationBlock` (UNIX timestamp, see research.md §R5). Graceful degradation per FR-017. Reference: contracts/access-control-service.ts §Ownership + §Admin.

**Checkpoint**: US2 complete. Can query ownership and admin state with all state classifications. Indexer enrichment works; graceful degradation works. Tests pass.

---

## Phase 5: User Story 3 — View Current Role Assignments (Priority: P1)

**Goal**: List current role assignments for an AccessControl contract, with optional enrichment from the indexer.

**Independent Test**: Query roles on a mock AccessControl contract with known role members, verify enumeration and hasRole-based lookup both work.

### Tests (TDD)

- [x] T018 [P] [US3] Write on-chain reader role tests in `packages/adapter-evm-core/test/access-control/onchain-reader.test.ts` (add role suite). Cover: `hasRole`, `enumerateRoleMembers` (getRoleMemberCount + getRoleMember loop), `readCurrentRoles` with known role IDs, `getRoleAdmin`. Reference: quickstart.md §Step 3.
- [x] T019 [P] [US3] Write indexer client role queries tests in `packages/adapter-evm-core/test/access-control/indexer-client.test.ts` (add role membership suite). Cover: `queryLatestGrants` for enrichment, role member queries via `GetRoleMembers`. Reference: contracts/indexer-queries.graphql §GetRoleMembers + §GetLatestGrants.
- [x] T020 [P] [US3] Write service role tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add roles suite). Cover: `getCurrentRoles()` via enumeration (hasEnumerableRoles), via known role IDs + hasRole, via indexer fallback. `getCurrentRolesEnriched()` with grant metadata. Graceful degradation: partial enrichment failure returns on-chain data with warning. Empty array when no roles/indexer/enumeration. DEFAULT_ADMIN_ROLE label mapping. **Explicit assertion: verify DEFAULT_ADMIN_ROLE is NOT auto-included in knownRoleIds on registration (FR-026).** Note: `grantedLedger` field in `EnrichedRoleAssignment` stores EVM block number despite its Stellar-originated name — add JSDoc comment on the mapping. Reference: spec.md §US3 scenarios 1–6.

### Implementation

- [x] T021 [P] [US3] Implement `hasRole`, `enumerateRoleMembers`, `readCurrentRoles`, `getRoleAdmin`, `getCurrentBlock` in `packages/adapter-evm-core/src/access-control/onchain-reader.ts`. Reference: quickstart.md §Step 3.
- [x] T022 [P] [US3] Implement `queryLatestGrants(contractAddress, roleIds)` in `packages/adapter-evm-core/src/access-control/indexer-client.ts`. Returns grant timestamps for enrichment. Reference: contracts/indexer-queries.graphql §GetLatestGrants + §GetRoleMembers.
- [x] T023 [US3] Implement `getCurrentRoles()` and `getCurrentRolesEnriched()` in `packages/adapter-evm-core/src/access-control/service.ts`. Strategy: 1) enumerable → on-chain enumeration, 2) indexer available → query role memberships, 3) fallback → hasRole checks for known role IDs. Enrichment adds grant timestamps from indexer. DEFAULT_ADMIN_ROLE_LABEL for bytes32 zero. Reference: contracts/access-control-service.ts §Roles.

**Checkpoint**: US1+US2+US3 complete — all P1 read operations functional. MVP read-only flow works end-to-end. Tests pass.

---

## Phase 6: User Story 4 — Transfer Ownership (Two-Step) (Priority: P2)

**Goal**: Assemble and execute ownership transfer, acceptance, and renounce transactions.

**Independent Test**: Assemble a `transferOwnership` WriteContractParameters and verify the ABI, function name, and args. Verify `renounceOwnership` assembly.

### Tests (TDD)

- [x] T024 [P] [US4] Write actions ownership tests in `packages/adapter-evm-core/test/access-control/actions.test.ts` (initial file — ownership suite). Cover: `assembleTransferOwnershipAction` returns correct `WriteContractParameters`, `assembleAcceptOwnershipAction`, `assembleRenounceOwnershipAction` (EVM-specific). Verify address, abi, functionName, args for each. Reference: quickstart.md §Step 5.
- [x] T025 [P] [US4] Write service ownership transfer tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add ownership transfer suite). Cover: `transferOwnership()` assembles and delegates to executeTransaction callback, `acceptOwnership()`, `renounceOwnership()` (EVM-specific). Verify expirationBlock is ignored for EVM. Guard: unregistered contract throws ConfigurationInvalid. Reference: spec.md §US4 scenarios 1–5.

### Implementation

- [x] T026 [P] [US4] Implement `assembleTransferOwnershipAction`, `assembleAcceptOwnershipAction`, `assembleRenounceOwnershipAction` in `packages/adapter-evm-core/src/access-control/actions.ts`. Each returns `{ address, abi: [singleFunctionAbi], functionName, args }` as `WriteContractParameters`. Reference: quickstart.md §Step 5, research.md §R2.
- [x] T027 [US4] Implement `transferOwnership()`, `acceptOwnership()`, `renounceOwnership()` in `packages/adapter-evm-core/src/access-control/service.ts`. Validate inputs, assemble via actions module, delegate to `executeTransaction` callback. `expirationBlock` param is ignored for EVM. Add INFO/DEBUG logging per NFR-001 (verify via mock logger in T025 service tests). Reference: contracts/access-control-service.ts §Ownership.

**Checkpoint**: US4 complete. Ownership transfer, accept, and renounce work end-to-end. Tests pass.

---

## Phase 7: User Story 5 — Transfer Default Admin Role (Two-Step) (Priority: P2)

**Goal**: Assemble and execute default admin transfer, accept, cancel, delay change, and delay rollback transactions.

**Independent Test**: Assemble `beginDefaultAdminTransfer` and `cancelDefaultAdminTransfer` WriteContractParameters and verify correctness.

### Tests (TDD)

- [x] T028 [P] [US5] Write actions admin tests in `packages/adapter-evm-core/test/access-control/actions.test.ts` (add admin suite). Cover: `assembleBeginAdminTransferAction`, `assembleAcceptAdminTransferAction`, `assembleCancelAdminTransferAction`, `assembleChangeAdminDelayAction` (uint48 parameter), `assembleRollbackAdminDelayAction`. Reference: quickstart.md §Step 5.
- [x] T029 [P] [US5] Write service admin transfer tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add admin transfer suite). Cover: `transferAdminRole()`, `acceptAdminTransfer()`, `cancelAdminTransfer()`, `changeAdminDelay()`, `rollbackAdminDelay()`. Guard: calling without `hasTwoStepAdmin` throws ConfigurationInvalid (FR-024). Reference: spec.md §US5 scenarios 1–6.

### Implementation

- [x] T030 [P] [US5] Implement `assembleBeginAdminTransferAction`, `assembleAcceptAdminTransferAction`, `assembleCancelAdminTransferAction`, `assembleChangeAdminDelayAction`, `assembleRollbackAdminDelayAction` in `packages/adapter-evm-core/src/access-control/actions.ts`. Reference: quickstart.md §Step 5.
- [x] T031 [US5] Implement `transferAdminRole()`, `acceptAdminTransfer()`, `cancelAdminTransfer()`, `changeAdminDelay()`, `rollbackAdminDelay()` in `packages/adapter-evm-core/src/access-control/service.ts`. Guard capability checks (throw ConfigurationInvalid if `!hasTwoStepAdmin`). Delegate to `executeTransaction`. Reference: contracts/access-control-service.ts §Admin.

**Checkpoint**: US5 complete. All admin transfer and delay operations work. Capability guards tested. Tests pass.

---

## Phase 8: User Story 6 — Grant and Revoke Roles (Priority: P2)

**Goal**: Assemble and execute role grant, revoke, and renounce transactions.

**Independent Test**: Assemble `grantRole` WriteContractParameters with a bytes32 role ID and verify correctness.

### Tests (TDD)

- [x] T032 [P] [US6] Write actions role tests in `packages/adapter-evm-core/test/access-control/actions.test.ts` (add role suite). Cover: `assembleGrantRoleAction`, `assembleRevokeRoleAction`, `assembleRenounceRoleAction`. Verify bytes32 role and address args. Reference: quickstart.md §Step 5.
- [x] T033 [P] [US6] Write service role management tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add role management suite). Cover: `grantRole()`, `revokeRole()`, `renounceRole()` (EVM-specific). Validation: invalid role ID rejected, invalid address rejected, unregistered contract rejected. Reference: spec.md §US6 scenarios 1–5.

### Implementation

- [x] T034 [P] [US6] Implement `assembleGrantRoleAction`, `assembleRevokeRoleAction`, `assembleRenounceRoleAction` in `packages/adapter-evm-core/src/access-control/actions.ts`. Reference: quickstart.md §Step 5.
- [x] T035 [US6] Implement `grantRole()`, `revokeRole()`, `renounceRole()` in `packages/adapter-evm-core/src/access-control/service.ts`. Validate addresses and role IDs. Delegate to `executeTransaction`. Reference: contracts/access-control-service.ts §Roles.

**Checkpoint**: US4+US5+US6 complete — all P2 write operations functional. Tests pass.

---

## Phase 9: User Story 7 — Query Access Control History (Priority: P3)

**Goal**: Query historical access control events from the indexer with filtering and pagination.

**Independent Test**: Query history with various filters (role, account, event type, time range) and verify paginated results.

### Tests (TDD)

- [x] T036 [P] [US7] Write indexer client history tests in `packages/adapter-evm-core/test/access-control/indexer-client.test.ts` (add history suite). Cover: `queryHistory` with filter by role/account/eventType/time range, pagination (first/offset), reverse chronological order, event type mapping (13 EVM events → HistoryChangeType per research.md §R6). Reference: contracts/indexer-queries.graphql §QueryAccessControlEvents.
- [x] T037 [P] [US7] Write service history tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add history suite). Cover: `getHistory()` delegates to indexer, empty result when indexer unavailable (FR-017), filter validation. Reference: spec.md §US7 scenarios 1–3.

### Implementation

- [x] T038 [US7] Implement `queryHistory(contractAddress, options)` with event type mapping in `packages/adapter-evm-core/src/access-control/indexer-client.ts`. Map all 13 EVM event types to HistoryChangeType (use UNKNOWN for 3 types until PR-2). Support filters: role, account, eventType, time range, pagination. Reference: contracts/indexer-queries.graphql §QueryAccessControlEvents, research.md §R6 mapping table.
- [x] T039 [US7] Implement `getHistory()` in `packages/adapter-evm-core/src/access-control/service.ts`. Validate inputs, check indexer availability, delegate to indexer client. Return empty PaginatedHistoryResult when indexer unavailable. Reference: contracts/access-control-service.ts §History.

**Checkpoint**: US7 complete. Historical event queries with filtering and pagination work. Tests pass.

---

## Phase 10: User Story 8 — Export Access Control Snapshot (Priority: P3)

**Goal**: Export a point-in-time snapshot of the contract's access control state.

**Independent Test**: Export snapshot and verify it contains roles and ownership matching the AccessSnapshot schema.

### Tests (TDD)

- [ ] T040 [P] [US8] Write service snapshot tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add snapshot suite). Cover: `exportSnapshot()` returns roles + optional ownership, omits ownership when contract not Ownable, snapshot validation, no adminInfo in AccessSnapshot (known limitation). Reference: spec.md §US8 scenarios 1–3, data-model.md §8.

### Implementation

- [ ] T041 [US8] Implement `exportSnapshot()` in `packages/adapter-evm-core/src/access-control/service.ts`. Combine `getCurrentRoles()` + `getOwnership()` (try/catch — omit if not Ownable). Validate snapshot structure. Reference: contracts/access-control-service.ts §History & Snapshots.

**Checkpoint**: US8 complete. Snapshot export works with validation. Tests pass.

---

## Phase 11: User Story 9 — Discover Role IDs via Indexer (Priority: P3)

**Goal**: Discover role IDs from the indexer's historical events when not provided at registration.

**Independent Test**: Register without role IDs, trigger discovery, verify discovered role IDs match indexed events.

### Tests (TDD)

- [ ] T042 [P] [US9] Write indexer client discovery tests in `packages/adapter-evm-core/test/access-control/indexer-client.test.ts` (add discovery suite). Cover: `discoverRoleIds` returns unique role IDs from events, empty result when no events. Reference: contracts/indexer-queries.graphql §DiscoverRoles.
- [ ] T043 [P] [US9] Write service discovery tests in `packages/adapter-evm-core/test/access-control/service.test.ts` (add discovery suite). Cover: `discoverKnownRoleIds()` returns discovered roles, caches results, returns empty when indexer unavailable, returns knownRoleIds when explicitly provided (precedence), single-attempt flag prevents retries. Reference: spec.md §US9 scenarios 1–2.

### Implementation

- [ ] T044 [US9] Implement `discoverRoleIds(contractAddress)` in `packages/adapter-evm-core/src/access-control/indexer-client.ts`. Query unique role IDs from historical events. Reference: contracts/indexer-queries.graphql §DiscoverRoles.
- [ ] T045 [US9] Implement `discoverKnownRoleIds()` and `dispose()` in `packages/adapter-evm-core/src/access-control/service.ts`. Cache discovered roles, respect knownRoleIds precedence, mark roleDiscoveryAttempted to prevent retries. `dispose()` clears context Map and indexer resources. Reference: contracts/access-control-service.ts §Role Discovery + §Lifecycle.

**Checkpoint**: All 9 user stories complete. Full service implementation done. All tests pass.

---

## Phase 12: Integration

**Purpose**: Wire the module into the adapter packages and configure network endpoints.

- [ ] T046 [P] Create module exports in `packages/adapter-evm-core/src/access-control/index.ts`. Export: `createEvmAccessControlService`, `EvmAccessControlService`, `EvmTransactionExecutor`, validation functions, feature-detection functions, constants. Mirror Stellar module's export structure.
- [ ] T047 [P] Update `packages/adapter-evm-core/src/index.ts` to re-export the `access-control` module.
- [ ] T048 [P] Add indexer URLs for all EVM mainnet networks in `packages/adapter-evm/src/networks/mainnet.ts`. Add `accessControlIndexerUrl` to each network config object. **URL source**: Obtain endpoints from the `access-control-indexers` repo's deployment configuration or infrastructure documentation. Follow the URL pattern established by existing deployed indexers. Reference: plan.md §Project Structure, research.md §R7.
- [ ] T049 [P] Add indexer URLs for all EVM testnet networks in `packages/adapter-evm/src/networks/testnet.ts`. Same pattern and URL source as T048.
- [ ] T050 Implement `getAccessControlService()` with lazy initialization in `packages/adapter-evm/src/adapter.ts`. Add private `accessControlService: EvmAccessControlService | null` field. Create service on first call with `executeTransaction` callback wrapping `signAndBroadcast`. Reference: quickstart.md §Step 9, research.md §R9, NFR-004.
- [ ] T051a Write integration test in `packages/adapter-evm/test/access-control-integration.test.ts` (or co-located with adapter tests). Test the full flow: `EvmAdapter.getAccessControlService()` → `registerContract()` → `getCapabilities()` → `getOwnership()` → `transferOwnership()` with mocked RPC and indexer. Verify lazy initialization (NFR-004): first call creates service, second call returns same instance. Reference: SC-008 (comprehensive test coverage).
- [ ] T051b Verify build: run `pnpm --filter @openzeppelin/ui-builder-adapter-evm-core build` and `pnpm --filter @openzeppelin/ui-builder-adapter-evm build` to ensure no type errors or build failures.

**Checkpoint**: Module fully integrated into adapter packages. Builds pass.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, documentation, changesets, and validation

- [ ] T052 [P] Run full test suite: `pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test` and verify all access-control tests pass.
- [ ] T053 [P] Create changeset for `packages/adapter-evm-core` (minor — new feature: access control module).
- [ ] T054 [P] Create changeset for `packages/adapter-evm` (minor — new feature: getAccessControlService integration + network indexer URLs).
- [ ] T055 Run quickstart.md validation — verify the implementation matches the step-by-step guide and all referenced files exist. **Also validate performance criteria**: SC-002 (capability detection <3s) and SC-004 (indexer queries <2s for 50 events) as manual smoke tests or lightweight benchmarks.
- [ ] T056 Code review: verify all TODO comments for PR-1/PR-2/PR-3 workarounds are present and clearly describe what to change once types are updated.
- [ ] T057 API parity verification (SC-001): Compare the EVM service's exported public API against the Stellar adapter's `packages/adapter-stellar/src/access-control/index.ts` exports. Verify all 13 unified `AccessControlService` methods are implemented with equivalent behavior. Document any intentional EVM-specific extensions not present in Stellar. Reference: spec.md §FR-001, §FR-025.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Pre-Requisite (Phase 0)**: No dependencies — start immediately (runs in parallel with Phase 1+). Must complete before workaround removal in Phase 12.
- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — feature detection + registration
- **US2 (Phase 4)**: Depends on Foundational — can start in parallel with US1 (different files)
- **US3 (Phase 5)**: Depends on Foundational — can start in parallel with US1/US2 (different files), but indexer client from US2 is reused
- **US4 (Phase 6)**: Depends on Foundational — can start in parallel with US1–3 (actions.ts is independent). Test tasks [P] can run in parallel with US5/US6 test tasks.
- **US5 (Phase 7)**: Depends on US4 implementation (shared actions.ts file). Test tasks [P] can run in parallel with US4/US6 test tasks.
- **US6 (Phase 8)**: Depends on US5 implementation (shared actions.ts file). Test tasks [P] can run in parallel with US4/US5 test tasks.
- **US7 (Phase 9)**: Depends on US3 (indexer client queryHistory)
- **US8 (Phase 10)**: Depends on US2 + US3 (getOwnership + getCurrentRoles)
- **US9 (Phase 11)**: Depends on US3 (indexer client discoverRoleIds)
- **Integration (Phase 12)**: Depends on ALL user stories (Phase 3–11) + Phase 0 for workaround removal
- **Polish (Phase 13)**: Depends on Integration (Phase 12)

### User Story Dependencies

| Story | Depends On | Shared Files |
|-------|-----------|--------------|
| US1 (P1) | Foundational only | feature-detection.ts, service.ts |
| US2 (P1) | Foundational only | onchain-reader.ts, indexer-client.ts, service.ts |
| US3 (P1) | Foundational only | onchain-reader.ts, indexer-client.ts, service.ts |
| US4 (P2) | Foundational only | actions.ts, service.ts |
| US5 (P2) | US4 (shared actions.ts) | actions.ts, service.ts |
| US6 (P2) | US5 (shared actions.ts) | actions.ts, service.ts |
| US7 (P3) | US3 (indexer client) | indexer-client.ts, service.ts |
| US8 (P3) | US2 + US3 (read methods) | service.ts |
| US9 (P3) | US3 (indexer client) | indexer-client.ts, service.ts |

### Within Each User Story (TDD Order)

1. Write tests → verify they FAIL
2. Implement lower-level modules (reader/client/actions)
3. Implement service methods
4. Verify tests PASS
5. Story complete

### Parallel Opportunities

```
Phase 0 (Pre-Req):   T000a ∥ T000b ∥ T000c  →  T000d  →  T000e
                      (runs in parallel with Phase 1+; must complete before Phase 12 workaround removal)

Phase 1 (Setup):     T002 ∥ T003 ∥ T004 ∥ T005  (all [P], different files)

Phase 2 (Foundation): T006 → T007  (sequential TDD: test → implement)

Phase 3–5 (P1 Stories — can overlap):
  US1: T008 ∥ T009  →  T010 ∥ T011
  US2: T012 ∥ T013 ∥ T014  →  T015 ∥ T016  →  T017
  US3: T018 ∥ T019 ∥ T020  →  T021 ∥ T022  →  T023

Phase 6–8 (P2 Stories — implementation sequential, test-writing parallelizable):
  Test writing:  T024 ∥ T025 ∥ T028 ∥ T029 ∥ T032 ∥ T033  (all write to separate test files)
  US4 impl:  T026  →  T027
  US5 impl:  T030  →  T031  (after US4 impl)
  US6 impl:  T034  →  T035  (after US5 impl)

Phase 9–11 (P3 Stories — can overlap):
  US7: T036 ∥ T037  →  T038  →  T039
  US8: T040  →  T041
  US9: T042 ∥ T043  →  T044  →  T045

Phase 12 (Integration):
  T046 ∥ T047 ∥ T048 ∥ T049  →  T050  →  T051a  →  T051b

Phase 13 (Polish):
  T052 ∥ T053 ∥ T054  →  T055  →  T056  →  T057
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (validation) — **CRITICAL**
3. Complete Phase 3: US1 (Register + Detect)
4. Complete Phase 4: US2 (Ownership + Admin reads)
5. Complete Phase 5: US3 (Role reads)
6. **STOP and VALIDATE**: All read operations work end-to-end via service
7. Can demo the Role Manager dashboard reading EVM contract state

### Incremental Delivery

1. **Setup + Foundational** → Validation ready
2. **US1+US2+US3** → Read-only MVP — Role Manager can display EVM contract state
3. **US4+US5+US6** → Write operations — Role Manager can manage EVM contracts
4. **US7+US8+US9** → History, snapshots, discovery — full feature parity
5. **Integration + Polish** → Production-ready, merged to adapter packages

### Key References During Implementation

| Module | Stellar Reference (read-only) |
|--------|------------------------------|
| validation.ts | `packages/adapter-stellar/src/access-control/validation.ts` |
| feature-detection.ts | `packages/adapter-stellar/src/access-control/feature-detection.ts` |
| onchain-reader.ts | `packages/adapter-stellar/src/access-control/onchain-reader.ts` |
| indexer-client.ts | `packages/adapter-stellar/src/access-control/indexer-client.ts` |
| actions.ts | `packages/adapter-stellar/src/access-control/actions.ts` |
| service.ts | `packages/adapter-stellar/src/access-control/service.ts` |
| adapter.ts | `packages/adapter-stellar/src/adapter.ts` |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- TDD is mandatory: write failing tests first for every module
- Reference the Stellar adapter as the structural template but implement EVM-specific logic
- All `// TODO` comments for PR-1/PR-2/PR-3 workarounds must be present and descriptive
- Commit after each completed story (conventional commit: `feat(adapter-evm-core): add US1 — registration and capability detection`)
- Service.ts grows incrementally: each story adds methods to the same file

## Cross-Cutting Concerns (apply throughout implementation)

- **Logging (NFR-001)**: All service methods must use `logger` from `@openzeppelin/ui-utils`: `logger.info` for operation start/completion, `logger.debug` for state details, `logger.warn` for graceful degradation, `logger.error` for failures. Service test suites should verify key logging calls via mock logger.
- **Concurrency (NFR-002)**: Service is single-consumer per instance. Concurrent reads for different contracts are safe; concurrent writes to the same contract are last-write-wins by design. No concurrency guard is required. Add a comment in `service.ts` documenting this model.
- **Indexer reorg handling**: Chain reorgs are the indexer's responsibility. Add a JSDoc note in `indexer-client.ts`: "Reorg handling is the indexer's responsibility; this client treats responses as best-effort historical data."
- **`grantedLedger` field naming**: The unified `EnrichedRoleAssignment` type uses `grantedLedger` (Stellar-originated name) for what is actually an EVM block number. Add a JSDoc mapping note where this field is populated in `service.ts`.
- **US4/5/6 test parallelism**: While implementation tasks for US4→US5→US6 are sequential (shared `actions.ts`), the test-writing tasks (T024, T028, T032) write to separate test files and CAN be parallelized.
