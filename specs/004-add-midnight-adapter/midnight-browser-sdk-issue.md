# Browser-Compatible SDK for Midnight Contracts

## Summary

We're building a browser-based UI Builder for Midnight contracts that needs to:

1. **Query read-only contract state** directly from the browser ✅ (working with patches)
2. **Execute writable transactions** directly from the browser ❌ (major blockers)

Currently, **all Midnight SDK packages have WASM/Node.js dependencies that prevent them from being used in browser environments**, blocking our ability to create fully functional client-side dApps.

## Use Case

**OpenZeppelin UI Builder** - A tool that automatically generates UIs for smart contracts:

1. Developer uploads contract artifacts (ABI-like schema)
2. UI Builder auto-generates forms and displays for contract functions
3. Users interact with deployed contracts directly from their browser
4. **No backend server** - entirely client-side for privacy and simplicity

This pattern is standard across Web3:

- Ethereum dApps query via browser-based `ethers.js` / `viem`
- Solana dApps query via browser-based `@solana/web3.js`
- Near dApps query via browser-based `near-api-js`

## Technical Requirements

### 1. Read-Only Queries (✅ Working with Patches)

Query read-only contract state from the browser:

```typescript
// What we need for read-only queries
const provider = createPublicDataProvider(indexerUrl);
const state = await provider.queryContract(contractAddress, functionId, params);
// Returns decoded JavaScript values
```

**Required Providers:**

- ✅ `publicDataProvider` (GraphQL indexer) - **WORKING** with patches

### 2. Writable Transactions (❌ Major Blockers)

**IMPORTANT CLARIFICATION:** ZK proof generation does **NOT** happen in the browser. According to the Midnight SDK types, the `proofProvider` is "a proof server running in a trusted environment". This means browser dApps just need to call a proof server API, not perform heavy cryptographic operations locally. This significantly simplifies browser transaction support.

Execute state-changing contract functions from the browser:

```typescript
// What we need for writable transactions
const providers = {
  publicDataProvider, // Query blockchain state
  privateStateProvider, // Manage contract private state
  zkConfigProvider, // Load ZK circuit artifacts
  proofProvider, // Generate zero-knowledge proofs
  walletProvider, // Sign and balance transactions
  midnightProvider, // Submit to network
};

const result = await submitCallTx(providers, {
  contractAddress,
  functionId,
  params,
  circuitId,
});
```

**Required Providers for Transactions:**

- ✅ `publicDataProvider` - Working (GraphQL indexer)
- ❌ `privateStateProvider` - **Needs IndexedDB/local storage**
- ❌ `zkConfigProvider` - **Needs circuit artifact loading**
- ⚠️ `proofProvider` - **Proof server API** (external service, not browser-based)
- ❌ `walletProvider` - **Requires wallet integration + balancing**
- ❌ `midnightProvider` - **Needs RPC transaction submission**

**Note:** According to the SDK types, `proofProvider` is described as "a proof server running in a trusted environment", meaning ZK proof generation happens on a separate server, not in the browser. This is actually good news for browser compatibility.

### Current Blockers

#### For Read-Only Queries (✅ Resolved with Patches)

Initial blockers for queries were:

- ❌ Missing peer dependencies in SDK packages
- ❌ CommonJS/ESM conflicts in `@apollo/client` and `cross-fetch`
- ❌ WASM module loading issues
- ❌ Module singleton issues with `setNetworkId/getNetworkId`

**Status:** ✅ **RESOLVED** - See "Workaround Solution" section below

#### For Writable Transactions (❌ Still Blocked)

Transaction execution has additional requirements beyond queries:

**Package Dependency Chain for Transactions:**

```
@midnight-ntwrk/midnight-js-contracts (submitCallTx)
  ├─> @midnight-ntwrk/midnight-js-indexer-public-data-provider (public data) ✅
  ├─> @midnight-ntwrk/midnight-js-private-state-provider (private state) ❌
  ├─> @midnight-ntwrk/midnight-js-zk-config-provider (circuit metadata) ❌
  ├─> @midnight-ntwrk/midnight-js-proof-provider (calls proof server) ⚠️
  │   └─> Proof Server API (external service, not in browser) ⚠️
  ├─> @midnight-ntwrk/midnight-js-wallet-provider (balancing/signing) ❌
  │   └─> Requires @midnight-ntwrk/compact-runtime (WASM) ⚠️
  └─> @midnight-ntwrk/midnight-js-provider (RPC submission) ❌
```

**Critical Transaction Blockers:**

1. **Zero-Knowledge Proof Generation** ✅ (Server-side, not a browser blocker)
   - According to SDK docs: "proof server running in a trusted environment"
   - Browser dApps just need to call the proof server API
   - No heavy cryptographic operations in browser required
   - **Blocker:** Need access to proof server endpoints and API documentation

