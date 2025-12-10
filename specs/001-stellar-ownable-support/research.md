# Research: Stellar Ownable Two-Step Transfer

**Date**: 2025-12-10  
**Feature**: 001-stellar-ownable-support

## 1. OpenZeppelin Stellar Ownable Interface

### Decision

Use the standard OpenZeppelin Stellar Contracts Ownable interface with two-step transfer.

### Function Signatures

```rust
// Read current owner
fn get_owner(env: &Env) -> Option<Address>

// Initiate two-step transfer with expiration
fn transfer_ownership(env: &Env, new_owner: Address, live_until_ledger: u32)

// Accept pending ownership (called by pending owner)
fn accept_ownership(env: &Env)

// Optional: renounce ownership
fn renounce_ownership(env: &Env)
```

### Event Signatures

```rust
// Emitted when transfer_ownership is called
event ownership_transfer {
    previous_owner: Address,
    new_owner: Address,
    live_until_ledger: u32,
}

// Emitted when accept_ownership completes the transfer
event ownership_transfer_completed {
    previous_owner: Address,
    new_owner: Address,
}
```

### Rationale

- Matches OpenZeppelin Stellar Contracts implementation
- Two-step transfer provides security against accidental transfers
- Ledger-based expiration is native to Soroban (vs block-based on EVM)

### Alternatives Considered

- Single-step transfer (EVM-style): Rejected because Stellar Ownable uses two-step by design
- Time-based expiration: Rejected because Soroban uses ledger sequences, not timestamps

---

## 2. Stellar Ledger Sequence Query

### Decision

Query current ledger sequence via Soroban RPC `getLatestLedger` method.

### Implementation

```typescript
// Using @stellar/stellar-sdk
import { SorobanRpc } from '@stellar/stellar-sdk';

async function getCurrentLedger(rpcUrl: string): Promise<number> {
  const server = new SorobanRpc.Server(rpcUrl);
  const latestLedger = await server.getLatestLedger();
  return latestLedger.sequence;
}
```

### Rationale

- `getLatestLedger` is the standard Soroban RPC method for ledger info
- Returns current sequence number directly
- Low latency (~100-200ms for testnet)
- Already available in existing adapter infrastructure

### Alternatives Considered

- Horizon API `/ledgers`: Slightly higher latency, more data than needed
- Caching with TTL: Could add 5-second cache if performance issues arise

### Performance Considerations

- Ledger advances every ~5 seconds on mainnet
- For expiration checks, a slight delay is acceptable
- Consider caching if multiple ownership queries happen in quick succession

---

## 3. Indexer Event Schema

### Decision

Extend existing indexer client to support ownership transfer events.

### New Event Types

The indexer already supports `OWNERSHIP_TRANSFER_COMPLETED`. We need to add:

```graphql
enum AccessControlEventType {
  ROLE_GRANTED
  ROLE_REVOKED
  OWNERSHIP_TRANSFER_COMPLETED
  OWNERSHIP_TRANSFER_INITIATED # NEW
}
```

### GraphQL Query for Pending Transfers

```graphql
query GetPendingOwnershipTransfer($contract: String!) {
  accessControlEvents(
    filter: { contract: { equalTo: $contract }, type: { equalTo: OWNERSHIP_TRANSFER_INITIATED } }
    orderBy: TIMESTAMP_DESC
    first: 1
  ) {
    nodes {
      id
      account # pending owner
      previousOwner # current owner at time of initiation
      liveUntilLedger # expiration ledger
      txHash
      timestamp
      blockHeight
    }
  }
}
```

### Pending State Detection Algorithm

