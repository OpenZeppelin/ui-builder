# Data Model: Stellar Ownable Two-Step Transfer

**Date**: 2025-12-10  
**Feature**: 001-stellar-ownable-support

## Entities

### 1. OwnershipInfo (Extended)

**Description**: Represents the current ownership state of a contract, including pending transfer information.

**Location**: `packages/types/src/adapters/access-control.ts`

| Field             | Type                       | Required | Description                                      |
| ----------------- | -------------------------- | -------- | ------------------------------------------------ |
| `owner`           | `string \| null`           | Yes      | Current owner address, or null if no owner       |
| `state`           | `OwnershipState`           | Yes      | Current ownership state                          |
| `pendingTransfer` | `PendingOwnershipTransfer` | No       | Pending transfer details (if state is 'pending') |

**State Transitions**:

```
[No Owner] --deploy--> [Owned]
[Owned] --transfer_ownership--> [Pending]
[Pending] --accept_ownership--> [Owned] (new owner)
[Pending] --expiration--> [Expired]
[Expired] --new transfer_ownership--> [Pending]
[Owned] --renounce_ownership--> [No Owner]
```

---

### 2. OwnershipState (Enum)

**Description**: Enumeration of possible ownership states.

**Location**: `packages/types/src/adapters/access-control.ts`

| Value         | Description                                           |
| ------------- | ----------------------------------------------------- |
| `'owned'`     | Contract has an active owner with no pending transfer |
| `'pending'`   | Ownership transfer initiated, awaiting acceptance     |
| `'expired'`   | Previous transfer attempt expired without completion  |
| `'renounced'` | Contract has no owner (ownership was renounced)       |

---

### 3. PendingOwnershipTransfer

**Description**: Details of an active pending ownership transfer.

**Location**: `packages/types/src/adapters/access-control.ts`

| Field              | Type     | Required | Description                                             |
| ------------------ | -------- | -------- | ------------------------------------------------------- |
| `pendingOwner`     | `string` | Yes      | Address designated to receive ownership                 |
| `expirationLedger` | `number` | Yes      | Ledger sequence by which transfer must be accepted      |
| `initiatedAt`      | `string` | No       | ISO8601 timestamp of transfer initiation (from indexer) |
| `initiatedTxId`    | `string` | No       | Transaction ID of the initiation (from indexer)         |
| `initiatedLedger`  | `number` | No       | Ledger at which transfer was initiated (from indexer)   |

---

### 4. OwnershipTransferStartedEvent

**Description**: Historical record of an ownership transfer initiation event from the indexer.

**Location**: `packages/adapter-stellar/src/access-control/indexer-client.ts`

| Field           | Type     | Required | Description                              |
| --------------- | -------- | -------- | ---------------------------------------- |
| `previousOwner` | `string` | Yes      | Owner (admin) who initiated the transfer |
| `pendingOwner`  | `string` | Yes      | Pending owner address (account)          |
| `txHash`        | `string` | Yes      | Transaction hash                         |
| `timestamp`     | `string` | Yes      | ISO8601 timestamp                        |
| `ledger`        | `number` | Yes      | Ledger sequence of event                 |

**Note**: The indexer does NOT store `live_until_ledger` (expiration). To determine expiration, the service must query the contract's on-chain state via `get_pending_owner()`.

---

### 5. PendingOwnerInfo (On-Chain)

**Description**: Pending owner information retrieved directly from the contract via `get_pending_owner()`.

**Location**: `packages/adapter-stellar/src/access-control/onchain-reader.ts`

| Field             | Type     | Required | Description                                        |
| ----------------- | -------- | -------- | -------------------------------------------------- |
| `pendingOwner`    | `string` | Yes      | Pending owner address                              |
| `liveUntilLedger` | `number` | Yes      | Ledger sequence by which transfer must be accepted |

**Note**: This is the only source for `liveUntilLedger` since the indexer does not store it.

---

### 6. AccessControlCapabilities (Extended)

**Description**: Extended capabilities to indicate two-step Ownable support.

