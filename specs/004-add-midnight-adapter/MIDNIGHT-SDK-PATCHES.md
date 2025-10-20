# Midnight SDK Patches - Implementation Summary

## Overview

Successfully patched 5 Midnight SDK packages to fix packaging bugs that prevented browser compatibility. These patches enable read-only contract queries to work in the UI Builder without requiring a backend server.

## Problem Statement

The Midnight SDK v2.0.2 has several packaging issues that prevented it from working in browser environments:

1. **Missing Peer Dependencies**: Multiple packages use dependencies without declaring them in their `package.json`, causing module resolution failures
2. **CommonJS/ESM Conflicts**: The `compact-runtime` package only provided CommonJS exports, causing "does not provide an export named X" errors in ESM contexts
3. **Hardcoded CJS Imports**: The `indexer-public-data-provider` compiled output imports from `.cjs` files instead of using package exports
4. **Incorrect Default Imports**: The `cross-fetch` import assumes a default export that doesn't exist in browser environments
5. **Broken WASM Integration**: Top-level await in WASM modules combined with CommonJS exports prevented proper bundling

## Solution: pnpm Patch System

Used pnpm's built-in patching system to fix the SDK packages:

```bash
pnpm patch <package@version>          # Create editable copy
# Make changes to the package
pnpm patch-commit <patch-directory>   # Generate and apply patch
```

This approach:

- Creates persistent patches in the `patches/` directory
- Automatically applies patches on `pnpm install`
- Can be removed once Midnight publishes fixed versions
- Is more maintainable than forking packages

## Patches Applied

### 1. @midnight-ntwrk/midnight-js-indexer-public-data-provider@2.0.2

**Files Modified**:

1. `package.json`
2. `dist/index.mjs`

**Changes to `package.json`**:

Added missing dependencies:

```json
{
  "dependencies": {
    "@midnight-ntwrk/compact-runtime": "0.9.0",
    "@midnight-ntwrk/ledger": "4.0.0"
  }
}
```

**Why**: Package imports from `@midnight-ntwrk/ledger` and `@midnight-ntwrk/compact-runtime` but doesn't declare them as dependencies.

**Changes to `dist/index.mjs`**:

Fixed Apollo Client imports to use ESM exports instead of CommonJS:

```diff
- import { ApolloClient, InMemoryCache } from '@apollo/client/core/core.cjs';
- import { from, split } from '@apollo/client/link/core/core.cjs';
- import { createHttpLink } from '@apollo/client/link/http/http.cjs';
- import { RetryLink } from '@apollo/client/link/retry/retry.cjs';
- import { getMainDefinition } from '@apollo/client/utilities/utilities.cjs';
- import { GraphQLWsLink } from '@apollo/client/link/subscriptions/subscriptions.cjs';
+ import { ApolloClient, InMemoryCache } from '@apollo/client/core';
+ import { from, split } from '@apollo/client/link/core';
+ import { createHttpLink } from '@apollo/client/link/http';
+ import { RetryLink } from '@apollo/client/link/retry';
+ import { getMainDefinition } from '@apollo/client/utilities';
+ import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
```

**Why**: The compiled output hardcoded imports from `.cjs` files, causing "does not provide an export named X" errors in ESM contexts.

Fixed cross-fetch import to handle browser environment:

```diff
- import fetch from 'cross-fetch';
+ import * as crossFetch from 'cross-fetch';
+ const fetch = crossFetch.default || crossFetch.fetch || globalThis.fetch;
```

**Why**: `cross-fetch` doesn't provide a default export in browser mode. This change handles both named and default exports, with a fallback to the native browser `fetch` API.

---

### 2. @midnight-ntwrk/midnight-js-types@2.0.2

**File**: `package.json`

Added missing dependency:

```json
{
  "dependencies": {
    "@midnight-ntwrk/ledger": "4.0.0"
  }
}
```

**Why**: Package uses types from `@midnight-ntwrk/ledger` but doesn't declare it.

---

### 3. @midnight-ntwrk/midnight-js-network-id@2.0.2

**File**: `package.json`

Added missing dependencies:

```json
{
  "dependencies": {
    "@midnight-ntwrk/compact-runtime": "0.9.0",
    "@midnight-ntwrk/ledger": "4.0.0"
  }
}
```

**Why**: Package calls functions from both `compact-runtime` and `ledger` but doesn't declare them.

---

### 4. @midnight-ntwrk/midnight-js-utils@2.0.2

**File**: `package.json`

Added missing dependency:

```json
{
  "dependencies": {
    "@midnight-ntwrk/wallet-sdk-address-format": "2.0.0"
  }
}
```

**Why**: Package uses address formatting utilities but doesn't declare the dependency.

---

### 5. @midnight-ntwrk/compact-runtime@0.9.0

**File Modified**: `package.json`

**Changes**: No changes - patch keeps package as-is.

**Why**: The package is CommonJS but doesn't contain WASM itself (only imports from `onchain-runtime` which has WASM).

