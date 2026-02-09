# Quickstart: EVM Adapter Access Control Module

**Branch**: `011-evm-access-control` | **Date**: 2026-02-09

## Prerequisites

- Node.js 18+, pnpm installed
- Repository cloned and `pnpm install` completed
- Familiarity with the Stellar adapter's access-control module (reference implementation)

## Implementation Order

Follow TDD (test-driven development) per constitution. For each module: write failing tests first, then implement.

### Phase 0: Pre-Requisite — Unified Types Update (`openzeppelin-ui` repo)

These changes must be made in the `openzeppelin-ui` repository first (or in parallel).

#### Step 0a: Make `expirationBlock` optional (PR-1)

**File**: `packages/types/src/adapters/access-control.ts`

```typescript
// PendingOwnershipTransfer — change:
expirationBlock: number;
// to:
expirationBlock?: number;  // optional: omitted for chains without expiration (EVM Ownable2Step)

// PendingAdminTransfer — change:
expirationBlock: number;
// to:
expirationBlock?: number;  // optional: omitted for chains without expiration (EVM Ownable2Step)

// transferOwnership method — change parameter:
expirationBlock: number,
// to:
expirationBlock?: number,  // optional for EVM, required for Stellar

// transferAdminRole method — change parameter:
expirationBlock: number,
// to:
expirationBlock?: number,  // optional for EVM, required for Stellar
```

Update JSDoc to note: "Required for chains with expiration (e.g., Stellar). Omitted for chains without (e.g., EVM Ownable2Step)."

Verify: Stellar adapter still compiles and passes tests (it still passes `number` — widening is non-breaking in TypeScript).

#### Step 0b: Add EVM-specific HistoryChangeType variants (PR-2)

**File**: `packages/types/src/adapters/access-control.ts`

```typescript
// Add to HistoryChangeType union:
export type HistoryChangeType =
  | 'GRANTED'
  | 'REVOKED'
  | 'ROLE_ADMIN_CHANGED'
  | 'OWNERSHIP_TRANSFER_STARTED'
  | 'OWNERSHIP_TRANSFER_COMPLETED'
  | 'OWNERSHIP_RENOUNCED'
  | 'ADMIN_TRANSFER_INITIATED'
  | 'ADMIN_TRANSFER_COMPLETED'
  | 'ADMIN_TRANSFER_CANCELED'           // NEW: EVM DefaultAdminTransferCanceled
  | 'ADMIN_RENOUNCED'
  | 'ADMIN_DELAY_CHANGE_SCHEDULED'      // NEW: EVM DefaultAdminDelayChangeScheduled
  | 'ADMIN_DELAY_CHANGE_CANCELED'       // NEW: EVM DefaultAdminDelayChangeCanceled
  | 'UNKNOWN';
```

Update the JSDoc comment block to document each new variant.

#### Step 0c: Add `accessControlIndexerUrl` to `EvmNetworkConfig` (PR-3)

**File**: `packages/types/src/networks/config.ts`

```typescript
// Add to EvmNetworkConfig interface:
/**
 * Optional GraphQL endpoint for the access control indexer.
 * Used by the access control module for historical queries and role discovery.
 */
accessControlIndexerUrl?: string;
```

#### Step 0d: Update Role Manager mapping (required by PR-2)

**File**: `apps/role-manager/src/types/role-changes.ts` (in `role-manager` repo)

Update the `CHANGE_TYPE_TO_ACTION` mapping to include the new `HistoryChangeType` variants:
```typescript
'ADMIN_TRANSFER_CANCELED': 'admin-transfer',
'ADMIN_DELAY_CHANGE_SCHEDULED': 'admin-transfer',
'ADMIN_DELAY_CHANGE_CANCELED': 'admin-transfer',
```

This MUST be done before or simultaneously with bumping `@openzeppelin/ui-types` in the Role Manager, as the `Record<HistoryChangeType, RoleChangeAction>` type requires exhaustive keys.

#### Step 0e: Publish and consume

- Publish a new `@openzeppelin/ui-types` version with all three changes
- Update `@openzeppelin/ui-types` dependency in `ui-builder` repo's `package.json`
- Update `@openzeppelin/ui-types` dependency in `role-manager` repo's `package.json` and apply Step 0d
- Remove any temporary workarounds (sentinel values, UNKNOWN mappings, local type extensions)

### Phase 1: Foundation (P1 — Read Operations)

#### Step 1: Validation (`validation.ts`)

Start here — all other modules depend on input validation.

```
packages/adapter-evm-core/src/access-control/validation.ts
packages/adapter-evm-core/test/access-control/validation.test.ts
```

