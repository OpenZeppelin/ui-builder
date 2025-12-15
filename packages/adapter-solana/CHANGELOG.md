# @openzeppelin/transaction-form-adapter-solana

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

### Patch Changes

- Updated dependencies [[`940de65`](https://github.com/OpenZeppelin/ui-builder/commit/940de6518eb1e0e94559818e870179bf1375973e), [`bfbbf9b`](https://github.com/OpenZeppelin/ui-builder/commit/bfbbf9bf55883ae61d6672436cfea66040251d48), [`f9cf1c7`](https://github.com/OpenZeppelin/ui-builder/commit/f9cf1c7018d5baffeda8da6b747710bad941ce3e), [`98a9e5d`](https://github.com/OpenZeppelin/ui-builder/commit/98a9e5d670b4fc3032617705c69656213154bd1e), [`94bc4b4`](https://github.com/OpenZeppelin/ui-builder/commit/94bc4b4deedb2a3755fa5e17d161a65d37944df7)]:
  - @openzeppelin/ui-builder-types@1.0.0
  - @openzeppelin/ui-builder-utils@1.0.0

## 0.16.0

### Patch Changes

- Updated dependencies [[`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195), [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195)]:
  - @openzeppelin/ui-builder-utils@0.16.0
  - @openzeppelin/ui-builder-types@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0
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

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [[`68c0aed`](https://github.com/OpenZeppelin/ui-builder/commit/68c0aed14f3597df8c52dc8667e420624399b8d2)]:
  - @openzeppelin/ui-builder-types@0.13.0
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
  - @openzeppelin/ui-builder-utils@0.12.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`47ee098`](https://github.com/OpenZeppelin/ui-builder/commit/47ee098b9d17241cb9323e0b644c3e36957ec358), [`702ca91`](https://github.com/OpenZeppelin/ui-builder/commit/702ca91f01a35057e6d1c1809aa00bfd926bcd98)]:
  - @openzeppelin/ui-builder-utils@0.10.1
  - @openzeppelin/ui-builder-types@0.10.1

## 0.10.0

### Minor Changes

- [#172](https://github.com/OpenZeppelin/ui-builder/pull/172) [`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d) Thanks [@pasevin](https://github.com/pasevin)! - Rename packages from "@openzeppelin/contracts-ui-builder-_" to "@openzeppelin/ui-builder-_" and update imports across the monorepo. Legacy packages will be deprecated on npm with guidance to the new names.

### Patch Changes

- Updated dependencies [[`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d)]:
  - @openzeppelin/ui-builder-types@0.10.0
  - @openzeppelin/ui-builder-utils@0.10.0

## 0.9.0

### Patch Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - Refactor wallet interface architecture for consistency
  - Move `SolanaWalletConnectionStatus` interface to `wallet/types.ts` for better organization
  - Update wallet connection functions to use two-parameter callback signature
  - Maintain structural compatibility with base `WalletConnectionStatus` interface
  - Align wallet directory structure with other adapters for architectural consistency
  - Update barrel exports to include new wallet types

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0

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

- [#52](https://github.com/OpenZeppelin/contracts-ui-builder/pull/52) [`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037) Thanks [@pasevin](https://github.com/pasevin)! - resolves clean build issues due to missing packages

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
