# Feature Specification: Wagmi v3 Upgrade

**Feature Branch**: `010-wagmi-v3-upgrade`  
**Created**: 2026-01-08  
**Status**: Ready for Planning  
**Input**: User description: "Update wagmi to wagmi v3"

## Overview

Upgrade the UI Builder monorepo from Wagmi v2 to Wagmi v3 to align with the latest ecosystem standards and enable compatibility with ecosystems that require Wagmi v3 (e.g., Polkadot Hub). This is a prerequisite for the `009-polkadot-adapter` feature.

### Background

Wagmi v3 introduces several breaking changes:
- **Hook renames**: `useAccount` → `useConnection`, `useSwitchAccount` → `useSwitchConnection`, `useAccountEffect` → `useConnectionEffect`
- **Connector dependencies**: Now optional peer dependencies (install only what you need)
- **Minimum TypeScript version**: 5.7.3 (current project uses 5.9.2, compatible)

### Impact Analysis

**Packages requiring updates:**
- `@openzeppelin/ui-builder-adapter-evm` - Main EVM adapter with wagmi hooks
- `apps/builder` - Builder application consuming wagmi

**Packages NOT requiring updates:**
- `@openzeppelin/ui-builder-adapter-evm-core` - Uses only viem, no wagmi dependency
- `adapter-stellar`, `adapter-solana`, `adapter-midnight` - Do not use wagmi directly

**Files with hook usage to migrate:**
- `packages/adapter-evm/src/wallet/hooks/facade-hooks.ts`
- `packages/adapter-evm/src/wallet/implementation/wagmi-implementation.ts`
- `packages/adapter-evm/src/wallet/utils/connection.ts`
- `packages/adapter-evm/src/wallet/utils/wallet-status.ts`
- `packages/adapter-evm/src/wallet/components/EvmWalletUiRoot.tsx`
- `packages/adapter-evm/src/__tests__/wallet-connect.test.ts`

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Existing EVM Applications Continue Working (Priority: P1)

Developers with existing applications built using the EVM adapter should experience no breaking changes in their application code after the upgrade, as the facade layer abstracts the underlying wagmi implementation.

**Why this priority**: Core functionality preservation is critical - breaking existing applications would cause significant disruption.

**Independent Test**: Can be tested by running the existing test suite and verifying all EVM wallet connection flows work as before.

**Acceptance Scenarios**:

1. **Given** an existing application using `@openzeppelin/ui-builder-adapter-evm`, **When** the application is rebuilt with the upgraded adapter, **Then** all wallet connection, transaction signing, and chain switching functionality works identically.

2. **Given** an exported application from the builder, **When** the application uses EVM wallet features, **Then** users can connect wallets, sign transactions, and switch chains without errors.

---

### User Story 2 - Builder Application Wallet Features (Priority: P1)

The builder application's wallet connection features (used for testing contracts) must work correctly with the upgraded wagmi version.

**Why this priority**: Builder is the primary product - its wallet features must work.

**Independent Test**: Can be tested by connecting a wallet in the builder app and executing a test transaction.

**Acceptance Scenarios**:

1. **Given** the builder application is running, **When** a user clicks "Connect Wallet", **Then** the wallet connection modal appears and wallets can be connected.

2. **Given** a connected wallet in the builder, **When** a user initiates a contract interaction, **Then** the transaction is sent and the receipt is received correctly.

---

### User Story 3 - Polkadot Adapter Compatibility (Priority: P2)

The upgrade enables the future Polkadot adapter (`009-polkadot-adapter`) to use Wagmi v3 as specified in official Polkadot Hub documentation.

**Why this priority**: This is a prerequisite for Polkadot ecosystem support but not immediately user-facing.

**Independent Test**: After upgrade, the Polkadot adapter can be implemented using Wagmi v3 hooks without version conflicts.

**Acceptance Scenarios**:

1. **Given** the monorepo uses Wagmi v3, **When** a new adapter imports wagmi, **Then** it receives v3 APIs (`useConnection` instead of `useAccount`).

---

### User Story 4 - RainbowKit Integration (Priority: P2)

The RainbowKit wallet connection UI must remain functional after the upgrade.

**Why this priority**: RainbowKit provides the wallet connection UX for EVM chains.

**Independent Test**: Can be tested by verifying RainbowKit modal opens and allows wallet selection.

**Acceptance Scenarios**:

1. **Given** the application uses RainbowKit for wallet connection, **When** the user clicks connect, **Then** the RainbowKit modal appears with wallet options.

2. **Given** a wallet is connected via RainbowKit, **When** the user disconnects, **Then** the wallet is properly disconnected and state is cleared.

---

### Edge Cases

