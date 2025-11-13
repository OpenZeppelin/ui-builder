# @openzeppelin/transaction-form-react-core

## 0.15.0

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0
  - @openzeppelin/ui-builder-renderer@0.15.0
  - @openzeppelin/ui-builder-ui@0.15.0
  - @openzeppelin/ui-builder-utils@0.15.0

## 0.14.0

### Patch Changes

- [#222](https://github.com/OpenZeppelin/ui-builder/pull/222) [`8422e81`](https://github.com/OpenZeppelin/ui-builder/commit/8422e81cd4425d5fc596ac805bc130a80030fc93) Thanks [@pasevin](https://github.com/pasevin)! - Fix Stellar UI kit wallet connection and Execute Transaction button issues
  - Fix WalletConnectionUI to recompute wallet components on each render, ensuring UI kit changes are reflected immediately when toggling between "Stellar Wallets Kit Custom" and "Stellar Wallets Kit"
  - Fix StellarWalletsKitConnectButton to propagate connection state changes to adapter's wallet implementation, ensuring Execute Transaction button enables when wallet is connected
  - Wire active StellarWalletsKit instance into wallet implementation for proper kit instance management across connect/disconnect/sign operations
  - Ensure connection state flows correctly through context hooks so useDerivedAccountStatus properly detects wallet connection

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-ui@0.14.0
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-renderer@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [[`68c0aed`](https://github.com/OpenZeppelin/ui-builder/commit/68c0aed14f3597df8c52dc8667e420624399b8d2)]:
  - @openzeppelin/ui-builder-types@0.13.0
  - @openzeppelin/ui-builder-ui@0.13.0
  - @openzeppelin/ui-builder-utils@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [[`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500), [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500)]:
  - @openzeppelin/ui-builder-types@0.12.0
  - @openzeppelin/ui-builder-ui@0.12.0
  - @openzeppelin/ui-builder-utils@0.12.0

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

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - Fix wallet UI mounting issue when switching between ecosystems
  - Fix React key generation bug in `WalletStateProvider` that prevented Stellar wallet UI from mounting after switching from EVM networks
  - Update key generation to use `${ecosystem}-${networkId}` format for proper component unmounting/mounting
  - Remove unused `lastFullUiKitConfiguration` property from `ExtendedContractAdapter` interface
  - Ensure proper wallet UI reconciliation when switching between different blockchain ecosystems

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0
  - @openzeppelin/contracts-ui-builder-ui@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/ui-builder-types@0.8.0
  - @openzeppelin/ui-builder-utils@0.8.0
  - @openzeppelin/ui-builder-ui@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [[`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec)]:
  - @openzeppelin/ui-builder-utils@0.7.0
  - @openzeppelin/ui-builder-ui@0.7.0

## 0.2.5

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/ui-builder-types@0.4.0
  - @openzeppelin/ui-builder-ui@0.5.1
  - @openzeppelin/ui-builder-utils@0.4.1

## 0.2.4

### Patch Changes

- Updated dependencies [[`6ad118f`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6ad118fcac5aeb6c807bdcc9464de98791d2a20a)]:
  - @openzeppelin/ui-builder-ui@0.5.0

## 0.2.3

### Patch Changes

- [#80](https://github.com/OpenZeppelin/contracts-ui-builder/pull/80) [`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc) Thanks [@pasevin](https://github.com/pasevin)! - Route all console.\* logs through centralized logger from utils, add system tags, update tests to spy on logger, restore missing createAbiFunctionItem in EVM adapter, and apply lint/prettier fixes. No public API changes.

- Updated dependencies [[`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc)]:
  - @openzeppelin/ui-builder-ui@0.4.1

## 0.2.2

### Patch Changes

- Updated dependencies [[`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c)]:
  - @openzeppelin/ui-builder-utils@0.4.0
  - @openzeppelin/ui-builder-ui@0.4.0

## 0.2.1

### Patch Changes

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/ui-builder-ui@0.3.1
  - @openzeppelin/ui-builder-utils@0.3.1
  - @openzeppelin/ui-builder-types@0.3.0

## 0.2.0

### Minor Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - support contracts UIs CRUD

### Patch Changes

- Updated dependencies [[`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103)]:
  - @openzeppelin/ui-builder-utils@0.3.0
  - @openzeppelin/ui-builder-ui@0.3.0

## 0.1.4

### Patch Changes

- [#64](https://github.com/OpenZeppelin/contracts-ui-builder/pull/64) [`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479) Thanks [@pasevin](https://github.com/pasevin)! - changed import sorting library

- Updated dependencies [[`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479)]:
  - @openzeppelin/ui-builder-types@0.2.1
  - @openzeppelin/ui-builder-utils@0.2.1
  - @openzeppelin/ui-builder-ui@0.2.1

## 0.1.3

### Patch Changes

- Updated dependencies [[`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81)]:
  - @openzeppelin/ui-builder-types@0.2.0
  - @openzeppelin/ui-builder-utils@0.2.0
  - @openzeppelin/ui-builder-ui@0.2.0

## 0.1.2

### Patch Changes

- [#52](https://github.com/OpenZeppelin/contracts-ui-builder/pull/52) [`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037) Thanks [@pasevin](https://github.com/pasevin)! - resolves clean build issues due to missing packages

- Updated dependencies [[`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037)]:
  - @openzeppelin/ui-builder-types@0.1.2
  - @openzeppelin/ui-builder-ui@0.1.2

## 1.17.0

### Minor Changes

- [`ac72bfd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac72bfddf5e16b75b82a9d33713b37b97dc71f88) Thanks [@pasevin](https://github.com/pasevin)! - deduplicates code

### Patch Changes

- Updated dependencies [[`ac72bfd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac72bfddf5e16b75b82a9d33713b37b97dc71f88)]:
  - @openzeppelin/transaction-form-ui@1.18.0

## 1.16.0

### Minor Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps

### Patch Changes

- Updated dependencies [[`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe)]:
  - @openzeppelin/ui-builder-types@1.16.0
  - @openzeppelin/transaction-form-utils@1.16.0
  - @openzeppelin/transaction-form-ui@1.16.0
