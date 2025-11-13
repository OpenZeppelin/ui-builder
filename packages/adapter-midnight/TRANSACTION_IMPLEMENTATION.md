# Midnight Contract Transaction Implementation

## Executive Summary

This document details the implementation of browser-based Midnight contract transaction execution in the OpenZeppelin Contracts UI Builder. The solution enables users to upload Midnight contract artifacts as ZIP files, dynamically load and execute contracts in the browser, generate zero-knowledge proofs, and submit transactions via the Lace wallet - all without requiring a backend server.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technical Challenges](#technical-challenges)
3. [Implementation Details](#implementation-details)
4. [SDK Modifications](#sdk-modifications)
5. [Known Limitations](#known-limitations)
6. [Future Improvements](#future-improvements)
7. [Testing Guidelines](#testing-guidelines)
8. [Identity Secret as Runtime-Only Credential](#identity-secret-as-runtime-only-credential)

---

## Architecture Overview

### High-Level Flow

```
User Uploads ZIP
    ↓
Extract Artifacts (browser)
    ↓
Parse Contract Definition (.d.ts/.d.cts)
    ↓
Register ZK Artifacts (in-memory)
    ↓
User Initiates Transaction
    ↓
Dynamic Contract Evaluation (shared WASM context)
    ↓
Create Transaction Options
    ↓
Retrieve ZK Artifacts (from memory)
    ↓
Submit to Proof Server (with embedded keys)
    ↓
Generate ZK Proof
    ↓
Lace Wallet Signs & Broadcasts
```

### Component Architecture

```
Browser Environment:
├── ZIP Extractor (jszip)
│   ├── Contract Definition (.d.ts/.d.cts)
│   ├── Contract Module (.cjs/.js)
│   ├── Witness Code (.js)
│   └── ZK Artifacts (.prover, .verifier, .bzkir)
│
├── Schema Parser
│   ├── Parse TypeScript Interfaces
│   └── Extract Circuits & Queries
│
├── EmbeddedZkConfigProvider (in-memory)
│   ├── registerAll() - Store artifacts
│   ├── get(circuitId) - Retrieve artifacts
│   └── Global instance shared across transactions
│
├── Contract Evaluator
│   ├── Shared WASM Context
│   ├── Dynamic Code Execution (new Function)
│   └── Dependency Injection (compact-runtime)
│
├── Buffer Polyfill
│   ├── Base64 Encoding/Decoding
│   ├── Hex Encoding/Decoding
│   └── UTF-8 String Handling
│
└── Transaction Execution
    ├── EOA Strategy
    ├── Provider Configuration
    └── Direct submitCallTx Invocation

Midnight SDK:
├── EmbeddedZkConfigProvider (provides keys from memory)
├── httpClientProofProvider (submits to proof server)
└── submitCallTx (transaction submission)
```

---

## Technical Challenges

### Challenge 1: WASM Context Isolation

**Problem**: Dynamically evaluated contract code creates a separate WebAssembly instance of `@midnight-ntwrk/compact-runtime`, causing type mismatches with the SDK's internal WASM instance.

**Symptoms**:

- `Error: expected either a valid UTF string, or a Uint8Array` during state verification
- `findDeployedContract` failures
- Type incompatibilities between contract and SDK

**Root Cause**: When using `new Function()` to evaluate contract code, the `require('@midnight-ntwrk/compact-runtime')` call resolves to a fresh module instance with its own WASM memory space, separate from the SDK's runtime.

**Solution**:

1. Pre-import the SDK's `@midnight-ntwrk/compact-runtime` instance
2. Inject it into the contract evaluator via a dependency map
3. Modify the sandbox's `require()` function to serve the injected instance
4. Unwrap ESM default exports to ensure correct object shape
5. Bypass `findDeployedContract` entirely, calling `submitCallTx` directly

**Implementation** (`packages/adapter-midnight/src/transaction/eoa.ts`):

```typescript
// Pre-import SDK's compact-runtime
const runtimeNs = await import('@midnight-ntwrk/compact-runtime');
const compactRuntime = (runtimeNs as Record<string, unknown>)?.default ?? runtimeNs;

// Inject into contract evaluator
const evaluationResult = await evaluateContractModule(artifacts.contractModule!, witnesses, {
  '@midnight-ntwrk/compact-runtime': compactRuntime,
});

// Direct transaction submission (bypass findDeployedContract)
const txHash = await submitCallTx(providers, contractInstance, functionName, args, txOptions);
```

**Configuration** (`packages/builder/vite.config.ts`):

```typescript
resolve: {
  dedupe: [
    '@midnight-ntwrk/compact-runtime',
    '@midnight-ntwrk/ledger',
    '@midnight-ntwrk/zswap',
    '@midnight-ntwrk/midnight-js-contracts',
  ],
},
optimizeDeps: {
  include: [
    '@midnight-ntwrk/compact-runtime',
    '@midnight-ntwrk/ledger',
    '@midnight-ntwrk/zswap',
    '@midnight-ntwrk/midnight-js-contracts',
  ],
}
```

### Challenge 2: Browser Buffer Compatibility

**Problem**: The Midnight SDK and its dependencies (`@dao-xyz/borsh`) expect Node.js `Buffer` to be available globally, but browsers don't provide this.

**Symptoms**:

- `Buffer is not defined` errors
- `allocUnsafe is not a function` in borsh serialization
- `stringLengthFn(...) is not a function` in borsh string handling
- Incorrect hex/base64 encoding

**Root Cause**: Module-level initialization in SDK dependencies captures `globalThis.Buffer` references at load time, before any polyfill can be installed.

**Solution**:

**Part 1: Comprehensive Buffer Polyfill** (`packages/adapter-midnight/src/index.ts`):

```typescript
if (!globalThis.Buffer) {
  (globalThis as any).Buffer = {
    from: (data: string | Uint8Array, encoding?: string) => {
      let uint8Array: Uint8Array;
      if (typeof data === 'string') {
        if (encoding === 'hex') {
          const bytes = [];
          for (let i = 0; i < data.length; i += 2) {
            bytes.push(parseInt(data.substr(i, 2), 16));
          }
          uint8Array = new Uint8Array(bytes);
        } else {
          uint8Array = new TextEncoder().encode(data);
        }
      } else {
        uint8Array = new Uint8Array(data);
      }

      // Add toString method for encoding conversions
      (uint8Array as any).toString = (enc?: string) => {
        if (enc === 'hex') {
          return Array.from(uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
        if (enc === 'base64') {
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          return btoa(binary);
        }
        return new TextDecoder().decode(uint8Array);
      };
      return uint8Array;
    },
    alloc: (size: number) => new Uint8Array(size),
    allocUnsafe: (size: number) => new Uint8Array(size),
    isBuffer: (obj: unknown) => obj instanceof Uint8Array,
    byteLength: (str: string, encoding?: string) => {
      if (encoding === 'utf8' || !encoding) {
        return new TextEncoder().encode(str).length;
      }
      if (encoding === 'hex') {
        return str.length / 2;
      }
      if (encoding === 'base64') {
        return Math.floor((str.length * 3) / 4);
      }
      return new TextEncoder().encode(str).length;
    },
  };
}
```

**Part 2: Runtime Function Wrappers in borsh** (`node_modules/@dao-xyz/borsh/lib/esm/binary.js`):

```javascript
// MONKEY-PATCH: Check for Buffer at runtime, not at module load time
const allocUnsafe = (len) => {
  const fn = allocUnsafeFn();
  return fn(len);
};

// MONKEY-PATCH: Check for Buffer.byteLength at runtime
const stringLengthFn = () => {
  if (globalThis.Buffer && globalThis.Buffer.byteLength) {
    return (str) => globalThis.Buffer.byteLength(str, 'utf8');
  }
  return utf8.length;
};
```

### Challenge 3: ZK Artifact Distribution

**Problem**: Zero-knowledge prover and verifier keys (binary files, ~250KB each) need to be provided to the proof server when generating transaction proofs, and they're extracted from a user-uploaded ZIP file.

**Challenges**:

- Can't use static file serving (artifacts are dynamic, user-uploaded)
- Can't embed in contract code (too large, ~500KB+ per circuit)
- Must work in pure browser environment (no server dependencies)
- Need to survive page refreshes for good UX

**Solution**: In-Memory Provider with Global Instance

**Implementation** (`packages/adapter-midnight/src/transaction/embedded-zk-config-provider.ts`):

```typescript
/**
 * A ZkConfigProvider that stores ZK artifacts entirely in browser memory.
 * Works identically in development and production without any server.
 */
export class EmbeddedZkConfigProvider {
  constructor(private artifacts: Record<string, ZkArtifact> = {}) {}

  /**
   * Register multiple ZK artifacts at once (called during ZIP extraction)
   */
  registerAll(artifacts: Record<string, ZkArtifact>): void {
    this.artifacts = { ...this.artifacts, ...artifacts };
  }

  /**
   * Get ZK configuration for a circuit (called by SDK when creating proofs)
   */
  async get(circuitId: string): Promise<ZKConfig | undefined> {
    const artifact = this.artifacts[circuitId];
    if (!artifact) return undefined;

    return {
      circuitId,
      proverKey: artifact.prover, // ~250KB Uint8Array
      verifierKey: artifact.verifier, // ~250KB Uint8Array
      zkir: artifact.zkir || new Uint8Array(0), // ~50KB Uint8Array
    };
  }
}
```

**Global Instance** (`packages/adapter-midnight/src/transaction/providers.ts`):

```typescript
// Single shared instance across all transactions
export const globalZkConfigProvider = new EmbeddedZkConfigProvider();

export async function createTransactionProviders(...) {
  // ...
  const zkConfigProvider = globalZkConfigProvider;
  // ...
}
```

**Registration During ZIP Upload** (`packages/adapter-midnight/src/utils/artifacts.ts`):

```typescript
// When user uploads ZIP file
const extractedArtifacts = await extractMidnightContractZip(base64Data);

if (extractedArtifacts.zkArtifacts) {
  // Store in global provider (pure browser, no server)
  globalZkConfigProvider.registerAll(extractedArtifacts.zkArtifacts);
  logger.info('Registered ZK artifacts:', Object.keys(extractedArtifacts.zkArtifacts));
}
```

**Key Benefits**:

- ✅ **No Server Required**: Works in pure static deployment
- ✅ **Identical Dev/Prod**: Same code path everywhere
- ✅ **Zero Network Overhead**: Artifacts already in memory
- ✅ **Simple Architecture**: No HTTP, no serialization, no Vite plugin

**Trade-offs**:

- ⚠️ **Page Reload**: Artifacts cleared on refresh (by design - user re-uploads ZIP)
- ⚠️ **Memory Usage**: ~500KB-1MB per circuit kept in browser memory
- ⚠️ **Single Contract**: Only one contract's artifacts at a time (acceptable for MVP)

### Challenge 4: Hex Encoding in SDK Utils

**Problem**: Multiple SDK utility functions expect Node.js-specific behavior that doesn't work in browsers.

**Issue 1: parseCoinPublicKeyToHex**

- **Problem**: Uses `Buffer.from(data).toString('hex')` which fails with broken Buffer polyfill
- **Solution**: Direct `Uint8Array` → hex conversion
- **File**: `node_modules/@midnight-ntwrk/midnight-js-utils/dist/index.mjs`

```javascript
const parseCoinPublicKeyToHex = (possibleBech32, zswapNetworkId) => {
  if (isHex(possibleBech32)) {
    return possibleBech32;
  }
  const parsedBech32 = MidnightBech32m.parse(possibleBech32);
  const decoded = ShieldedCoinPublicKey.codec.decode(zswapNetworkId, parsedBech32);

  // MONKEY-PATCH FIX: Direct Uint8Array to hex conversion
  const uint8Array = decoded.data;
  const hexResult = Array.from(uint8Array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hexResult;
};
```

**Issue 2: NetworkId Enum**

- **Problem**: `runtime.NetworkId` is undefined in browser builds
- **Solution**: Provide fallback enum
- **File**: `node_modules/@midnight-ntwrk/midnight-js-network-id/dist/index.mjs`

```javascript
const RuntimeNetworkId = runtime.NetworkId || {
  Undeployed: { tag: 'undeployed' },
  TestNet: { tag: 'testnet' },
  DevNet: { tag: 'devnet' },
  MainNet: { tag: 'mainnet' },
};

const toRuntimeNetworkId = (networkId) => {
  return RuntimeNetworkId[networkId];
};
```

**Issue 3: Proof Server Content-Type**

- **Problem**: Missing `Content-Type` header causes 415 errors
- **Solution**: Add `application/octet-stream` header
- **File**: `node_modules/@midnight-ntwrk/midnight-js-http-client-proof-provider/dist/index.mjs`

```javascript
const response = await fetchRetry(urlObject, {
  method: 'POST',
  body: payload,
  headers: {
    'Content-Type': 'application/octet-stream',
  },
  signal: AbortSignal.timeout(config.timeout),
});
```

---

## Implementation Details

### Contract Definition Parsing

**File**: `packages/adapter-midnight/src/utils/schema-parser.ts`

**Challenge**: TypeScript definition files can use multiple patterns for declaring contract interfaces.

**Supported Patterns**:

1. **Type Alias Pattern**:

```typescript
export type Circuits<T> = {
  increment(): Witnesses<T>;
  decrement(): Witnesses<T>;
};
```

2. **Interface Property Pattern**:

```typescript
export declare class Contract {
  circuits: {
    increment(): Witnesses;
    decrement(): Witnesses;
  };
}
```

3. **Ledger Query Pattern**:

```typescript
export type Ledger = {
  readonly counter: Counter;
};
```

4. **Function Return Pattern**:

```typescript
export declare function ledger(...): {
  readonly counter: Counter;
};
```

**Implementation**:

```typescript
export function extractCircuits(content: string): ContractFunction[] {
  const circuits: ContractFunction[] = [];

  // Pattern 1: export type Circuits<T> = { ... }
  const typeAliasRegex = /export\s+type\s+Circuits<[^>]*>\s*=\s*\{([^}]*)\};?/s;
  const typeAliasMatch = content.match(typeAliasRegex);

  if (typeAliasMatch) {
    const body = typeAliasMatch[1];
    const functionRegex = /(\w+)\s*\([^)]*\)\s*:/g;
    let match;
    while ((match = functionRegex.exec(body))) {
      circuits.push({
        name: match[1],
        type: 'circuit' as const,
        inputs: [],
        outputs: [],
      });
    }
    return circuits;
  }

  // Pattern 2: declare class Contract { circuits: { ... } }
  // ... fallback implementations
}
```

### Dynamic Contract Evaluation

**File**: `packages/adapter-midnight/src/transaction/contract-evaluator.ts`

**Challenge**: Execute compiled contract code (CommonJS) in a browser sandbox with controlled dependencies.

**Approach**:

1. Create a minimal CommonJS environment with `require`, `module`, `exports`
2. Inject dependencies via a lookup map
3. Use `new Function()` to evaluate code (safer than `eval()`)
4. Unwrap ESM default exports for compatibility

**Implementation**:

```typescript
export async function evaluateContractModule(
  moduleCode: string,
  witnesses: Record<string, unknown>,
  deps?: Record<string, unknown>
): Promise<EvaluatedContract> {
  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: (moduleName: string) => {
      // Priority 1: Injected dependencies (e.g., compact-runtime)
      if (deps && moduleName in deps) {
        const mod = deps[moduleName];
        // Unwrap ESM default exports
        return (mod as Record<string, unknown>)?.default ?? mod;
      }

      // Priority 2: Built-in modules
      if (moduleName === './witnesses' || moduleName === './witnesses.js') {
        return witnesses;
      }

      throw new Error(`Module not found: ${moduleName}`);
    },
  };

  const evalFunction = new Function('require', 'module', 'exports', moduleCode);

  evalFunction(sandbox.require, sandbox.module, sandbox.exports);

  const moduleExports = sandbox.module.exports;
  const Contract = (moduleExports as Record<string, unknown>).Contract;

  // Instantiate with witnesses
  const contractInstance = new (Contract as any)(witnesses);

  return {
    contract: contractInstance,
    exports: moduleExports,
  };
}
```

### Witness Code Sanitization

**File**: `packages/adapter-midnight/src/transaction/witness-evaluator.ts`

**Challenge**: Witness code is provided as ES modules with `import`/`export` statements, but needs to run in a CommonJS-style sandbox.

**Solution**: Strip ESM syntax before evaluation:

```typescript
export async function evaluateWitnessCode(witnessCode: string): Promise<Record<string, unknown>> {
  // Remove top-level import statements
  let sanitized = witnessCode.replace(/^\s*import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');

  // Convert "export const witnesses = ..." to "const witnesses = ..."
  sanitized = sanitized.replace(/export\s+const\s+witnesses\s*=/, 'const witnesses =');

  // Remove "export default ..." and "export { ... }"
  sanitized = sanitized.replace(/export\s+default\s+\{[^}]*\};?/g, '');
  sanitized = sanitized.replace(/export\s*\{[^}]*\};?/g, '');

  // Fallback: remove any leading "export " keyword
  sanitized = sanitized.replace(/^export\s+/gm, '');

  const evalFunction = new Function('return (() => { ' + sanitized + '; return witnesses; })()');
  return evalFunction();
}
```

### ZIP Extraction Strategy

**File**: `packages/adapter-midnight/src/utils/zip-extractor.ts`

**Requirements**:

1. Extract contract definition (`.d.ts` or `.d.cts`)
2. Extract contract module (`.cjs` or `.js`)
3. Extract witness code (`.js`, prefer compiled over `.ts`)
4. Extract ZK artifacts (`.prover`, `.verifier`, `.bzkir`)
5. Handle nested directory structures
6. Resolve re-exports (`export * from './...'`)

**Implementation Highlights**:

**Re-export Resolution**:

```typescript
async function resolveReExports(content: string, zip: JSZip, currentPath: string): Promise<string> {
  const reExportRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  let match;
  let resolvedContent = content;

  while ((match = reExportRegex.exec(content))) {
    const relativePath = match[1];
    const resolvedPath = resolvePath(currentPath, relativePath);

    const reExportedFile =
      zip.file(resolvedPath + '.ts') ||
      zip.file(resolvedPath + '.d.ts') ||
      zip.file(resolvedPath + '.d.cts');

    if (reExportedFile) {
      const reExportedContent = await reExportedFile.async('string');
      // Recursively resolve nested re-exports
      const fullyResolved = await resolveReExports(reExportedContent, zip, resolvedPath);
      // Append interfaces (remove re-export line)
      resolvedContent = resolvedContent.replace(match[0], fullyResolved);
    }
  }

  return resolvedContent;
}
```

**ZK Artifact Extraction**:

```typescript
// Find all .prover files (these define the circuits)
const proverFiles = Object.keys(files).filter((f) => f.endsWith('.prover'));

for (const proverPath of proverFiles) {
  const circuitId = path.basename(proverPath, '.prover');
  const basePath = path.dirname(proverPath);

  // Find corresponding .verifier
  const verifierPath = `${basePath}/${circuitId}.verifier`;
  const verifierFile = files[verifierPath];

  // Find corresponding .bzkir or .zkir
  const zkirPath = `${basePath}/${circuitId}.bzkir` || `${basePath}/${circuitId}.zkir`;
  const zkirFile = files[zkirPath];

  if (verifierFile) {
    artifacts.zkArtifacts![circuitId] = {
      prover: await files[proverPath].async('uint8array'),
      verifier: await verifierFile.async('uint8array'),
      zkir: zkirFile ? await zkirFile.async('uint8array') : undefined,
    };
  }
}
```

---

## SDK Modifications

### Summary of Monkey-Patches

All SDK modifications are in `node_modules` and are **required** for browser compatibility. They should be documented as patches for future SDK updates.

| File                                                                    | Function                  | Issue                        | Fix                              |
| ----------------------------------------------------------------------- | ------------------------- | ---------------------------- | -------------------------------- |
| `@midnight-ntwrk/midnight-js-utils/dist/index.mjs`                      | `parseCoinPublicKeyToHex` | Buffer.toString('hex') fails | Direct Uint8Array→hex conversion |
| `@midnight-ntwrk/midnight-js-utils/dist/index.mjs`                      | `parseEncPublicKeyToHex`  | Buffer.toString('hex') fails | Direct Uint8Array→hex conversion |
| `@midnight-ntwrk/midnight-js-http-client-proof-provider/dist/index.mjs` | `proveTx`                 | Missing Content-Type header  | Add 'application/octet-stream'   |
| `@dao-xyz/borsh/lib/esm/binary.js`                                      | `allocUnsafe`             | Captured at module load      | Runtime function wrapper         |
| `@dao-xyz/borsh/lib/esm/binary.js`                                      | `stringLengthFn`          | Captured at module load      | Runtime function wrapper         |

**Note**: The `@midnight-ntwrk/midnight-js-network-id` patch only adds dependencies (no code changes). Module singleton behavior is ensured by Vite's `dedupe` configuration in `vite.config.ts`.

### Patch Maintenance Strategy

**Option 1: patch-package**

```bash
npm install patch-package
npx patch-package @midnight-ntwrk/midnight-js-utils
npx patch-package @midnight-ntwrk/midnight-js-network-id
npx patch-package @midnight-ntwrk/midnight-js-http-client-proof-provider
npx patch-package @dao-xyz/borsh
```

**Option 2: Manual Documentation**

- Keep this document updated with exact changes
- Reapply manually after SDK updates
- Track SDK version compatibility

**Option 3: Upstream Contributions**

- Submit PRs to Midnight SDK repositories
- Add browser compatibility flags
- Export browser-specific builds

---

## Known Limitations

### 1. Proof Server Version Compatibility

**Issue**: Prover and verifier keys contain version metadata that must match the proof server's expected version.

**Current Behavior**:

- Proof server expects version 4.0
- Contract must be compiled with compatible Compact compiler
- Version mismatch results in 400 Bad Request

**Workaround**: Recompile contract with current Compact compiler:

```bash
cd contracts/your-contract
yarn compact
yarn build
```

**Future Solution**:

- Detect proof server version via API
- Display warning if version mismatch
- Support multiple compiler versions

### 2. Pure Client-Side Implementation

**Resolution**: ZK artifacts are stored entirely in browser memory.

**Current Behavior**:

- Artifacts stored in global `EmbeddedZkConfigProvider` instance
- Works identically in development and production
- No server dependencies required
- Artifacts persist across transactions in same session
- Cleared on page reload (by design)

**Production Deployment**: No changes required - deploy as static files like EVM/Stellar

**Future Enhancements**:

- Persist to IndexedDB for multi-session support
- Add artifact version management
- Implement contract-level artifact caching

### 3. Hot Module Replacement Limitations

**Issue**: HMR doesn't always propagate changes to utility modules.

**Current Behavior**:

- Changes to `artifacts.ts` may require hard refresh
- Buffer polyfill changes require page reload
- Most component changes work with HMR

**Workaround**: Hard refresh browser (Cmd/Ctrl + Shift + R) after code changes

**Future Solution**: Configure Vite HMR boundaries more precisely

### 4. Single Contract per Session

**Issue**: Current implementation overwrites artifacts when uploading different contracts.

**Current Behavior**:

- Uploading Contract B replaces Contract A's artifacts
- Can only work with one contract at a time
- No contract switching without re-upload

**Future Solution**:

- Multi-contract artifact store keyed by contract address
- Contract selector UI
- Lazy-load artifacts per contract

### 5. Organizer-Only Circuits Require Initialized Private State

**Issue**: Circuits marked as organizer-only require an organizer secret key to seed private state before proof generation. Without it, the proof server returns a 400 error.

**Current Behavior (Runtime-Only Secret)**:

- The organizer secret is prompted at execution time (never during artifact loading)
- A runtime-only private state overlay injects the secret for the duration of the call
- The secret is never persisted; writes strip `organizerSecretKey` before storage
- For participant-only circuits without organizer logic, private state is optional

**How to Use**:

1. Execute an organizer-only circuit and enter the "Organizer Secret Key (hex)" when prompted in the form.
2. The EOA execution strategy uses `createPrivateStateOverlay` to expose the secret in memory during `get(id)` and to strip it on `set(id)`.
3. For organizer-less contracts (or participant-only ones), leave the field empty.

**Handling Missing Private State**:

The overlay treats underlying storage misses (e.g., IndexedDB "Entry not found") as `null` state, allowing the runtime key to be injected without error.

**Example Error Message (legacy environments)**:

If you attempt to call an organizer-only circuit without providing the runtime secret:

```
Private state not initialized for this contract/privateStateId.
For organizer-only circuits, provide the organizer secret key at execution time so the private state can be seeded.
```

**Future Improvements**:

- Auto-detect organizer-only circuits from contract definition and show contextual hints
- UI indicators for organizer-only vs participant-only circuits
- Optional ephemeral in-memory caching (short-lived) to reduce re-prompting

### 3. Error Messages

**Issue**: Low-level SDK errors don't provide user-friendly feedback.

**Examples**:

- "Cannot read properties of undefined" → unclear what's missing
- "400 Bad Request" → doesn't explain version mismatch
- "Not Found" → doesn't specify which artifact

**Future Solution**:

- Add error translation layer
- Provide actionable error messages
- Include troubleshooting links

---

## Future Improvements

### Short Term (Next Sprint)

1. **Persistent Artifact Storage**
   - Store ZK artifacts in IndexedDB
   - Implement cache invalidation by contract hash
   - Add "Clear Cache" UI button

2. **Multi-Contract Support**
   - Extend store to support multiple contracts
   - Add contract selector dropdown
   - Lazy-load artifacts per contract

3. **Better Error Handling**
   - Add error translation middleware
   - Implement user-friendly error messages
   - Add retry logic for transient failures

4. **Loading States**
   - Show upload progress for large ZK artifacts
   - Display proof generation status
   - Add transaction confirmation animation

### Medium Term (Next Quarter)

1. **Proof Server Version Detection**
   - Query proof server for supported versions
   - Display compatibility warnings
   - Support multiple compiler versions

2. **Contract Validation**
   - Verify artifact integrity (checksums)
   - Validate circuit IDs match contract definition
   - Check for required vs optional files

3. **Performance Optimization**
   - Stream large artifact uploads
   - Compress artifacts for transport
   - Implement request batching

4. **Testing Infrastructure**
   - Unit tests for all evaluators
   - Integration tests for transaction flow
   - Mock proof server for testing

### Long Term (Future Releases)

1. **Upstream SDK Contributions**
   - Submit browser compatibility patches
   - Request official browser builds
   - Contribute to SDK documentation

2. **Alternative Proof Generation**
   - Client-side proof generation (WASM)
   - Distributed proof generation
   - Proof caching and reuse

3. **Smart Contract Registry**
   - Public registry of verified contracts
   - Artifact CDN for common contracts
   - Community-verified contract library

4. **Developer Experience**
   - Contract debugging tools
   - Transaction simulation
   - Gas estimation for Midnight

---

## Testing Guidelines

### Manual Testing Checklist

**Contract Upload**:

- [ ] Upload valid ZIP file
- [ ] Verify functions extracted correctly
- [ ] Check artifact counts in logs
- [ ] Test with multiple circuits
- [ ] Test with nested directory structures

**Transaction Execution**:

- [ ] Execute write function (circuit)
- [ ] Execute read function (query)
- [ ] Verify wallet popup appears
- [ ] Check transaction hash returned
- [ ] Verify transaction on explorer

**Error Scenarios**:

- [ ] Invalid ZIP file
- [ ] Missing contract definition
- [ ] Missing ZK artifacts
- [ ] Wrong compiler version
- [ ] Network disconnection
- [ ] Proof server timeout

**Performance**:

- [ ] Large contract upload (>1MB)
- [ ] Multiple sequential transactions
- [ ] Server restart and re-upload
- [ ] Page refresh behavior

### Automated Testing Recommendations

**Unit Tests**:

```typescript
describe('ZIP Extractor', () => {
  it('should extract contract definition', async () => {
    const zip = await createTestZip();
    const artifacts = await extractMidnightContractZip(zip);
    expect(artifacts.contractDefinition).toBeDefined();
  });

  it('should extract ZK artifacts', async () => {
    const zip = await createTestZip();
    const artifacts = await extractMidnightContractZip(zip);
    expect(artifacts.zkArtifacts).toHaveProperty('increment');
  });
});

describe('Schema Parser', () => {
  it('should extract circuits from type alias', () => {
    const content = 'export type Circuits<T> = { increment(): T; };';
    const circuits = extractCircuits(content);
    expect(circuits).toHaveLength(1);
    expect(circuits[0].name).toBe('increment');
  });
});

describe('Contract Evaluator', () => {
  it('should evaluate contract with injected dependencies', async () => {
    const mockRuntime = { version: '0.9.0' };
    const result = await evaluateContractModule(
      'module.exports = { test: require("@midnight-ntwrk/compact-runtime") }',
      {},
      { '@midnight-ntwrk/compact-runtime': mockRuntime }
    );
    expect(result.exports.test).toBe(mockRuntime);
  });
});
```

**Integration Tests**:

```typescript
describe('Transaction Flow', () => {
  it('should execute full transaction', async () => {
    // Upload contract
    await uploadContract(testZipFile);

    // Execute transaction
    const tx = await executeTransaction('increment', []);

    // Verify result
    expect(tx.hash).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
```

### Monitoring Recommendations

**Metrics to Track**:

- Artifact upload success rate
- Average proof generation time
- Transaction success rate
- Error types and frequency
- Browser compatibility issues

**Logging Best Practices**:

- Use structured logging with context
- Include contract address in all logs
- Log performance markers (upload time, proof time)
- Separate debug/info/error levels

---

## Identity Secret as Runtime-Only Credential

### Overview

Some circuits require an identity secret key to execute (often called organizer/owner key in specific contracts). To protect this sensitive material, the adapter treats the identity secret key as a **runtime-only credential** that is:

- **Never requested or stored** in contract definition
- **Never persisted** in builder configuration or artifacts
- **Prompted at execution time**, similar to a relayer API key
- **Seeded locally** in the private state provider just-in-time before transaction execution
- **Not transmitted** across the network (stays in private state provider)

### Architecture

```
User Executes Transaction
    ↓
UI Prompts for Identity Secret (Midnight EOA only)
    ↓
User Enters Secret (hex string, no 0x prefix)
    ↓
Secret Passed as runtime context (runtimeApiKey)
    ↓
EOA Strategy Receives Secret
    ↓
Hex Decode to Bytes
    ↓
Seed Private State Provider: { <identitySecretKeyPropertyName>: bytes } // default: organizerSecretKey
    ↓
callCircuit Executes with Seeded State
    ↓
Private State Provider Returns Updated State After Execution
    ↓
Updated State Persisted Locally (without secret)
```

### Implementation Details

**1. No Storage in Contract Definition**

The Midnight adapter's `getContractDefinitionInputs()` does NOT include an organizer secret key field. Users upload only:

- Contract address
- Private State ID
- Contract build artifacts (ZIP)

**2. Runtime-Only Form Field (Builder)**

The Builder auto-adds a `runtimeSecret` field to the form for functions that require an identity secret (based on adapter-provided function decorations). This field:

- Appears in the form like any other field
- Has an adapter-defined `label` and `helperText` (e.g., "Identity Secret Key (hex)")
- Includes `adapterBinding.key` used to route the secret to the adapter
- Is never persisted and is removed from contract arguments at submit time

Example shape:

```ts
{
  id: 'runtime-secret-organizer',
  name: 'organizerSecretKeyHex',
  label: 'Identity Secret Key (hex)',
  type: 'runtimeSecret',
  validation: { required: false },
  adapterBinding: { key: 'organizerSecretKeyHex' },
}
```

At execution, the renderer extracts values from all `runtimeSecret` fields and supplies them to the adapter without including them in the contract call arguments.

**3. Seeding in EOA Strategy**

In `EoaExecutionStrategy.execute()`, after providers are initialized and before contract instantiation:

```typescript
// Seed private state from runtime key if provided (runtime-only, never persisted)
if (_runtimeApiKey) {
  try {
    const hex = _runtimeApiKey.trim().replace(/^0x/, '');
    const bytes = hexToBytes(hex);
    await providers.privateStateProvider.set(privateStateId, { organizerSecretKey: bytes });
}
```

**4. No Persistence in Artifacts**

The artifact payloads in `formatter.ts` never include `organizerSecretKeyHex`. The `_artifacts` object in transaction options contains only:

- `privateStateId`
- `contractModule`
- `witnessCode`
- `verifierKeys`

**5. Fast Failure for Missing Secret**

In `callCircuit.ts`, if private state is missing and no identity secret was provided, a clear error is thrown:

```
Private state not initialized for this contract/privateStateId.
For identity-restricted circuits, provide the Identity Secret Key in the form
so the private state can be seeded.
```

### User Flow

**For participant-only contracts** (no organizer circuits):

1. Load contract (no organizer secret needed)
2. Execute transaction
3. Submit succeeds

**For organizer-only circuits** (e.g., setName):

1. Load contract (no secret requested)
2. Execute transaction
3. UI prompts: "Organizer Secret Key (hex)" field appears
4. User enters the organizer secret key
5. EOA strategy seeds private state with the secret
6. Transaction proceeds with seeded state
7. Proof generation succeeds
8. Transaction submitted
9. **Secret is NOT stored anywhere**

Next time a different organizer-only circuit is executed, the user must provide the secret again.

### Security Benefits

- **Zero Storage**: Organizer secret never touches IndexedDB or local storage
- **Session-Scoped**: Secret only exists in memory for the duration of the transaction
- **No Network Leaks**: Secret never transmitted to proof server or backend
- **Explicit Interaction**: User must consciously provide the secret each time it's needed
- **No Accidental Exposure**: No risk of secret leaking in exported apps or backups

### Future Improvements

1. **Auto-Detection**: Automatically show the organizer secret prompt based on circuit analysis
2. **UI Hints**: Display which circuits are organizer-only vs participant-only
3. **Batch Execution**: Allow multiple organizer-only circuits in one session with single key entry
4. **Ephemeral Caching**: Optional short-lived in-memory cache (e.g., 5 minutes) to reduce re-prompting

---

## Appendix

### Dependencies

**Core Dependencies**:

- `jszip` - ZIP file extraction
- `@midnight-ntwrk/compact-runtime` - Contract runtime
- `@midnight-ntwrk/midnight-js-contracts` - Contract utilities
- `@midnight-ntwrk/midnight-js-http-client-proof-provider` - Proof server client
- `@midnight-ntwrk/midnight-js-level-private-state-provider` - IndexedDB state storage

**Development Dependencies**:

- Vite - Development server
- TypeScript - Type checking
- ESLint - Code quality

### File Structure

```
packages/adapter-midnight/src/
├── index.ts                          # Buffer polyfill entry point
├── utils/
│   ├── zip-extractor.ts             # ZIP extraction & artifact parsing
│   ├── schema-parser.ts             # Contract definition parsing
│   └── artifacts.ts                 # Artifact validation & registration
├── transaction/
│   ├── eoa.ts                       # EOA transaction strategy
│   ├── providers.ts                 # Provider configuration & global instance
│   ├── embedded-zk-config-provider.ts # In-memory ZK artifact provider
│   ├── contract-evaluator.ts       # Dynamic contract evaluation
│   └── witness-evaluator.ts        # Witness code evaluation
└── networks/
    └── testnet.ts                   # Network configuration

packages/builder/
└── vite.config.ts                   # Vite configuration (deduplication)

node_modules/ (monkey-patched)
├── @midnight-ntwrk/
│   ├── midnight-js-utils/
│   ├── midnight-js-network-id/
│   └── midnight-js-http-client-proof-provider/
└── @dao-xyz/borsh/
```

### References

- [Midnight Documentation](https://docs.midnight.network/)
- [Compact Language Specification](https://docs.midnight.network/develop/compact/)
- [Midnight SDK Reference](https://docs.midnight.network/develop/sdk/)

---

## Conclusion

This implementation successfully achieves **true browser-based Midnight contract execution** without any backend server requirements. The solution handles WASM contexts, binary data encoding, and SDK compatibility challenges through a combination of polyfills, monkey-patches, and careful architecture decisions.

The architecture prioritizes:

1. **Zero Backend** - Pure static deployment identical to EVM and Stellar adapters
2. **Developer Experience** - Simple ZIP upload workflow with automatic artifact registration
3. **Security** - Sandboxed code evaluation with controlled dependencies
4. **Performance** - In-memory artifact storage, lazy loading, efficient encoding
5. **Production Ready** - Same code path in development and production

Key Achievements:

- ✅ **No Infrastructure Changes**: Deploy as static files to any CDN/hosting
- ✅ **Pure Client-Side**: All ZK artifacts stored in browser memory
- ✅ **Zero Network Overhead**: No artifact HTTP requests during transactions
- ✅ **Simple Architecture**: Removed server plugin, HTTP endpoints, serialization layer

## 6. Organizer-Only Circuit Detection and UI Badges

### Problem

Midnight circuits often have gated logic that depends on organizer-only access (e.g., owner checks using `local_sk`). Users need to know:

1. Which circuits require the organizer secret key
2. What the organizer-only access means and why it's needed

Traditional documentation or naming heuristics are error-prone and don't reflect the actual compiled contract behavior.

### Solution: Runtime Detection via Instrumentation

The adapter performs safe, ground-truth detection by dry-running circuits with instrumentation:

**Detection Strategy:**

- **Private-state Proxy**: Intercepts reads of `organizerSecretKey` in private state; flips a flag and returns zeroed bytes so execution proceeds
- **Witness Wrapper**: Wraps known sensitive witnesses (`local_sk`, `set_owner_from_local_sk`, `compute_commitment_with_secret`, `check_pin`); flips the same flag on invocation
- **Stubbed Proof Provider**: Throws a sentinel error before proof generation, ensuring no network calls or transaction submission
- **Minimal Input Matrix**: Tests each circuit with 1–5 argument combinations (baseline + boolean/optional toggles) to handle branchy logic
- **Concurrency Control**: Processes 3 circuits in parallel to keep UI responsive
- **Caching**: Results cached per contract+privateStateId+artifactsHash to avoid repeated detection

**Key Safety Properties:**

- No secrets logged; only flags toggled
- No persistence; detecting provider drops writes
- No network calls; proof submission stubbed
- Timeboxed execution (1.5s per attempt) with graceful timeout handling
- Path-sensitive: if a circuit only guards access under specific branches, detection may require a tweaked input matrix (most owner checks happen early, so one pass typically suffices)

**Limitations:**

- If a circuit is purely conditional on user input (e.g., "only if age > 18 AND is_admin"), a naive input set might miss the condition. Mitigation: provide explicit input hints or run a broader matrix.
- Detection is best-effort; complex circuits with deep branches may not be fully characterized with a minimal matrix.

### Adapter API and UI Integration

**New types** (in `packages/types/src/adapters/base.ts`):

- `FunctionBadge`: Visual badge next to function (`{ text: string, variant?: 'info'|'warning'|'neutral' }`)
- `FunctionDecoration`: Badges + optional notes for a function
- `FunctionDecorationsMap`: Map of circuit ID to decorations

**New adapter method** (in `ContractAdapter` interface):

```typescript
getFunctionDecorations?(): Promise<FunctionDecorationsMap | undefined>;
```

**Midnight adapter implementation** (in `packages/adapter-midnight/src/adapter.ts`):

- Maintains `organizerOnlyCache` (Map<cacheKey, detectionResults>)
- `getFunctionDecorations()` returns cached results or initiates async detection
- Maps `{ organizerOnly: true }` to:
  - Badge: "Organizer-only" (warning variant)
  - Note: "This circuit requires an organizer secret key. The key is requested at execution time and never stored."

**Renderer** (chain-agnostic, no Midnight-specific UI):

- Function list component: Renders adapter-provided badges next to function names
- Function selection panel (e.g., `TransactionForm`): Displays adapter-provided note in a neutral info alert

### Future Enhancements

1. **Background Detection**: Kick off detection async in the background after artifacts load; progressively update UI as circuits complete detection
2. **Input Matrix Customization**: Allow users to provide explicit test cases for complex branchy circuits
3. **Per-Branch Analysis**: Extended detection to map which input paths lead to organizer-only checks
4. **Caching Persistence**: Store detection results in session storage or IndexedDB for multi-session performance

Future work should focus on:

1. Upstreaming browser compatibility fixes to Midnight SDK
2. Improving error messages and debugging tools
3. Adding comprehensive test coverage
4. Optional IndexedDB persistence for multi-session artifact caching
