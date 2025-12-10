# Feature Specification: Stellar Ownable Protocol Support

**Feature Branch**: `001-stellar-ownable-support`  
**Created**: December 10, 2025  
**Status**: Draft  
**Input**: User description: "Extend Stellar Access Control module to support Ownable protocols two-step ownership transfer, and block expiration features."

## Clarifications

### Session 2025-12-10

- Q: What happens if a user initiates a new transfer while a pending transfer already exists? → A: New transfer cancels existing pending transfer automatically.
- Q: How should the system behave when the indexer is unavailable? → A: Show partial data (current owner only) with clear warning that pending status is unavailable.
- Q: What happens when a user initiates a transfer with an expiration ledger that has already passed? → A: Reject with clear error message before submitting transaction (client-side validation).
- Q: Should ownership history be displayed as a separate feature? → A: No, existing `getHistory` for all events is sufficient; users can filter ownership events there.
- Q: How to handle race condition where transfer expires between status check and acceptance? → A: No pre-check; let transaction fail naturally and show clear error explaining the expiration.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Contract Ownership Status (Priority: P1)

A contract administrator needs to view the current ownership status of a Stellar contract that implements the OpenZeppelin Ownable module. The system must display whether the contract has an active owner, a pending ownership transfer, or an expired transfer attempt.

**Why this priority**: This is the foundational feature—without accurately displaying ownership status, users cannot make informed decisions about ownership transfers. All other features depend on this core capability.

**Independent Test**: Can be fully tested by querying any Ownable-compatible Stellar contract and verifying the displayed owner address matches the on-chain state. Delivers immediate value by showing ownership information.

**Acceptance Scenarios**:

1. **Given** a Stellar contract with the Ownable module deployed, **When** the user queries the contract's ownership status, **Then** the system displays the current owner's address.
2. **Given** a Stellar contract with a pending ownership transfer, **When** the user views the ownership status, **Then** the system displays "Pending" status with the pending owner's address and transfer expiration ledger.
3. **Given** a Stellar contract where a pending transfer has expired, **When** the user views the ownership status, **Then** the system displays "Expired" status indicating the previous transfer attempt is no longer valid.

---

### User Story 2 - Initiate Ownership Transfer (Priority: P2)

A contract owner wants to transfer ownership to a new address. The owner must specify the new owner's address and a ledger sequence number by which the transfer must be accepted. The system must submit the transfer and track its pending state.

**Why this priority**: Once ownership visibility is established (P1), owners need the ability to initiate transfers. This enables the core ownership management workflow.

**Independent Test**: Can be tested by having an owner initiate a transfer and verifying the contract enters a pending state with correct pending owner and expiration values.

**Acceptance Scenarios**:

1. **Given** the user is the current owner of an Ownable contract, **When** they initiate a transfer specifying a new owner address and expiration ledger, **Then** the system submits the `transfer_ownership` transaction and the contract enters a "Pending" state.
2. **Given** the user is NOT the current owner, **When** they attempt to initiate a transfer, **Then** the system prevents the action and displays an appropriate error message.
3. **Given** an owner initiates a transfer, **When** the transaction is confirmed, **Then** the system displays the pending transfer details including the new owner address and expiration ledger.

---

### User Story 3 - Accept Ownership Transfer (Priority: P2)

A pending owner needs to accept an ownership transfer before the expiration ledger is reached. Upon successful acceptance, the pending owner becomes the new contract owner.

**Why this priority**: This completes the two-step transfer workflow. Without acceptance capability, transfers cannot be finalized.

**Independent Test**: Can be tested by having the pending owner call accept and verifying ownership transitions from the original owner to the new owner.

**Acceptance Scenarios**:

1. **Given** a pending ownership transfer where the user is the pending owner, **When** the user accepts the transfer before the expiration ledger, **Then** the system submits the `accept_ownership` transaction and ownership transfers to the new owner.
2. **Given** a pending transfer that has expired (current ledger > expiration ledger), **When** the pending owner attempts to accept, **Then** the system displays an error indicating the transfer has expired.
3. **Given** a user who is NOT the pending owner, **When** they attempt to accept ownership, **Then** the system prevents the action and displays an appropriate error message.

---

### User Story 4 - Detect Ownable Contract Features (Priority: P3)

The system must automatically detect whether a Stellar contract implements the OpenZeppelin Ownable module by checking for required entry points and event patterns.

**Why this priority**: Feature detection enables automatic discovery of Ownable contracts without manual configuration. This improves user experience but is not required for basic ownership operations if the user knows the contract supports Ownable.

**Independent Test**: Can be tested by scanning contracts with and without Ownable implementation and verifying correct detection results.

