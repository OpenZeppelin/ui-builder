# Feature Specification: EVM Adapter Access Control Module

**Feature Branch**: `011-evm-access-control`  
**Created**: 2026-02-09  
**Status**: Draft  
**Input**: User description: "EVM adapter Access Control module. Follow exact same structure as in the Stellar adapter. The goal is to have a 1:1 parity in functionality, because it will be used in the Role Manager app through unified API. Check access-control-indexers repo in this workspace for the evm and stellar indexer reference."

## Clarifications

### Session 2026-02-09

- Q: How should the EVM adapter handle the `expired` ownership/admin state, given EVM Ownable2Step and AccessControlDefaultAdminRules have no expiration mechanism? → A: Never return `expired` for EVM. It is a Stellar-only state. EVM pending transfers remain `pending` until accepted, overwritten, or cancelled.
- Q: Should the EVM module support admin delay change operations (`changeDefaultAdminDelay`, `rollbackDefaultAdminDelay`) beyond admin transfer? → A: Full support — include both read (history events) and write (assemble transactions) for delay change operations.
- Q: Which EVM networks should have indexer support at launch? → A: All EVM networks. The indexers are identical across networks — only network config updates (adding indexer endpoints) are needed, no functional changes per network. The access control module implementation lives in the EVM core package.
- Q: How does `addKnownRoleIds` merge with existing known and discovered role IDs? → A: Union with deduplication, matching Stellar adapter behavior. Known role IDs from `registerContract()` and `addKnownRoleIds()` are merged into a single deduplicated array. `getCurrentRoles()` uses the union of known + discovered IDs.
- Q: What is the `expirationBlock` field for EVM pending admin transfers? → A: For EVM `AccessControlDefaultAdminRules`, the `expirationBlock` field in `PendingAdminTransfer` stores the `acceptSchedule` value — a UNIX timestamp in seconds (not a block number) indicating the earliest time the transfer can be accepted. This is a semantic divergence from Stellar where `expirationBlock` is an actual ledger number deadline. The field name comes from the unified type and cannot be changed without a types update.
- Q: Should the EVM adapter code use `undefined` or `0` for `expirationBlock` on Ownable2Step transfers (no expiration)? → A: Write code targeting `undefined` (anticipating PR-1). If PR-1 is not merged before implementation starts, use `0` as a temporary sentinel with a `// TODO: replace with undefined after PR-1 is merged` comment. Tests should assert against the target value (`undefined`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register an EVM Contract and Detect Access Control Capabilities (Priority: P1)

A developer or application (such as the Role Manager) registers an EVM contract address with its ABI and optionally provides known role identifiers. The system inspects the contract ABI to detect which access control patterns are supported — Ownable, Ownable2Step, AccessControl, AccessControlDefaultAdminRules, and whether roles are enumerable.

**Why this priority**: Capability detection is the foundational step that all other access control operations depend on. Without knowing what a contract supports, no subsequent queries or transactions can be performed correctly.

**Independent Test**: Can be fully tested by registering a known EVM contract (e.g., an OpenZeppelin AccessControl contract deployed on a testnet) and verifying the returned capability flags match the contract's actual interfaces.

**Acceptance Scenarios**:

1. **Given** a contract that implements only Ownable, **When** the user registers it with its ABI, **Then** capabilities report `hasOwnable: true` and all other flags as `false`.
2. **Given** a contract that implements Ownable2Step and AccessControl, **When** the user registers it, **Then** capabilities report `hasOwnable: true`, `hasTwoStepOwnable: true`, `hasAccessControl: true`.
3. **Given** a contract that implements AccessControlDefaultAdminRules, **When** the user registers it, **Then** capabilities report `hasAccessControl: true`, `hasTwoStepAdmin: true`.
4. **Given** an invalid contract address, **When** the user attempts to register it, **Then** the system returns a clear validation error.
5. **Given** a registered contract, **When** the user provides known role IDs, **Then** those role IDs are stored and used for subsequent role queries.

---

### User Story 2 - View Current Ownership and Admin State (Priority: P1)

A user wants to see the current ownership state of an EVM contract — who the owner is, whether there is a pending ownership transfer (Ownable2Step), and the current admin state (for AccessControlDefaultAdminRules contracts).

**Why this priority**: Viewing ownership and admin state is the primary read operation that users perform before making any governance decisions. It directly enables the Role Manager dashboard.

**Independent Test**: Can be fully tested by querying ownership state on a deployed Ownable2Step contract and verifying owner address, pending transfer details, and state classification.

**Acceptance Scenarios**:

1. **Given** an Ownable contract with an active owner, **When** the user queries ownership, **Then** the system returns the owner address and state `owned`.
2. **Given** an Ownable2Step contract with a pending transfer, **When** the user queries ownership, **Then** the system returns state `pending` with the pending owner address and the block at which the transfer was initiated.
3. **Given** an Ownable contract where ownership was renounced (owner is zero address), **When** the user queries ownership, **Then** the system returns state `renounced`.
4. **Given** an AccessControlDefaultAdminRules contract with a scheduled admin transfer, **When** the user queries admin info, **Then** the system returns state `pending` with the new admin address and the accept schedule timestamp (UNIX seconds, stored in `expirationBlock` field — see Clarifications).
5. **Given** a contract that does not support Ownable, **When** the user queries ownership, **Then** the system returns a clear indication that ownership is not supported.
6. **Given** a contract that implements both Ownable2Step and AccessControlDefaultAdminRules, **When** the user queries both ownership and admin info, **Then** the system returns independent state objects for each — ownership state and admin state are not conflated.

---

### User Story 3 - View Current Role Assignments (Priority: P1)

A user wants to see all current role assignments on an EVM AccessControl contract — which accounts hold which roles, and optionally when roles were granted.

**Why this priority**: Role visibility is a core requirement for the Role Manager dashboard and auditing use cases. Without role listing, users cannot manage what they cannot see.

**Independent Test**: Can be fully tested by querying roles on a contract with known role assignments and verifying the returned list matches on-chain state.

**Acceptance Scenarios**:

1. **Given** an AccessControl contract with multiple role assignments, **When** the user queries current roles, **Then** the system returns all role-account pairs currently active.
2. **Given** an AccessControl contract with role enumeration support, **When** the user queries roles, **Then** the system can enumerate all members of each role.
3. **Given** known role IDs are provided at registration, **When** the user queries current roles, **Then** the system checks membership for each known role.
4. **Given** the indexer is available, **When** the user requests enriched role data, **Then** the system returns role assignments with grant timestamps and granting account.
5. **Given** the indexer is unavailable, **When** the user queries roles, **Then** the system falls back to on-chain queries only and returns role assignments without historical enrichment.
6. **Given** on-chain role reads succeed but the indexer fails mid-enrichment, **When** the user requests enriched roles, **Then** the system returns the on-chain data without enrichment and logs a warning (partial failure does not propagate as an error).

---

### User Story 4 - Transfer Ownership (Two-Step) (Priority: P2)

A user wants to initiate an ownership transfer on an Ownable2Step contract, and a prospective new owner wants to accept it.

**Why this priority**: Ownership transfer is a critical governance operation but depends on the read capabilities from P1 stories being in place first.

**Independent Test**: Can be fully tested by initiating a transfer on a testnet contract, verifying the pending state, and then accepting it from the new owner account.

**Acceptance Scenarios**:

1. **Given** an Ownable2Step contract, **When** the current owner initiates a transfer to a new address, **Then** the system assembles and delegates execution of the `transferOwnership` transaction.
2. **Given** a pending ownership transfer, **When** the pending owner accepts it, **Then** the system assembles and delegates execution of the `acceptOwnership` transaction.
3. **Given** a simple Ownable contract (no two-step), **When** the owner transfers ownership, **Then** the system assembles and delegates execution of the single-step `transferOwnership` transaction.
4. **Given** a non-owner account, **When** they attempt to transfer ownership, **Then** the transaction fails with an appropriate error from the contract.
5. **Given** an Ownable contract, **When** the current owner renounces ownership, **Then** the system assembles and delegates execution of the `renounceOwnership` transaction, and subsequent ownership queries return state `renounced`.

---

### User Story 5 - Transfer Default Admin Role (Two-Step) (Priority: P2)

A user wants to initiate a default admin transfer on an AccessControlDefaultAdminRules contract, with a scheduled acceptance window.

**Why this priority**: Admin transfer is the EVM-specific equivalent of the Stellar admin two-step flow, essential for parity.

**Independent Test**: Can be fully tested by scheduling a default admin transfer and verifying the pending state and acceptance behavior.

**Acceptance Scenarios**:

1. **Given** an AccessControlDefaultAdminRules contract, **When** the current default admin schedules a transfer, **Then** the system assembles the `beginDefaultAdminTransfer` transaction with the new admin and appropriate delay.
2. **Given** a scheduled admin transfer past its accept schedule, **When** the pending admin accepts, **Then** the system assembles the `acceptDefaultAdminTransfer` transaction.
3. **Given** a scheduled admin transfer, **When** the current admin cancels it, **Then** the system assembles the `cancelDefaultAdminTransfer` transaction.
4. **Given** an AccessControlDefaultAdminRules contract, **When** the default admin changes the transfer delay, **Then** the system assembles the `changeDefaultAdminDelay` transaction with the new delay value.
5. **Given** a scheduled delay change, **When** the default admin rolls it back, **Then** the system assembles the `rollbackDefaultAdminDelay` transaction.
6. **Given** a contract that does NOT have `hasTwoStepAdmin` capability, **When** a user calls any admin operation (`cancelAdminTransfer`, `changeAdminDelay`, etc.), **Then** the system throws a `ConfigurationInvalid` error before attempting any on-chain interaction.

---

### User Story 6 - Grant and Revoke Roles (Priority: P2)

A user with the appropriate admin role wants to grant or revoke roles on an AccessControl contract.

**Why this priority**: Role management is a primary use case for the Role Manager app but requires the read-side (P1) to be complete.

**Independent Test**: Can be fully tested by granting a role to an account, verifying membership, then revoking it and verifying removal.

**Acceptance Scenarios**:

1. **Given** an AccessControl contract and a user with the admin role for a given role, **When** they grant the role to a new account, **Then** the system assembles and delegates execution of the `grantRole` transaction.
2. **Given** a role member, **When** an admin revokes their role, **Then** the system assembles and delegates execution of the `revokeRole` transaction.
3. **Given** a role member, **When** they renounce their own role, **Then** the system assembles and delegates execution of the `renounceRole` transaction. Note: `renounceRole(role, account)` requires that the caller address equals the `account` parameter — this is enforced on-chain by the contract.
4. **Given** invalid inputs (bad address or role), **When** the user attempts to grant/revoke, **Then** the system returns validation errors before submitting the transaction.
5. **Given** a contract with no known role IDs, no indexer available, and no enumeration support, **When** the user queries current roles, **Then** the system returns an empty array (no roles can be determined without input data).

---

### User Story 7 - Query Access Control History (Priority: P3)

A user wants to view the historical record of access control events — role grants, revocations, ownership transfers, admin changes, and admin delay changes — with filtering and pagination.

**Why this priority**: History is important for auditing and governance transparency but is not required for the core management workflows.

**Independent Test**: Can be fully tested by querying history on a contract with known events and verifying the returned events match the on-chain event log.

**Acceptance Scenarios**:

1. **Given** a contract with historical access control events, **When** the user queries history, **Then** the system returns paginated events in reverse chronological order.
2. **Given** filter options (by role, by account, by event type, by time range), **When** the user queries history with filters, **Then** only matching events are returned.
3. **Given** the indexer is unavailable, **When** the user queries history, **Then** the system indicates that historical data is not available.

---

### User Story 8 - Export Access Control Snapshot (Priority: P3)

A user wants to export a point-in-time snapshot of the entire access control state of a contract for audit or backup purposes.

**Why this priority**: Snapshot export is a convenience feature for compliance and auditing that builds on top of the read capabilities.

**Independent Test**: Can be fully tested by exporting a snapshot and validating its structure contains all current roles, ownership, and admin information.

**Acceptance Scenarios**:

1. **Given** a registered contract with roles and ownership, **When** the user exports a snapshot, **Then** the system returns a complete access control snapshot including `roles` (role assignments) and optionally `ownership` (if Ownable is supported). Note: the unified `AccessSnapshot` type does not include `adminInfo` — this is a known limitation matching the Stellar adapter's behavior. Admin info is accessible separately via `getAdminInfo()`.
2. **Given** an exported snapshot, **When** the system validates it, **Then** the snapshot conforms to the shared `AccessSnapshot` schema.
3. **Given** a contract that does not support Ownable, **When** a snapshot is exported, **Then** the `ownership` field is omitted and the snapshot still validates successfully.

---

### User Story 9 - Discover Role IDs via Indexer (Priority: P3)

A user registers a contract without knowing all the role identifiers. The system should discover them by querying the indexer for historical role events.

**Why this priority**: Role discovery improves usability but is optional since users can provide known role IDs manually.

**Independent Test**: Can be fully tested by registering a contract without role IDs and verifying the system discovers them from indexed events.

**Acceptance Scenarios**:

1. **Given** a contract registered without known role IDs and the indexer is available, **When** the user triggers role discovery, **Then** the system returns all role IDs seen in historical events.
2. **Given** the indexer is unavailable, **When** the user triggers role discovery, **Then** the system returns an empty set and does not attempt repeated discovery.

---

### Edge Cases

- What happens when an EVM contract implements both Ownable2Step and AccessControlDefaultAdminRules simultaneously? The system must detect and expose both capabilities independently.
- How does the system handle a contract whose ABI is incomplete or does not match the deployed bytecode? Capability detection relies on ABI analysis and should report only what the ABI declares.
- What happens when the indexer returns stale data that contradicts on-chain state (e.g., a role was revoked on-chain but the indexer hasn't caught up)? On-chain data should be treated as the source of truth for current state; the indexer is authoritative only for historical events.
- How does the system handle the `DEFAULT_ADMIN_ROLE` (bytes32 zero)? It must be recognized as the default admin role and handled appropriately in queries and displays.
- What happens when querying roles on a contract that supports AccessControl but not AccessControlEnumerable? The system must rely on known role IDs and indexer data rather than on-chain enumeration.
- How does the system handle chain reorganizations that invalidate indexed events? The indexer is responsible for reorg handling; the adapter treats indexer data as best-effort.
- How does the system handle proxy contracts where the ABI may not match the underlying implementation? ABI-based detection is the defined boundary for v1. The system reports only what the provided ABI declares — proxy-related ABI mismatches are explicitly out of scope.
- How does the system handle admin renounce for AccessControlDefaultAdminRules? There is no standalone `renounceDefaultAdmin()` function in OpenZeppelin v5. Admin renounce is achieved through the existing two-step transfer to address(0): `beginDefaultAdminTransfer(address(0))` followed by `acceptDefaultAdminTransfer()` after the delay. The `renounced` state is detected when `defaultAdmin()` returns the zero address.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement the same `AccessControlService` interface used by the Stellar adapter, ensuring 1:1 API parity for the Role Manager unified API.
- **FR-002**: System MUST detect access control capabilities by analyzing the contract ABI for Ownable, Ownable2Step, AccessControl, AccessControlDefaultAdminRules, and AccessControlEnumerable patterns.
- **FR-003**: System MUST register EVM contracts with their ABI and optional known role identifiers, validating all inputs (address format, role format).
- **FR-004**: System MUST read current ownership state from on-chain data, returning owner address and state classification (owned, pending, renounced).
- **FR-005**: System MUST read pending ownership transfers for Ownable2Step contracts, including the pending owner address and the block at which the transfer was initiated.
- **FR-006**: System MUST read current admin state for AccessControlDefaultAdminRules contracts, including pending admin transfers with accept schedule and delay information.
- **FR-007**: System MUST read current role assignments by checking membership for known role IDs via on-chain queries.
- **FR-008**: System MUST support enriched role queries that augment on-chain data with grant timestamps and granting accounts from the indexer.
- **FR-009**: System MUST assemble transaction data and delegate execution for ownership operations: `transferOwnership`, `acceptOwnership` (Ownable2Step), returning an `OperationResult`.
- **FR-009a**: System MUST assemble transaction data and delegate execution for `renounceOwnership` (Ownable), returning an `OperationResult`. This is an EVM-specific extension not present in the Stellar adapter or the unified `AccessControlService` interface.
- **FR-010**: System MUST assemble transaction data and delegate execution for admin operations: `beginDefaultAdminTransfer`, `acceptDefaultAdminTransfer`, `cancelDefaultAdminTransfer` (AccessControlDefaultAdminRules), returning an `OperationResult`.
- **FR-010a**: System MUST assemble transaction data and delegate execution for admin delay change operations: `changeDefaultAdminDelay`, `rollbackDefaultAdminDelay` (AccessControlDefaultAdminRules), returning an `OperationResult`.
- **FR-011**: System MUST assemble transaction data and delegate execution for role operations: `grantRole`, `revokeRole`, `renounceRole`, returning an `OperationResult`. Note: `renounceRole(role, account)` requires that the caller is the account renouncing — this is enforced on-chain by the contract. `renounceRole` is an EVM-specific extension not present in the Stellar adapter.
- **FR-012**: System MUST query historical access control events from the EVM indexer with support for filtering (by role, account, event type, time range) and pagination.
- **FR-013**: System MUST export a complete access control snapshot conforming to the shared `AccessSnapshot` type.
- **FR-014**: System MUST discover role IDs from the indexer when known role IDs are not provided, with caching and single-attempt fallback when the indexer is unavailable.
- **FR-015**: System MUST validate EVM addresses (hex format with checksum support) for both contract and account addresses.
- **FR-016**: System MUST validate role IDs as bytes32 hex strings.
- **FR-017**: System MUST gracefully degrade when the indexer is unavailable, with the following specific behaviors:
  - `getCapabilities()`: sets `supportsHistory: false` in the returned capabilities.
  - `getOwnership()`: returns on-chain data only (no indexer enrichment for pending transfer initiation details).
  - `getAdminInfo()`: returns basic admin info with state `active` when pending transfer status cannot be determined.
  - `getCurrentRoles()`: returns roles from on-chain enumeration or known role IDs only (no indexer fallback for member discovery).
  - `getCurrentRolesEnriched()`: falls back to `getCurrentRoles()` result without grant metadata.
  - `getHistory()`: returns empty `PaginatedHistoryResult` (`{ items: [], pageInfo: { hasNextPage: false } }`).
  - `discoverKnownRoleIds()`: returns empty array, marks discovery as attempted to prevent retries.
- **FR-018**: System MUST be exposed via the `EvmAdapter.getAccessControlService()` method, following the same pattern as the Stellar adapter. The access control module implementation MUST reside in the EVM core package; the adapter-evm package delegates to it.
- **FR-019**: System MUST support the same indexer client configuration precedence as Stellar: user configuration (service constructor override) > runtime override > network default endpoint (`networkConfig.accessControlIndexerUrl`, falling back to `networkConfig.indexerUri` for backward compatibility). All existing EVM networks MUST have indexer endpoints configured — the indexer implementation is identical across networks, so only network config entries need updating. Both EVM and Stellar adapters use the shared `accessControlIndexerUrl` field on `BaseNetworkConfig`.
- **FR-020**: System MUST handle the EVM-specific `DEFAULT_ADMIN_ROLE` (bytes32 zero value) correctly in all role queries and operations.
- **FR-021**: System MUST provide a `dispose()` method to clean up resources (indexer connections, caches).
- **FR-022**: System MUST map EVM-specific concepts to the unified types — block numbers instead of ledger sequences, accept schedule timestamps instead of expiration ledgers, bytes32 roles instead of symbol roles.
- **FR-023**: System MUST never return the `expired` state for ownership or admin info. EVM pending transfers do not expire; they remain `pending` until accepted, overwritten by a new transfer, or cancelled.
- **FR-024**: System MUST use the same error classes as the Stellar adapter: `ConfigurationInvalid` (from `@openzeppelin/ui-types`) for validation errors (invalid address, unregistered contract, invalid role format, unsupported capability), and `OperationFailed` (from `@openzeppelin/ui-types`) for execution failures (snapshot validation). Guard methods that require a specific capability (e.g., `cancelAdminTransfer` without `hasTwoStepAdmin`) MUST throw `ConfigurationInvalid` with a descriptive message before assembling any transaction.
- **FR-025**: System MUST implement all methods from the unified `AccessControlService` interface. The interface methods are:
  - **Core (always implemented)**: `registerContract`, `addKnownRoleIds`, `getCapabilities`, `getOwnership`, `transferOwnership`, `acceptOwnership`, `getCurrentRoles`, `getCurrentRolesEnriched`, `grantRole`, `revokeRole`, `getHistory`, `exportSnapshot`, `discoverKnownRoleIds`, `dispose`
  - **Admin (implemented when AccessControlDefaultAdminRules detected)**: `getAdminInfo`, `transferAdminRole`, `acceptAdminTransfer`
  - **EVM-specific extensions** (additive, not part of the unified interface): `renounceOwnership` (Ownable), `renounceRole` (AccessControl), `cancelAdminTransfer`, `changeAdminDelay`, `rollbackAdminDelay` (AccessControlDefaultAdminRules)
  
  See `contracts/access-control-service.ts` for the complete API contract with method signatures and JSDoc.
- **FR-026**: System MUST NOT auto-include `DEFAULT_ADMIN_ROLE` (bytes32 zero) in known role IDs. `DEFAULT_ADMIN_ROLE` is treated like any other role — consumers must explicitly include it in `knownRoleIds` or rely on indexer discovery. This matches the Stellar adapter's behavior.
- **FR-027**: The network identifier used in indexer GraphQL queries (the `network` filter field) MUST match the `networkConfig.id` value (kebab-case format, e.g., `ethereum-mainnet`). This convention must be consistent across all EVM network configurations.

### Non-Functional Requirements

- **NFR-001**: Service MUST follow the Stellar adapter's logging patterns using `@openzeppelin/ui-utils` logger: `logger.info` for operation start/completion, `logger.debug` for implementation details and state, `logger.warn` for graceful degradation (indexer unavailable, query fallback), `logger.error` for operation failures.
- **NFR-002**: Service is single-consumer per instance. Concurrent reads for different contracts are safe (each operates on independent Map entries). Concurrent writes to the same contract context (e.g., simultaneous `registerContract` calls for the same address) are not guarded — the last write wins. This matches the Stellar adapter's concurrency model.
- **NFR-003**: Timeout and retry behavior for on-chain RPC calls and indexer GraphQL requests is inherited from viem defaults and `fetch` defaults respectively. No custom timeout or retry logic is required for v1. The Stellar adapter follows the same approach.
- **NFR-004**: Service initialization in `EvmAdapter` MUST use lazy initialization — the `EvmAccessControlService` is created on the first call to `getAccessControlService()`, not in the adapter constructor. This matches the Stellar adapter's pattern and avoids unnecessary initialization when access control is not used.

### Key Entities

- **Contract Context**: Represents a registered EVM contract with its ABI, detected capabilities, known role IDs, and discovered role IDs. Identified by contract address.
- **Ownership Info**: Current ownership state of a contract — owner address, state (owned/pending/renounced — `expired` is never used for EVM), and optional pending transfer details (pending owner, initiation block). A pending transfer persists until accepted or overwritten by a new transfer.
- **Admin Info**: Current default admin state — admin address, state (active/pending/renounced — `expired` is never used for EVM), and optional pending transfer details (new admin, accept schedule, delay). A pending admin transfer persists until accepted or cancelled.
- **Role Assignment**: A mapping of role ID to account address, representing a currently active role membership. Enriched variant includes grant timestamp and granting account.
- **Access Control Event**: A historical record of an access control action — role grant/revoke, ownership transfer, admin change, admin delay change — with block number, timestamp, transaction hash, and event-specific fields.
- **Access Control Capabilities**: A flags object indicating which access control patterns a contract supports, along with notes about verification status.

## Pre-Requisite: Unified Types Update (`openzeppelin-ui` repo)

The following changes to `@openzeppelin/ui-types` in the `openzeppelin-ui` repository are required before or in parallel with the EVM adapter implementation. These ensure the unified API properly accommodates EVM semantics.

### PR-1: Make `expirationBlock` optional in pending transfer types

**File**: `packages/types/src/adapters/access-control.ts`

EVM Ownable2Step has no expiration mechanism — pending transfers persist until accepted or overwritten. The current `PendingOwnershipTransfer.expirationBlock` and `PendingAdminTransfer.expirationBlock` fields are required (`number`), forcing EVM to use a sentinel value. Making them optional (`number | undefined`) properly represents chains where expiration does not apply.

- `PendingOwnershipTransfer.expirationBlock` → `expirationBlock?: number`
- `PendingAdminTransfer.expirationBlock` → `expirationBlock?: number`
- Update JSDoc to note: "Required for chains with expiration (e.g., Stellar). Omitted for chains without expiration (e.g., EVM Ownable2Step)."
- Update the `transferOwnership` and `transferAdminRole` method signatures: `expirationBlock` parameter should also be `number | undefined` (optional for EVM, required for Stellar)
- Verify the Stellar adapter still compiles and passes tests after the change

### PR-2: Add EVM-specific `HistoryChangeType` variants

**File**: `packages/types/src/adapters/access-control.ts`

The EVM indexer tracks events not covered by the current `HistoryChangeType` union. Without these, EVM events fall through to `UNKNOWN`, losing semantic meaning in the Role Manager history view.

Add to the `HistoryChangeType` union:
- `'ADMIN_TRANSFER_CANCELED'` — DefaultAdminTransferCanceled (EVM AccessControlDefaultAdminRules)
- `'ADMIN_DELAY_CHANGE_SCHEDULED'` — DefaultAdminDelayChangeScheduled (EVM AccessControlDefaultAdminRules)
- `'ADMIN_DELAY_CHANGE_CANCELED'` — DefaultAdminDelayChangeCanceled (EVM AccessControlDefaultAdminRules)

Update the JSDoc comment block to document each new variant.

**Impact on Role Manager**: The Role Manager uses `Record<HistoryChangeType, RoleChangeAction>` for event type mapping. Adding new union members **will break TypeScript compilation** in the Role Manager until its mapping is updated to include the new variants. This must be coordinated: either the Role Manager mapping is updated in the same PR cycle, or the Role Manager must add a catch-all/default pattern before the types are bumped. Update the `CHANGE_TYPE_TO_ACTION` mapping in `apps/role-manager/src/types/role-changes.ts`.

### PR-3: Add `accessControlIndexerUrl` to `BaseNetworkConfig`

**File**: `packages/types/src/networks/config.ts`

All adapters that use the access control indexer need a feature-specific endpoint per network. Adding `accessControlIndexerUrl` to `BaseNetworkConfig` (rather than individual ecosystem configs) provides a uniform field across all ecosystems.

Add to `BaseNetworkConfig`:
- `accessControlIndexerUrl?: string` — Optional GraphQL endpoint for the access control indexer. Feature-specific field — distinct from the general-purpose `indexerUri` which may serve different purposes per ecosystem (e.g., Midnight chain indexer).

This is additive and non-breaking (optional field).

**Rationale**: The generic `indexerUri` field serves different purposes per ecosystem — Stellar uses it for the access control indexer, while Midnight uses it for its chain indexer. By introducing a feature-specific field on `BaseNetworkConfig`, each adapter explicitly declares its access control indexer URL, avoiding semantic ambiguity. Both EVM and Stellar adapters use `accessControlIndexerUrl` for their access control modules. The Stellar adapter's `indexer-client.ts` prefers `accessControlIndexerUrl` over `indexerUri` (with graceful fallback to `indexerUri` for backward compatibility).

**Stellar adapter migration (PR-3a)**: As part of this change, the Stellar adapter's network configs (`mainnet.ts`, `testnet.ts`) were updated to use `accessControlIndexerUrl` instead of `indexerUri`, and the `indexer-client.ts` resolution logic was updated to prefer `accessControlIndexerUrl ?? indexerUri`. A temporary type augmentation file (`src/types/access-control-indexer-url.d.ts`) bridges the gap until the new types are published. The user config system (`network-services.ts`) continues to use `indexerUri` as its form field name, which is unchanged.

## Assumptions

- The EVM adapter already has the infrastructure for transaction signing and broadcasting via the existing `signAndBroadcast` method, so the access control module only needs to assemble transaction data (calldata), not execute it directly.
- The EVM access control indexer (from the `access-control-indexers` repo) is deployed and available at configured endpoints for all EVM networks. The indexer implementation is identical across networks — no per-network functional changes are needed, only network config updates with indexer endpoints.
- The access control module implementation resides in the EVM core package (`adapter-evm-core`). The `adapter-evm` package exposes it via `EvmAdapter.getAccessControlService()` by delegating to the core.
- The unified `AccessControlService` interface in `@openzeppelin/ui-types` will be updated (see Pre-Requisite section) to accommodate EVM semantics — optional `expirationBlock`, EVM-specific history change types, and indexer URL in network config.
- EVM contracts follow OpenZeppelin's standard AccessControl and Ownable patterns. Non-standard implementations may not be fully detected.
- The `bytes32` role format used by EVM AccessControl (e.g., `keccak256("MINTER_ROLE")`) is the standard role identifier format. The adapter treats these as opaque bytes32 strings and does not attempt to reverse the hash.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All operations available in the Stellar access control module are available in the EVM module with equivalent behavior — the Role Manager app can switch between Stellar and EVM contracts using the same unified API without code changes.
- **SC-002**: Users can register an EVM contract and receive accurate capability detection within 3 seconds.
- **SC-003**: Current ownership, admin, and role state queries return results consistent with on-chain state as of the latest block available from the RPC endpoint. Freshness depends on the RPC node's sync status.
- **SC-004**: Historical event queries return paginated results from the indexer within 2 seconds for typical page sizes (up to 50 events).
- **SC-005**: The module gracefully handles indexer unavailability — all on-chain read operations continue to function, and users receive clear feedback when historical data is unavailable.
- **SC-006**: All EVM-specific address and role validation catches malformed inputs before any on-chain or indexer queries are made.
- **SC-007**: The module's file structure within the EVM core package mirrors the Stellar adapter's structure (service, actions, feature-detection, indexer-client, onchain-reader, validation, index) for maintainability and developer familiarity.
- **SC-008**: The module has comprehensive test coverage matching the Stellar adapter's test suite structure (service tests, detection tests, indexer client tests, on-chain reader tests, validation tests).
