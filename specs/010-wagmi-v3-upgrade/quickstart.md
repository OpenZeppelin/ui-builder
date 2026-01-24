# Quickstart: Wagmi v3 Upgrade

**Date**: 2026-01-08  
**Feature**: `010-wagmi-v3-upgrade`

## Prerequisites

Before starting the upgrade:

1. **Verify RainbowKit v3 availability**: Check [RainbowKit releases](https://github.com/rainbow-me/rainbowkit/releases) for a version supporting Wagmi v3
2. **Ensure clean working tree**: `git status` shows no uncommitted changes
3. **Run existing tests**: `pnpm test` passes

> ⚠️ **BLOCKING**: If RainbowKit v3 is not released, this upgrade cannot proceed. Monitor PR #2591.

---

## Step 1: Update Package Versions

### Root package.json

Update the pnpm override:

```diff
{
  "pnpm": {
    "overrides": {
-     "@wagmi/core": "^2.20.3"
+     "@wagmi/core": "^3.0.0"
    }
  }
}
```

### packages/adapter-evm/package.json

```diff
{
  "dependencies": {
-   "@wagmi/connectors": "5.7.13",
-   "@wagmi/core": "^2.20.3",
+   "@wagmi/connectors": "^5.8.0",
+   "@wagmi/core": "^3.0.0",
  },
  "devDependencies": {
-   "wagmi": "^2.16.1"
+   "wagmi": "^3.0.0"
  },
  "peerDependencies": {
-   "wagmi": "^2.15.0"
+   "wagmi": "^3.0.0",
+   "@coinbase/wallet-sdk": "^4.3.6",
+   "@walletconnect/ethereum-provider": "^2.21.1"
  }
}
```

### apps/builder/package.json

```diff
{
  "dependencies": {
-   "@wagmi/core": "^2.20.3",
-   "wagmi": "^2.16.1",
+   "@wagmi/core": "^3.0.0",
+   "wagmi": "^3.0.0",
+   "@coinbase/wallet-sdk": "^4.3.6",
+   "@walletconnect/ethereum-provider": "^2.21.1",
  }
}
```

---

## Step 2: Install Dependencies

```bash
pnpm install
```

Verify no version conflicts:
```bash
pnpm why wagmi
pnpm why @wagmi/core
```

---

## Step 3: Migrate Hook Names

### File: packages/adapter-evm/src/wallet/hooks/facade-hooks.ts

```diff
import {
- useAccount,
+ useConnection,
  useBalance,
  useChainId,
  useChains,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
- type UseAccountReturnType,
+ type UseConnectionReturnType,
  // ... other types
} from 'wagmi';

export const evmFacadeHooks: EcosystemSpecificReactHooks = {
- useAccount,
+ useConnection,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useChainId,
  useChains,
  useBalance,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSignMessage,
  useSignTypedData,
};

export type {
- UseAccountReturnType,
+ UseConnectionReturnType,
  // ... other types
};
```

### Other Files to Check

Search for `useAccount` in these files and update to `useConnection`:

```bash
rg "useAccount" packages/adapter-evm/src/
```

Files to update:
- `packages/adapter-evm/src/wallet/implementation/wagmi-implementation.ts`
- `packages/adapter-evm/src/wallet/utils/connection.ts`
- `packages/adapter-evm/src/wallet/utils/wallet-status.ts`
- `packages/adapter-evm/src/wallet/components/EvmWalletUiRoot.tsx`
- `packages/adapter-evm/src/__tests__/wallet-connect.test.ts`

---

## Step 4: Update RainbowKit (if needed)

If RainbowKit v3 has API changes, update the config service:

```typescript
// packages/adapter-evm/src/wallet/rainbowkit/config-service.ts
// Check RainbowKit v3 migration guide for any config changes
```

---

## Step 5: Run Tests

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test

# Build all packages
pnpm build
```

---

## Step 6: Manual Verification

1. **Start the builder app**:
   ```bash
   pnpm dev
   ```

2. **Test wallet connection**:
   - Click "Connect Wallet"
   - Verify RainbowKit modal appears
   - Connect with MetaMask or WalletConnect
   - Verify address displays correctly

3. **Test chain switching**:
   - Switch networks in the connected wallet
   - Verify UI updates correctly

4. **Test transaction signing**:
   - Initiate a test transaction
   - Verify signing prompt appears
   - Verify transaction completes

---

## Step 7: Create Changeset

```bash
pnpm changeset
```

Select:
- `@openzeppelin/ui-builder-adapter-evm` - **major** (breaking: wagmi v3 peer dependency)
- `@openzeppelin/ui-builder-app` - **minor** (internal dependency update)

Changeset message:
```
feat(adapter-evm): upgrade to wagmi v3

BREAKING CHANGE: This adapter now requires wagmi@^3.0.0 as a peer dependency.

Migration steps:
1. Upgrade wagmi to ^3.0.0
2. Install connector peer dependencies: @coinbase/wallet-sdk, @walletconnect/ethereum-provider
3. Update any direct useAccount usage to useConnection (if using facade hooks directly)
```

---

## Troubleshooting

### Version Conflict Errors

If pnpm reports version conflicts:

```bash
# Clear node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

If type errors appear after migration:

```bash
# Rebuild type declarations
pnpm clean
pnpm build
pnpm typecheck
```

### RainbowKit Issues

If RainbowKit modal doesn't appear:

1. Check browser console for errors
2. Verify RainbowKit version is compatible with Wagmi v3
3. Check for any connector configuration changes

---

## References

- [Wagmi v3 Migration Guide](https://wagmi.sh/react/guides/migrate-from-v2-to-v3)
- [RainbowKit Migration Guide](https://rainbowkit.com/en-US/docs/migration-guide)
- [Wagmi v3 Connector Dependencies](https://wagmi.sh/react/guides/migrate-from-v2-to-v3#install-connector-dependencies)