- **Version conflict handling**: If consumers have both v2 and v3 wagmi in their dependency tree, pnpm's strict dependency resolution will flag the conflict. Resolution: consumers must upgrade to wagmi v3 or use pnpm overrides to force a single version. Document this in migration notes.
- **Connector dependency handling**: For optional connectors in v3, the adapter will install only required connectors (coinbaseWallet, walletConnect) as peer dependencies. Consumers using additional connectors must install them explicitly.
- **RainbowKit compatibility** (RESOLVED): Upgrade is blocked until RainbowKit v3.x is available or v2.x is verified compatible with Wagmi v3.
- **Partial upgrade failure**: If upgrade fails mid-way (e.g., tests fail after version bump), rollback by reverting package.json changes and running `pnpm install` to restore v2 dependencies.
- **React version compatibility**: React 18+ is required (current: React 19). No changes needed.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Package Version Updates

- **FR-001**: System MUST upgrade `wagmi` from `^2.15.0` to `^3.0.0` in all package.json files
- **FR-002**: System MUST upgrade `@wagmi/core` from `^2.20.3` to `^3.0.0` in all package.json files
- **FR-003**: System MUST upgrade `@wagmi/connectors` from `5.7.13` to compatible v3 version
- **FR-004**: System MUST update the root `package.json` pnpm override for `@wagmi/core`

#### Hook Migration

- **FR-005**: System MUST rename all `useAccount` hook usages to `useConnection`
- **FR-006**: System MUST update all `UseAccountReturnType` type references to `UseConnectionReturnType`
- **FR-007**: Facade hooks interface (`evmFacadeHooks`) MUST expose `useConnection` instead of `useAccount`
- **FR-008**: System MUST rename any `useSwitchAccount` usages to `useSwitchConnection`
  - **Verification**: Run `rg "useSwitchAccount" packages/ apps/` to confirm presence/absence
- **FR-017**: System MUST discover ALL hook usages before migration:
  - **Discovery command**: `rg "useAccount|useSwitchAccount|useAccountEffect" packages/ apps/ --type ts --type tsx`
  - **Expected locations**: Files listed in Impact Analysis section
  - **If additional files found**: Add to migration scope before proceeding

#### Connector Dependencies

- **FR-009**: System MUST explicitly install connector dependencies as peer dependencies:
  - **REQUIRED** (used by RainbowKit default wallet list):
    - `@coinbase/wallet-sdk@^4.3.6` - Required for coinbaseWallet connector
    - `@walletconnect/ethereum-provider@^2.21.1` - Required for walletConnect connector
  - **OPTIONAL** (not currently used, consumers install if needed):
    - `@metamask/sdk@~0.33.1` - For metaMask connector (RainbowKit uses injected connector instead)
  - **Rationale**: Wagmi v3 makes connector dependencies optional peer deps for supply-chain security and bundle size. We install only connectors used by our default RainbowKit configuration.
- **FR-010**: System MUST update connector imports to use explicit dependency packages where applicable

#### Compatibility

- **FR-011**: System MUST verify RainbowKit compatibility with Wagmi v3 as FIRST blocking task:
  - **Verification steps**:
    1. Check RainbowKit npm for v3.x release OR check if v2.x peer deps accept wagmi@3
    2. If v3.x exists: upgrade `@rainbow-me/rainbowkit` to ^3.0.0
    3. If v2.x only: test locally by installing wagmi@3 and verifying RainbowKit modal renders
  - **Go/No-Go criteria**:
    - ✅ GO: RainbowKit modal opens, wallet list displays, connection succeeds, disconnect works
    - ❌ NO-GO: Console errors mentioning wagmi version, modal fails to render, connection hooks throw
  - **If NO-GO**: Upgrade is BLOCKED. Wait for RainbowKit v3 release. Monitor PR #2591.
- **FR-012**: System MUST maintain backward compatibility in the public API of `adapter-evm`:
  - **Public API includes**: ContractAdapter interface methods, exported types, network configurations
  - **NOT public API**: facade hooks (`evmFacadeHooks`), internal wallet implementation, internal utils
- **FR-013**: System MUST update all tests to use new hook names
- **FR-016**: System MUST verify viem compatibility remains stable (viem 2.x required by both wagmi v2 and v3)

#### Documentation

- **FR-014**: System MUST update any internal documentation referencing wagmi v2 APIs
- **FR-015**: System MUST add migration notes in changeset for consuming applications:
  - **Changeset type**: MAJOR (breaking change for adapter-evm)
  - **Required content**:
    1. Breaking change notice: `wagmi` peer dependency changed from ^2.x to ^3.x
    2. Consumer action required: Update wagmi to ^3.0.0 in their package.json
    3. Connector dependencies: Install `@coinbase/wallet-sdk` and `@walletconnect/ethereum-provider` if not present
    4. Note: No code changes required if using adapter through ContractAdapter interface
  - **Example changeset**:
    ```
    ---
    "@openzeppelin/ui-builder-adapter-evm": major
    ---
    
    feat(adapter-evm): upgrade to wagmi v3
    
    BREAKING CHANGE: This adapter now requires wagmi@^3.0.0 as a peer dependency.
    
    Migration steps for consumers:
    1. Upgrade wagmi: `pnpm add wagmi@^3.0.0`
    2. Install connector deps: `pnpm add @coinbase/wallet-sdk @walletconnect/ethereum-provider`
    3. No code changes required if using ContractAdapter interface
    ```

