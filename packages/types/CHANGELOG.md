# @openzeppelin/ui-builder-types

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

- [#255](https://github.com/OpenZeppelin/ui-builder/pull/255) [`f9cf1c7`](https://github.com/OpenZeppelin/ui-builder/commit/f9cf1c7018d5baffeda8da6b747710bad941ce3e) Thanks [@pasevin](https://github.com/pasevin)! - Move `EcosystemFeatureConfig` and `EcosystemInfo` interfaces from builder registry to shared types package (`@openzeppelin/ui-builder-types`). This ensures consistent type definitions across all consumers and enables reuse in other applications like Role Manager.

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

## 0.16.0

### Minor Changes

- [#238](https://github.com/OpenZeppelin/ui-builder/pull/238) [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195) Thanks [@pasevin](https://github.com/pasevin)! - Enhance Stellar adapter to properly handle complex Soroban types including enums with payloads, nested structs, tuples, and maps. Improvements include: enum metadata extraction and propagation through transaction pipeline, proper tuple payload serialization with ScVec wrapping, integer-only enum support (e.g., RoyalCard), XDR-based map/struct field sorting for canonical ordering, browser-compatible XDR comparison utilities, enhanced enum detection using spec entries, and improved validation bounds preservation in nested object fields. Fixes transaction execution errors for complex_struct and other functions with complex type parameters.

## 0.15.0

### Minor Changes

- [#232](https://github.com/OpenZeppelin/ui-builder/pull/232) [`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff) Thanks [@pasevin](https://github.com/pasevin)! - Add support for configurable identity secret key property name in Midnight contracts

  **Breaking Changes:**
  - None

  **New Features:**
  - Added `RuntimeSecretPropertyInput` interface to support adapter-driven property name configuration
  - Midnight adapter now derives the identity secret key property name from contract artifacts
  - Added configurable "Secret Key Property Name" field in the Customize step for runtime secret fields
  - Property name is automatically detected from contract artifacts (e.g., `organizerSecretKey`, `secretKey`, `ownerKey`)
  - Users can override the detected property name if needed

  **Improvements:**
  - Refactored secret property resolution logic into shared utility function
  - Improved error handling for missing or invalid property names
  - Added JavaScript identifier validation for property names
  - Enhanced helper text to guide users on property name configuration
  - Updated terminology from "Organizer" to "Identity-restricted" for better clarity

  **Bug Fixes:**
  - Fixed empty string handling in property name resolution
  - Fixed TextField ID uniqueness for accessibility
  - Fixed JSDoc documentation for better clarity

  **Internal Changes:**
  - Consolidated duplicated `ExtendedRuntimeBinding` type into shared utility
  - Improved witness type definition parsing for more reliable property name derivation
  - Enhanced logging for witness type definition processing

## 0.14.0

### Minor Changes

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Implement runtime-only secret field support with dual-credential execution
  - Add FunctionBadge, FunctionDecoration, and FunctionDecorationsMap types to types/adapters/ui-enhancements.ts
  - Extend ContractAdapter.signAndBroadcast to accept optional runtimeApiKey and runtimeSecret parameters
  - Add adapterBinding field to FormFieldType for adapter-specific credential binding
  - Implement Banner component for reusable notification/warning display in ui package
  - Add runtimeSecret field type with adapter-driven UI rendering in builder:
    - Hide "Field Type" dropdown for runtime secret fields
    - Hide "Required Field" toggle for runtime secret fields
    - Make "Field Label" span full width when Field Type is hidden
    - Add security warning banner when hardcoded values are used
  - Extract runtime secret display logic into separate components (RuntimeSecretFieldDisplay, ParameterFieldDisplay)
  - Extract field header (icon, label, delete button) into FieldHeader component
  - Implement reusable hooks for function notes (useGetFunctionNote) and execution validation (useExecutionValidation)
  - Create FunctionNoteSection and RuntimeSecretButton components for modular form customization
  - Add runtimeSecretExtractor utility for clean credential handling during transaction execution
  - Support hardcoded readonly runtime secrets with proper field extraction
  - Implement FunctionDecorationsService in adapter-midnight for organizer-only circuit detection
  - Fix private state overlay to handle provider storage misses gracefully
  - Update transaction execution flow to pass both relayer API keys and adapter-specific secrets

### Patch Changes

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Add FileUploadField component with drag-and-drop support
  - Add new FileUploadField component to UI package with comprehensive file upload functionality
  - Implement drag-and-drop file upload with visual feedback states
  - Add file size validation with customizable limits
  - Add file type validation via accept prop
  - Include optional base64 conversion for storage
  - Provide visual feedback for upload states (idle, processing, success, error)
  - Full accessibility support with ARIA attributes and keyboard navigation
  - Integration with React Hook Form for validation
  - Add file-upload field type to types package
  - Register FileUploadField in renderer field registry

  Usage: Designed primarily for uploading contract artifacts (ZIP files) in Midnight adapter, but suitable for any file upload needs across the application.

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

## 0.12.0

### Minor Changes

- [#196](https://github.com/OpenZeppelin/ui-builder/pull/196) [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500) Thanks [@pasevin](https://github.com/pasevin)! - Embed icon components in network configs; remove legacy icon string and dynamic icon usage.
  - Build performance: dramatically reduced build time and output file count
  - Runtime: no increase to runtime bundle size
  - API: `iconComponent` added to BaseNetworkConfig; `icon` string removed
  - Adapters: import specific `@web3icons/react` icons and set on configs
  - UI: prefer `network.iconComponent` when present

- [#196](https://github.com/OpenZeppelin/ui-builder/pull/196) [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500) Thanks [@pasevin](https://github.com/pasevin)! - Embed icon components in network configs; remove legacy icon string and dynamic icon usage. Improves build time and output file count; no runtime bundle size increase.

## 0.10.1

### Patch Changes

- [#183](https://github.com/OpenZeppelin/ui-builder/pull/183) [`702ca91`](https://github.com/OpenZeppelin/ui-builder/commit/702ca91f01a35057e6d1c1809aa00bfd926bcd98) Thanks [@pasevin](https://github.com/pasevin)! - Fix BytesN parameter handling in Stellar forms so base64 inputs reuse the bytes field, propagate max byte hints, and convert to ScVal correctly.

## 0.10.0

### Minor Changes

- [#172](https://github.com/OpenZeppelin/ui-builder/pull/172) [`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d) Thanks [@pasevin](https://github.com/pasevin)! - Rename packages from "@openzeppelin/contracts-ui-builder-_" to "@openzeppelin/ui-builder-_" and update imports across the monorepo. Legacy packages will be deprecated on npm with guidance to the new names.

## 0.9.0

### Minor Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

- [#162](https://github.com/OpenZeppelin/contracts-ui-builder/pull/162) [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93) Thanks [@pasevin](https://github.com/pasevin)! - Add Sourcify fallback, deep-link orchestration, provider settings UI, RouterService/deepLink utils, and ContractAdapter/app-config extensions.

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - New FormField UI component for enum type handling and representation

### Patch Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - Enhance base wallet connection status interface
  - Enhance `WalletConnectionStatus` interface with additional universal properties (isConnecting, isDisconnected, isReconnecting, status, connector)
  - Remove chain-specific properties (addresses, chain) from base interface to maintain chain-agnostic design
  - Support inheritance pattern for chain-specific extensions while preserving structural typing compatibility
  - Enable richer wallet UX data across all adapters without sacrificing architectural principles

## 0.8.0

### Minor Changes

- [#145](https://github.com/OpenZeppelin/contracts-ui-builder/pull/145) [`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

## 0.4.0

### Minor Changes

- [#106](https://github.com/OpenZeppelin/contracts-ui-builder/pull/106) [`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b) Thanks [@pasevin](https://github.com/pasevin)! - Extend ProxyInfo with optional adminAddress; add optional adapter method filterAutoQueryableFunctions for chain-specific auto-query filtering.

## 0.3.0

### Minor Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - feat: Added the `ProxyInfo` type to support the new proxy detection feature and updated the `ContractAdapter` interface to include it.

## 0.2.1

### Patch Changes

- [#64](https://github.com/OpenZeppelin/contracts-ui-builder/pull/64) [`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479) Thanks [@pasevin](https://github.com/pasevin)! - changed import sorting library

## 0.2.0

### Minor Changes

- [#56](https://github.com/OpenZeppelin/contracts-ui-builder/pull/56) [`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81) Thanks [@pasevin](https://github.com/pasevin)! - Support for the new Etherscan V2 Client by the EVM Adapter

## 0.1.2

### Patch Changes

- [#52](https://github.com/OpenZeppelin/contracts-ui-builder/pull/52) [`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037) Thanks [@pasevin](https://github.com/pasevin)! - resolves clean build issues due to missing packages

## 1.17.0

### Minor Changes

- [#39](https://github.com/OpenZeppelin/transaction-form-builder/pull/39) [`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a) Thanks [@pasevin](https://github.com/pasevin)! - Supports block explorer configuration in the UI

## 1.16.0

### Minor Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps
