# @openzeppelin/transaction-form-ui

## 0.15.0

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0
  - @openzeppelin/ui-builder-utils@0.15.0

## 0.14.0

### Minor Changes

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

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Midnight adapter contract ingestion and shared gating
  - Midnight: move loading to contract/loader; return contractDefinitionArtifacts; keep adapter thin.
  - Builder: replace local required-field gating with shared utils (getMissingRequiredContractInputs); remove redundant helper.
  - Utils: add contractInputs shared helpers and tests.
  - Storage/App/UI: persist and rehydrate contractDefinitionArtifacts; auto-save triggers on artifact changes.

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

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

### Minor Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

- [#162](https://github.com/OpenZeppelin/contracts-ui-builder/pull/162) [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93) Thanks [@pasevin](https://github.com/pasevin)! - Add Sourcify fallback, deep-link orchestration, provider settings UI, RouterService/deepLink utils, and ContractAdapter/app-config extensions.

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - New FormField UI component for enum type handling and representation

### Patch Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - allow zero values in ArrayField required validation

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - snapshot pre-append and fallback setValue to fix add-item with default 0 in ArrayField

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0

## 0.8.0

### Minor Changes

- [#145](https://github.com/OpenZeppelin/contracts-ui-builder/pull/145) [`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/ui-builder-types@0.8.0
  - @openzeppelin/ui-builder-utils@0.8.0

## 0.7.2

### Patch Changes

- [#143](https://github.com/OpenZeppelin/contracts-ui-builder/pull/143) [`f344326`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/f344326aab505e16468ec1b45708fc28a53df192) Thanks [@pasevin](https://github.com/pasevin)! - stabilize array ops across contexts

## 0.7.1

### Patch Changes

- [#137](https://github.com/OpenZeppelin/contracts-ui-builder/pull/137) [`73db143`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/73db1436f5c6f44062a39f262bad9a542fb85bb9) Thanks [@pasevin](https://github.com/pasevin)! - allow zero values in ArrayField required validation

- [#139](https://github.com/OpenZeppelin/contracts-ui-builder/pull/139) [`49d7d6c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/49d7d6c38d1890a67dfbf514161e71f46849a123) Thanks [@pasevin](https://github.com/pasevin)! - snapshot pre-append and fallback setValue to fix add-item with default 0 in ArrayField

## 0.7.0

### Patch Changes

- Updated dependencies [[`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec)]:
  - @openzeppelin/ui-builder-utils@0.7.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/ui-builder-types@0.4.0
  - @openzeppelin/ui-builder-utils@0.4.1

## 0.5.0

### Minor Changes

- [#91](https://github.com/OpenZeppelin/contracts-ui-builder/pull/91) [`6ad118f`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6ad118fcac5aeb6c807bdcc9464de98791d2a20a) Thanks [@pasevin](https://github.com/pasevin)! - a better support for mobile screen sizes

## 0.4.1

### Patch Changes

- [#80](https://github.com/OpenZeppelin/contracts-ui-builder/pull/80) [`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc) Thanks [@pasevin](https://github.com/pasevin)! - Route all console.\* logs through centralized logger from utils, add system tags, update tests to spy on logger, restore missing createAbiFunctionItem in EVM adapter, and apply lint/prettier fixes. No public API changes.

## 0.4.0

### Minor Changes

- [#74](https://github.com/OpenZeppelin/contracts-ui-builder/pull/74) [`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c) Thanks [@pasevin](https://github.com/pasevin)! - implement google analytics and a common footer

### Patch Changes

- Updated dependencies [[`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c)]:
  - @openzeppelin/ui-builder-utils@0.4.0

## 0.3.1

### Patch Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - feat: Added a new `CodeEditorField` component to provide a dedicated input for multiline code, such as contract ABIs.

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/ui-builder-utils@0.3.1
  - @openzeppelin/ui-builder-types@0.3.0

## 0.3.0

### Minor Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - support contracts UIs CRUD

### Patch Changes

- Updated dependencies [[`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103)]:
  - @openzeppelin/ui-builder-utils@0.3.0

## 0.2.1

### Patch Changes

- [#64](https://github.com/OpenZeppelin/contracts-ui-builder/pull/64) [`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479) Thanks [@pasevin](https://github.com/pasevin)! - changed import sorting library

- Updated dependencies [[`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479)]:
  - @openzeppelin/ui-builder-types@0.2.1
  - @openzeppelin/ui-builder-utils@0.2.1

## 0.2.0

### Minor Changes

- [#56](https://github.com/OpenZeppelin/contracts-ui-builder/pull/56) [`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81) Thanks [@pasevin](https://github.com/pasevin)! - Support for the new Etherscan V2 Client by the EVM Adapter

### Patch Changes

- Updated dependencies [[`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81)]:
  - @openzeppelin/ui-builder-types@0.2.0
  - @openzeppelin/ui-builder-utils@0.2.0

## 0.1.3

### Patch Changes

- [#54](https://github.com/OpenZeppelin/contracts-ui-builder/pull/54) [`63fca98`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/63fca981f56bf9b2bb7c43c720bea3cbbd53d6f6) Thanks [@pasevin](https://github.com/pasevin)! - pre-release clean up and improvements

## 0.1.2

### Patch Changes

- [#52](https://github.com/OpenZeppelin/contracts-ui-builder/pull/52) [`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037) Thanks [@pasevin](https://github.com/pasevin)! - resolves clean build issues due to missing packages

- Updated dependencies [[`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037)]:
  - @openzeppelin/ui-builder-types@0.1.2

## 1.18.0

### Minor Changes

- [`ac72bfd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/ac72bfddf5e16b75b82a9d33713b37b97dc71f88) Thanks [@pasevin](https://github.com/pasevin)! - deduplicates code

## 1.17.0

### Minor Changes

- [#39](https://github.com/OpenZeppelin/transaction-form-builder/pull/39) [`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a) Thanks [@pasevin](https://github.com/pasevin)! - Supports block explorer configuration in the UI

### Patch Changes

- Updated dependencies [[`f507dcd`](https://github.com/OpenZeppelin/transaction-form-builder/commit/f507dcdc6cab173c812f9111c9c57d523d20740a)]:
  - @openzeppelin/ui-builder-types@1.17.0
  - @openzeppelin/transaction-form-utils@1.17.0

## 1.16.0

### Minor Changes

- [#37](https://github.com/OpenZeppelin/transaction-form-builder/pull/37) [`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe) Thanks [@pasevin](https://github.com/pasevin)! - Introduces RPC configuration UI in the core and exported apps

### Patch Changes

- Updated dependencies [[`6b20ff8`](https://github.com/OpenZeppelin/transaction-form-builder/commit/6b20ff82cab748db41797dff0891890e35a24bfe)]:
  - @openzeppelin/ui-builder-types@1.16.0
  - @openzeppelin/transaction-form-utils@1.16.0

## 1.15.1

### Patch Changes

- [`39b196c`](https://github.com/OpenZeppelin/transaction-form-builder/commit/39b196cdea737678676f3da262e460201335d40d) Thanks [@pasevin](https://github.com/pasevin)! - Improve size responsiveness across UI components

  Enhanced responsive layout and sizing for RelayerConfiguration components including RelayerCredentialsCard, RelayerGasConfigurationCard, RelayerHeader, RelayerSelectionCard, and RelayerDetailsCard. Improved address display component responsiveness.
