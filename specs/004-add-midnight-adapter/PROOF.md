# Concrete Proof: Midnight SDK Browser Incompatibility Issues

## Issue #1: Missing Dependencies in package.json

### Package: `@midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2`

**package.json declares:**

```json
{
  "name": "@midnight-ntwrk/midnight-js-indexer-public-data-provider",
  "version": "2.0.2",
  "dependencies": {
    "@apollo/client": "^3.13.8",
    "@midnight-ntwrk/midnight-js-network-id": "2.0.2",
    "@midnight-ntwrk/midnight-js-types": "2.0.2",
    "buffer": "^6.0.3",
    "cross-fetch": "^4.0.0",
    "graphql": "^16.8.0",
    "graphql-ws": "^6.0.0",
    "isomorphic-ws": "^5.0.0",
    "rxjs": "^7.5.0",
    "ws": "^8.14.2",
    "zen-observable-ts": "^1.1.0"
  }
}
```

**But dist/index.mjs actually imports:**

```javascript
import { ContractState } from '@midnight-ntwrk/compact-runtime'; // ❌ NOT DECLARED
import { Transaction, ZswapChainState } from '@midnight-ntwrk/ledger'; // ❌ NOT DECLARED
import {
  FailEntirely,
  FailFallible,
  InvalidProtocolSchemeError,
  SucceedEntirely,
} from '@midnight-ntwrk/midnight-js-types';
```

**Result:**

```
✘ [ERROR] Could not resolve "@midnight-ntwrk/ledger"
✘ [ERROR] Could not resolve "@midnight-ntwrk/compact-runtime"
```

---

### Package: `@midnight-ntwrk/midnight-js-types@2.0.2`

**package.json declares:**

```json
{
  "dependencies": {
    "rxjs": "^7.5.0"
  }
}
```

**But dist/index.mjs actually imports:**

```javascript
export { UnprovenTransaction } from '@midnight-ntwrk/ledger'; // ❌ NOT DECLARED
```

**Result:**

```
✘ [ERROR] Could not resolve "@midnight-ntwrk/ledger"
```

---

### Package: `@midnight-ntwrk/midnight-js-network-id@2.0.2`

**Imports but doesn't declare:**

```javascript
import * as runtime from '@midnight-ntwrk/compact-runtime'; // ❌ NOT DECLARED
import * as ledger from '@midnight-ntwrk/ledger'; // ❌ NOT DECLARED
```

---

### Package: `@midnight-ntwrk/midnight-js-utils@2.0.2`

**Imports but doesn't declare:**

```javascript
import { ...CoinPublicKey, ...EncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format'; // ❌ NOT DECLARED
```

---

## Issue #2: CommonJS/ESM Conflicts with WASM

### Evidence: `@midnight-ntwrk/compact-runtime@0.9.0`

**File: `dist/runtime.js` (lines 57-64)**

```javascript
// CommonJS module using require()
const inspect = require('object-inspect');
const ocrt = require('@midnight-ntwrk/onchain-runtime'); // ← This loads WASM
__exportStar(require('./version'), exports);
var onchain_runtime_1 = require('@midnight-ntwrk/onchain-runtime');

// Then tries to export as ESM properties
Object.defineProperty(exports, 'ContractState', {
  enumerable: true,
  get: function () {
    return onchain_runtime_1.ContractState;
  },
});
```

**The WASM package uses top-level await:**

```javascript
// @midnight-ntwrk/onchain-runtime/midnight_onchain_runtime_wasm.js
import * as wasm from "./midnight_onchain_runtime_wasm_bg.wasm";
// ... WASM initialization with top-level await
const __vite__wasmModule = await initWasm({ ... }); // ← top-level await
```

**Runtime Error:**

```
✘ [ERROR] This require call is not allowed because the transitive dependency
"vite-plugin-wasm-namespace:/Users/.../midnight_onchain_runtime_wasm_bg.wasm"
contains a top-level await

  ../../node_modules/@midnight-ntwrk/compact-runtime/dist/runtime.js:58:21:
    58 │ const ocrt = require("@midnight-ntwrk/onchain-runtime");
       ╵                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

**Browser Runtime Error:**

```
SyntaxError: The requested module '.../@midnight-ntwrk/compact-runtime/dist/runtime.js'
does not provide an export named 'ContractState'
```

**Why it fails:**

1. CommonJS `require()` is synchronous
2. WASM initialization uses `await` (asynchronous)
3. Vite/esbuild cannot reconcile this in browser environments
4. The module exports don't resolve properly at runtime

---

## Issue #3: No Browser-Compatible Query Layer

### Current State: Midnight SDK

**All query functionality requires Node.js + WASM:**

- `@midnight-ntwrk/midnight-js-indexer-public-data-provider` → imports `@midnight-ntwrk/ledger` (WASM)
- `@midnight-ntwrk/midnight-js-contracts` → imports `@midnight-ntwrk/compact-runtime` (WASM)
- No standalone browser-compatible query package exists

### Comparison: Other Ecosystems

#### ✅ Ethereum

```javascript
// Browser-compatible, no WASM, pure JS
import { createPublicClient, http } from 'viem';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

const balance = await client.getBalance({ address: '0x...' });
const data = await client.readContract({
  address: '0x...',
  abi: contractABI,
  functionName: 'balanceOf',
  args: ['0x...'],
});
```

#### ✅ Solana

```javascript
// Browser-compatible, no WASM, pure JS
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const balance = await connection.getBalance(new PublicKey('...'));
const accountInfo = await connection.getAccountInfo(new PublicKey('...'));
```

#### ✅ Near

```javascript
// Browser-compatible, no WASM, pure JS
import { connect, keyStores } from 'near-api-js';

const near = await connect({
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
});

const account = await near.account('example.near');
const result = await account.viewFunction({
  contractId: 'contract.near',
  methodName: 'get_balance',
  args: {},
});
```

#### ❌ Midnight

```javascript
// DOES NOT EXIST - No browser-compatible equivalent
// Must use Node.js + WASM packages:
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

// ↑ This imports @midnight-ntwrk/ledger (WASM), @midnight-ntwrk/compact-runtime (WASM)
// Cannot run in browser
```

---

## Summary

| Issue                      | Evidence                                                     | Impact                                     |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| **Missing Dependencies**   | 4 packages import undeclared dependencies                    | `Could not resolve` build errors           |
| **CommonJS/ESM with WASM** | `compact-runtime` uses `require()` with WASM top-level await | Dev server errors, runtime export failures |
| **No Browser SDK**         | No pure-JS query package like Ethereum/Solana/Near have      | Cannot build client-side dApps             |

---

## Test It Yourself

1. Create a fresh Vite project: `npm create vite@latest test-midnight -- --template react-ts`
2. Install: `npm install @midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2`
3. Import in `App.tsx`: `import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider'`
4. Run: `npm run dev`

**Result:** Instant build failure with unresolved dependencies and ESM/CommonJS conflicts.
