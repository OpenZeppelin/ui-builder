# @openzeppelin/transaction-form-builder-core

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