### Key Entities

- **WagmiConfig**: Configuration object for wagmi setup (structure may change in v3)
- **Connection**: Represents wallet connection state (renamed from Account in v3)
- **Connector**: Wallet connector (now requires explicit dependency installation in v3)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing tests pass after the upgrade
  - **Verification**: `pnpm test` exits with code 0
  - **Scope**: All packages in monorepo
- **SC-002**: Builder application wallet connection works end-to-end
  - **Verification steps**:
    1. Start builder: `pnpm dev`
    2. Click "Connect Wallet" - modal appears
    3. Connect with MetaMask or WalletConnect - address displays
    4. Switch network - UI updates
    5. Disconnect - state clears
- **SC-003**: Exported applications function correctly with EVM wallet features
  - **Verification**: Run `pnpm test:export` (existing export test script)
- **SC-004**: No version conflicts reported by pnpm during installation
  - **Verification**: `pnpm install` exits with code 0, no peer dependency warnings for wagmi
- **SC-005**: TypeScript compilation succeeds with no wagmi-related type errors
  - **Verification**: `pnpm typecheck` exits with code 0
- **SC-006**: RainbowKit wallet modal appears and allows wallet selection
  - **Verification**: Visual confirmation in browser, no console errors
- **SC-007**: Future Polkadot adapter can import `useConnection` from wagmi without errors
  - **Verification**: Create test file importing `useConnection` from wagmi, TypeScript compiles

---

## Assumptions

- **RainbowKit compatibility** (VERIFY FIRST): Planning proceeds, but implementation MUST begin with RainbowKit v3/Wagmi v3 compatibility verification. If incompatible and no RainbowKit v3 exists, implementation is blocked until RainbowKit v3 is released.
- **TypeScript version**: Current 5.9.2 meets Wagmi v3's minimum requirement (5.7.3) ✓
  - Source: [Wagmi v3 Migration Guide](https://wagmi.sh/react/guides/migrate-from-v2-to-v3#bumped-minimum-typescript-version)
- **Facade hooks isolation**: The facade hooks pattern in `adapter-evm` isolates most of the migration to that package
- **viem compatibility**: viem ^2.33.3 remains compatible with Wagmi v3 ✓
  - Source: Wagmi v3 requires viem 2.x ([wagmi package.json](https://github.com/wevm/wagmi/blob/main/packages/react/package.json))
  - Verified: Both wagmi v2 and v3 use viem 2.x, no viem upgrade needed
- **@tanstack/react-query compatibility**: Current ^5.x is compatible with Wagmi v3 ✓
  - Source: Wagmi v3 requires @tanstack/react-query ^5.0.0
- **React version**: React 18+ required, current React 19 is compatible ✓

---

## Rollback Plan

If the upgrade fails after partial implementation:

1. **Immediate rollback**: `git checkout -- package.json pnpm-lock.yaml packages/*/package.json apps/*/package.json`
2. **Restore dependencies**: `pnpm install`
3. **Verify rollback**: `pnpm test` (all tests should pass with v2)

**Rollback triggers**:
- RainbowKit incompatibility discovered after version bump
- Unexpected test failures not related to hook renames
- TypeScript compilation errors in consuming packages
- Version conflict resolution fails

---

## Dependencies

- **Prerequisite for**: `009-polkadot-adapter` (Polkadot adapter requires Wagmi v3)
- **No prerequisites**: This is a standalone upgrade

---

## Clarifications

### Session 2026-01-08

- Q: If RainbowKit v2.x is incompatible with Wagmi v3, what is the fallback strategy? → A: Wait for RainbowKit v3 release before proceeding with upgrade
- Q: Are facade hooks (evmFacadeHooks) part of the public API that must maintain backward compatibility? → A: No, facade hooks are internal implementation details; can rename freely to match Wagmi v3 APIs
- Q: Should this spec be marked as blocked until RainbowKit v3 is confirmed, or proceed with planning? → A: Proceed with planning; include RainbowKit compatibility verification as first implementation task

---

## Session Notes

### Session 2026-01-08 - Initial Specification

**Context**: During planning for the Polkadot adapter (`009-polkadot-adapter`), we discovered that official Polkadot Hub documentation specifies Wagmi v3, while the current codebase uses Wagmi v2.

**Decision**: Create this specification as a prerequisite to enable version consistency across all EVM-compatible adapters.

**Key findings from codebase analysis**:
1. `adapter-evm-core` has no wagmi dependency (only viem) - no changes needed
2. `adapter-evm` uses `useAccount` and related hooks in facade-hooks.ts
3. Root package.json has `@wagmi/core` override that needs updating
4. Builder app has direct wagmi dependencies
