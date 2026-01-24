# Data Model: Wagmi v3 Upgrade

**Date**: 2026-01-08  
**Feature**: `010-wagmi-v3-upgrade`

## Overview

This upgrade involves no new data models. The changes are limited to:
1. Hook name migrations (API surface changes)
2. Type name migrations
3. Package version updates

---

## Hook Migration Mapping

### Renamed Hooks

| Location | v2 Import | v3 Import |
|----------|-----------|-----------|
| `adapter-evm/src/wallet/hooks/facade-hooks.ts` | `useAccount` | `useConnection` |
| (if present) | `useSwitchAccount` | `useSwitchConnection` |
| (if present) | `useAccountEffect` | `useConnectionEffect` |

### Type Migrations

| v2 Type | v3 Type |
|---------|---------|
| `UseAccountReturnType` | `UseConnectionReturnType` |
| `UseSwitchAccountReturnType` | `UseSwitchConnectionReturnType` |

---

## Facade Hooks Interface

### Current (v2)

```typescript
// packages/adapter-evm/src/wallet/hooks/facade-hooks.ts
import {
  useAccount,
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
  type UseAccountReturnType,
  // ... other types
} from 'wagmi';

export const evmFacadeHooks: EcosystemSpecificReactHooks = {
  useAccount,
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
```

### Target (v3)

```typescript
// packages/adapter-evm/src/wallet/hooks/facade-hooks.ts
import {
  useConnection,  // renamed from useAccount
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
  type UseConnectionReturnType,  // renamed from UseAccountReturnType
  // ... other types
} from 'wagmi';

export const evmFacadeHooks: EcosystemSpecificReactHooks = {
  useAccount: useConnection,  // expose as useAccount for internal compatibility OR
  useConnection,              // rename to useConnection (internal detail, can change)
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
```

**Note**: Per clarification, facade hooks are internal implementation details. We can rename freely to match Wagmi v3 APIs.

---

## Package Version Changes

### adapter-evm/package.json

| Dependency | v2 Version | v3 Version |
|------------|------------|------------|
| `wagmi` | `^2.16.1` (dev), `^2.15.0` (peer) | `^3.0.0` |
| `@wagmi/core` | `^2.20.3` | `^3.0.0` |
| `@wagmi/connectors` | `5.7.13` | TBD (check v3 compatible) |

### New Peer Dependencies (v3)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@coinbase/wallet-sdk` | `^4.3.6` | coinbaseWallet connector |
| `@walletconnect/ethereum-provider` | `^2.21.1` | walletConnect connector |
| `@metamask/sdk` | `~0.33.1` | metaMask connector (if used) |

### apps/builder/package.json

| Dependency | v2 Version | v3 Version |
|------------|------------|------------|
| `wagmi` | `^2.16.1` | `^3.0.0` |
| `@wagmi/core` | `^2.20.3` | `^3.0.0` |

### Root package.json Override

```json
{
  "pnpm": {
    "overrides": {
      "@wagmi/core": "^3.0.0"  // was ^2.20.3
    }
  }
}
```

---

## Entities (Unchanged)

The following entities are defined in `@openzeppelin/ui-types` and remain unchanged:

- **ContractAdapter**: Interface implemented by adapter-evm
- **NetworkConfig**: Configuration for network connections
- **EcosystemSpecificReactHooks**: Interface for facade hooks

No changes to `@openzeppelin/ui-types` are required for this upgrade.

---

## State Transitions

No state machine changes. Wallet connection flow remains identical:

```
Disconnected → Connecting → Connected → Disconnecting → Disconnected
```

The internal hook implementation changes, but the state transitions are preserved.
