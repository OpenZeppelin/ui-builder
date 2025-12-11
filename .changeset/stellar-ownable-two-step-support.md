---
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-types': minor
---

feat(adapter-stellar): add two-step Ownable support with ledger-based expiration

Implements OpenZeppelin Stellar Ownable two-step ownership transfer pattern:

**New Features:**

- `getOwnership()` now returns ownership state (owned/pending/expired/renounced) with pending transfer details
- `transferOwnership()` supports expiration ledger parameter for two-step transfers
- `acceptOwnership()` allows pending owners to complete ownership transfer
- `getCurrentLedger()` helper to get current ledger sequence for expiration calculation
- `validateExpirationLedger()` validation helper for client-side expiration checks
- `hasTwoStepOwnable` capability flag in feature detection

**Type Extensions:**

- Added `OwnershipState` type for ownership states
- Added `PendingOwnershipTransfer` interface for pending transfer details
- Extended `OwnershipInfo` with `state` and `pendingTransfer` fields
- Extended `AccessControlCapabilities` with `hasTwoStepOwnable` flag

**Indexer Integration:**

- Added `OWNERSHIP_TRANSFER_STARTED` event type support
- Added `queryPendingOwnershipTransfer()` method to indexer client
- Graceful degradation when indexer is unavailable

**Non-Functional:**

- Performance: Ownership queries < 3s, indexer queries < 1s, ledger queries < 500ms
- Logging: INFO for ownership operations, WARN for indexer unavailability
