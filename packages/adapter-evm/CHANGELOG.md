# @openzeppelin/transaction-form-adapter-evm

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
