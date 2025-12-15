---
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-types': minor
---

feat(adapter-stellar): add two-step admin transfer support with ledger-based expiration

Implements OpenZeppelin Stellar AccessControl two-step admin transfer pattern:

**New Features:**

- `getAdminInfo()` returns admin state (active/pending/expired/renounced) with pending transfer details
- `transferAdminRole()` initiates two-step admin transfer with expiration ledger parameter
- `acceptAdminTransfer()` allows pending admins to complete admin transfer
- `hasTwoStepAdmin` capability flag in feature detection

**Type Extensions:**

- Added `AdminState` type for admin states ('active' | 'pending' | 'expired' | 'renounced')
- Added `PendingAdminTransfer` interface for pending admin transfer details
- Added `AdminInfo` interface for admin information with state and pending transfer
- Extended `AccessControlCapabilities` with `hasTwoStepAdmin` flag
- Added optional `getAdminInfo`, `transferAdminRole`, `acceptAdminTransfer` methods to `AccessControlService` interface

**Indexer Integration:**

- Added `ADMIN_TRANSFER_INITIATED` event type support
- Added `ADMIN_TRANSFER_COMPLETED` event type support
- Added `AdminTransferInitiatedEvent` interface for pending admin transfers
- Added `queryPendingAdminTransfer()` method to indexer client
- Graceful degradation when indexer is unavailable

**Action Assembly:**

- Added `assembleTransferAdminRoleAction()` for transfer_admin_role transactions
- Added `assembleAcceptAdminTransferAction()` for accept_admin_transfer transactions

**Breaking Changes:**

- Removed `GetOwnershipOptions` interface and `verifyOnChain` option from `getOwnership()` and `getAdminInfo()`
- Removed `readPendingOwner()` function from onchain-reader (it called non-existent `get_pending_owner()` function)
- Signature change: `getOwnership(contractAddress, options?)` -> `getOwnership(contractAddress)`
- Signature change: `getAdminInfo(contractAddress, options?)` -> `getAdminInfo(contractAddress)`
- Removed `TRANSFERRED` from `HistoryChangeType` - use `OWNERSHIP_TRANSFER_COMPLETED` instead

The `verifyOnChain` option was removed because standard OpenZeppelin Stellar contracts do not expose `get_pending_owner()` or `get_pending_admin()` methods. Pending transfer state is only accessible via the indexer, not on-chain.

The `TRANSFERRED` event type was removed to simplify the API. Use the more specific `OWNERSHIP_TRANSFER_STARTED` and `OWNERSHIP_TRANSFER_COMPLETED` types instead.