**Acceptance Scenarios**:

1. **Given** a Stellar contract that implements all Ownable entry points (`get_owner`, `transfer_ownership`, `accept_ownership`), **When** the system performs feature detection, **Then** the contract is identified as Ownable-compatible.
2. **Given** a Stellar contract missing one or more Ownable entry points, **When** the system performs feature detection, **Then** the contract is NOT identified as Ownable-compatible.
3. **Given** an Ownable-compatible contract, **When** the system queries historical events, **Then** it correctly identifies `ownership_transfer` and `ownership_transfer_completed` events.

---

### Edge Cases

- When a user attempts to initiate a transfer with an expiration ledger that has already passed, the system rejects the request with a clear error message before submitting the transaction.
- When network errors occur during transfer initiation or acceptance, the system displays a user-friendly error message and allows retry without data loss.
- When the indexer is temporarily unavailable, the system displays current owner only with a clear warning that pending transfer status cannot be determined; operations remain available.
- When querying ownership status for a contract that was deployed but never had ownership events, the system returns the current owner from `get_owner()` with state "Owned" (no pending transfer).
- When a user initiates a new transfer while a pending transfer exists, the new transfer automatically cancels and replaces the existing pending transfer.
- If a transfer expires between status check and acceptance attempt, the transaction fails on-chain and the system displays a clear error explaining that the transfer has expired.
- When `expirationLedger` equals the current ledger (boundary condition), the system rejects the transfer as invalid since acceptance would be impossible.
- When `get_owner()` returns null (renounced ownership), the system displays "No Owner" or "Renounced" state.
- Concurrent transfer attempts from different clients are handled by contract-level serialization; no client-side locking is required.

## Requirements _(mandatory)_

### Functional Requirements

**Feature Detection**

- **FR-001**: System MUST detect Ownable module conformance by verifying presence of `get_owner`, `transfer_ownership`, and `accept_ownership` entry points.
- **FR-002**: System MUST identify Ownable event patterns including `ownership_transfer` and `ownership_transfer_completed` events.
- **FR-003**: System MUST expose Ownable capability information through the adapter's feature detection mechanism.

**Ownership Status**

- **FR-004**: System MUST fetch and display the current owner address by invoking the `get_owner` contract method.
- **FR-005**: System MUST determine pending transfer status by querying `ownership_transfer` events from the indexer.
- **FR-006**: System MUST determine transfer completion by querying `ownership_transfer_completed` events from the indexer.
- **FR-007**: System MUST calculate transfer expiration by comparing the `live_until_ledger` value (from on-chain `get_pending_owner()`) against the current ledger sequence.
- **FR-008**: System MUST present ownership state as one of: "Owned" (active owner, no pending transfer), "Pending" (transfer initiated, awaiting acceptance), or "Expired" (previous transfer attempt expired).

**Ownership Transfer Operations**

- **FR-009**: System MUST allow the current owner to initiate an ownership transfer by invoking `transfer_ownership(new_owner, live_until_ledger)`.
- **FR-009a**: System MUST validate that the specified `live_until_ledger` is greater than the current ledger sequence before submitting a transfer transaction; if invalid, reject with a clear error message.
- **FR-010**: System MUST prevent non-owners from initiating ownership transfers.
- **FR-011**: System MUST allow the pending owner to complete a transfer by invoking `accept_ownership()`.
- **FR-012**: System MUST prevent acceptance of expired transfers (where current ledger > `live_until_ledger`).
- **FR-013**: System MUST prevent non-pending-owners from accepting ownership transfers.
- **FR-013a**: System MUST allow initiating a new transfer while a pending transfer exists; the new transfer automatically cancels and replaces the existing pending transfer.

**Indexer Integration**

- **FR-014**: System MUST query the indexer for `OWNERSHIP_TRANSFER_STARTED` events to discover pending transfer initiation details.
- **FR-015**: System MUST query the indexer for `OWNERSHIP_TRANSFER_COMPLETED` events to confirm ownership acceptance.
- **FR-016**: System MUST query `live_until_ledger` via on-chain `get_pending_owner()` call (indexer does not store expiration values).
- **FR-016a**: If indexer indicates a pending transfer but on-chain query returns no pending owner, treat as 'owned' state (transfer may have completed or expired).

**Ledger Sequence**

- **FR-017**: System MUST query the current ledger sequence number to determine transfer expiration status.
- **FR-017a**: System MUST expose a `getCurrentLedger()` helper method that returns the current ledger sequence via Soroban RPC `getLatestLedger`.

**Error Handling**