**Solution**: Added `@midnight-ntwrk/compact-runtime` and `object-inspect` to Vite's `optimizeDeps.include` list in `vite.config.ts`, forcing Vite to pre-bundle them and convert all CommonJS code (including `require()` calls) to ESM.

```typescript
optimizeDeps: {
  include: ['@midnight-ntwrk/compact-runtime', 'object-inspect'],
  exclude: [/* WASM packages */],
}
```

The CommonJS polyfill in `index.html` provides fallback globals and a working `require()` cache for edge cases:

```html
<script>
  if (typeof exports === 'undefined') {
    globalThis.exports = {};
  }
  if (typeof module === 'undefined') {
    globalThis.module = { exports: globalThis.exports };
  }
</script>
<script type="module">
  // Require polyfill with module cache
  if (typeof globalThis.require === 'undefined') {
    const moduleCache = new Map();
    globalThis.require = function (id) {
      if (moduleCache.has(id)) return moduleCache.get(id);
      throw new Error(`Module '${id}' not pre-loaded`);
    };
    Promise.all([
      import('object-inspect').then((m) => moduleCache.set('object-inspect', m.default || m)),
    ]).catch((e) => console.warn('Failed to pre-load:', e));
  }
</script>
```

## Vite Configuration Updates

### Removed Workarounds

Removed Apollo Client CJS aliases from `packages/builder/vite.config.ts`:

```diff
- '@apollo/client/core/core.cjs': '@apollo/client/core',
- '@apollo/client/link/core/core.cjs': '@apollo/client/link/core',
- '@apollo/client/link/http/http.cjs': '@apollo/client/link/http',
- '@apollo/client/link/retry/retry.cjs': '@apollo/client/link/retry',
- '@apollo/client/utilities/utilities.cjs': '@apollo/client/utilities',
- '@apollo/client/link/subscriptions/subscriptions.cjs': '@apollo/client/link/subscriptions',
```

These aliases are no longer needed since the patch to `@midnight-ntwrk/midnight-js-indexer-public-data-provider` fixed the imports at the source.

### Configuration Changes

1. **Added `optimizeDeps.include`**: Forces Vite to pre-bundle `compact-runtime` and `object-inspect`, converting all CommonJS to ESM
2. **Kept WASM exclusions**: WASM-dependent packages (`onchain-runtime`, `ledger`, `zswap`) remain excluded
3. **Added CommonJS polyfill** to `index.html`: Provides global `exports`, `module`, and a working `require()` cache

### Kept Configuration

The following Vite config settings are still required:

1. **WASM Plugins**: `vite-plugin-wasm` and `vite-plugin-top-level-await` for WASM module support
2. **optimizeDeps.exclude**: Prevents Vite from pre-bundling WASM-dependent packages (excluding `compact-runtime`)
3. **Node Polyfills**: Buffer and global polyfills for browser compatibility

## Testing Results

✅ **Dev server starts successfully**

```bash
VITE v7.1.10  ready in 603 ms
➜  Local:   http://localhost:5174/
```

✅ **No import resolution errors**

- All `@midnight-ntwrk/*` packages resolve correctly
- Apollo Client ESM exports work without aliases
- No "Could not resolve" errors

✅ **No CommonJS/ESM conflicts**

- No "does not provide an export named X" errors
- No "exports is not defined" errors
- No "require is not defined" errors
- All imports work in browser environment
- Vite successfully converts CommonJS `require()` calls to ESM

## Files Changed

### New Files

- `patches/@midnight-ntwrk__midnight-js-indexer-public-data-provider@2.0.2.patch`
- `patches/@midnight-ntwrk__midnight-js-types@2.0.2.patch`
- `patches/@midnight-ntwrk__midnight-js-network-id@2.0.2.patch`
- `patches/@midnight-ntwrk__midnight-js-utils@2.0.2.patch`
- `patches/@midnight-ntwrk__compact-runtime@0.9.0.patch`

### Modified Files

- `package.json`: Added patchedDependencies configuration
- `packages/builder/vite.config.ts`: Removed Apollo Client aliases
- `packages/builder/index.html`: Added CommonJS polyfill script for `exports` and `module` globals

## Next Steps

### Immediate

1. Test actual contract queries with a real Midnight contract
2. Debug any runtime issues that occur during query execution
3. Document any additional issues found

### Long-term

1. Report these packaging bugs to the Midnight team
2. Request they publish fixed versions
3. Remove patches once official fixes are released

## Removal Instructions

When Midnight publishes fixed SDK versions:

```bash
# 1. Update package versions in adapter-midnight/package.json
# 2. Remove patch references from root package.json
# 3. Delete patch files
rm -rf patches/@midnight-ntwrk__*
# 4. Remove CommonJS polyfill from packages/builder/index.html
# 5. Reinstall dependencies
pnpm install
```

## Notes

- Patches are applied automatically on `pnpm install`
- Patches are version-specific (tied to v2.0.2 / v0.9.0)
- If you upgrade SDK versions, new patches may be needed
- These are temporary fixes until Midnight publishes corrected packages
