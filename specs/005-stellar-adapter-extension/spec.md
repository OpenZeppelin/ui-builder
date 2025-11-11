# Feature Specification: Stellar Adapter Extension — Access Control

**Feature Branch**: `005-stellar-adapter-extension`  
**Created**: 2025-11-11  
**Status**: Draft  
**Input**: User description: "the stellar adapter extension"

**Scope Note**: This extension supports ONLY official OpenZeppelin Stellar Access Control contracts. Non‑conforming or custom access-control modules are treated as unsupported. See [OpenZeppelin Stellar Access Control](https://github.com/OpenZeppelin/stellar-contracts/tree/main/packages/access).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Inspect roles and ownership (Priority: P1)

As a developer/operator, I load a Stellar contract and see a clear summary of what access-control features it supports (e.g., ownership, roles, role enumeration) alongside the current owner and the current membership per role.

**Why this priority**: This enables immediate understanding of contract governance and is the foundation for all other actions.

**Independent Test**: Provide a contract ID; system returns capabilities, current owner (if available), and a role-to-members mapping without requiring any additional setup.

**Acceptance Scenarios**:

1. **Given** a valid Stellar contract ID, **When** I request capabilities, **Then** I see whether ownership and roles are supported and whether history is available.
2. **Given** a contract with roles, **When** I request current roles, **Then** I receive each role with the list of current members.
3. **Given** a contract supporting ownership, **When** I request ownership info, **Then** I see the current owner (or `null` if not set).

---

### User Story 2 - Manage role membership (Priority: P1)

As an authorized operator, I can grant or revoke a role for an account on a supported Stellar contract and see the updated membership reflected after completion.

**Why this priority**: Role management is the core operational task for access control.

**Independent Test**: Execute a grant/revoke action on a test contract and verify that re-reading roles reflects the change.

**Acceptance Scenarios**:

1. **Given** I have permission to manage a role, **When** I grant the role to an account, **Then** I receive a transaction identifier and subsequent reads include the account as a member.
2. **Given** an account currently has a role, **When** I revoke the role, **Then** I receive a transaction identifier and subsequent reads exclude the account from that role.

---

### User Story 3 - Transfer ownership (Priority: P2)

As an owner, I can transfer ownership to a new account and confirm the change by re-reading ownership.

**Why this priority**: Ownership management is crucial but occurs less frequently than role changes.

**Independent Test**: Execute an ownership transfer on a test contract and verify the new owner is reported.

**Acceptance Scenarios**:

1. **Given** I am the owner, **When** I transfer ownership to a valid account, **Then** I receive a transaction identifier and subsequent reads show the new owner.
2. **Given** I am not the owner, **When** I attempt a transfer, **Then** I receive a clear permission error without side effects.

---

### User Story 4 - Export snapshot (Priority: P2)

As an auditor or engineer, I can export the current access-control snapshot (roles, members, ownership) to a portable format for archival or review.

**Why this priority**: Snapshots support audits, change control, and reproducibility.

**Independent Test**: Trigger a snapshot export and verify that it faithfully represents the current reported state.

**Acceptance Scenarios**:

1. **Given** a contract, **When** I export a snapshot, **Then** I receive a structured artifact containing ownership and all role assignments.
2. **Given** a snapshot, **When** I compare it to a fresh read, **Then** the data matches (absent concurrent changes).

---

### User Story 5 - View history when available (Priority: P3)

As a user, when a history source is configured, I can view role-related historical activity (e.g., grants/revokes) and filter by role.

**Why this priority**: Useful for investigations and audits but not required for core operations.

**Independent Test**: Configure a history source, request historical entries, and verify results list relevant changes with ordering and basic metadata.

**Acceptance Scenarios**:

1. **Given** a configured history source, **When** I request history, **Then** I see a time-ordered list of role changes.
2. **Given** filters by role, **When** I apply a role filter, **Then** results include only changes for that role.
3. **Given** no history source, **When** I request history, **Then** I receive a clear indication that the feature is unavailable with no errors.

### Edge Cases

- Contract does not implement recognized access-control or ownership patterns → clearly reported as unsupported for those capabilities.
- History source not configured or unreachable → degrade to current-state only with explicit capability flags.
- Large role membership sets → responses remain paginated or complete within expected performance targets.
- Permission failures on mutations → clear, actionable errors without partial state changes.
- Network/provider misconfiguration → validation failures with guidance to correct configuration.
- Concurrent changes between read and export → snapshot reflects the state at time of export and documents no guarantees about subsequent changes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST detect and surface contract access-control capabilities (ownership, base roles, role enumeration, history availability).
- **FR-002**: The system MUST return current ownership information when supported.
- **FR-003**: The system MUST return current role assignments as a mapping from role identifiers to member addresses.
- **FR-004**: The system MUST support role grant and revoke actions on supported contracts and return an operation identifier.
- **FR-005**: The system MUST support ownership transfer on supported contracts and return an operation identifier.
- **FR-006**: The system MUST export a snapshot of current state (roles and ownership) in a portable, structured format.
- **FR-007**: The system MUST gracefully degrade when no history source is configured, while clearly indicating feature unavailability.
- **FR-008**: The system MUST provide clear, typed error responses for unsupported features, permission failures, and configuration issues.
- **FR-009**: The system MUST allow runtime configuration of optional history sources without requiring UI changes.
- **FR-009a**: The network configuration MAY provide per-network default indexer endpoints (e.g., testnet/mainnet) when stable official endpoints exist; runtime overrides take precedence.
- **FR-010**: The system MUST remain headless (no UI dependencies) and expose a clean, capability-driven API surface.
- **FR-011**: Returned models MUST be chain-agnostic (roles, ownership, snapshot, capabilities) to enable reuse across ecosystems.
- **FR-012**: The system MUST validate addresses using the project’s single source of truth for address validation.
- **FR-013**: The system MUST document capability flags enabling consumers to toggle UI features safely.
- **FR-014**: The system SHOULD prefer on-chain reads for current state when feasible and use history sources for historical/enumeration data where necessary.
- **FR-015**: The system SHOULD provide basic filtering for history (e.g., by role) when a history source is present.
- **FR-016**: Support scope is limited to official OpenZeppelin Stellar Access Control contracts as defined in the packages/access module; non‑conforming contracts are reported as unsupported and excluded from role/ownership actions.

### Key Entities _(include if feature involves data)_

- **RoleIdentifier**: A stable identifier for a role (id; optional label).
- **RoleAssignment**: A pair of `{ role: RoleIdentifier, members: string[] }`.
- **OwnershipInfo**: `{ owner: string | null }`.
- **AccessSnapshot**: `{ roles: RoleAssignment[], ownership?: OwnershipInfo }`.
- **AccessControlCapabilities**: `{ hasOwnable: boolean; hasAccessControl: boolean; hasEnumerableRoles: boolean; supportsHistory: boolean; verifiedAgainstOZInterfaces: boolean; notes?: string[] }`.
- **Errors**: Typed categories such as unsupported features, permission denied, configuration missing/unreachable, and generic operation failure.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Capability detection + current owner/roles load in ≤ 3 seconds for typical test contracts under normal network conditions.
- **SC-002**: Role grant/revoke and ownership transfer complete with a returned operation identifier; subsequent reads reflect changes within 30 seconds (under normal confirmation times).
- **SC-003**: Snapshot export faithfully matches current reported state (100% field-level parity) and is produced in ≤ 2 seconds for typical contract sizes.
- **SC-004**: When no history source is configured, users can still complete inspection and management tasks (stories 1–4) with ≥ 95% success rate in tests.
- **SC-005**: Error messages are actionable and unambiguous, enabling users to resolve configuration or permission issues without developer intervention in ≥ 90% of test cases.
- **SC-006**: The API surface remains UI-agnostic (no UI imports or assumptions) and can be exercised in isolation with automated tests covering capability detection, reads, mutations, and snapshot export.\*\*\*
