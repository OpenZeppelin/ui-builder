# Tasks: Stellar Adapter Extension — Access Control

## Phase 1 — Setup

- [x] T001 Ensure feature branch is checked out: 005-stellar-adapter-extension
- [x] T002 Verify workspace scripts and tooling: pnpm, vitest, tsup, lint configs
- [x] T003 Add changeset stub for adapter/types/utils (no version bump yet)

## Phase 2 — Foundational (blocking prerequisites)

- [x] T004 Create shared interfaces in packages/types/src/access-control.ts
- [x] T005 Update packages/types/src/adapters/base.ts with getAccessControlService? signature
- [x] T006 Update tooling rule @no-extra-adapter-methods.cjs to allow getAccessControlService
- [x] T007 [P] Add snapshot helpers in packages/utils/src/access/snapshot.ts
- [x] T008 Extend Stellar NetworkConfig for optional indexer endpoints in packages/types/src/networks/config.ts
- [x] T009 [P] Add/verify Stellar network service form/validation for indexer in packages/adapter-stellar/src/configuration/network-services.ts
- [x] T010 Provide per‑network indexer defaults when stable (testnet/mainnet) in packages/adapter-stellar/src/networks/\*.ts

## Phase 3 — US1 (P1): Inspect roles and ownership

- [x] T011 [US1] Implement capability detection in packages/adapter-stellar/src/access-control/feature-detection.ts
- [x] T012 [US1] Implement on-chain ownership/roles reader in packages/adapter-stellar/src/access-control/onchain-reader.ts
- [x] T013 [US1] Implement AccessControlService surface in packages/adapter-stellar/src/access-control/service.ts (getCapabilities/getOwnership/getCurrentRoles)
- [x] T014 [US1] Wire service accessor on adapter and capability flags exposure in packages/adapter-stellar/src/index.ts
- [x] T015 [P] [US1] Unit tests: detection in packages/adapter-stellar/test/access-control/detection.test.ts
- [x] T016 [P] [US1] Unit tests: on-chain reader in packages/adapter-stellar/test/access-control/onchain-reader.test.ts
- [x] T017 [P] [US1] Unit tests: reject non‑OZ access-control contracts (UnsupportedContractFeatures) in packages/adapter-stellar/test/access-control/detection.test.ts

## Phase 4 — US2 (P1): Manage role membership (grant/revoke)

- [x] T018 [US2] Implement action assembly in packages/adapter-stellar/src/access-control/actions.ts (grantRole/revokeRole)
- [x] T019 [US2] Expose grantRole/revokeRole via AccessControlService in packages/adapter-stellar/src/access-control/service.ts
- [x] T020 [P] [US2] Unit tests: grant/revoke roundtrip (mock RPC) in packages/adapter-stellar/tests/access-control/service.spec.ts
- [x] T021 [US2] Wire up transaction execution with wallet context and ExecutionConfig in packages/adapter-stellar/src/access-control/service.ts (grantRole/revokeRole) and unskip roundtrip tests

## Phase 5 — US3 (P2): Transfer ownership

- [x] T022 [US3] Implement transferOwnership action in packages/adapter-stellar/src/access-control/actions.ts
- [x] T023 [US3] Expose transferOwnership via AccessControlService in packages/adapter-stellar/src/access-control/service.ts
- [x] T024 [P] [US3] Unit tests: transfer ownership roundtrip (mock RPC) in packages/adapter-stellar/tests/access-control/service.spec.ts
- [x] T025 [US3] Wire up transaction execution with wallet context and ExecutionConfig in packages/adapter-stellar/src/access-control/service.ts (transferOwnership) and unskip roundtrip tests

## Phase 6 — US4 (P2): Export snapshot

- [x] T026 [US4] Implement exportSnapshot in packages/adapter-stellar/src/access-control/service.ts (use utils snapshot)
- [x] T027 [P] [US4] Unit tests: snapshot parity vs current reads in packages/adapter-stellar/tests/access-control/service.spec.ts

## Phase 7 — US5 (P3): History when available

- [x] T028 [US5] Implement indexer client with config precedence in packages/adapter-stellar/src/access-control/indexer-client.ts
- [x] T029 [US5] Implement getHistory + filtering in packages/adapter-stellar/src/access-control/service.ts
- [ ] T030 [P] [US5] Unit tests: history queries (mock GraphQL) in packages/adapter-stellar/tests/access-control/indexer-client.spec.ts
- [ ] T031 [P] [US5] Unit tests: merge on-chain + indexer, edge cases in packages/adapter-stellar/tests/access-control/merger.spec.ts
- [ ] T032 [P] [US5] Unit tests: no indexer configured/unreachable → supportsHistory=false and graceful fallback in packages/adapter-stellar/tests/access-control/indexer-client.spec.ts

## Final Phase — Polish & Cross-Cutting

- [ ] T033 Add error taxonomy in packages/adapter-stellar/src/access-control/errors.ts (UnsupportedContractFeatures, PermissionDenied, IndexerUnavailable, ConfigurationInvalid, OperationFailed)
- [ ] T034 Ensure address validation uses shared source in all entry points
- [ ] T035 Update README/CHANGELOG fragments (adapter/types/utils) as needed
- [ ] T036 Add changeset entries and finalize versions for publish
- [ ] T037 Add CI connectivity checks for default Stellar indexer endpoints (testnet/mainnet)
- [ ] T038 [P] Add lightweight perf checks for SC‑001 (capabilities/roles load ≤ 3s with mocks) in packages/adapter-stellar/tests/access-control/perf.spec.ts
- [ ] T039 [P] Add lightweight perf checks for SC‑003 (snapshot export ≤ 2s with mocks) in packages/adapter-stellar/tests/access-control/perf.spec.ts

## Dependencies & Order

- Phase 1 → Phase 2 → US1 (P1) → US2 (P1) → US3 (P2) → US4 (P2) → US5 (P3) → Polish
- Critical edges: T004–T006 before T013/T014; T008–T010 before T028; Utils snapshot (T007) before T026
- Transaction execution wiring (T021, T025) depends on action assembly and service stubs being in place

## Parallel Opportunities

- [P] marked tasks are parallelizable:
  - T007 utils snapshot
  - T009 network services validation
  - T015–T017 US1 tests
  - T020 US2 tests (documentation of expected behavior)
  - T024 US3 tests
  - T027 US4 tests
  - T030–T032 US5 tests

## Independent Test Criteria (per story)

- US1: Provide contract ID; get capabilities, ownership, and role membership without indexer
- US2: Perform grant/revoke; re-read roles reflects change
- US3: Transfer ownership; re-read ownership reflects change
- US4: Export snapshot; compare with current reads; parity holds
- US5: With indexer configured, get history; filter by role; without indexer, feature clearly unavailable

## MVP Scope

- MVP = US1 + US2 (P1): Inspect + Manage roles on supported contracts using on-chain first
