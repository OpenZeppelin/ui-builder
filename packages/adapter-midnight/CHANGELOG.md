# Midnight Adapter Changelog

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
