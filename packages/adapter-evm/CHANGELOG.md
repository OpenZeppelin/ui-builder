# @openzeppelin/transaction-form-adapter-evm

## 0.9.0

### Minor Changes

- [#162](https://github.com/OpenZeppelin/contracts-ui-builder/pull/162) [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93) Thanks [@pasevin](https://github.com/pasevin)! - Add Sourcify fallback, deep-link orchestration, provider settings UI, RouterService/deepLink utils, and ContractAdapter/app-config extensions.

### Patch Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - Refactor wallet interface architecture for consistency
  - Move `EvmWalletConnectionStatus` interface to `wallet/types.ts` for better organization
  - Add `convertWagmiToEvmStatus` utility function to eliminate code duplication
  - Fix chainId type conversion in execution config validation to handle both string and number types
  - Update wallet barrel exports to include new types and utilities
  - Maintain structural compatibility with base `WalletConnectionStatus` interface

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - remove broken address validation from field configs

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - Update EVM adapter execution strategy interface to use TxStatus instead of string

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - clean up redundant ternary in array field validation

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0
  - @openzeppelin/contracts-ui-builder-ui@0.9.0
  - @openzeppelin/contracts-ui-builder-react-core@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/contracts-ui-builder-types@0.8.0
  - @openzeppelin/contracts-ui-builder-utils@0.8.0
  - @openzeppelin/contracts-ui-builder-ui@0.8.0
  - @openzeppelin/contracts-ui-builder-react-core@0.8.0

## 0.7.1

### Patch Changes

- [#137](https://github.com/OpenZeppelin/contracts-ui-builder/pull/137) [`73db143`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/73db1436f5c6f44062a39f262bad9a542fb85bb9) Thanks [@pasevin](https://github.com/pasevin)! - clean up redundant ternary in array field validation

- Updated dependencies [[`73db143`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/73db1436f5c6f44062a39f262bad9a542fb85bb9), [`49d7d6c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/49d7d6c38d1890a67dfbf514161e71f46849a123)]:
  - @openzeppelin/contracts-ui-builder-ui@0.7.1

## 0.7.0

### Minor Changes

- [#131](https://github.com/OpenZeppelin/contracts-ui-builder/pull/131) [`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec) Thanks [@pasevin](https://github.com/pasevin)! - implements ecosystem-namespaced wallet UI configuration to support different wallet UI kits for different blockchain ecosystems

### Patch Changes

- Updated dependencies [[`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec)]:
  - @openzeppelin/contracts-ui-builder-utils@0.7.0
  - @openzeppelin/contracts-ui-builder-react-core@0.7.0
  - @openzeppelin/contracts-ui-builder-ui@0.7.0

## 0.6.0

### Minor Changes

- [#129](https://github.com/OpenZeppelin/contracts-ui-builder/pull/129) [`a4236e9`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/a4236e95ddda6530dfd2a87c4bc8a0915e9ff332) Thanks [@stevedylandev](https://github.com/stevedylandev)! - Patched Monad testnet config

- [#122](https://github.com/OpenZeppelin/contracts-ui-builder/pull/122) [`3a85c72`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3a85c7296ca05c2edb9931966089f4bfd04e105a) Thanks [@stevedylandev](https://github.com/stevedylandev)! - Added Monad Testnet support

### Patch Changes

- [#127](https://github.com/OpenZeppelin/contracts-ui-builder/pull/127) [`acc7037`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/acc70372e7b815026331ed76f77a5d55633ec547) Thanks [@pasevin](https://github.com/pasevin)! - feat(adapter-evm): change cystom ui kit name

## 0.5.0

### Minor Changes

- [#106](https://github.com/OpenZeppelin/contracts-ui-builder/pull/106) [`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b) Thanks [@pasevin](https://github.com/pasevin)! - Resolve legacy OpenZeppelin proxy implementation/admin via storage slots; expose adminAddress in proxy info; delegate auto-query filtering to adapter to avoid admin-only getters; add storage-slot debug logs.

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/contracts-ui-builder-types@0.4.0
  - @openzeppelin/contracts-ui-builder-react-core@0.2.5
  - @openzeppelin/contracts-ui-builder-ui@0.5.1
  - @openzeppelin/contracts-ui-builder-utils@0.4.1

## 0.4.0

### Minor Changes

- [#91](https://github.com/OpenZeppelin/contracts-ui-builder/pull/91) [`6ad118f`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6ad118fcac5aeb6c807bdcc9464de98791d2a20a) Thanks [@pasevin](https://github.com/pasevin)! - a better support for mobile screen sizes

### Patch Changes

- Updated dependencies [[`6ad118f`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6ad118fcac5aeb6c807bdcc9464de98791d2a20a)]:
  - @openzeppelin/contracts-ui-builder-ui@0.5.0
  - @openzeppelin/contracts-ui-builder-react-core@0.2.4

## 0.3.2

### Patch Changes

- [#80](https://github.com/OpenZeppelin/contracts-ui-builder/pull/80) [`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc) Thanks [@pasevin](https://github.com/pasevin)! - Route all console.\* logs through centralized logger from utils, add system tags, update tests to spy on logger, restore missing createAbiFunctionItem in EVM adapter, and apply lint/prettier fixes. No public API changes.

- [#81](https://github.com/OpenZeppelin/contracts-ui-builder/pull/81) [`14171aa`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/14171aa46dfd76811551e0ba4560097736fb3420) Thanks [@pasevin](https://github.com/pasevin)! - - Stringify array args for view calls before parsing to prevent runtime failures
  - Stringify array inputs for write path to align with the parser
  - Guard relayer value precision (avoid Number overflow) and warn on default gasLimit
  - Honor RPC overrides in proxy detection and remove variable shadowingNo breaking changes; behavior is more robust and config-compliant.
- Updated dependencies [[`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc)]:
  - @openzeppelin/contracts-ui-builder-react-core@0.2.3
  - @openzeppelin/contracts-ui-builder-ui@0.4.1

## 0.3.1

### Patch Changes

- Updated dependencies [[`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c)]:
  - @openzeppelin/contracts-ui-builder-utils@0.4.0
  - @openzeppelin/contracts-ui-builder-ui@0.4.0
  - @openzeppelin/contracts-ui-builder-react-core@0.2.2

## 0.3.0

### Minor Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - feat: Implemented automatic proxy detection for UUPS and EIP-1967 patterns, enabling the adapter to load the underlying implementation ABI. Also enhanced the ABI comparison logic to provide more detailed and accurate diffs.

### Patch Changes

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/contracts-ui-builder-ui@0.3.1
  - @openzeppelin/contracts-ui-builder-utils@0.3.1
  - @openzeppelin/contracts-ui-builder-types@0.3.0
  - @openzeppelin/contracts-ui-builder-react-core@0.2.1

## 0.2.2

### Patch Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - docs update

- Updated dependencies [[`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103)]:
  - @openzeppelin/contracts-ui-builder-react-core@0.2.0
  - @openzeppelin/contracts-ui-builder-utils@0.3.0
  - @openzeppelin/contracts-ui-builder-ui@0.3.0

## 0.2.1

### Patch Changes

- [#64](https://github.com/OpenZeppelin/contracts-ui-builder/pull/64) [`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479) Thanks [@pasevin](https://github.com/pasevin)! - changed import sorting library

- Updated dependencies [[`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479)]:
  - @openzeppelin/contracts-ui-builder-react-core@0.1.4
  - @openzeppelin/contracts-ui-builder-types@0.2.1
  - @openzeppelin/contracts-ui-builder-utils@0.2.1
  - @openzeppelin/contracts-ui-builder-ui@0.2.1

## 0.2.0

### Minor Changes

- [#56](https://github.com/OpenZeppelin/contracts-ui-builder/pull/56) [`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81) Thanks [@pasevin](https://github.com/pasevin)! - New Etherscan V2 API Client. Etherscan V2 has been enabled by default for mainnet and testnet networks, with example configurations provided to guide users.

### Patch Changes

- Updated dependencies [[`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81)]:
  - @openzeppelin/contracts-ui-builder-types@0.2.0
  - @openzeppelin/contracts-ui-builder-utils@0.2.0
  - @openzeppelin/contracts-ui-builder-ui@0.2.0
  - @openzeppelin/contracts-ui-builder-react-core@0.1.3

## 0.1.3

### Patch Changes

- [#54](https://github.com/OpenZeppelin/contracts-ui-builder/pull/54) [`63fca98`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/63fca981f56bf9b2bb7c43c720bea3cbbd53d6f6) Thanks [@pasevin](https://github.com/pasevin)! - pre-release clean up and improvements

- Updated dependencies [[`63fca98`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/63fca981f56bf9b2bb7c43c720bea3cbbd53d6f6)]:
  - @openzeppelin/contracts-ui-builder-ui@0.1.3

## 0.1.2

### Patch Changes

- [#52](https://github.com/OpenZeppelin/contracts-ui-builder/pull/52) [`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037) Thanks [@pasevin](https://github.com/pasevin)! - resolves clean build issues due to missing packages

- Updated dependencies [[`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037)]:
  - @openzeppelin/contracts-ui-builder-react-core@0.1.2
  - @openzeppelin/contracts-ui-builder-types@0.1.2
  - @openzeppelin/contracts-ui-builder-ui@0.1.2

## 1.18.0

### Minor Changes

- [#46](https://github.com/OpenZeppelin/transaction-form-builder/pull/46) [`777a246`](https://github.com/OpenZeppelin/transaction-form-builder/commit/777a246fa3c4112ee91fd2a0279e86267d0574e5) Thanks [@pasevin](https://github.com/pasevin)! - Add support for 9 major EVM networks

## 1.17.1

### Patch Changes

- [#42](https://github.com/OpenZeppelin/transaction-form-builder/pull/42) [`2d9a867`](https://github.com/OpenZeppelin/transaction-form-builder/commit/2d9a86741f1b7cd71ca8e45f36e26ceef9d5b809) Thanks [@pasevin](https://github.com/pasevin)! - sync package versions

## 1.17.0

### Minor Changes

- [#39](https://github.com/OpenZeppelin/transaction-form-builder/pull/39) [`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a) Thanks [@pasevin](https://github.com/pasevin)! - Supports block explorer configuration in the UI

### Patch Changes

- Updated dependencies [[`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a)]:
  - @openzeppelin/transaction-form-types@1.17.0
  - @openzeppelin/transaction-form-utils@1.17.0
  - @openzeppelin/transaction-form-ui@1.17.0

## 1.16.0

### Minor Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps

### Patch Changes

- Updated dependencies [[`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe)]:
  - @openzeppelin/transaction-form-react-core@1.16.0
  - @openzeppelin/transaction-form-types@1.16.0
  - @openzeppelin/transaction-form-utils@1.16.0
  - @openzeppelin/transaction-form-ui@1.16.0

## 1.15.1

### Patch Changes

- [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d) Thanks [@pasevin](https://github.com/pasevin)! - Fix default speed configuration not being applied on initial mount

  Resolves bug where UI showed "Fast Speed Preset Active" but exported configuration used fallback gasPrice (20 gwei) instead of speed: 'fast'. Now ensures the default speed preset is properly communicated to the parent component and included in exported configurations.

- Updated dependencies [[`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d)]:
  - @openzeppelin/transaction-form-ui@1.15.1
