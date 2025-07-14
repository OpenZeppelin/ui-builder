# @openzeppelin/transaction-form-builder-core

## 1.20.0

### Minor Changes

- [#46](https://github.com/OpenZeppelin/transaction-form-builder/pull/46) [`777a246`](https://github.com/OpenZeppelin/transaction-form-builder/commit/777a246fa3c4112ee91fd2a0279e86267d0574e5) Thanks [@pasevin](https://github.com/pasevin)! - Add support for 9 major EVM networks

### Patch Changes

- Updated dependencies [[`777a246`](https://github.com/OpenZeppelin/transaction-form-builder/commit/777a246fa3c4112ee91fd2a0279e86267d0574e5)]:
  - @openzeppelin/transaction-form-adapter-evm@1.18.0

## 1.19.0

### Minor Changes

- [`ac72bfd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac72bfddf5e16b75b82a9d33713b37b97dc71f88) Thanks [@pasevin](https://github.com/pasevin)! - deduplicates code

### Patch Changes

- Updated dependencies [[`ac72bfd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac72bfddf5e16b75b82a9d33713b37b97dc71f88)]:
  - @openzeppelin/transaction-form-react-core@1.17.0
  - @openzeppelin/transaction-form-ui@1.18.0
  - @openzeppelin/transaction-form-adapter-midnight@0.3.1
  - @openzeppelin/transaction-form-renderer@1.17.1

## 1.18.1

### Patch Changes

- [#42](https://github.com/OpenZeppelin/transaction-form-builder/pull/42) [`2d9a867`](https://github.com/OpenZeppelin/transaction-form-builder/commit/2d9a86741f1b7cd71ca8e45f36e26ceef9d5b809) Thanks [@pasevin](https://github.com/pasevin)! - docker support

- Updated dependencies [[`2d9a867`](https://github.com/OpenZeppelin/transaction-form-builder/commit/2d9a86741f1b7cd71ca8e45f36e26ceef9d5b809)]:
  - @openzeppelin/transaction-form-adapter-evm@1.17.1

## 1.18.0

### Minor Changes

- [#39](https://github.com/OpenZeppelin/transaction-form-builder/pull/39) [`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a) Thanks [@pasevin](https://github.com/pasevin)! - Supports block explorer configuration in the UI

### Patch Changes

- Updated dependencies [[`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a)]:
  - @openzeppelin/transaction-form-adapter-midnight@0.3.0
  - @openzeppelin/transaction-form-adapter-stellar@0.3.0
  - @openzeppelin/transaction-form-adapter-solana@0.3.0
  - @openzeppelin/transaction-form-renderer@1.17.0
  - @openzeppelin/transaction-form-adapter-evm@1.17.0
  - @openzeppelin/contracts-ui-builder-types@1.17.0
  - @openzeppelin/transaction-form-utils@1.17.0
  - @openzeppelin/transaction-form-ui@1.17.0

## 1.17.0

### Minor Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps

### Patch Changes

- Updated dependencies [[`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe)]:
  - @openzeppelin/transaction-form-renderer@1.16.0
  - @openzeppelin/transaction-form-adapter-evm@1.16.0
  - @openzeppelin/transaction-form-react-core@1.16.0
  - @openzeppelin/transaction-form-styles@1.16.0
  - @openzeppelin/contracts-ui-builder-types@1.16.0
  - @openzeppelin/transaction-form-utils@1.16.0
  - @openzeppelin/transaction-form-ui@1.16.0
  - @openzeppelin/transaction-form-adapter-midnight@0.2.2
  - @openzeppelin/transaction-form-adapter-stellar@0.2.1
  - @openzeppelin/transaction-form-adapter-solana@0.2.1

## 1.16.0

### Minor Changes

- [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d) Thanks [@pasevin](https://github.com/pasevin)! - Add auto-collapsible OptionSelector with icon support and responsive layout fixes

  Enhanced OptionSelector component with automatic collapsing behavior, icon support, and improved responsive layouts across FormBuilder components including ExecutionMethodSettings, PrimaryMethodSelector, RelayerHeader, and UiKitSettings.

### Patch Changes

- [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d) Thanks [@pasevin](https://github.com/pasevin)! - Fix checkbox state reset when switching between fields

  Resolved issue where checkbox states were not properly reset when switching between different fields in the FieldEditor. Added proper state management in fieldEditorUtils to ensure clean state transitions.

- [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d) Thanks [@pasevin](https://github.com/pasevin)! - Improve size responsiveness across UI components

  Enhanced responsive layout and sizing for RelayerConfiguration components including RelayerCredentialsCard, RelayerGasConfigurationCard, RelayerHeader, RelayerSelectionCard, and RelayerDetailsCard. Improved address display component responsiveness.

- Updated dependencies [[`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d), [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d), [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d)]:
  - @openzeppelin/transaction-form-adapter-evm@1.15.1
  - @openzeppelin/transaction-form-renderer@1.15.1
  - @openzeppelin/transaction-form-ui@1.15.1
  - @openzeppelin/transaction-form-adapter-midnight@0.2.1