2. **Private State Management**
   - Contract private state must be stored locally (IndexedDB?)
   - State synchronization with blockchain
   - State recovery and persistence

3. **Wallet Provider Integration**
   - Transaction signing
   - Coin selection and balancing
   - Fee calculation
   - Currently relies on Node.js wallet implementations
   - Needs browser wallet extension or browser-compatible SDK

4. **Circuit Configuration** (zkConfigProvider)
   - Provides circuit metadata to proof server
   - Tells proof server which circuit to use for proving
   - **Blocker:** Understanding the required configuration format
   - May not need actual circuit artifacts in browser (server has them)

### What We've Tried

1. ✅ **Vite externalization** - Doesn't help; browser still tries to fetch WASM modules
2. ✅ **Dynamic imports** - Same issue; dependencies load at module level
3. ✅ **Browser stubs** - Breaks functionality entirely
4. ✅ **Vite WASM plugins** - Discovered packaging bugs (see below)
   - Tried `vite-plugin-wasm`, `vite-plugin-top-level-await`
   - Tried `@esbuild-plugins/node-globals-polyfill`
   - Result: **Found that packages have missing dependencies**, preventing even Node.js usage
5. ❌ **Raw GraphQL queries** - Requires reimplementing Midnight's state decoding (not practical)

## Requested Solutions

### Part 1: Read-Only Queries (✅ Working with Patches, ❌ Needs Official Support)

While we've made queries work via extensive patching, **official browser-compatible packages are still needed** for:

- Stability and maintainability
- Avoiding large bundle sizes (current: 5.5MB + 2.4MB + 1.6MB WASM)
- Proper version compatibility
- Developer experience

**Ideal Solution: Lightweight Browser Query Package**

```typescript
// @midnight-ntwrk/midnight-js-browser-query (proposed)
import { createBrowserProvider } from '@midnight-ntwrk/midnight-js-browser-query';

const provider = createBrowserProvider({
  indexerUri: 'https://indexer.testnet.midnight.network/api/v1/graphql',
});

// Query public contract state
const state = await provider.queryContractState(contractAddress);

// Query with contract module for type-safe field access
const result = await provider.queryField(
  contractAddress,
  fieldName,
  contractModule // Optional: compiled contract module for ledger() access
);
```

**Query Package Requirements:**

- ✅ Pure JavaScript state deserialization (no WASM)
- ✅ Browser-compatible GraphQL client
- ✅ Support for contract `ledger()` functions
- ✅ < 500KB bundle size
- ✅ Works with all modern bundlers (Vite, Webpack, Rollup, etc.)

### Part 2: Writable Transactions (❌ Major Gaps, Needs Investigation)

Transaction support requires clarification from the Midnight team on feasibility:

**Option A: Full Browser Transaction Support (Ideal but Complex)**

```typescript
// @midnight-ntwrk/midnight-js-browser-tx (hypothetical)
import { createBrowserProviders } from '@midnight-ntwrk/midnight-js-browser-tx';

const providers = await createBrowserProviders({
  indexerUri: '...',
  rpcUri: '...',
  walletConnection: window.midnight, // Browser wallet extension
  circuitArtifactsUrl: 'https://cdn.midnight.network/circuits',
});

// Submit state-changing transaction
const tx = await submitCallTx(providers, {
  contractAddress,
  functionId,
  params,
  circuitId,
});
```

**Transaction Package Requirements:**

- ✅ ZK proof generation via proof server API (not browser-based)
- ✅ Proof server endpoint access
- ❌ IndexedDB for private state storage (implementation needed)
- ❌ Integration with browser wallet extensions (e.g., Lace)
- ⚠️ Circuit configuration (metadata only, not full artifacts)
- ❌ RPC transaction submission endpoint

**Open Questions for Midnight Team:**

1. ✅ ~~Is ZK proof generation feasible in browser?~~ **CLARIFIED:** Proof server does this
2. **Where are the proof server endpoints?** (testnet/mainnet URLs)
3. **What's the proof server API?** (authentication, rate limits, pricing?)
4. Are there browser wallet extensions in development (like MetaMask/Lace)?
5. What's the recommended architecture for browser-based dApps?
6. How should dApps access proof servers? (public endpoints? user-provided?)

**Option B: Wallet-Extension-Based Transactions (More Realistic?)**

Similar to Ethereum's MetaMask model, where:

- Browser wallet extension handles proving, signing, and submission
- dApp only constructs transaction requests
- User approves in extension UI
- Extension manages private state and keys

```typescript
// Simpler dApp-side API
const tx = await window.midnight.request({
  method: 'midnight_sendTransaction',
  params: [
    {
      contractAddress,
      functionId,
      params,
    },
  ],
});
```