**Location**: `packages/types/src/adapters/access-control.ts`

| Field                         | Type       | Required | Description                                         |
| ----------------------------- | ---------- | -------- | --------------------------------------------------- |
| `hasOwnable`                  | `boolean`  | Yes      | Contract implements basic Ownable                   |
| `hasTwoStepOwnable`           | `boolean`  | Yes      | Contract supports two-step transfer with expiration |
| `hasAccessControl`            | `boolean`  | Yes      | Contract implements AccessControl                   |
| `hasEnumerableRoles`          | `boolean`  | Yes      | Roles can be enumerated                             |
| `supportsHistory`             | `boolean`  | Yes      | Historical data available via indexer               |
| `verifiedAgainstOZInterfaces` | `boolean`  | Yes      | Verified against OZ interfaces                      |
| `notes`                       | `string[]` | No       | Capability notes/warnings                           |

---

## Validation Rules

### OwnershipInfo

1. If `state` is `'pending'`, `pendingTransfer` MUST be present
2. If `state` is `'owned'` or `'expired'`, `pendingTransfer` MAY be absent
3. `owner` can be `null` only if ownership was renounced

### PendingOwnershipTransfer

1. `expirationLedger` MUST be greater than initiation ledger
2. `pendingOwner` MUST be a valid Stellar address (G... or C...)

### Transfer Initiation

1. `expirationLedger` MUST be greater than current ledger sequence
2. Caller MUST be current owner

### Transfer Acceptance

1. Caller MUST be the pending owner
2. Current ledger MUST be less than or equal to expiration ledger

---

## Relationships

```
┌─────────────────────┐
│   Contract          │
│   (on-chain)        │
└─────────┬───────────┘
          │
          │ get_owner()
          ▼
┌─────────────────────┐
│   OwnershipInfo     │
│                     │
│  - owner            │
│  - state            │
│  - pendingTransfer ─┼──────┐
└─────────────────────┘      │
                             │
          ┌──────────────────┘
          ▼
┌─────────────────────────────┐
│  PendingOwnershipTransfer   │
│                             │
│  - pendingOwner             │
│  - expirationLedger         │
│  - initiatedAt              │
│  - initiatedTxId            │
└─────────────────────────────┘
          ▲
          │ sourced from
          │
┌─────────────────────────────┐
│  Indexer                    │
│  (ownership_transfer events)│
└─────────────────────────────┘
```

---

## Data Flow

### Reading Ownership State

```
1. Client calls getOwnership(contractAddress)
2. Service calls get_owner() on contract → owner address
3. If owner is null → return 'renounced' state
4. Service checks indexer availability
5. If indexer available:
   a. Query latest OWNERSHIP_TRANSFER_STARTED event
   b. Query OWNERSHIP_TRANSFER_COMPLETED after initiation
   c. If no completion found (pending transfer exists):
      - Call get_pending_owner() on-chain to get expiration (liveUntilLedger)
      - Query current ledger
      - Compare current ledger with liveUntilLedger
      - Determine state (pending vs expired)
6. If indexer unavailable:
   - Return 'owned' state with warning (cannot determine pending status)
7. Return OwnershipInfo with state and pending details
```

**Key Insight**: The indexer only tells us IF a transfer was started. To determine WHEN it expires, we must query the contract directly via `get_pending_owner()` which returns `Option<(Address, u32)>` with the expiration ledger.

### Initiating Transfer

```
1. Client calls transferOwnership(contractAddress, newOwner, expirationLedger)
2. Service validates expiration > current ledger
3. Service assembles transfer_ownership transaction
4. Transaction signed and broadcast
5. Contract emits ownership_transfer event
6. Service returns transaction ID
```

### Accepting Transfer

```
1. Client calls acceptOwnership(contractAddress)
2. Service assembles accept_ownership transaction
3. Transaction signed and broadcast
4. Contract validates caller is pending owner
5. Contract validates expiration not passed
6. Contract emits ownership_transfer_completed event
7. Service returns transaction ID
```
