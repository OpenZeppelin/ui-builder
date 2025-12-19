# @openzeppelin/transaction-form-builder-core

## 0.12.7

### Patch Changes

- Updated dependencies [[`82be765`](https://github.com/OpenZeppelin/ui-builder/commit/82be765d9ac6a1fbf0bb95596db21e0f5f3731c8)]:
  - @openzeppelin/ui-builder-adapter-stellar@1.1.2

## 0.12.6

### Patch Changes

- Updated dependencies [[`5527175`](https://github.com/OpenZeppelin/ui-builder/commit/5527175640f864407f371c4a0a031d21c6410877)]:
  - @openzeppelin/ui-builder-adapter-stellar@1.1.1

## 0.12.5

### Patch Changes

- Updated dependencies [[`6b4707a`](https://github.com/OpenZeppelin/ui-builder/commit/6b4707ab6f370e662942f3f00164e40fda6fda51), [`6b4707a`](https://github.com/OpenZeppelin/ui-builder/commit/6b4707ab6f370e662942f3f00164e40fda6fda51)]:
  - @openzeppelin/ui-builder-react-core@1.1.0
  - @openzeppelin/ui-builder-utils@1.1.0
  - @openzeppelin/ui-builder-renderer@1.1.0
  - @openzeppelin/ui-builder-ui@1.1.0
  - @openzeppelin/ui-builder-adapter-midnight@1.1.0
  - @openzeppelin/ui-builder-adapter-stellar@1.1.0

## 0.12.4

### Patch Changes

- Updated dependencies [[`940de65`](https://github.com/OpenZeppelin/ui-builder/commit/940de6518eb1e0e94559818e870179bf1375973e), [`7561580`](https://github.com/OpenZeppelin/ui-builder/commit/75615803c8c4e9848ffd469a19e5e684a92579fb), [`bfbbf9b`](https://github.com/OpenZeppelin/ui-builder/commit/bfbbf9bf55883ae61d6672436cfea66040251d48), [`4a496fe`](https://github.com/OpenZeppelin/ui-builder/commit/4a496fe6522d4f7f30602ac25856e1a711025d7c), [`f911a9e`](https://github.com/OpenZeppelin/ui-builder/commit/f911a9ef64ad60d6b8381006f41ff398a7765e96), [`c0cb6d1`](https://github.com/OpenZeppelin/ui-builder/commit/c0cb6d1ab87c1e60e6d3c4532107cd525aaaea19), [`d74dafc`](https://github.com/OpenZeppelin/ui-builder/commit/d74dafcb83d3bc87b89aed19abc7362a5c34c02a), [`56eb3fc`](https://github.com/OpenZeppelin/ui-builder/commit/56eb3fc4970bd85a75d6ed0cb643c096668bdc69), [`fbc8ecd`](https://github.com/OpenZeppelin/ui-builder/commit/fbc8ecd527dd879b209b02878db210eadf49208c), [`f9cf1c7`](https://github.com/OpenZeppelin/ui-builder/commit/f9cf1c7018d5baffeda8da6b747710bad941ce3e), [`98a9e5d`](https://github.com/OpenZeppelin/ui-builder/commit/98a9e5d670b4fc3032617705c69656213154bd1e), [`94bc4b4`](https://github.com/OpenZeppelin/ui-builder/commit/94bc4b4deedb2a3755fa5e17d161a65d37944df7), [`923e016`](https://github.com/OpenZeppelin/ui-builder/commit/923e01634b94d6bf421a57f67aac4512e9b9b091)]:
  - @openzeppelin/ui-builder-types@1.0.0
  - @openzeppelin/ui-builder-adapter-evm@1.0.0
  - @openzeppelin/ui-builder-adapter-stellar@1.0.0
  - @openzeppelin/ui-builder-adapter-solana@1.0.0
  - @openzeppelin/ui-builder-adapter-midnight@1.0.0
  - @openzeppelin/ui-builder-ui@1.0.0
  - @openzeppelin/ui-builder-utils@1.0.0
  - @openzeppelin/ui-builder-storage@1.0.0
  - @openzeppelin/ui-builder-react-core@1.0.0
  - @openzeppelin/ui-builder-renderer@1.0.0

## 0.12.3

### Patch Changes

- Updated dependencies [[`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195), [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195)]:
  - @openzeppelin/ui-builder-utils@0.16.0
  - @openzeppelin/ui-builder-adapter-evm@0.16.0
  - @openzeppelin/ui-builder-adapter-midnight@0.16.0
  - @openzeppelin/ui-builder-adapter-stellar@0.16.0
  - @openzeppelin/ui-builder-types@0.16.0
  - @openzeppelin/ui-builder-renderer@0.16.0
  - @openzeppelin/ui-builder-ui@0.16.0
  - @openzeppelin/ui-builder-adapter-solana@0.16.0
  - @openzeppelin/ui-builder-react-core@0.16.0
  - @openzeppelin/ui-builder-storage@0.16.0

## 0.12.2

### Patch Changes

- [#236](https://github.com/OpenZeppelin/ui-builder/pull/236) [`c13561d`](https://github.com/OpenZeppelin/ui-builder/commit/c13561d6f1327c57ed1d7555df34048b68505345) Thanks [@pasevin](https://github.com/pasevin)! - Fix EVM wallet network switching on reconnection and improve UX consistency

  **Builder App**
  - Fix wallet reconnection network switch: automatically re-queue network switch when user disconnects and reconnects wallet in same session
  - Centralize "meaningful content" criteria to ensure consistent behavior across auto-save, navigation, and record filtering
  - Improve network selection UX: wallet widget now properly unmounts when navigating back to network list
  - Preserve ecosystem tab selection when going back without meaningful content
  - Fix NetworkSwitchManager to not notify completion on error conditions
  - Extract wallet reconnection logic into dedicated `useWalletReconnectionHandler` hook for better code organization

  **EVM Adapter**
  - Add RPC configuration listener to automatically invalidate cached Wagmi config when user changes RPC settings
  - Preserve wallet connection state across network switches by reusing Wagmi config instance
  - Add cleanup() method for proper resource management

  Fixes #228

- Updated dependencies [[`c13561d`](https://github.com/OpenZeppelin/ui-builder/commit/c13561d6f1327c57ed1d7555df34048b68505345)]:
  - @openzeppelin/ui-builder-adapter-evm@0.15.1

## 0.12.1

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-adapter-midnight@0.15.0
  - @openzeppelin/ui-builder-types@0.15.0
  - @openzeppelin/ui-builder-adapter-evm@0.15.0
  - @openzeppelin/ui-builder-adapter-solana@0.15.0
  - @openzeppelin/ui-builder-adapter-stellar@0.15.0
  - @openzeppelin/ui-builder-react-core@0.15.0
  - @openzeppelin/ui-builder-renderer@0.15.0
  - @openzeppelin/ui-builder-storage@0.15.0
  - @openzeppelin/ui-builder-ui@0.15.0
  - @openzeppelin/ui-builder-utils@0.15.0

## 0.12.0

### Minor Changes

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

- [#221](https://github.com/OpenZeppelin/ui-builder/pull/221) [`98c1f33`](https://github.com/OpenZeppelin/ui-builder/commit/98c1f33bd446d24d22562ba7087e14bf9ff31575) Thanks [@pasevin](https://github.com/pasevin)! - Fix EVM network loading regression in preview/production builds
  - Fix issue where EVM networks failed to load in preview/docker modes while other adapters worked
  - Implement adapter-specific Vite configuration pattern for better isolation and fault tolerance
  - Add dynamic loading of adapter Vite configs with graceful error handling
  - Create vite-config.ts exports for EVM, Solana, and Stellar adapters
  - Ensure Midnight adapter's WASM plugins don't interfere with other adapters' dynamic imports
  - Add build-time validation to enforce vite-config pattern across all adapters

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Midnight adapter contract ingestion and shared gating
  - Midnight: move loading to contract/loader; return contractDefinitionArtifacts; keep adapter thin.
  - Builder: replace local required-field gating with shared utils (getMissingRequiredContractInputs); remove redundant helper.
  - Utils: add contractInputs shared helpers and tests.
  - Storage/App/UI: persist and rehydrate contractDefinitionArtifacts; auto-save triggers on artifact changes.

- Updated dependencies [[`98c1f33`](https://github.com/OpenZeppelin/ui-builder/commit/98c1f33bd446d24d22562ba7087e14bf9ff31575), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`98c1f33`](https://github.com/OpenZeppelin/ui-builder/commit/98c1f33bd446d24d22562ba7087e14bf9ff31575), [`8422e81`](https://github.com/OpenZeppelin/ui-builder/commit/8422e81cd4425d5fc596ac805bc130a80030fc93), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-adapter-evm@0.14.0
  - @openzeppelin/ui-builder-adapter-solana@0.14.0
  - @openzeppelin/ui-builder-adapter-stellar@0.14.0
  - @openzeppelin/ui-builder-ui@0.14.0
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-renderer@0.14.0
  - @openzeppelin/ui-builder-react-core@0.14.0
  - @openzeppelin/ui-builder-adapter-midnight@0.14.0
  - @openzeppelin/ui-builder-storage@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

## 0.11.1

### Patch Changes

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

- Updated dependencies [[`68c0aed`](https://github.com/OpenZeppelin/ui-builder/commit/68c0aed14f3597df8c52dc8667e420624399b8d2)]:
  - @openzeppelin/ui-builder-types@0.13.0
  - @openzeppelin/ui-builder-ui@0.13.0
  - @openzeppelin/ui-builder-renderer@0.13.0
  - @openzeppelin/ui-builder-utils@0.13.0
  - @openzeppelin/ui-builder-adapter-evm@0.13.0
  - @openzeppelin/ui-builder-adapter-stellar@0.13.0
  - @openzeppelin/ui-builder-adapter-midnight@0.13.0
  - @openzeppelin/ui-builder-adapter-solana@0.13.0
  - @openzeppelin/ui-builder-react-core@0.13.0
  - @openzeppelin/ui-builder-storage@0.13.0

## 0.11.0

### Minor Changes

- [#196](https://github.com/OpenZeppelin/ui-builder/pull/196) [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500) Thanks [@pasevin](https://github.com/pasevin)! - Embed icon components in network configs; remove legacy icon string and dynamic icon usage. Improves build time and output file count; no runtime bundle size increase.

### Patch Changes

- [#196](https://github.com/OpenZeppelin/ui-builder/pull/196) [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500) Thanks [@pasevin](https://github.com/pasevin)! - Embed icon components in network configs; remove legacy icon string and dynamic icon usage.
  - Build performance: dramatically reduced build time and output file count
  - Runtime: no increase to runtime bundle size
  - API: `iconComponent` added to BaseNetworkConfig; `icon` string removed
  - Adapters: import specific `@web3icons/react` icons and set on configs
  - UI: prefer `network.iconComponent` when present

- Updated dependencies [[`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500), [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500)]:
  - @openzeppelin/ui-builder-types@0.12.0
  - @openzeppelin/ui-builder-adapter-evm@0.12.0
  - @openzeppelin/ui-builder-adapter-stellar@0.12.0
  - @openzeppelin/ui-builder-adapter-solana@0.12.0
  - @openzeppelin/ui-builder-ui@0.12.0
  - @openzeppelin/ui-builder-adapter-midnight@0.12.0
  - @openzeppelin/ui-builder-react-core@0.12.0
  - @openzeppelin/ui-builder-renderer@0.12.0
  - @openzeppelin/ui-builder-storage@0.12.0
  - @openzeppelin/ui-builder-utils@0.12.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`f7d3d1f`](https://github.com/OpenZeppelin/ui-builder/commit/f7d3d1f37e41607f91fad7fe70204354243a933c)]:
  - @openzeppelin/ui-builder-adapter-evm@0.11.1

## 0.10.0

### Minor Changes

- [#184](https://github.com/OpenZeppelin/ui-builder/pull/184) [`877b150`](https://github.com/OpenZeppelin/ui-builder/commit/877b1504df8f21395b276c2895190a7576cea2ba) Thanks [@pasevin](https://github.com/pasevin)! - Add Stellar Asset Contract support with CDN-backed spec loading and improved builder loading feedback for contract metadata.

### Patch Changes

- Updated dependencies [[`877b150`](https://github.com/OpenZeppelin/ui-builder/commit/877b1504df8f21395b276c2895190a7576cea2ba)]:
  - @openzeppelin/ui-builder-adapter-stellar@0.11.0

## 0.9.2

### Patch Changes

- Updated dependencies [[`47ee098`](https://github.com/OpenZeppelin/ui-builder/commit/47ee098b9d17241cb9323e0b644c3e36957ec358), [`702ca91`](https://github.com/OpenZeppelin/ui-builder/commit/702ca91f01a35057e6d1c1809aa00bfd926bcd98)]:
  - @openzeppelin/ui-builder-utils@0.10.1
  - @openzeppelin/ui-builder-adapter-stellar@0.10.1
  - @openzeppelin/ui-builder-types@0.10.1
  - @openzeppelin/ui-builder-renderer@0.10.1
  - @openzeppelin/ui-builder-ui@0.10.1
  - @openzeppelin/ui-builder-adapter-midnight@0.10.1
  - @openzeppelin/ui-builder-adapter-solana@0.10.1

## 0.9.1

### Patch Changes

- Updated dependencies [[`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d)]:
  - @openzeppelin/ui-builder-react-core@0.10.0
  - @openzeppelin/ui-builder-renderer@0.10.0
  - @openzeppelin/ui-builder-types@0.10.0
  - @openzeppelin/ui-builder-styles@0.10.0
  - @openzeppelin/ui-builder-storage@0.10.0
  - @openzeppelin/ui-builder-ui@0.10.0
  - @openzeppelin/ui-builder-utils@0.10.0
  - @openzeppelin/ui-builder-adapter-evm@0.10.0
  - @openzeppelin/ui-builder-adapter-solana@0.10.0
  - @openzeppelin/ui-builder-adapter-stellar@0.10.0
  - @openzeppelin/ui-builder-adapter-midnight@0.10.0

## 0.9.0

### Minor Changes

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

- [#162](https://github.com/OpenZeppelin/contracts-ui-builder/pull/162) [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93) Thanks [@pasevin](https://github.com/pasevin)! - Add Sourcify fallback, deep-link orchestration, provider settings UI, RouterService/deepLink utils, and ContractAdapter/app-config extensions.

- [#130](https://github.com/OpenZeppelin/contracts-ui-builder/pull/130) [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47) Thanks [@pasevin](https://github.com/pasevin)! - New FormField UI component for enum type handling and representation

### Patch Changes

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-adapter-evm@0.9.0
  - @openzeppelin/contracts-ui-builder-adapter-solana@0.9.0
  - @openzeppelin/contracts-ui-builder-adapter-stellar@0.9.0
  - @openzeppelin/contracts-ui-builder-renderer@0.9.0
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0
  - @openzeppelin/contracts-ui-builder-ui@0.9.0
  - @openzeppelin/contracts-ui-builder-react-core@0.9.0
  - @openzeppelin/contracts-ui-builder-adapter-midnight@0.9.0
  - @openzeppelin/contracts-ui-builder-storage@0.9.0

## 0.8.0

### Minor Changes

- [#145](https://github.com/OpenZeppelin/contracts-ui-builder/pull/145) [`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9) Thanks [@pasevin](https://github.com/pasevin)! - support for new BytesField component with validation

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/ui-builder-renderer@0.8.0
  - @openzeppelin/ui-builder-types@0.8.0
  - @openzeppelin/ui-builder-utils@0.8.0
  - @openzeppelin/ui-builder-ui@0.8.0
  - @openzeppelin/ui-builder-adapter-evm@0.8.0
  - @openzeppelin/ui-builder-adapter-midnight@0.8.0
  - @openzeppelin/ui-builder-adapter-solana@0.8.0
  - @openzeppelin/ui-builder-adapter-stellar@0.8.0
  - @openzeppelin/ui-builder-react-core@0.8.0
  - @openzeppelin/ui-builder-storage@0.8.0

## 0.7.2

### Patch Changes

- Updated dependencies [[`f344326`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/f344326aab505e16468ec1b45708fc28a53df192)]:
  - @openzeppelin/ui-builder-ui@0.7.2
  - @openzeppelin/ui-builder-adapter-midnight@0.7.2
  - @openzeppelin/ui-builder-renderer@0.7.2

## 0.7.1

### Patch Changes

- Updated dependencies [[`73db143`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/73db1436f5c6f44062a39f262bad9a542fb85bb9), [`49d7d6c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/49d7d6c38d1890a67dfbf514161e71f46849a123), [`73db143`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/73db1436f5c6f44062a39f262bad9a542fb85bb9)]:
  - @openzeppelin/ui-builder-ui@0.7.1
  - @openzeppelin/ui-builder-adapter-evm@0.7.1
  - @openzeppelin/ui-builder-adapter-midnight@0.7.1
  - @openzeppelin/ui-builder-renderer@0.7.1

## 0.7.0

### Minor Changes

- [#131](https://github.com/OpenZeppelin/contracts-ui-builder/pull/131) [`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec) Thanks [@pasevin](https://github.com/pasevin)! - implements ecosystem-namespaced wallet UI configuration to support different wallet UI kits for different blockchain ecosystems

### Patch Changes

- Updated dependencies [[`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec)]:
  - @openzeppelin/ui-builder-adapter-evm@0.7.0
  - @openzeppelin/ui-builder-utils@0.7.0
  - @openzeppelin/ui-builder-adapter-midnight@0.7.0
  - @openzeppelin/ui-builder-adapter-solana@0.7.0
  - @openzeppelin/ui-builder-adapter-stellar@0.7.0
  - @openzeppelin/ui-builder-react-core@0.7.0
  - @openzeppelin/ui-builder-renderer@0.7.0
  - @openzeppelin/ui-builder-storage@0.7.0
  - @openzeppelin/ui-builder-ui@0.7.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`a4236e9`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/a4236e95ddda6530dfd2a87c4bc8a0915e9ff332), [`3a85c72`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3a85c7296ca05c2edb9931966089f4bfd04e105a), [`acc7037`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/acc70372e7b815026331ed76f77a5d55633ec547)]:
  - @openzeppelin/ui-builder-adapter-evm@0.6.0

## 0.6.0

### Minor Changes

- [#106](https://github.com/OpenZeppelin/contracts-ui-builder/pull/106) [`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b) Thanks [@pasevin](https://github.com/pasevin)! - Show proxy implementation/admin in banner with explorer links and chain-agnostic copy; “Reset detection” now uses proxy ABI only (no implementation fetch); prevent reload loop on fatal load errors.

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b), [`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b), [`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/ui-builder-adapter-evm@0.5.0
  - @openzeppelin/ui-builder-types@0.4.0
  - @openzeppelin/ui-builder-renderer@0.4.0
  - @openzeppelin/ui-builder-adapter-midnight@0.1.4
  - @openzeppelin/ui-builder-adapter-solana@0.0.9
  - @openzeppelin/ui-builder-adapter-stellar@0.0.9
  - @openzeppelin/ui-builder-react-core@0.2.5
  - @openzeppelin/ui-builder-storage@0.3.4
  - @openzeppelin/ui-builder-ui@0.5.1
  - @openzeppelin/ui-builder-utils@0.4.1

## 0.5.0

### Minor Changes

- [#91](https://github.com/OpenZeppelin/contracts-ui-builder/pull/91) [`6ad118f`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6ad118fcac5aeb6c807bdcc9464de98791d2a20a) Thanks [@pasevin](https://github.com/pasevin)! - a better support for mobile screen sizes

### Patch Changes

- Updated dependencies [[`6ad118f`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6ad118fcac5aeb6c807bdcc9464de98791d2a20a)]:
  - @openzeppelin/ui-builder-adapter-evm@0.4.0
  - @openzeppelin/ui-builder-renderer@0.3.0
  - @openzeppelin/ui-builder-ui@0.5.0
  - @openzeppelin/ui-builder-adapter-midnight@0.1.3
  - @openzeppelin/ui-builder-react-core@0.2.4

## 0.4.1

### Patch Changes

- [#80](https://github.com/OpenZeppelin/contracts-ui-builder/pull/80) [`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc) Thanks [@pasevin](https://github.com/pasevin)! - Route all console.\* logs through centralized logger from utils, add system tags, update tests to spy on logger, restore missing createAbiFunctionItem in EVM adapter, and apply lint/prettier fixes. No public API changes.

- Updated dependencies [[`d05bdeb`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/d05bdebd110ed03280ebdc1a8c20e925d5f279cc), [`14171aa`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/14171aa46dfd76811551e0ba4560097736fb3420)]:
  - @openzeppelin/ui-builder-adapter-midnight@0.1.2
  - @openzeppelin/ui-builder-adapter-stellar@0.0.8
  - @openzeppelin/ui-builder-adapter-solana@0.0.8
  - @openzeppelin/ui-builder-adapter-evm@0.3.2
  - @openzeppelin/ui-builder-react-core@0.2.3
  - @openzeppelin/ui-builder-renderer@0.2.3
  - @openzeppelin/ui-builder-ui@0.4.1

## 0.4.0

### Minor Changes

- [#74](https://github.com/OpenZeppelin/contracts-ui-builder/pull/74) [`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c) Thanks [@pasevin](https://github.com/pasevin)! - implement google analytics and a common footer

### Patch Changes

- Updated dependencies [[`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c)]:
  - @openzeppelin/ui-builder-utils@0.4.0
  - @openzeppelin/ui-builder-ui@0.4.0
  - @openzeppelin/ui-builder-adapter-evm@0.3.1
  - @openzeppelin/ui-builder-adapter-midnight@0.1.1
  - @openzeppelin/ui-builder-adapter-solana@0.0.7
  - @openzeppelin/ui-builder-adapter-stellar@0.0.7
  - @openzeppelin/ui-builder-react-core@0.2.2
  - @openzeppelin/ui-builder-renderer@0.2.2
  - @openzeppelin/ui-builder-storage@0.3.2

## 0.3.0

### Minor Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - feat: Added UI components to display proxy contract information and allow users to bypass proxy detection. The contract loading step has been refactored into smaller, more maintainable hooks. The auto-save functionality now preserves the original contract definition to ensure accurate ABI comparisons.

### Patch Changes

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/ui-builder-adapter-stellar@0.0.6
  - @openzeppelin/ui-builder-renderer@0.2.1
  - @openzeppelin/ui-builder-storage@0.3.1
  - @openzeppelin/ui-builder-ui@0.3.1
  - @openzeppelin/ui-builder-adapter-solana@0.0.6
  - @openzeppelin/ui-builder-adapter-midnight@0.1.0
  - @openzeppelin/ui-builder-utils@0.3.1
  - @openzeppelin/ui-builder-adapter-evm@0.3.0
  - @openzeppelin/ui-builder-types@0.3.0
  - @openzeppelin/ui-builder-react-core@0.2.1

## 0.2.0

### Minor Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - support contracts UIs CRUD

### Patch Changes

- Updated dependencies [[`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103), [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103), [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103)]:
  - @openzeppelin/ui-builder-adapter-midnight@0.0.6
  - @openzeppelin/ui-builder-adapter-stellar@0.0.5
  - @openzeppelin/ui-builder-adapter-solana@0.0.5
  - @openzeppelin/ui-builder-adapter-evm@0.2.2
  - @openzeppelin/ui-builder-storage@0.3.0
  - @openzeppelin/ui-builder-react-core@0.2.0
  - @openzeppelin/ui-builder-renderer@0.2.0
  - @openzeppelin/ui-builder-styles@0.3.0
  - @openzeppelin/ui-builder-utils@0.3.0
  - @openzeppelin/ui-builder-ui@0.3.0

## 0.1.7

### Patch Changes

- [#64](https://github.com/OpenZeppelin/contracts-ui-builder/pull/64) [`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479) Thanks [@pasevin](https://github.com/pasevin)! - changed import sorting library

- Updated dependencies [[`875a7b8`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/875a7b8f00bec08b869b4a59c4def6e7b1790479)]:
  - @openzeppelin/ui-builder-adapter-midnight@0.0.5
  - @openzeppelin/ui-builder-adapter-evm@0.2.1
  - @openzeppelin/ui-builder-react-core@0.1.4
  - @openzeppelin/ui-builder-renderer@0.1.5
  - @openzeppelin/ui-builder-types@0.2.1
  - @openzeppelin/ui-builder-utils@0.2.1
  - @openzeppelin/ui-builder-ui@0.2.1
  - @openzeppelin/ui-builder-adapter-solana@0.0.4
  - @openzeppelin/ui-builder-adapter-stellar@0.0.4

## 0.1.6

### Patch Changes

- [#60](https://github.com/OpenZeppelin/contracts-ui-builder/pull/60) [`c8cafd4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/c8cafd4bb8ba927c443f799e29700dbe6ca7c995) Thanks [@pasevin](https://github.com/pasevin)! - handle rc publishing for staging environment

## 0.1.5

### Patch Changes

- [#57](https://github.com/OpenZeppelin/contracts-ui-builder/pull/57) [`fc05836`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/fc058368cbd885b63c5aa932ed216df783f59e71) Thanks [@pasevin](https://github.com/pasevin)! - resolve network switching regression and optimize state management

## 0.1.4

### Patch Changes

- Updated dependencies [[`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81), [`83c430e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/83c430e86f47733bde89b560b70a7a922eebfe81)]:
  - @openzeppelin/ui-builder-adapter-evm@0.2.0
  - @openzeppelin/ui-builder-styles@0.2.0
  - @openzeppelin/ui-builder-types@0.2.0
  - @openzeppelin/ui-builder-utils@0.2.0
  - @openzeppelin/ui-builder-ui@0.2.0
  - @openzeppelin/ui-builder-adapter-midnight@0.0.4
  - @openzeppelin/ui-builder-adapter-solana@0.0.3
  - @openzeppelin/ui-builder-adapter-stellar@0.0.3
  - @openzeppelin/ui-builder-react-core@0.1.3
  - @openzeppelin/ui-builder-renderer@0.1.4

## 0.1.3

### Patch Changes

- [#54](https://github.com/OpenZeppelin/contracts-ui-builder/pull/54) [`63fca98`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/63fca981f56bf9b2bb7c43c720bea3cbbd53d6f6) Thanks [@pasevin](https://github.com/pasevin)! - pre-release clean up and improvements

- Updated dependencies [[`63fca98`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/63fca981f56bf9b2bb7c43c720bea3cbbd53d6f6), [`6d74481`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/6d7448140936f5c8dfadac3bca05dde54d468167)]:
  - @openzeppelin/ui-builder-adapter-evm@0.1.3
  - @openzeppelin/ui-builder-renderer@0.1.3
  - @openzeppelin/ui-builder-styles@0.1.2
  - @openzeppelin/ui-builder-ui@0.1.3
  - @openzeppelin/ui-builder-adapter-midnight@0.0.3

## 0.1.2

### Patch Changes

- [#52](https://github.com/OpenZeppelin/contracts-ui-builder/pull/52) [`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037) Thanks [@pasevin](https://github.com/pasevin)! - resolves clean build issues due to missing packages

- Updated dependencies [[`3cb6dd7`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/3cb6dd7e4f2bdf51860ae6abe51432bba0828037)]:
  - @openzeppelin/ui-builder-adapter-midnight@0.0.2
  - @openzeppelin/ui-builder-adapter-solana@0.0.2
  - @openzeppelin/ui-builder-adapter-evm@0.1.2
  - @openzeppelin/ui-builder-react-core@0.1.2
  - @openzeppelin/ui-builder-renderer@0.1.2
  - @openzeppelin/ui-builder-types@0.1.2
  - @openzeppelin/ui-builder-ui@0.1.2
  - @openzeppelin/ui-builder-adapter-stellar@0.0.2

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
  - @openzeppelin/ui-builder-types@1.17.0
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
  - @openzeppelin/ui-builder-types@1.16.0
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
