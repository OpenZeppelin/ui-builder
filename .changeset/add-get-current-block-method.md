---
'@openzeppelin/ui-builder-types': minor
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-adapter-solana': minor
'@openzeppelin/ui-builder-adapter-midnight': minor
---

feat(adapters): add `getCurrentBlock()` method to ContractAdapter interface

Adds a new mandatory `getCurrentBlock()` method to the `ContractAdapter` interface that returns the current block/ledger number from the blockchain.

**Use Cases:**

- Calculating appropriate expiration blocks for time-sensitive operations
- Validating expiration parameters before submitting transactions
- Determining if pending operations have expired

**Implementation Details:**

- **EVM**: Uses `eth_blockNumber` JSON-RPC call via `getEvmCurrentBlock()` helper
- **Stellar**: Delegates to existing `getCurrentLedger()` from onchain-reader module
- **Solana**: Uses `getSlot` JSON-RPC call via `getSolanaCurrentBlock()` helper
- **Midnight**: Placeholder that throws (indexer does not yet expose block number API)