**What to implement**:
- `validateContractAddress(address)` — Uses viem `isAddress()`
- `validateAccountAddress(address)` — Same as contract (EVM is uniform)
- `validateAddress(address)` — Alias for either
- `validateRoleId(roleId)` — Regex: `/^0x[0-9a-fA-F]{64}$/`
- `validateRoleIds(roleIds)` — Array validation

**Reference**: `packages/adapter-stellar/src/access-control/validation.ts`

#### Step 2: Feature Detection (`feature-detection.ts`)

Depends on: validation (for address format).

```
packages/adapter-evm-core/src/access-control/feature-detection.ts
packages/adapter-evm-core/test/access-control/feature-detection.test.ts
```

**What to implement**:
- `detectAccessControlCapabilities(contractSchema)` — Analyze `functions` array for OZ patterns
- `validateAccessControlSupport(capabilities)` — Has at least Ownable or AccessControl

**Key logic**: Match function names AND parameter types against known OZ signatures (see `contracts/feature-detection.ts` for the full detection matrix).

**Reference**: `packages/adapter-stellar/src/access-control/feature-detection.ts`

#### Step 3: On-Chain Reader (`onchain-reader.ts`)

Depends on: validation, viem public client.

```
packages/adapter-evm-core/src/access-control/onchain-reader.ts
packages/adapter-evm-core/test/access-control/onchain-reader.test.ts
```

**What to implement**:
- `readOwnership(rpcUrl, contractAddress, viemChain?)` — Calls `owner()`, `pendingOwner()`
- `readCurrentRoles(rpcUrl, contractAddress, roleIds, viemChain?)` — Calls `hasRole()` for each role/account pair
- `getAdmin(rpcUrl, contractAddress, viemChain?)` — Calls `defaultAdmin()`, `pendingDefaultAdmin()`
- `hasRole(rpcUrl, contractAddress, role, account, viemChain?)` — Single `hasRole()` check
- `enumerateRoleMembers(rpcUrl, contractAddress, roleId, viemChain?)` — `getRoleMemberCount()` + `getRoleMember()` loop
- `getRoleAdmin(rpcUrl, contractAddress, roleId, viemChain?)` — `getRoleAdmin()` call
- `getCurrentBlock(rpcUrl)` — `eth_blockNumber` call

**Pattern**: Each function creates a viem `publicClient` via `createPublicClient({ chain, transport: http(rpcUrl) })` and calls `readContract()` with a single-function ABI fragment.

**Reference**: `packages/adapter-stellar/src/access-control/onchain-reader.ts`

#### Step 4: Indexer Client (`indexer-client.ts`)

Depends on: validation.

```
packages/adapter-evm-core/src/access-control/indexer-client.ts
packages/adapter-evm-core/test/access-control/indexer-client.test.ts
```

**What to implement**:
- `EvmIndexerClient` class with:
  - `constructor(networkConfig)` — Resolve endpoint with config precedence
  - `queryHistory(contractAddress, options)` — Paginated event query
  - `discoverRoleIds(contractAddress)` — Unique roles from events
  - `queryLatestGrants(contractAddress, roleIds)` — Grant timestamps for enrichment
  - `queryPendingOwnershipTransfer(contractAddress)` — Latest OwnershipTransferStarted
  - `queryPendingAdminTransfer(contractAddress)` — Latest DefaultAdminTransferScheduled
  - `isAvailable()` — Health check
- `createIndexerClient(networkConfig)` — Factory function

**Pattern**: Uses `fetch()` for GraphQL POST requests. See `contracts/indexer-queries.graphql` for query templates.

**Reference**: `packages/adapter-stellar/src/access-control/indexer-client.ts`

### Phase 2: Write Operations (P2)

#### Step 5: Actions (`actions.ts`)

Depends on: validation.

```
packages/adapter-evm-core/src/access-control/actions.ts
packages/adapter-evm-core/test/access-control/actions.test.ts
```

**What to implement** — Each returns `WriteContractParameters`:
- `assembleGrantRoleAction(contractAddress, roleId, account)` — `grantRole(bytes32, address)`
- `assembleRevokeRoleAction(contractAddress, roleId, account)` — `revokeRole(bytes32, address)`
- `assembleRenounceRoleAction(contractAddress, roleId, account)` — `renounceRole(bytes32, address)`
- `assembleTransferOwnershipAction(contractAddress, newOwner)` — `transferOwnership(address)`
- `assembleAcceptOwnershipAction(contractAddress)` — `acceptOwnership()`
- `assembleRenounceOwnershipAction(contractAddress)` — `renounceOwnership()` (EVM-specific)
- `assembleBeginAdminTransferAction(contractAddress, newAdmin)` — `beginDefaultAdminTransfer(address)`
- `assembleAcceptAdminTransferAction(contractAddress)` — `acceptDefaultAdminTransfer()`
- `assembleCancelAdminTransferAction(contractAddress)` — `cancelDefaultAdminTransfer()`
- `assembleChangeAdminDelayAction(contractAddress, newDelay)` — `changeDefaultAdminDelay(uint48)`
- `assembleRollbackAdminDelayAction(contractAddress)` — `rollbackDefaultAdminDelay()`