This approach would:

- ✅ Offload complexity to wallet extension
- ✅ Better security (keys never leave wallet)
- ✅ Familiar UX for Web3 users
- ✅ Smaller dApp bundle sizes

### Option 2: Browser Build of Existing Packages

Add browser-specific entry points to existing packages:

```json
// @midnight-ntwrk/midnight-js-indexer-public-data-provider/package.json
{
  "exports": {
    ".": {
      "browser": "./dist/browser.mjs", // No WASM deps
      "node": "./dist/index.mjs", // Full features
      "default": "./dist/browser.mjs"
    }
  }
}
```

### Option 3: GraphQL Schema Documentation

If creating browser packages isn't feasible immediately, provide:

- Complete GraphQL schema documentation for the Midnight Indexer API
- State encoding/decoding format specification
- Example queries for common operations

This would allow us to implement our own browser-compatible query layer.

## Impact Analysis

### Current State: Read-Only Queries Working (with Patches)

**What We've Achieved:**

- ✅ Read-only contract queries work in browser (with extensive patches)
- ✅ Can display public contract state in UI
- ✅ GraphQL indexer integration functional
- ⚠️ Large bundle sizes (9.5MB WASM total)
- ⚠️ Fragile patches requiring maintenance on SDK updates

**What's Still Blocked:**

- ❌ Cannot execute state-changing transactions
- ❌ Cannot build fully interactive dApps
- ❌ Users can read but not write to contracts

### Without Official Browser Support

**For Read-Only Queries:**

- ⚠️ Relying on fragile patches for core functionality
- ⚠️ Breaking changes in SDK updates require re-patching
- ⚠️ Large bundle sizes (9.5MB WASM) hurt UX
- ⚠️ No official support or documentation

**For Writable Transactions:**

- ❌ Cannot build functional Midnight dApps at all
- ❌ All dApps require backend servers (complexity, cost, centralization)
- ❌ Midnight ecosystem lags behind other L1s significantly
- ❌ Privacy promises undermined by required backend trust
- ❌ Higher barrier to entry for developers
- ❌ No way to build tools like OpenZeppelin UI Builder fully

### With Official Browser Support

**For Read-Only Queries (Phase 1):**

- ✅ Stable, maintainable query API
- ✅ Small bundle sizes (< 500KB instead of 9.5MB)
- ✅ Official documentation and support
- ✅ Enables read-only dApps (dashboards, explorers, analytics)
- ✅ OpenZeppelin UI Builder can support Midnight (view functions only)

**For Writable Transactions (Phase 2):**

- ✅ Build fully functional client-side Midnight dApps
- ✅ Wallet extension integration (MetaMask-like UX)
- ✅ True decentralization - no backend required
- ✅ Better privacy - queries and txs from user's machine
- ✅ Competitive with Ethereum/Solana/Near tooling
- ✅ Lower barrier to entry for developers
- ✅ Ecosystem growth through better developer experience

## Current Implementation Status

**Completed:**

- ✅ Contract artifact parsing
- ✅ Schema conversion
- ✅ Address validation
- ✅ Wallet integration (basic connector support)
- ✅ **Read-only queries (WORKING with extensive patches)**

**In Progress:**

- ⚠️ Stabilizing query implementation
- ⚠️ Reducing bundle sizes
- ⚠️ Investigating transaction feasibility

**Blocked:**

- ❌ Writable transaction execution (awaiting Midnight team guidance)
- ❌ Full wallet integration (requires transaction support)
- ❌ Production-ready deployment (fragile patches, large bundles)

## ✅ WORKAROUND FOUND: Critical Packaging Bugs

### Bug #1: Missing Peer Dependencies in Multiple Packages

**Issue**: Several `@midnight-ntwrk/midnight-js-*@2.0.2` packages import from core packages but don't declare them as dependencies OR peerDependencies:

**Package: `@midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2`**

```javascript
// Imports but doesn't declare:
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { Transaction, ZswapChainState } from '@midnight-ntwrk/ledger';
```

**Package: `@midnight-ntwrk/midnight-js-types@2.0.2`**

```javascript
// Imports but doesn't declare:
export { UnprovenTransaction } from '@midnight-ntwrk/ledger';
```

**Package: `@midnight-ntwrk/midnight-js-network-id@2.0.2`**

```javascript
// Imports but doesn't declare:
import * as runtime from '@midnight-ntwrk/compact-runtime';
import * as ledger from '@midnight-ntwrk/ledger';
```

**Package: `@midnight-ntwrk/midnight-js-utils@2.0.2`**

```javascript
// Imports but doesn't declare:
import { ...CoinPublicKey, ...EncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
```

**Impact**: Build failures with `Could not resolve "@midnight-ntwrk/ledger"` and similar errors.

