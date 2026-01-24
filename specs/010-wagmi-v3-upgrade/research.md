# Research: Wagmi v3 Upgrade

**Date**: 2026-01-08  
**Feature**: `010-wagmi-v3-upgrade`

## 1. RainbowKit Wagmi v3 Compatibility

### Decision
**BLOCKING VERIFICATION REQUIRED**: RainbowKit v3 with Wagmi v3 support is in development but not yet released.

### Findings
- **Open PR #2591**: "feat: wagmi v3 compatability" opened Dec 8, 2025 by DanielSinclair
- **Discussion**: "Support for Wagmi v3" started Nov 28, 2025 by PaulRBerg
- **Current RainbowKit**: v2.2.10 requires Wagmi v2.x

### Rationale
The PR is in active development. Until merged and released, we cannot proceed with the full upgrade. First task must be to check if PR has been merged and a new RainbowKit version released.

### Alternatives Considered
1. **Wait for RainbowKit v3** (CHOSEN) - Aligned with clarification decision
2. **Replace with Reown AppKit** - Would require significant UI changes
3. **Fork RainbowKit** - Maintenance burden, not sustainable

### Action
First implementation task: Check RainbowKit releases for v3.x with Wagmi v3 support. If not available, this spec is blocked.

---

## 2. Wagmi v3 Hook Migration

### Decision
Rename hooks according to official Wagmi v3 migration guide.

### Hook Mapping

| Wagmi v2 | Wagmi v3 |
|----------|----------|
| `useAccount` | `useConnection` |
| `useSwitchAccount` | `useSwitchConnection` |
| `useAccountEffect` | `useConnectionEffect` |
| `UseAccountReturnType` | `UseConnectionReturnType` |

### Rationale
Official breaking change in Wagmi v3. The rename reflects that Wagmi manages "connections" to providers (EIP-1193), not "accounts" in the Web3 sense.

### Source
- [Wagmi v3 Migration Guide](https://wagmi.sh/react/guides/migrate-from-v2-to-v3)

---

## 3. Connector Dependencies

### Decision
Explicitly install required connector peer dependencies.

### Required Dependencies

```json
{
  "@coinbase/wallet-sdk": "^4.3.6",
  "@walletconnect/ethereum-provider": "^2.21.1",
  "@metamask/sdk": "~0.33.1"
}
```

### Rationale
Wagmi v3 makes connector dependencies optional peer dependencies. This allows:
- Smaller bundle sizes (only install what you need)
- Independent version management
- Better supply-chain security control

### RainbowKit Impact
When RainbowKit v3 is released, it may handle connector dependencies internally (as "batteries-included") or pass responsibility to consumers. Monitor RainbowKit v3 release notes.

### Source
- [Wagmi v3 Migration Guide - Connector Dependencies](https://wagmi.sh/react/guides/migrate-from-v2-to-v3#install-connector-dependencies)

---

## 4. TypeScript Version Compatibility

### Decision
No changes needed - current TypeScript version is compatible.

### Findings
- **Wagmi v3 minimum**: TypeScript 5.7.3
- **Project current**: TypeScript 5.9.2
- **Status**: ✅ Compatible

---

## 5. viem Compatibility

### Decision
No viem upgrade needed - current version is compatible.

### Findings
- **Current viem**: ^2.33.3
- **Wagmi v3 requirement**: viem 2.x
- **Status**: ✅ Compatible

---

## 6. pnpm Override Strategy

### Decision
Update root `package.json` pnpm override to enforce Wagmi v3 across workspace.

### Current Override
```json
{
  "pnpm": {
    "overrides": {
      "@wagmi/core": "^2.20.3"
    }
  }
}
```

### New Override
```json
{
  "pnpm": {
    "overrides": {
      "@wagmi/core": "^3.0.0"
    }
  }
}
```

### Rationale
Prevents version conflicts in the dependency tree by enforcing a single Wagmi version.

---

## Summary

| Research Topic | Status | Blocker? |
|---------------|--------|----------|
| RainbowKit v3 compatibility | PR in development, not released | ⚠️ YES - verify first |
| Hook migration mapping | Documented | No |
| Connector dependencies | Documented | No |
| TypeScript compatibility | ✅ Compatible | No |
| viem compatibility | ✅ Compatible | No |
| pnpm override strategy | Documented | No |

### Next Steps
1. **Before implementation**: Verify RainbowKit v3 release status
2. **If RainbowKit v3 available**: Proceed with upgrade
3. **If RainbowKit v3 not available**: Spec remains blocked until release