**Pattern**: Each creates `{ address, abi: [singleFunctionAbi], functionName, args }`.

**Reference**: `packages/adapter-stellar/src/access-control/actions.ts`

### Phase 3: Service Orchestration

#### Step 6: Service (`service.ts`)

Depends on: ALL above modules.

```
packages/adapter-evm-core/src/access-control/service.ts
packages/adapter-evm-core/test/access-control/service.test.ts
```

**What to implement**:
- `EvmAccessControlService` class implementing `AccessControlService`
- All methods orchestrate the lower-level modules:
  - `registerContract()` → validate + store context
  - `getCapabilities()` → feature-detection + indexer availability check
  - `getOwnership()` → onchain-reader + indexer enrichment
  - `getAdminInfo()` → onchain-reader + indexer enrichment
  - `getCurrentRoles()` → onchain-reader (enumerable or hasRole) + indexer fallback
  - `getCurrentRolesEnriched()` → getCurrentRoles + indexer grant timestamps
  - `grantRole/revokeRole/transferOwnership/...` → actions + executeTransaction callback
  - `getHistory()` → indexer-client
  - `exportSnapshot()` → getCurrentRoles + getOwnership
  - `discoverKnownRoleIds()` → indexer-client with caching
  - `dispose()` → clear Map

**Reference**: `packages/adapter-stellar/src/access-control/service.ts`

#### Step 7: Module Exports (`index.ts`)

```
packages/adapter-evm-core/src/access-control/index.ts
```

Export all public API from each submodule. Mirror the Stellar module's export structure.

### Phase 4: Integration

#### Step 8: Network Config Extension

```
packages/adapter-evm-core/src/types/network.ts  (add accessControlIndexerUrl)
packages/adapter-evm/src/networks/mainnet.ts     (add indexer URLs per network)
packages/adapter-evm/src/networks/testnet.ts     (add indexer URLs per network)
```

#### Step 9: Adapter Integration

```
packages/adapter-evm/src/adapter.ts
```

Add to `EvmAdapter`:
- Private `accessControlService` field (initially `null`)
- `getAccessControlService()` method — lazy initialization (creates the service on first call, not in the adapter constructor). This matches the Stellar adapter's pattern and avoids unnecessary initialization when access control is not used.
- The method creates the service with the `executeTransaction` callback wrapping `EvmAdapter.signAndBroadcast`

#### Step 10: Package Exports

```
packages/adapter-evm-core/src/index.ts  (export access-control module)
```

## Running Tests

```bash
# Run all tests in the core package
pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test

# Run only access-control tests
pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test -- --reporter verbose access-control

# Run a specific test file
pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test -- src/access-control/validation.test.ts
```

## Key Files to Reference

| EVM (to create) | Stellar (reference) |
|------------------|---------------------|
| `adapter-evm-core/src/access-control/service.ts` | `adapter-stellar/src/access-control/service.ts` |
| `adapter-evm-core/src/access-control/actions.ts` | `adapter-stellar/src/access-control/actions.ts` |
| `adapter-evm-core/src/access-control/feature-detection.ts` | `adapter-stellar/src/access-control/feature-detection.ts` |
| `adapter-evm-core/src/access-control/indexer-client.ts` | `adapter-stellar/src/access-control/indexer-client.ts` |
| `adapter-evm-core/src/access-control/onchain-reader.ts` | `adapter-stellar/src/access-control/onchain-reader.ts` |
| `adapter-evm-core/src/access-control/validation.ts` | `adapter-stellar/src/access-control/validation.ts` |
| `adapter-evm/src/adapter.ts` | `adapter-stellar/src/adapter.ts` |

## Post-Implementation Cleanup

1. **Changeset**: Create changesets for `adapter-evm-core` and `adapter-evm` packages
2. **Remove workarounds**: Once the updated `@openzeppelin/ui-types` is consumed, remove any sentinel values (`expirationBlock: 0`), `UNKNOWN` fallbacks for mapped events, and local type extensions for `accessControlIndexerUrl`
