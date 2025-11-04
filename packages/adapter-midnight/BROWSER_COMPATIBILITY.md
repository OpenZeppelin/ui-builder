# Midnight SDK Browser Compatibility Workaround

## Overview

This document describes the **temporary workaround** implemented to enable Midnight SDK packages to run in browser environments. The Midnight SDK (`@midnight-ntwrk/midnight-js-*` packages) was not designed for browser use and contains numerous compatibility issues that prevent it from working in client-side applications.

**Status**: ⚠️ **TEMPORARY SOLUTION** - This is a stopgap measure using extensive monkey-patching. A proper solution requires official browser support from the Midnight team.

---

## The Problem

### Browser Compatibility Issues

The Midnight SDK has multiple blocking issues for browser environments:

1. **Missing Dependencies**: SDK packages import from other packages but don't declare them as dependencies
2. **CommonJS/ESM Conflicts**: Mixed module systems causing import failures
3. **Node.js Globals**: Relies on Node.js-specific globals (`Buffer`, `module`, `exports`, `require`)
4. **WASM with Top-Level Await**: Uses CommonJS `require()` to load WASM modules with top-level await
5. **Module Singleton Issues**: Patched packages create separate module instances, breaking state management
6. **Incorrect Import Paths**: Hardcoded imports from `.cjs` files in ESM context

### Impact

Without these fixes:

- ❌ Cannot query Midnight contracts from the browser
- ❌ Cannot build client-side Midnight dApps
- ❌ All dApps require backend servers
- ❌ UI Builder cannot support Midnight contracts

---

## The Solution: Monkey-Patching

We used **`pnpm patch`** to create comprehensive patches of the Midnight SDK packages. This is a **temporary workaround** that modifies the SDK code at install time.

### 1. Added Missing Dependencies

The SDK packages had missing peer dependencies. We manually added them:

```json
{
  "dependencies": {
    "@midnight-ntwrk/compact-runtime": "0.9.0",
    "@midnight-ntwrk/ledger": "4.0.0",
    "@midnight-ntwrk/onchain-runtime": "4.0.0",
    "@midnight-ntwrk/wallet-sdk-address-format": "2.0.0",
    "@midnight-ntwrk/zswap": "4.0.0"
  }
}
```

### 2. Patched `@midnight-ntwrk/midnight-js-indexer-public-data-provider`

**File**: `patches/@midnight-ntwrk__midnight-js-indexer-public-data-provider@2.0.2.patch`

**Changes**:

- Fixed CommonJS imports to use ESM paths
- Fixed `cross-fetch` import (no default export in browser)
- Added network ID global override for module singleton issue
- Modified deserialization to use global network ID

```javascript
// Before:
import { ApolloClient } from '@apollo/client/core/core.cjs';

// After:
import { ApolloClient } from '@apollo/client/core/index.js';
```

### 3. Browser Polyfills

**File**: `packages/builder/index.html`

Added CommonJS global polyfills required by WASM packages:

```html
<script>
  // CommonJS globals
  globalThis.exports = {};
  globalThis.module = { exports: {} };

  // Custom require() with module cache
  globalThis.require = (function () {
    const moduleCache = {};
    return function require(id) {
      if (moduleCache[id]) return moduleCache[id];

      // Handle dynamic imports for known modules
      if (id === 'object-inspect') {
        const module = import('object-inspect');
        moduleCache[id] = module;
        return module;
      }

      throw new Error(`Module not found: ${id}`);
    };
  })();
</script>
```

### 4. Vite Configuration

**File**: `packages/builder/vite.config.ts`

**Excluded packages from pre-bundling** (WASM + top-level await issues):

```typescript
optimizeDeps: {
  exclude: [
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
    '@midnight-ntwrk/midnight-js-network-id',
    '@midnight-ntwrk/midnight-js-types',
    '@midnight-ntwrk/midnight-js-utils',
    '@midnight-ntwrk/midnight-js-contracts',
    '@midnight-ntwrk/ledger',
    '@midnight-ntwrk/zswap',
    '@midnight-ntwrk/compact-runtime',
    '@midnight-ntwrk/onchain-runtime',
    'object-inspect',
  ],
  include: [
    '@midnight-ntwrk/compact-runtime',
    'object-inspect',
  ],
}
```

**Added WASM plugins**:

```typescript
plugins: [react(), tsconfigPaths(), wasm(), topLevelAwait()];
```

### 5. Network ID Global Override

**File**: `packages/adapter-midnight/src/query/provider.ts`

To solve the module singleton issue from patching:

```typescript
// Set network ID both ways to handle patched SDK
const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
const networkId = await getNetworkIdEnum(networkConfig);
setNetworkId(networkId);

// WORKAROUND: Due to pnpm patching creating module singletons,
// we also set the network ID in globalThis
globalThis.__MIDNIGHT_NETWORK_ID__ = networkId;
```

---

## Files Modified

### Patches Applied

- `patches/@midnight-ntwrk__midnight-js-indexer-public-data-provider@2.0.2.patch`

### Configuration Changes

- `packages/builder/vite.config.ts` - Added WASM plugins, excluded packages
- `packages/builder/index.html` - Added CommonJS polyfills
- `packages/adapter-midnight/package.json` - Added missing dependencies

### Adapter Code

- `packages/adapter-midnight/src/query/provider.ts` - Network ID global override
- `packages/adapter-midnight/src/query/executor.ts` - Browser-safe query implementation

