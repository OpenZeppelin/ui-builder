# Data Model: EVM Adapter Access Control Module

**Branch**: `011-evm-access-control` | **Date**: 2026-02-09

## Entity Definitions

### 1. EvmAccessControlContext (Internal)

In-memory context stored per registered contract. Not persisted.

| Field | Type | Description |
|-------|------|-------------|
| contractAddress | `string` | Normalized (lowercased) EVM address with `0x` prefix |
| contractSchema | `ContractSchema` | Parsed ABI as ContractSchema (from adapter's `loadContract`) |
| knownRoleIds | `string[]` | Role IDs explicitly provided via `registerContract()` (bytes32 hex) |
| discoveredRoleIds | `string[]` | Role IDs discovered via indexer query (cached) |
| roleDiscoveryAttempted | `boolean` | Flag to prevent repeated discovery when indexer unavailable |
| capabilities | `AccessControlCapabilities \| null` | Cached capabilities (populated on first `getCapabilities()` call) |

**Identity**: Keyed by normalized `contractAddress` in a `Map<string, EvmAccessControlContext>`.

**Lifecycle**: Created on `registerContract()`, enriched on capability detection and role discovery, removed on `dispose()`.

### 2. AccessControlCapabilities (from @openzeppelin/ui-types)

Returned by `getCapabilities()`. Populated by ABI analysis in `feature-detection.ts`.

| Field | Type | EVM Detection Logic |
|-------|------|---------------------|
| hasOwnable | `boolean` | ABI has `owner()` + `transferOwnership(address)` |
| hasTwoStepOwnable | `boolean` | Ownable + `pendingOwner()` + `acceptOwnership()` |
| hasAccessControl | `boolean` | ABI has `hasRole(bytes32,address)` + `grantRole(bytes32,address)` + `revokeRole(bytes32,address)` + `getRoleAdmin(bytes32)` |
| hasTwoStepAdmin | `boolean` | AccessControl + `defaultAdmin()` + `pendingDefaultAdmin()` + `beginDefaultAdminTransfer(address)` + `acceptDefaultAdminTransfer()` + `cancelDefaultAdminTransfer()` |
| hasEnumerableRoles | `boolean` | AccessControl + `getRoleMemberCount(bytes32)` + `getRoleMember(bytes32,uint256)` |
| supportsHistory | `boolean` | `true` when indexer endpoint is configured and reachable |
| verifiedAgainstOZInterfaces | `boolean` | `true` if ERC-165 `supportsInterface()` confirms (optional enhancement) |
| notes | `string[]` | Warnings about incomplete ABI, missing functions, etc. |

### 3. OwnershipInfo (from @openzeppelin/ui-types)

Returned by `getOwnership()`. Combines on-chain reads and indexer data.

| Field | Type | EVM Source |
|-------|------|-----------|
| owner | `string \| null` | On-chain: `owner()` call. Null if zero address (renounced). |
| state | `OwnershipState` | Derived: `'owned'` (has owner, no pending), `'pending'` (has pending owner), `'renounced'` (owner is zero). Never `'expired'` for EVM. |
| pendingTransfer | `PendingOwnershipTransfer \| undefined` | Present when state is `'pending'` |

**PendingOwnershipTransfer fields for EVM**:

| Field | Type | EVM Source |
|-------|------|-----------|
| pendingOwner | `string` | On-chain: `pendingOwner()` (Ownable2Step) |
| expirationBlock | `number \| undefined` | `undefined` — EVM Ownable2Step has no expiration (requires PR-1 in openzeppelin-ui; uses sentinel `0` until types are updated) |
| initiatedAt | `string \| undefined` | Indexer: `OwnershipTransferStarted` event timestamp |
| initiatedTxId | `string \| undefined` | Indexer: event transaction hash |
| initiatedBlock | `number \| undefined` | Indexer: event block number |

**State transitions**:
```
[No contract] → registerContract() → [owned | renounced]
[owned] → transferOwnership(newOwner) → [pending]
[pending] → acceptOwnership() → [owned] (new owner)
[pending] → transferOwnership(different) → [pending] (new pending owner, old overwritten)
[owned | pending] → renounceOwnership() → [renounced]
```

### 4. AdminInfo (from @openzeppelin/ui-types)

Returned by `getAdminInfo()`. For AccessControlDefaultAdminRules contracts only.

| Field | Type | EVM Source |
|-------|------|-----------|
| admin | `string \| null` | On-chain: `defaultAdmin()`. Null if zero address (renounced). |
| state | `AdminState` | Derived: `'active'` (has admin, no pending), `'pending'` (scheduled transfer), `'renounced'` (admin is zero). Never `'expired'` for EVM. |
| pendingTransfer | `PendingAdminTransfer \| undefined` | Present when state is `'pending'` |

**PendingAdminTransfer fields for EVM**:

| Field | Type | EVM Source |
|-------|------|-----------|
| pendingAdmin | `string` | On-chain: `pendingDefaultAdmin()` returns `(newAdmin, schedule)` |
| expirationBlock | `number \| undefined` | On-chain: `pendingDefaultAdmin()` returns `(newAdmin, schedule)` — the `schedule` is a **UNIX timestamp in seconds** (NOT a block number) representing the earliest time the transfer can be accepted. **Semantic divergence**: Stellar uses `expirationBlock` as a ledger deadline ("must accept BEFORE"), EVM uses it as an accept schedule ("can accept AFTER"). The field name comes from the unified type. Requires PR-1 for optionality; uses `schedule` value directly until types are updated. |
| initiatedAt | `string \| undefined` | Indexer: `DefaultAdminTransferScheduled` event timestamp |
| initiatedTxId | `string \| undefined` | Indexer: event transaction hash |
| initiatedBlock | `number \| undefined` | Indexer: event block number |

**State transitions**:
```
[No contract] → registerContract() → [active | renounced]
[active] → beginDefaultAdminTransfer(newAdmin) → [pending]
[pending] → acceptDefaultAdminTransfer() → [active] (new admin)
[pending] → cancelDefaultAdminTransfer() → [active] (same admin, pending cleared)
[active] → beginDefaultAdminTransfer(address(0)) → [pending] (renounce flow step 1)
[pending to address(0)] → acceptDefaultAdminTransfer() → [renounced] (renounce flow step 2)
```

> Note: There is no standalone `renounceDefaultAdmin()` function in OpenZeppelin v5. Admin renounce is achieved through the standard two-step transfer flow with `address(0)` as the new admin.

### 5. RoleAssignment (from @openzeppelin/ui-types)

Returned by `getCurrentRoles()`.

| Field | Type | EVM Source |
|-------|------|-----------|
| role.id | `string` | bytes32 hex string (e.g., `0x0000...0000` for DEFAULT_ADMIN_ROLE) |
| role.label | `string \| undefined` | `"DEFAULT_ADMIN_ROLE"` for zero bytes32; otherwise undefined (hash cannot be reversed) |
| members | `string[]` | On-chain: `getRoleMember(role, index)` if enumerable; or `hasRole(role, account)` with known accounts from indexer |

### 6. EnrichedRoleAssignment (from @openzeppelin/ui-types)

Returned by `getCurrentRolesEnriched()`. Adds grant metadata from indexer.

| Field | Type | EVM Source |
|-------|------|-----------|
| role | `RoleIdentifier` | Same as RoleAssignment |
| members[].address | `string` | Account address |
| members[].grantedAt | `string \| undefined` | Indexer: `RoleGranted` event timestamp |
| members[].grantedTxId | `string \| undefined` | Indexer: event transaction hash |
| members[].grantedLedger | `number \| undefined` | Indexer: event block number |

### 7. HistoryEntry (from @openzeppelin/ui-types)

Returned in `PaginatedHistoryResult.items` by `getHistory()`.

| Field | Type | EVM Source |
|-------|------|-----------|
| role.id | `string` | Indexer: `role` field from AccessControlEvent (bytes32 hex) |
| role.label | `string \| undefined` | `"DEFAULT_ADMIN_ROLE"` for zero bytes32 |
| account | `string` | Indexer: `account` field (address affected) |
| changeType | `HistoryChangeType` | Mapped from indexer `eventType` (see R6 in research.md). 3 EVM-specific types require PR-2; uses `UNKNOWN` until types are updated. |
| txId | `string` | Indexer: `txHash` field |
| timestamp | `string \| undefined` | Indexer: `timestamp` field (ISO8601) |
| ledger | `number \| undefined` | Indexer: `blockNumber` field |

### 8. AccessSnapshot (from @openzeppelin/ui-types)

Returned by `exportSnapshot()`.

| Field | Type | EVM Source |
|-------|------|-----------|
| roles | `RoleAssignment[]` | From `getCurrentRoles()` |
| ownership | `OwnershipInfo \| undefined` | From `getOwnership()` if Ownable detected (try/catch — omitted if contract doesn't support Ownable) |

> Note: The unified `AccessSnapshot` type does not include `adminInfo`. This is a known limitation matching the Stellar adapter. Admin information is accessible separately via `getAdminInfo()`. If a future types update adds `adminInfo` to `AccessSnapshot`, the EVM adapter should populate it.

### 9. EvmCompatibleNetworkConfig (Extended)

Extended in `adapter-evm-core/src/types/network.ts`:

| Field | Type | Description |
|-------|------|-------------|
| *(existing fields)* | | All existing EvmCompatibleNetworkConfig fields preserved |
| accessControlIndexerUrl | `string \| undefined` | NEW: GraphQL endpoint for the access control indexer (added via PR-3 in openzeppelin-ui; local extension in adapter-evm-core until types are updated) |

## Constants

| Name | Value | Purpose |
|------|-------|---------|
| `DEFAULT_ADMIN_ROLE` | `0x0000000000000000000000000000000000000000000000000000000000000000` | The bytes32 zero value used by OpenZeppelin AccessControl |
| `DEFAULT_ADMIN_ROLE_LABEL` | `"DEFAULT_ADMIN_ROLE"` | Human-readable label for the default admin role |
| `ZERO_ADDRESS` | `0x0000000000000000000000000000000000000000` | EVM zero address (indicates renounced ownership/admin) |
| `NO_EXPIRATION` | `0` | Temporary sentinel for `expirationBlock` when EVM has no expiration. **Target**: `undefined` (after PR-1 makes the field optional). Implementation should write code targeting `undefined` with a `// TODO` comment if PR-1 is not yet merged. Tests should assert against `undefined`. |
