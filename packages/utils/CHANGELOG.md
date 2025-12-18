# @openzeppelin/transaction-form-utils

## 1.1.0

### Minor Changes

- [#279](https://github.com/OpenZeppelin/ui-builder/pull/279) [`6b4707a`](https://github.com/OpenZeppelin/ui-builder/commit/6b4707ab6f370e662942f3f00164e40fda6fda51) Thanks [@pasevin](https://github.com/pasevin)! - Add AnalyticsService for Google Analytics integration with generic event tracking support

## 1.0.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [[`940de65`](https://github.com/OpenZeppelin/ui-builder/commit/940de6518eb1e0e94559818e870179bf1375973e), [`bfbbf9b`](https://github.com/OpenZeppelin/ui-builder/commit/bfbbf9bf55883ae61d6672436cfea66040251d48), [`f9cf1c7`](https://github.com/OpenZeppelin/ui-builder/commit/f9cf1c7018d5baffeda8da6b747710bad941ce3e), [`98a9e5d`](https://github.com/OpenZeppelin/ui-builder/commit/98a9e5d670b4fc3032617705c69656213154bd1e), [`94bc4b4`](https://github.com/OpenZeppelin/ui-builder/commit/94bc4b4deedb2a3755fa5e17d161a65d37944df7)]:
  - @openzeppelin/ui-builder-types@1.0.0

## 0.16.0

### Minor Changes

- [#238](https://github.com/OpenZeppelin/ui-builder/pull/238) [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195) Thanks [@pasevin](https://github.com/pasevin)! - Add shared numeric validation bounds utility and enhance all adapters to apply type-specific min/max validation for integer types. Numeric bounds are now automatically applied to form fields based on chain-specific type names (e.g., uint32, U32, Uint<0..255>), improving input validation and user experience.

### Patch Changes

- Updated dependencies [[`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195)]:
  - @openzeppelin/ui-builder-types@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0

## 0.14.0

### Minor Changes

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Add `getBytesSize` utility function to extract size from `Bytes<N>` type strings. This function parses type strings like "Bytes<32>" and returns the size as a number, or undefined for dynamic types like "Uint8Array". Useful for validating fixed-size byte arrays in adapters.

### Patch Changes

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Midnight adapter contract ingestion and shared gating
  - Midnight: move loading to contract/loader; return contractDefinitionArtifacts; keep adapter thin.
  - Builder: replace local required-field gating with shared utils (getMissingRequiredContractInputs); remove redundant helper.
  - Utils: add contractInputs shared helpers and tests.
  - Storage/App/UI: persist and rehydrate contractDefinitionArtifacts; auto-save triggers on artifact changes.

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-types@0.14.0

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

## 0.12.0

### Patch Changes

- Updated dependencies [[`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500), [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500)]:
  - @openzeppelin/ui-builder-types@0.12.0

## 0.10.1

### Patch Changes

- [#181](https://github.com/OpenZeppelin/ui-builder/pull/181) [`47ee098`](https://github.com/OpenZeppelin/ui-builder/commit/47ee098b9d17241cb9323e0b644c3e36957ec358) Thanks [@pasevin](https://github.com/pasevin)! - Disable logs in staging/production by honoring VITE_EXPORT_ENV in logger defaults.
  Also keep logs enabled only for development/test.
- Updated dependencies [[`702ca91`](https://github.com/OpenZeppelin/ui-builder/commit/702ca91f01a35057e6d1c1809aa00bfd926bcd98)]:
  - @openzeppelin/ui-builder-types@0.10.1

## 0.10.0

### Minor Changes

- [#172](https://github.com/OpenZeppelin/ui-builder/pull/172) [`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d) Thanks [@pasevin](https://github.com/pasevin)! - Rename packages from "@openzeppelin/contracts-ui-builder-_" to "@openzeppelin/ui-builder-_" and update imports across the monorepo. Legacy packages will be deprecated on npm with guidance to the new names.

### Patch Changes

- Updated dependencies [[`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d)]:
  - @openzeppelin/ui-builder-types@0.10.0

## 0.9.0

### Minor Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

- [#162](https://github.com/OpenZeppelin/contracts-ui-builder/pull/162) [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93) Thanks [@pasevin](https://github.com/pasevin)! - Add Sourcify fallback, deep-link orchestration, provider settings UI, RouterService/deepLink utils, and ContractAdapter/app-config extensions.

### Patch Changes

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0

## 0.8.0

### Minor Changes

- [#145](https://github.com/OpenZeppelin/contracts-ui-builder/pull/145) [`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/ui-builder-types@0.8.0

## 0.7.0

### Minor Changes

- [#131](https://github.com/OpenZeppelin/contracts-ui-builder/pull/131) [`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec) Thanks [@pasevin](https://github.com/pasevin)! - implements ecosystem-namespaced wallet UI configuration to support different wallet UI kits for different blockchain ecosystems

## 0.4.1

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/ui-builder-types@0.4.0

## 0.4.0

### Minor Changes

- [#74](https://github.com/OpenZeppelin/contracts-ui-builder/pull/74) [`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c) Thanks [@pasevin](https://github.com/pasevin)! - implement google analytics and a common footer

## 0.3.1

### Patch Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - feat: Added a simple hashing utility for ABI comparison purposes.

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/ui-builder-types@0.3.0

## 0.3.0

### Minor Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - support contracts UIs CRUD

## 0.2.1

### Patch Changes

- [#64](https://github.com/OpenZeppelin/contracts-ui-builder/pull/64) [`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479) Thanks [@pasevin](https://github.com/pasevin)! - changed import sorting library

- Updated dependencies [[`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479)]:
  - @openzeppelin/ui-builder-types@0.2.1

## 0.2.0

### Minor Changes

- [#56](https://github.com/OpenZeppelin/contracts-ui-builder/pull/56) [`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81) Thanks [@pasevin](https://github.com/pasevin)! - Support for the new Etherscan V2 Client by the EVM Adapter

### Patch Changes

- Updated dependencies [[`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81)]:
  - @openzeppelin/ui-builder-types@0.2.0

## 1.17.0

### Minor Changes

- [#39](https://github.com/OpenZeppelin/transaction-form-builder/pull/39) [`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a) Thanks [@pasevin](https://github.com/pasevin)! - Supports block explorer configuration in the UI

### Patch Changes

- Updated dependencies [[`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a)]:
  - @openzeppelin/ui-builder-types@1.17.0

## 1.16.0

### Minor Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps

### Patch Changes

- Updated dependencies [[`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe)]:
  - @openzeppelin/ui-builder-types@1.16.0
