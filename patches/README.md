# Patches Directory

This directory contains pnpm patches for fixing dependency issues in adapter packages.

## Overview

Patches are maintained in this root directory as the **single source of truth** and automatically synced to adapter packages before publishing.

## Architecture

### Development (Monorepo)

- Patches stored in `patches/` (this directory)
- Root `package.json` references these patches via `pnpm.patchedDependencies`
- pnpm applies patches when dependencies are installed

### Production (Published Adapters)

- Script `scripts/sync-patches-to-adapters.js` automatically:
  1. Copies patches to adapter's `patches/` directory
  2. Updates adapter's `package.json` with `pnpm.patchedDependencies`
  3. Adds `patches` to adapter's published files
- When users install the adapter, patches are applied automatically

## Workflow

### Adding a New Patch

1. Create the patch using pnpm:

   ```bash
   pnpm patch <package@version>
   # Make your changes
   pnpm patch-commit /path/to/patched/package
   ```

2. Add mapping to `scripts/sync-patches-to-adapters.js`:

   ```js
   const PATCH_TO_ADAPTER_MAP = {
     '@your-package/name': 'adapter-name',
     // ...
   };
   ```

3. Run sync script (or it will run automatically on build):
   ```bash
   pnpm sync-patches
   ```

### Updating an Existing Patch

1. Update the patch file in `patches/` directory
2. Run `pnpm install` to apply changes
3. Run `pnpm sync-patches` to sync to adapters

### Removing a Patch

1. Delete the patch file from `patches/`
2. Remove from root `package.json` `pnpm.patchedDependencies`
3. Remove mapping from `scripts/sync-patches-to-adapters.js`
4. Run `pnpm sync-patches` to clean up adapters

## Current Patches

### Midnight Adapter Patches

All patches fix browser compatibility issues in Midnight SDK v2.0.2:

- `@midnight-ntwrk__midnight-js-indexer-public-data-provider@2.0.2.patch`
  - Fixes Apollo Client ESM imports (`.cjs` → proper ESM)
  - Fixes network ID module imports
  - See `specs/004-add-midnight-adapter/MIDNIGHT-SDK-PATCHES.md` for details

- `@midnight-ntwrk__midnight-js-types@2.0.2.patch`
  - Adds missing peer dependencies

- `@midnight-ntwrk__midnight-js-network-id@2.0.2.patch`
  - Adds missing peer dependencies

- `@midnight-ntwrk__midnight-js-utils@2.0.2.patch`
  - Adds missing peer dependencies

- `@midnight-ntwrk__compact-runtime@0.9.0.patch`
  - Fixes CommonJS/ESM conflicts
  - Fixes WASM integration for bundlers

## Automation

The sync script runs automatically:

- Before building the monorepo: `pnpm build`
- Before publishing an adapter: `pnpm publish` (via `prepublishOnly`)

Manual sync: `pnpm sync-patches`

## Benefits

- ✅ Single source of truth for patches
- ✅ No manual copying or duplication
- ✅ Automated wiring of `pnpm.patchedDependencies`
- ✅ Patches travel with published adapters
- ✅ Users don't need to manage patches manually
- ✅ Easy to add patches for other adapters

## Expected Warnings

When running the sync script or building, you may see:

```
WARN  The field "pnpm.patchedDependencies" was found in /path/to/packages/adapter-*/package.json.
This will not take effect. You should configure "pnpm.patchedDependencies" at the root of the workspace instead.
```

**This warning is expected and safe to ignore.** Here's why:

- During monorepo development, patches are applied from the root `package.json` (working correctly)
- The `patchedDependencies` field in adapter packages is **only** needed when published to npm
- pnpm shows this warning to inform you the field is ignored during development
- End users who install the published adapter from npm will have patches applied correctly

The warning doesn't indicate a problem - it's pnpm's way of saying "this field won't do anything in the monorepo, but we see you have it here for publishing purposes."

## Notes

- Patches are version-specific (e.g., `@2.0.2`)
- If you upgrade a dependency, you may need to regenerate patches
- Patches should be temporary - report bugs upstream and remove when fixed
