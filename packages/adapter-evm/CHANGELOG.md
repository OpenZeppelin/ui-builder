# @openzeppelin/transaction-form-adapter-evm

## 1.15.1

### Patch Changes

- [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d) Thanks [@pasevin](https://github.com/pasevin)! - Fix default speed configuration not being applied on initial mount

  Resolves bug where UI showed "Fast Speed Preset Active" but exported configuration used fallback gasPrice (20 gwei) instead of speed: 'fast'. Now ensures the default speed preset is properly communicated to the parent component and included in exported configurations.

- Updated dependencies [[`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d)]:
  - @openzeppelin/transaction-form-ui@1.15.1
