# @openzeppelin/transaction-form-adapter-evm

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
