# @openzeppelin/transaction-form-adapter-stellar

## 1.1.1

### Patch Changes

- [#283](https://github.com/OpenZeppelin/ui-builder/pull/283) [`5527175`](https://github.com/OpenZeppelin/ui-builder/commit/5527175640f864407f371c4a0a031d21c6410877) Thanks [@pasevin](https://github.com/pasevin)! - Fix: Read user-configured indexer endpoints from localStorage

  The StellarIndexerClient now correctly reads user-configured indexer endpoints from UserNetworkServiceConfigService (localStorage). Previously, user settings saved via the NetworkSettingsDialog were ignored.

  Changes:
  - Add user-configured indexer as highest priority in endpoint resolution
  - Add URL validation for user-configured endpoints
  - Subscribe to config changes to reset cache when user updates settings
  - Add dispose() method for cleanup

## 1.1.0

### Patch Changes

- Updated dependencies [[`6b4707a`](https://github.com/OpenZeppelin/ui-builder/commit/6b4707ab6f370e662942f3f00164e40fda6fda51)]:
  - @openzeppelin/ui-builder-utils@1.1.0
  - @openzeppelin/ui-builder-ui@1.1.0

## 1.0.0

### Minor Changes

- [#276](https://github.com/OpenZeppelin/ui-builder/pull/276) [`940de65`](https://github.com/OpenZeppelin/ui-builder/commit/940de6518eb1e0e94559818e870179bf1375973e) Thanks [@pasevin](https://github.com/pasevin)! - feat(adapters): add `getCurrentBlock()` method to ContractAdapter interface

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

- [#243](https://github.com/OpenZeppelin/ui-builder/pull/243) [`bfbbf9b`](https://github.com/OpenZeppelin/ui-builder/commit/bfbbf9bf55883ae61d6672436cfea66040251d48) Thanks [@pasevin](https://github.com/pasevin)! - Add Access Control and Ownable support for Stellar (Soroban) contracts

  ### @openzeppelin/ui-builder-adapter-stellar
  - Add `AccessControlService` implementation with full support for OpenZeppelin Access Control and Ownable patterns
  - Add capability detection to identify contracts implementing AccessControl, Ownable, or both
  - Support role management: query current roles, grant/revoke roles, check permissions
  - Support ownership management: transfer ownership, query current owner
  - Add historical queries via SubQuery indexer integration for complete role change and ownership transfer history
  - Implement server-side filtering by contract, role, account, and limit
  - Add graceful degradation when indexer is unavailable (on-chain queries continue to work)
  - Add comprehensive address validation using shared utilities at all service entry points
  - Export access control service via `getAccessControlService()` method on `StellarAdapter`
  - Add snapshot export functionality for current access control state
  - Support both account addresses (G...) and contract addresses (C...) for ownership transfers

  ### @openzeppelin/ui-builder-types
  - Add `AccessControlService` interface and related types (`AccessControlCapabilities`, `OwnershipInfo`, `RoleAssignment`, `AccessSnapshot`, `HistoryEntry`, `OperationResult`)
  - Add `getAccessControlService?()` optional method to `ContractAdapter` interface
  - Extend `BaseNetworkConfig` with optional `indexerUri` and `indexerWsUri` fields for GraphQL endpoint configuration

  ### @openzeppelin/ui-builder-utils
  - Add access control snapshot utilities (`validateSnapshot`, `serializeSnapshot`, `deserializeSnapshot`, `createEmptySnapshot`, `findRoleAssignment`, `compareSnapshots`)
  - Add access control error utilities (`isAccessControlError`, error message extraction helpers)
  - Export address normalization utilities (`normalizeAddress`, `addressesEqual`) for chain-agnostic address comparison

- [#277](https://github.com/OpenZeppelin/ui-builder/pull/277) [`98a9e5d`](https://github.com/OpenZeppelin/ui-builder/commit/98a9e5d670b4fc3032617705c69656213154bd1e) Thanks [@pasevin](https://github.com/pasevin)! - feat(adapter-stellar): add two-step admin transfer support with ledger-based expiration

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

- [#271](https://github.com/OpenZeppelin/ui-builder/pull/271) [`94bc4b4`](https://github.com/OpenZeppelin/ui-builder/commit/94bc4b4deedb2a3755fa5e17d161a65d37944df7) Thanks [@pasevin](https://github.com/pasevin)! - feat(adapter-stellar): add two-step Ownable support with ledger-based expiration

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

### Patch Changes

- Updated dependencies [[`940de65`](https://github.com/OpenZeppelin/ui-builder/commit/940de6518eb1e0e94559818e870179bf1375973e), [`7561580`](https://github.com/OpenZeppelin/ui-builder/commit/75615803c8c4e9848ffd469a19e5e684a92579fb), [`bfbbf9b`](https://github.com/OpenZeppelin/ui-builder/commit/bfbbf9bf55883ae61d6672436cfea66040251d48), [`f911a9e`](https://github.com/OpenZeppelin/ui-builder/commit/f911a9ef64ad60d6b8381006f41ff398a7765e96), [`c0cb6d1`](https://github.com/OpenZeppelin/ui-builder/commit/c0cb6d1ab87c1e60e6d3c4532107cd525aaaea19), [`d74dafc`](https://github.com/OpenZeppelin/ui-builder/commit/d74dafcb83d3bc87b89aed19abc7362a5c34c02a), [`fbc8ecd`](https://github.com/OpenZeppelin/ui-builder/commit/fbc8ecd527dd879b209b02878db210eadf49208c), [`f9cf1c7`](https://github.com/OpenZeppelin/ui-builder/commit/f9cf1c7018d5baffeda8da6b747710bad941ce3e), [`98a9e5d`](https://github.com/OpenZeppelin/ui-builder/commit/98a9e5d670b4fc3032617705c69656213154bd1e), [`94bc4b4`](https://github.com/OpenZeppelin/ui-builder/commit/94bc4b4deedb2a3755fa5e17d161a65d37944df7)]:
  - @openzeppelin/ui-builder-types@1.0.0
  - @openzeppelin/ui-builder-ui@1.0.0
  - @openzeppelin/ui-builder-utils@1.0.0

## 0.17.0

### Minor Changes

- Add Access Control and Ownable support for Stellar (Soroban) contracts
  - Implement `AccessControlService` interface with full support for OpenZeppelin Access Control and Ownable patterns
  - Add capability detection to identify contracts implementing AccessControl, Ownable, or both
  - Support role management: query current roles, grant/revoke roles, check permissions
  - Support ownership management: transfer ownership, query current owner
  - Add historical queries via SubQuery indexer integration for complete role change and ownership transfer history
  - Implement server-side filtering by contract, role, account, and limit
  - Add graceful degradation when indexer is unavailable (on-chain queries continue to work)
  - Add comprehensive address validation using shared utilities at all service entry points
  - Export access control service via `getAccessControlService()` method on `StellarAdapter`
  - Add snapshot export functionality for current access control state
  - Support both account addresses (G...) and contract addresses (C...) for ownership transfers

### Patch Changes

- Updated dependencies:
  - @openzeppelin/ui-builder-types@0.17.0
  - @openzeppelin/ui-builder-utils@0.17.0

## 0.16.0

### Minor Changes

- [#238](https://github.com/OpenZeppelin/ui-builder/pull/238) [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195) Thanks [@pasevin](https://github.com/pasevin)! - Add shared numeric validation bounds utility and enhance all adapters to apply type-specific min/max validation for integer types. Numeric bounds are now automatically applied to form fields based on chain-specific type names (e.g., uint32, U32, Uint<0..255>), improving input validation and user experience.

- [#238](https://github.com/OpenZeppelin/ui-builder/pull/238) [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195) Thanks [@pasevin](https://github.com/pasevin)! - Enhance Stellar adapter to properly handle complex Soroban types including enums with payloads, nested structs, tuples, and maps. Improvements include: enum metadata extraction and propagation through transaction pipeline, proper tuple payload serialization with ScVec wrapping, integer-only enum support (e.g., RoyalCard), XDR-based map/struct field sorting for canonical ordering, browser-compatible XDR comparison utilities, enhanced enum detection using spec entries, and improved validation bounds preservation in nested object fields. Fixes transaction execution errors for complex_struct and other functions with complex type parameters.

### Patch Changes

- Updated dependencies [[`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195), [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195)]:
  - @openzeppelin/ui-builder-utils@0.16.0
  - @openzeppelin/ui-builder-types@0.16.0
  - @openzeppelin/ui-builder-ui@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0
  - @openzeppelin/ui-builder-ui@0.15.0
  - @openzeppelin/ui-builder-utils@0.15.0

## 0.14.0

### Minor Changes

- [#221](https://github.com/OpenZeppelin/ui-builder/pull/221) [`98c1f33`](https://github.com/OpenZeppelin/ui-builder/commit/98c1f33bd446d24d22562ba7087e14bf9ff31575) Thanks [@pasevin](https://github.com/pasevin)! - Standardize adapter Vite configuration pattern
  - Add vite-config.ts export to all adapters for build-time configuration isolation
  - Export getEvmViteConfig(), getSolanaViteConfig(), and getStellarViteConfig() functions
  - Include module deduplication configurations for adapter-specific dependencies
  - Update package.json exports and tsup.config.ts to include vite-config builds
  - Ensures each adapter's build requirements are isolated and don't interfere with others

### Patch Changes

- [#222](https://github.com/OpenZeppelin/ui-builder/pull/222) [`8422e81`](https://github.com/OpenZeppelin/ui-builder/commit/8422e81cd4425d5fc596ac805bc130a80030fc93) Thanks [@pasevin](https://github.com/pasevin)! - Fix Stellar UI kit wallet connection and Execute Transaction button issues
  - Fix WalletConnectionUI to recompute wallet components on each render, ensuring UI kit changes are reflected immediately when toggling between "Stellar Wallets Kit Custom" and "Stellar Wallets Kit"
  - Fix StellarWalletsKitConnectButton to propagate connection state changes to adapter's wallet implementation, ensuring Execute Transaction button enables when wallet is connected
  - Wire active StellarWalletsKit instance into wallet implementation for proper kit instance management across connect/disconnect/sign operations
  - Ensure connection state flows correctly through context hooks so useDerivedAccountStatus properly detects wallet connection

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-ui@0.14.0
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

## 0.13.0

### Minor Changes

- [#199](https://github.com/OpenZeppelin/ui-builder/pull/199) [`68c0aed`](https://github.com/OpenZeppelin/ui-builder/commit/68c0aed14f3597df8c52dc8667e420624399b8d2) Thanks [@pasevin](https://github.com/pasevin)! - Add BigInt field type for safe handling of large integers beyond JavaScript Number precision

  **Breaking Behavior Changes:**
  - Large integer types (64-bit and above) now map to `bigint` field type instead of `number`
    - **EVM**: `uint64`, `uint128`, `uint256`, `int64`, `int128`, `int256`
    - **Stellar**: `U64`, `U128`, `U256`, `I64`, `I128`, `I256`
  - BigInt values are stored and transmitted as strings to prevent precision loss

  **New Features:**
  - Added new `BigIntField` component with built-in integer validation
  - Added `createBigIntTransform()` for proper string-based value handling
  - BigInt field now available in UI Builder field type dropdown under "Numeric" category

  **Improvements:**
  - Fixes uint256 truncation issue (#194)
  - Prevents precision loss for values exceeding `Number.MAX_SAFE_INTEGER` (2^53-1)
  - Simplified field generation by removing redundant type-specific validation logic from adapters
  - Component-based validation ensures consistency across all blockchain ecosystems

  **Technical Details:**
  - `BigIntField` uses string storage to handle arbitrary-precision integers
  - Integer-only validation via regex (`/^-?\d+$/`)
  - Compatible field types properly ordered with `bigint` as recommended type
  - Transform functions ensure safe conversion between UI and blockchain formats

### Patch Changes

- Updated dependencies [[`68c0aed`](https://github.com/OpenZeppelin/ui-builder/commit/68c0aed14f3597df8c52dc8667e420624399b8d2)]:
  - @openzeppelin/ui-builder-types@0.13.0
  - @openzeppelin/ui-builder-ui@0.13.0
  - @openzeppelin/ui-builder-utils@0.13.0

## 0.12.0

### Minor Changes

- [#196](https://github.com/OpenZeppelin/ui-builder/pull/196) [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500) Thanks [@pasevin](https://github.com/pasevin)! - Embed icon components in network configs; remove legacy icon string and dynamic icon usage.
  - Build performance: dramatically reduced build time and output file count
  - Runtime: no increase to runtime bundle size
  - API: `iconComponent` added to BaseNetworkConfig; `icon` string removed
  - Adapters: import specific `@web3icons/react` icons and set on configs
  - UI: prefer `network.iconComponent` when present

- [#196](https://github.com/OpenZeppelin/ui-builder/pull/196) [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500) Thanks [@pasevin](https://github.com/pasevin)! - Embed icon components in network configs; remove legacy icon string and dynamic icon usage. Improves build time and output file count; no runtime bundle size increase.

### Patch Changes

- Updated dependencies [[`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500), [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500)]:
  - @openzeppelin/ui-builder-types@0.12.0
  - @openzeppelin/ui-builder-ui@0.12.0
  - @openzeppelin/ui-builder-utils@0.12.0

## 0.11.0

### Minor Changes

- [#184](https://github.com/OpenZeppelin/ui-builder/pull/184) [`877b150`](https://github.com/OpenZeppelin/ui-builder/commit/877b1504df8f21395b276c2895190a7576cea2ba) Thanks [@pasevin](https://github.com/pasevin)! - Add Stellar Asset Contract support with CDN-backed spec loading and improved builder loading feedback for contract metadata.

## 0.10.1

### Patch Changes

- [#183](https://github.com/OpenZeppelin/ui-builder/pull/183) [`702ca91`](https://github.com/OpenZeppelin/ui-builder/commit/702ca91f01a35057e6d1c1809aa00bfd926bcd98) Thanks [@pasevin](https://github.com/pasevin)! - Fix BytesN parameter handling in Stellar forms so base64 inputs reuse the bytes field, propagate max byte hints, and convert to ScVal correctly.

- Updated dependencies [[`47ee098`](https://github.com/OpenZeppelin/ui-builder/commit/47ee098b9d17241cb9323e0b644c3e36957ec358), [`702ca91`](https://github.com/OpenZeppelin/ui-builder/commit/702ca91f01a35057e6d1c1809aa00bfd926bcd98)]:
  - @openzeppelin/ui-builder-utils@0.10.1
  - @openzeppelin/ui-builder-types@0.10.1
  - @openzeppelin/ui-builder-ui@0.10.1

## 0.10.0

### Minor Changes

- [#172](https://github.com/OpenZeppelin/ui-builder/pull/172) [`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d) Thanks [@pasevin](https://github.com/pasevin)! - Rename packages from "@openzeppelin/contracts-ui-builder-_" to "@openzeppelin/ui-builder-_" and update imports across the monorepo. Legacy packages will be deprecated on npm with guidance to the new names.

### Patch Changes

- Updated dependencies [[`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d)]:
  - @openzeppelin/ui-builder-types@0.10.0
  - @openzeppelin/ui-builder-ui@0.10.0
  - @openzeppelin/ui-builder-utils@0.10.0

## 0.9.0

### Patch Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - Fix Freighter wallet popup loop and refactor wallet interface architecture
  - **Fix critical bug**: Replace aggressive polling with event-driven wallet connection approach in `StellarWalletUiRoot`
  - **Eliminate infinite Freighter popups** that occurred when clicking wallet connection button
  - Add `stellarWalletImplementationManager` singleton pattern following EVM adapter architecture
  - Update adapter to use new implementation manager and return `StellarWalletConnectionStatus`
  - Move wallet interfaces (`StellarWalletConnectionStatus`, `StellarConnectionStatusListener`) to `wallet/types.ts`
  - Implement event subscriptions with minimal fallback polling (5-minute intervals instead of 1-second)
  - Align wallet directory structure with EVM adapter for architectural consistency

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0
  - @openzeppelin/contracts-ui-builder-ui@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/ui-builder-types@0.8.0
  - @openzeppelin/ui-builder-utils@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [[`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec)]:
  - @openzeppelin/ui-builder-utils@0.7.0

## 0.0.9

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/ui-builder-types@0.4.0
  - @openzeppelin/ui-builder-utils@0.4.1

## 0.0.8

### Patch Changes

- [#80](https://github.com/OpenZeppelin/contracts-ui-builder/pull/80) [`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc) Thanks [@pasevin](https://github.com/pasevin)! - Route all console.\* logs through centralized logger from utils, add system tags, update tests to spy on logger, restore missing createAbiFunctionItem in EVM adapter, and apply lint/prettier fixes. No public API changes.

## 0.0.7

### Patch Changes

- Updated dependencies [[`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c)]:
  - @openzeppelin/ui-builder-utils@0.4.0

## 0.0.6

### Patch Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - fix: Updated the contract address input field to use the new `blockchain-address` type for better validation and user experience.

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/ui-builder-utils@0.3.1
  - @openzeppelin/ui-builder-types@0.3.0

## 0.0.5

### Patch Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - docs update

- Updated dependencies [[`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103)]:
  - @openzeppelin/ui-builder-utils@0.3.0

## 0.0.4

### Patch Changes

- Updated dependencies [[`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479)]:
  - @openzeppelin/ui-builder-types@0.2.1
  - @openzeppelin/ui-builder-utils@0.2.1

## 0.0.3

### Patch Changes

- Updated dependencies [[`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81)]:
  - @openzeppelin/ui-builder-types@0.2.0
  - @openzeppelin/ui-builder-utils@0.2.0

## 0.0.2

### Patch Changes

- Updated dependencies [[`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037)]:
  - @openzeppelin/ui-builder-types@0.1.2

## 0.3.0

### Minor Changes

- [#39](https://github.com/OpenZeppelin/transaction-form-builder/pull/39) [`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a) Thanks [@pasevin](https://github.com/pasevin)! - Supports block explorer configuration in the UI

### Patch Changes

- Updated dependencies [[`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a)]:
  - @openzeppelin/ui-builder-types@1.17.0
  - @openzeppelin/transaction-form-utils@1.17.0

## 0.2.1

### Patch Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps

- Updated dependencies [[`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe)]:
  - @openzeppelin/ui-builder-types@1.16.0
  - @openzeppelin/transaction-form-utils@1.16.0