---

## Current Limitations

### 1. Runtime Version Mismatch

The contract's compiled `ledger()` function expects a specific `compact-runtime` version. If the UI Builder has a different version, queries will fail with:

```
CompactError: Version mismatch: compiled code expects 0.8.1, runtime is 0.9.0
```

**Workaround**: Users must recompile their contract with the matching runtime version.

**Proper Solution**: Implement multi-version runtime support (see Future Improvements).

### 2. Large Bundle Size

The WASM bundles total ~10MB:

- `compact-runtime`: ~5.5MB
- `onchain-runtime`: ~2.4MB
- `ledger`: ~1.6MB

**Impact**: Slower initial page load, higher bandwidth usage.

**Proper Solution**: Browser-optimized SDK with code splitting.

### 3. Module Singleton Issues

Patched packages can create separate module instances, breaking shared state.

**Current Fix**: Global variable override (`globalThis.__MIDNIGHT_NETWORK_ID__`)

**Proper Solution**: SDK should not rely on module-level state.

### 4. Maintenance Burden

Every SDK update requires:

1. Re-applying patches manually
2. Testing all browser compatibility fixes
3. Updating documentation
4. Potential new issues from SDK changes

---

## Future Improvements

### Short-term (Workaround Improvements)

1. **Multi-Runtime Support**
   - Parse required runtime version from contract module
   - Dynamically load matching runtime version (CDN or bundled)
   - Or bypass version check for read-only queries

2. **Lazy WASM Loading**
   - Only load WASM when needed
   - Code-split by contract type
   - Reduce initial bundle size

3. **Better Error Messages**
   - Detect common issues (wrong runtime version, missing contract module)
   - Provide actionable guidance to users

### Long-term (Proper Solution)

**The Midnight team should provide official browser support:**

#### Option 1: Browser-Compatible Query Package (Preferred)

Create a lightweight package specifically for browser use:

```typescript
// @midnight-ntwrk/midnight-js-browser-query (hypothetical)
import { MidnightBrowserProvider } from '@midnight-ntwrk/midnight-js-browser-query';

const provider = new MidnightBrowserProvider({
  indexerUri: 'https://indexer.testnet.midnight.network/api/v1/graphql',
});

const result = await provider.queryViewFunction(
  contractAddress,
  functionId,
  params,
  contractSchema
);
```

**Requirements**:

- Pure JavaScript (no WASM for basic queries)
- No Node.js-specific APIs
- Works with all modern bundlers (Vite, Webpack, Rollup)
- Proper ESM/CJS exports
- < 500KB bundle size

#### Option 2: Browser Entry Points

Add browser-specific builds to existing packages:

```json
{
  "exports": {
    ".": {
      "browser": "./dist/browser.mjs",
      "node": "./dist/index.mjs",
      "default": "./dist/browser.mjs"
    }
  }
}
```

#### Option 3: Fix Packaging Issues

At minimum, fix these issues:

1. Declare all dependencies in `package.json`
2. Use proper ESM imports (no hardcoded `.cjs` paths)
3. Provide browser-compatible versions of WASM modules
4. Document browser compatibility explicitly

---

## Testing

To verify the workaround is functioning:

```bash
# Build the adapter
pnpm --filter @openzeppelin/ui-builder-adapter-midnight build

# Run tests
pnpm --filter @openzeppelin/ui-builder-adapter-midnight test

# Start dev server and test in browser
pnpm --filter @openzeppelin/ui-builder dev
```

**Browser Test Checklist**:

- [ ] Page loads without console errors
- [ ] WASM modules load successfully
- [ ] Can connect to Midnight indexer
- [ ] Can query contract state (view functions)
- [ ] Results display correctly in UI
- [ ] No memory leaks during repeated queries

---

## Related Documentation

- **Detailed Issue**: `../../specs/004-add-midnight-adapter/midnight-browser-sdk-issue.md`
- **Solution Details**: `../../specs/004-add-midnight-adapter/SOLUTION.md`
- **SDK Patches**: `../../specs/004-add-midnight-adapter/MIDNIGHT-SDK-PATCHES.md`

---

## Maintenance Notes

### When Updating Midnight SDK Versions

1. **Backup current patches**: `cp -r patches patches.backup`
2. **Update package version**: `pnpm add @midnight-ntwrk/midnight-js-indexer-public-data-provider@latest`
3. **Reapply patches**: Check if patches apply cleanly
4. **Test thoroughly**: Run full test suite and browser testing
5. **Update this document**: Note any new issues or changes

### If Patches Fail to Apply

```bash
# Remove failed patch
rm patches/@midnight-ntwrk__midnight-js-indexer-public-data-provider@*.patch

# Create new patch interactively
pnpm patch @midnight-ntwrk/midnight-js-indexer-public-data-provider

# Make necessary changes in the opened directory
# Then commit the patch:
pnpm patch-commit /path/to/patched/package
```

---

## Support & Contact

If you encounter issues with this workaround:

1. Check the browser console for errors
2. Verify all patches are applied: `git status patches/`
3. Review the Related Documentation above
4. Open an issue with:
   - Browser version and OS
   - Console error messages
   - Steps to reproduce
   - Midnight SDK version

---

**Last Updated**: 2025-10-15

**Status**: ⚠️ Active workaround - awaiting official browser support from Midnight team