### Bug #2: Version Mismatch Between Package Families

- `@midnight-ntwrk/midnight-js-*` packages use version `2.0.2`
- But `@midnight-ntwrk/ledger` versions: `[ '2.0.7', '2.0.8', '3.0.2', '3.0.6', '4.0.0' ]`
- And `@midnight-ntwrk/compact-runtime` versions: `[ '0.6.12', '0.6.13', '0.7.0', '0.7.1', '0.8.1', '0.9.0' ]`
- **No version alignment** between package families

### ✅ Workaround Solution

**Manually install the missing peer dependencies:**

```bash
pnpm add @midnight-ntwrk/ledger@4.0.0 \
         @midnight-ntwrk/compact-runtime@0.9.0 \
         @midnight-ntwrk/wallet-sdk-address-format@2.0.0
```

**Additional Configuration:**

The WASM packages must be excluded from Vite's pre-bundling because they use CommonJS `require()` with top-level await:

```typescript
// vite.config.ts
optimizeDeps: {
  exclude: [
    '@midnight-ntwrk/compact-runtime',
    '@midnight-ntwrk/onchain-runtime',
    '@midnight-ntwrk/ledger',
    '@midnight-ntwrk/zswap',
    // ... and other midnight packages
  ],
}
```

**Result:**

- ✅ Build succeeds
- ✅ WASM files are bundled (5.5MB + 2.4MB + 1.6MB)
- ✅ Dev server runs without errors
- 🧪 Browser runtime testing in progress

### Recommended Fix from Midnight Team

The packages should either:

**Option A:** Declare as dependencies (recommended for tightly coupled packages):

```json
{
  "dependencies": {
    "@midnight-ntwrk/ledger": "^4.0.0",
    "@midnight-ntwrk/compact-runtime": "^0.9.0",
    "@midnight-ntwrk/wallet-sdk-address-format": "^2.0.0"
  }
}
```

**Option B:** Declare as peerDependencies (if version flexibility needed):

```json
{
  "peerDependencies": {
    "@midnight-ntwrk/ledger": "^4.0.0",
    "@midnight-ntwrk/compact-runtime": "^0.9.0",
    "@midnight-ntwrk/wallet-sdk-address-format": "^2.0.0"
  }
}
```

## References

- **Our codebase**: OpenZeppelin Contracts UI Builder
- **Affected packages**:
  - `@midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2` (has packaging bugs)
  - `@midnight-ntwrk/midnight-js-contracts@2.0.2`
  - `@midnight-ntwrk/ledger` (missing as dependency, versions don't align)
  - `@midnight-ntwrk/compact-runtime` (missing as dependency)

## Questions for Midnight Team

### For Read-Only Queries

1. **Is an official browser-compatible query package on your roadmap?**
   - If yes, what's the timeline?
   - What will the API look like?

2. **Can the current SDK be fixed to work in browsers without patches?**
   - Fix missing peer dependencies
   - Provide proper ES module builds
   - Reduce WASM bundle sizes

3. **Is there documentation for the GraphQL indexer schema?**
   - Could help us build our own lightweight layer if needed

### For Writable Transactions

4. **Is browser-based transaction execution a goal for Midnight?**
   - Should dApps run fully client-side, or is a backend expected?

5. **Where are the proof server endpoints?** ⭐ CRITICAL
   - Testnet proof server URL?
   - Mainnet proof server URL?
   - Are they public or require authentication?
   - Rate limits? Pricing? SLA?

6. **What's the proof server API?** ⭐ CRITICAL
   - REST or gRPC?
   - Authentication mechanism?
   - Request/response format?
   - Timeout recommendations?
   - Error handling?

7. **What's the wallet extension strategy?**
   - Is there a browser wallet extension in development?
   - Will it handle proving coordination, signing, and submission (MetaMask-like)?
   - Or should dApps implement full transaction logic?
   - Does the wallet extension call the proof server, or does the dApp?

8. **How should private state be managed in browsers?**
   - IndexedDB storage recommended?
   - State synchronization patterns?
   - Recovery mechanisms?
   - State encryption?

9. **How should circuit configuration work?** (zkConfigProvider)
   - What metadata does the proof server need?
   - How does the proof server know which circuit to use?
   - Where do circuit artifacts live? (only server-side, right?)
   - Version compatibility between contracts and circuit artifacts?

10. **What's the recommended architecture for browser dApps?**
    - Full client-side with wallet extension + proof server?
    - Backend-assisted?
    - Hybrid approach?
    - Reference implementation or examples?

---

**Environment:**

- Vite 6.x (modern ES bundler)
- Browser targets: Chrome/Firefox/Safari (latest)
- No Node.js server available in deployed apps
- React-based UI framework