- **FR-018**: System MUST display specific error messages for rejection scenarios:
  - Non-owner attempting transfer: "Only the current owner can initiate ownership transfers."
  - Non-pending-owner attempting accept: "Only the pending owner can accept this transfer."
  - Expired transfer acceptance: "This ownership transfer has expired. The expiration ledger {X} has passed (current: {Y})."
  - Invalid expiration ledger: "Expiration ledger {X} must be greater than current ledger {Y}."
  - Expiration at boundary (equal to current): "Expiration ledger must be strictly greater than current ledger to allow acceptance time."
- **FR-019**: System MUST handle network errors gracefully during transfer operations by displaying user-friendly error messages and allowing retry.
- **FR-020**: System MUST treat `expirationLedger` equal to current ledger as invalid (must be strictly greater than).

**Renounced Ownership**

- **FR-021**: System MUST handle contracts with no owner (`get_owner` returns null) by displaying "No Owner" state.
- **FR-022**: When `get_owner` returns null and no pending transfer exists, system MUST display ownership state as "Renounced".

**Concurrency**

- **FR-023**: System MUST NOT perform client-side locking for concurrent transfer attempts; contract-level serialization handles race conditions.

### Key Entities

- **Contract Owner**: The address that currently holds ownership rights over the contract. Has exclusive authority to initiate ownership transfers.

- **Pending Owner**: The address designated to receive ownership in an active transfer. Must call `accept_ownership` before expiration to complete the transfer.

- **Ownership Transfer**: Represents a transfer attempt with: initiating owner, pending owner, initiation ledger, expiration ledger (`live_until_ledger`), and completion status.

- **Ownership State**: Enumeration representing the current ownership situation: Owned (stable ownership), Pending (active transfer in progress), Expired (failed transfer attempt).

- **Ownership Event**: On-chain events emitted during ownership actions (`ownership_transfer` for initiation, `ownership_transfer_completed` for acceptance); queried via existing `getHistory` functionality.

### Non-Functional Requirements

**Performance**

- **NFR-001**: Ownership status queries (including indexer calls) MUST complete within 3 seconds under normal conditions.
- **NFR-002**: Indexer event queries for pending state detection SHOULD complete within 1 second.
- **NFR-003**: Current ledger sequence queries MUST complete within 500ms.

**Observability**

- **NFR-004**: All ownership operations MUST be logged at INFO level with operation type, contract address, and result status.
- **NFR-005**: Errors during ownership operations MUST be logged at ERROR level with full context for debugging.
- **NFR-006**: Indexer unavailability MUST be logged at WARN level when graceful degradation is triggered.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view the current owner address for any Ownable-compatible Stellar contract within 3 seconds of querying.

- **SC-002**: Pending ownership transfers are accurately detected and displayed with correct pending owner and expiration information in 100% of cases.

- **SC-003**: Expired transfers are correctly identified when the current ledger exceeds the expiration ledger, with no false positives or negatives.

- **SC-004**: Contract owners can successfully initiate ownership transfers, with the system correctly preventing unauthorized transfer attempts.

- **SC-005**: Pending owners can successfully accept transfers before expiration, with the system correctly preventing expired or unauthorized acceptance attempts.

- **SC-006**: Feature detection correctly identifies Ownable-compatible contracts with 100% accuracy for contracts implementing the standard OpenZeppelin Stellar Ownable interface.

- **SC-007**: When the indexer is unavailable, the system displays the current owner (via direct contract query) with a clear warning that pending transfer status cannot be determined; ownership operations remain available but users are informed of data limitations.

## Assumptions

- The OpenZeppelin Stellar Ownable module follows the documented interface with `get_owner`, `get_pending_owner`, `transfer_ownership(new_owner, live_until_ledger)`, and `accept_ownership()` methods.
- The indexer provides historical event data for `OWNERSHIP_TRANSFER_STARTED` and `OWNERSHIP_TRANSFER_COMPLETED` events but does NOT store `live_until_ledger` expiration values.
- The contract's `get_pending_owner()` method returns `Option<(Address, u32)>` where the u32 is the `live_until_ledger` expiration.
- The Horizon API or Stellar RPC provides access to the current ledger sequence number for expiration calculations.
- A contract can only have one pending transfer at a time; initiating a new transfer invalidates any previous pending transfer.
- The adapter will use existing `queryViewFunction` and `invokeFunction` patterns for contract interactions.

## Dependencies

- Stellar indexer service must support querying `OWNERSHIP_TRANSFER_STARTED` and `OWNERSHIP_TRANSFER_COMPLETED` events.
- Access to current ledger sequence via Horizon API or Stellar RPC.
- On-chain `get_pending_owner()` method available on Ownable contracts to retrieve expiration ledger.
- Existing adapter infrastructure for contract method invocation and event querying.