```typescript
async function getPendingTransferState(contractAddress: string): Promise<PendingState | null> {
  // 1. Query latest OWNERSHIP_TRANSFER_INITIATED event
  const initiatedEvent = await queryLatestOwnershipTransferInitiated(contractAddress);

  if (!initiatedEvent) {
    return null; // No pending transfer ever initiated
  }

  // 2. Check if completed
  const completedEvent = await queryOwnershipTransferCompleted(
    contractAddress,
    initiatedEvent.timestamp // Only look for completions after initiation
  );

  if (completedEvent && completedEvent.timestamp > initiatedEvent.timestamp) {
    return null; // Transfer was completed
  }

  // 3. Check expiration
  const currentLedger = await getCurrentLedger();

  if (currentLedger > initiatedEvent.liveUntilLedger) {
    return { state: 'expired', ...initiatedEvent };
  }

  return { state: 'pending', ...initiatedEvent };
}
```

### Rationale

- Reuses existing indexer infrastructure
- Event-based approach handles the fact that pending state isn't exposed via getters
- Chronological comparison ensures accurate state detection

### Alternatives Considered

- Contract getter for pending state: Not available in OZ Stellar Ownable
- Simulating contract to get storage: Too complex, indexer is cleaner

---

## 4. Indexer Dependency & Graceful Degradation

### Decision

When indexer is unavailable, show current owner only with warning.

### Behavior Matrix

| Indexer Available | Pending State | Display                                                                           |
| ----------------- | ------------- | --------------------------------------------------------------------------------- |
| Yes               | None          | Owner: `<address>`, State: "Owned"                                                |
| Yes               | Pending       | Owner: `<address>`, Pending: `<new_owner>`, Expires: `<ledger>`, State: "Pending" |
| Yes               | Expired       | Owner: `<address>`, State: "Expired" (previous transfer expired)                  |
| No                | Unknown       | Owner: `<address>`, State: "Unknown" + Warning                                    |

### Warning Message

"Pending transfer status unavailable. Indexer connection required to detect pending ownership transfers."

### Rationale

- Current owner can always be fetched via `get_owner()` direct call
- Pending state requires historical event analysis
- Partial data is better than no data

---

## 5. Client-Side Validation

### Decision

Validate expiration ledger before submitting transfer transaction.

### Validation Logic

```typescript
async function validateTransferExpiration(
  expirationLedger: number,
  rpcUrl: string
): Promise<{ valid: boolean; error?: string }> {
  const currentLedger = await getCurrentLedger(rpcUrl);

  if (expirationLedger <= currentLedger) {
    return {
      valid: false,
      error: `Expiration ledger ${expirationLedger} has already passed. Current ledger is ${currentLedger}.`,
    };
  }

  // Optional: warn if expiration is very soon (< 100 ledgers ≈ 8 minutes)
  const ledgersUntilExpiration = expirationLedger - currentLedger;
  if (ledgersUntilExpiration < 100) {
    // Log warning but don't block
    logger.warn('Transfer expiration is very soon', { ledgersUntilExpiration });
  }

  return { valid: true };
}
```

### Rationale

- Prevents wasted transaction fees on invalid transfers
- Better UX than letting transaction fail on-chain
- Per clarification: reject before submission, not warn

---

## 6. Overlapping Transfer Behavior

### Decision

New transfer automatically cancels and replaces existing pending transfer.

### Implementation Note

This is handled by the contract itself - when `transfer_ownership` is called while a pending transfer exists, the contract overwrites the pending state. The adapter doesn't need special handling beyond:

1. UI should show current pending state (if any) when initiating new transfer
2. No blocking logic required - contract handles the replacement

### Rationale

- Per spec clarification: "New transfer cancels existing pending transfer automatically"
- Contract-level enforcement is authoritative
- Simplifies adapter implementation

---

## Summary of Key Decisions

| Topic                 | Decision                      | Rationale                            |
| --------------------- | ----------------------------- | ------------------------------------ |
| Function interface    | OZ Stellar Ownable standard   | Matches existing implementation      |
| Ledger query          | Soroban RPC `getLatestLedger` | Native, fast, already available      |
| Pending detection     | Indexer events                | Pending state not exposed via getter |
| Indexer unavailable   | Partial data + warning        | Current owner always fetchable       |
| Expiration validation | Client-side rejection         | Per spec clarification               |
| Overlapping transfers | Contract handles              | Per spec clarification               |
