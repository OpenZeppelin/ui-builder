# Midnight Adapter Changelog

## 0.15.0

### Minor Changes

- [#232](https://github.com/OpenZeppelin/ui-builder/pull/232) [`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff) Thanks [@pasevin](https://github.com/pasevin)! - Add support for configurable identity secret key property name in Midnight contracts

  **Breaking Changes:**
  - None

  **New Features:**
  - Added `RuntimeSecretPropertyInput` interface to support adapter-driven property name configuration
  - Midnight adapter now derives the identity secret key property name from contract artifacts
  - Added configurable "Secret Key Property Name" field in the Customize step for runtime secret fields
  - Property name is automatically detected from contract artifacts (e.g., `organizerSecretKey`, `secretKey`, `ownerKey`)
  - Users can override the detected property name if needed

  **Improvements:**
  - Refactored secret property resolution logic into shared utility function
  - Improved error handling for missing or invalid property names
  - Added JavaScript identifier validation for property names
  - Enhanced helper text to guide users on property name configuration
  - Updated terminology from "Organizer" to "Identity-restricted" for better clarity

  **Bug Fixes:**
  - Fixed empty string handling in property name resolution
  - Fixed TextField ID uniqueness for accessibility
  - Fixed JSDoc documentation for better clarity

  **Internal Changes:**
  - Consolidated duplicated `ExtendedRuntimeBinding` type into shared utility
  - Improved witness type definition parsing for more reliable property name derivation
  - Enhanced logging for witness type definition processing

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0
  - @openzeppelin/ui-builder-react-core@0.15.0
  - @openzeppelin/ui-builder-ui@0.15.0
  - @openzeppelin/ui-builder-utils@0.15.0

## 0.14.0

### Minor Changes

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Midnight adapter contract ingestion and shared gating
  - Midnight: move loading to contract/loader; return contractDefinitionArtifacts; keep adapter thin.
  - Builder: replace local required-field gating with shared utils (getMissingRequiredContractInputs); remove redundant helper.
  - Utils: add contractInputs shared helpers and tests.
  - Storage/App/UI: persist and rehydrate contractDefinitionArtifacts; auto-save triggers on artifact changes.

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - # Refactor Midnight wallet management to event-driven architecture with polling-based event emulation

  **Architecture Changes:**
  - Refactored wallet implementation to mirror Stellar adapter structure
  - Introduced `LaceWalletImplementation` class for core wallet logic
  - Added `midnightWalletImplementationManager` singleton pattern
  - Created `MidnightWalletUiRoot` as the primary provider component
  - Removed unnecessary `MidnightWalletProvider` wrapper for consistency
  - Implemented facade functions in `connection.ts` for high-level wallet operations

  **Event Emulation:**
  - Lace Midnight DAppConnectorWalletAPI lacks native `onAccountChange` events
  - Implemented polling-based event emulation via `api.state()` with exponential backoff
  - Adaptive polling intervals: 2s initial, 5s when connected, up to 15s on errors
  - Polling pauses when document is hidden (tab inactive) to reduce intrusive popups
  - Polling starts only when listeners subscribe, stops when all unsubscribe

  **UX Improvements:**
  - Fixed repeated wallet popup issue by preventing multiple `enable()` calls
  - Added `connectInFlight` guard against React Strict Mode double-effects and rapid clicks
  - Implemented focus/blur heuristics to detect user dismissal of unlock popup
  - 60s fallback timeout prevents infinite loading state in edge cases
  - Auto-reconnect on page load for seamless UX with already-enabled wallets

  **Documentation:**
  - Added comprehensive inline comments explaining design decisions and limitations
  - Created wallet module README documenting architecture and implementation details
  - Documented all workarounds needed due to Lace API limitations

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

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Refactor to use shared `getBytesSize` function from `@openzeppelin/ui-builder-utils` instead of local implementation. This ensures consistent bytes size parsing across all adapters and reduces code duplication.

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Add wallet connection unit tests and Vitest configuration; fix adapter imports to use local configuration barrel. Remove temporary test seam to align with other adapters.

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`8422e81`](https://github.com/OpenZeppelin/ui-builder/commit/8422e81cd4425d5fc596ac805bc130a80030fc93), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-ui@0.14.0
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-react-core@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

## [Pure Client-Side Implementation] - 2025-01-XX

### Major Changes

#### ✨ Pure Browser-Based ZK Artifact Handling

**Replaced**: Server-based artifact serving (Vite plugin + HTTP endpoints)  
**With**: In-memory browser storage via `EmbeddedZkConfigProvider`

**Impact**:

- ✅ No backend server required for development or production
- ✅ Identical behavior in `pnpm dev` and production builds
- ✅ Same deployment model as EVM and Stellar adapters
- ✅ Zero network overhead for artifact retrieval

### New Files

- `src/transaction/embedded-zk-config-provider.ts` - In-memory ZK artifact provider
  - `registerAll()` - Store artifacts from ZIP upload
  - `get(circuitId)` - Retrieve artifacts for proof generation
  - `getCircuitIds()` - List available circuits
  - Returns `ZKConfig` with `proverKey`, `verifierKey`, `zkir` as `Uint8Array`

### Modified Files

#### `src/transaction/providers.ts`

- **Added**: `globalZkConfigProvider` - Singleton instance shared across all transactions
- **Changed**: Use `EmbeddedZkConfigProvider` instead of `FetchZkConfigProvider`
- **Removed**: `verifierKeys` parameter (now handled by embedded provider)
- **Updated**: Proof server URI derivation logic to prioritize wallet config

#### `src/utils/artifacts.ts`

- **Added**: Import `globalZkConfigProvider`
- **Added**: Registration of ZK artifacts with global provider on ZIP upload
- **Removed**: `uploadZkArtifactsToServer()` function
- **Removed**: Server upload logic and HTTP requests

#### `src/utils/zip-extractor.ts`

- **Enhanced**: ZK artifact extraction to match provider's expected format
- **Added**: Detailed debug logging for artifact extraction process
- **Added**: Support for `.bzkir` and `.zkir` file extensions

#### `src/index.ts` (Buffer Polyfill)

- **Fixed**: `toString('base64')` implementation using `btoa()` for correct binary conversion
- **Fixed**: Ensure `toString()` method is attached to all `Uint8Array` instances
- **Added**: `byteLength()` method for borsh serialization compatibility
- **Removed**: Debug logging statements

### Deleted Files

- `../../builder/vite-plugins/zk-artifacts-server.ts` - No longer needed
- `src/zkArtifacts/store.ts` - Replaced by `EmbeddedZkConfigProvider`

### Configuration Changes

#### `../../builder/vite.config.ts`

- **Removed**: `zkArtifactsServerPlugin` import
- **Removed**: Plugin from plugins array
- **Kept**: Module deduplication for WASM context sharing

### Monkey Patches (Maintained)

All SDK patches remain in place for browser compatibility:

1. **`@midnight-ntwrk/midnight-js-utils`** - Direct `Uint8Array` to hex conversion
2. **`@midnight-ntwrk/midnight-js-network-id`** - Fallback `NetworkId` enum
3. **`@midnight-ntwrk/midnight-js-http-client-proof-provider`** - Content-Type header fix
4. **`@dao-xyz/borsh`** - Runtime function wrappers for `allocUnsafe` and `stringLengthFn`

### Bug Fixes

- Fixed base64 encoding corruption that caused version mismatch errors
- Fixed proof server URL construction (was replacing path instead of appending)
- Fixed `Buffer` polyfill to support all encoding methods needed by SDK
- Fixed borsh serialization by ensuring runtime access to `Buffer` methods

### Documentation

- **Added**: `README.md` - Quick start guide and overview
- **Added**: `TRANSACTION_IMPLEMENTATION.md` - Comprehensive technical documentation
- **Updated**: Architecture diagrams to reflect pure client-side approach
- **Updated**: File structure documentation
- **Updated**: Dependency list (removed `fetch-zk-config-provider`)

### Performance Improvements

- **Zero Network Requests**: Artifacts retrieved from memory instead of HTTP
- **Faster Transactions**: No artifact fetching delay during proof generation
- **Simpler Architecture**: Removed server middleware, serialization, base64 encoding/decoding

### Known Limitations

1. **Session-Only Storage**: Artifacts cleared on page reload
   - **By Design**: Users re-upload ZIP file (same as contract re-upload)
   - **Future**: Optional IndexedDB persistence

2. **Memory Usage**: ~500KB-1MB per circuit stored in browser memory
   - **Acceptable**: Modern browsers handle this easily
   - **Trade-off**: Zero network overhead

3. **Single Contract**: Only one contract's artifacts at a time
   - **Acceptable**: MVP use case
   - **Future**: Multi-contract artifact store

### Migration Notes

#### For Developers

**No Action Required** - The implementation is backwards compatible:

- Same contract upload flow
- Same transaction execution API
- Same user experience

**Benefits**:

- Development server is simpler (no plugin to manage)
- Production deployment is unchanged (still static files)
- No HMR issues with server-side state

#### For Users

**No Changes** - User workflow remains identical:

1. Upload ZIP file
2. Connect wallet
3. Execute transactions

**Note**: After page reload, re-upload the ZIP file (same as before, but now there's no server state to get out of sync).

### Testing

All manual testing passed:

- ✅ ZIP upload and artifact extraction
- ✅ Contract function parsing
- ✅ Transaction execution (circuit calls)
- ✅ Proof generation with embedded keys
- ✅ Wallet signing and broadcasting
- ✅ Development environment (`pnpm dev`)
- ✅ Proof server integration (local and testnet)

### Technical Achievements

1. **Pure Static Deployment**: No infrastructure changes needed
2. **Zero Backend Dependencies**: Works identically in dev and prod
3. **Simplified Architecture**: Removed entire server layer
4. **Browser-Native**: All artifact handling in browser memory
5. **Production Ready**: Same deployment as other adapters

---

## Previous Implementation

### Server-Based Approach (Deprecated)

The previous implementation used:

- Vite server plugin with HTTP endpoints (`/__zk-upload`, `/keys/*.prover`, etc.)
- Browser-to-server artifact upload via POST requests
- Server-side in-memory store attached to `globalThis`
- `FetchZkConfigProvider` fetching artifacts via HTTP
- Base64 encoding/decoding for artifact transmission

**Issues Resolved**:

- ❌ HMR could reset server-side store
- ❌ Required backend infrastructure
- ❌ Different behavior in dev vs prod
- ❌ Network overhead for artifact retrieval
- ❌ Complex serialization layer

**All resolved by pure client-side approach**.
