# Research: EVM Adapter Access Control Module

**Branch**: `011-evm-access-control` | **Date**: 2026-02-09

## R1: On-Chain Read Strategy

**Decision**: Use viem `createPublicClient` with `readContract()` for all on-chain reads, matching the existing pattern in `adapter-evm-core/src/query/handler.ts`.

**Rationale**: The EVM core package already uses viem for all RPC interactions. `readContract()` handles ABI encoding/decoding automatically. Creating a public client per-call with `http(rpcUrl)` transport is stateless and consistent with the existing query handler.

**Alternatives considered**:

- Raw `eth_call` via fetch: More control but loses viem's ABI encoding/decoding and type safety. Rejected for consistency.
- Shared public client instance: Would require managing client lifecycle. Rejected because the current pattern creates clients per-call and viem handles connection pooling internally.

**Implementation notes**:

- Reuse `resolveRpcUrl()` from `src/configuration/rpc.ts` for RPC URL resolution (user > app config > default)
- Create viem public client using `networkConfig.viemChain` when available, falling back to manual chain construction
- ABI fragments for each read function (owner, pendingOwner, hasRole, etc.) defined as constants

## R2: Transaction Data Assembly Format

**Decision**: Return `WriteContractParameters` from all action assembly functions, matching the existing EVM transaction format.

**Rationale**: The `EvmAdapter.signAndBroadcast()` method already accepts `WriteContractParameters`. Returning this type means the access control module's transaction assembly integrates seamlessly with both EOA and Relayer execution strategies without any changes.

**Alternatives considered**:

- Raw calldata (bytes): Would require consumers to handle encoding. Rejected because `WriteContractParameters` is already the standard.
- Custom transaction type: Would add unnecessary abstraction. Rejected.

**Implementation notes**:

- Each action function takes the contract address and operation-specific parameters
- Returns `{ address, abi, functionName, args }` (optionally `value` for payable, but AC operations are not payable)
- ABI fragments embedded as constants in `actions.ts` (single-function ABI arrays)

## R3: GraphQL Indexer Client

**Decision**: Implement a new `EvmIndexerClient` class mirroring `StellarIndexerClient` with GraphQL queries against the EVM access control indexer.

**Rationale**: The EVM indexer uses the same unified GraphQL schema as the Stellar indexer (from `access-control-indexers` repo). The query patterns are identical — filter by network + contract + optional role/account/eventType. A dedicated client class encapsulates connection management, error handling, and response transformation.

**Alternatives considered**:

- Reuse the `@oz-indexers/client` package from the indexers repo directly: Would add a new external dependency and couple to the indexer repo's release cycle. Rejected in favor of a lightweight, self-contained client.
- Generic GraphQL client library (e.g., graphql-request): Adds unnecessary dependency. Raw `fetch` with typed responses is sufficient and matches the Stellar adapter's approach.

**Implementation notes**:

- Uses `fetch` for GraphQL requests (available in both browser and Node.js)
- Config precedence: user config > runtime override > `networkConfig.accessControlIndexerUrl`
- Graceful degradation: catches network errors, returns empty results with `supportsHistory: false`
- Response types mirror the indexer's GraphQL schema (AccessControlEvent, RoleMembership, ContractOwnership)

## R4: Feature Detection via ABI Analysis

**Decision**: Detect capabilities by checking for the presence of specific function signatures in `ContractSchema.functions`, matching OpenZeppelin contract interfaces.

**Rationale**: EVM contracts expose their interface through the ABI. The `ContractSchema.functions` array contains all functions from the ABI. By checking for characteristic function names and signatures, we can reliably detect which OpenZeppelin patterns are implemented.

**Alternatives considered**:

- ERC-165 `supportsInterface()` on-chain check: More authoritative but requires an RPC call and not all contracts implement ERC-165. Could be used as supplementary verification. Rejected as primary method because it requires an async call and not all contracts support it.
- Bytecode analysis: Too complex and fragile. Rejected.

**Detection matrix**:

| Pattern                        | Required Functions                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownable                        | `owner()` + `transferOwnership(address)`                                                                                                                            |
| Ownable2Step                   | Ownable + `pendingOwner()` + `acceptOwnership()`                                                                                                                    |
| AccessControl                  | `hasRole(bytes32,address)` + `grantRole(bytes32,address)` + `revokeRole(bytes32,address)` + `getRoleAdmin(bytes32)`                                                 |
| AccessControlEnumerable        | AccessControl + `getRoleMemberCount(bytes32)` + `getRoleMember(bytes32,uint256)`                                                                                    |
| AccessControlDefaultAdminRules | AccessControl + `defaultAdmin()` + `pendingDefaultAdmin()` + `beginDefaultAdminTransfer(address)` + `acceptDefaultAdminTransfer()` + `cancelDefaultAdminTransfer()` |

**Implementation notes**:

- Check function names AND parameter types for accuracy (avoid false positives from similarly-named functions)
- Optional ERC-165 verification as enhancement (adds `verifiedAgainstOZInterfaces: true` when confirmed)
- Returns `AccessControlCapabilities` flags

## R5: Unified Type Mapping — `expirationBlock` Semantics ⭐ SSOT

> **This section is the single source of truth** for `expirationBlock` semantics across all spec artifacts. Other documents (spec.md clarifications, data-model.md, contracts/) should reference R5 rather than restating the full semantics.

**Decision**: For EVM Ownable2Step (no expiration), set `expirationBlock` to `undefined` (targeting PR-1 which makes the field optional; `0` as temporary sentinel until PR-1 is merged). For AccessControlDefaultAdminRules, map the `acceptSchedule` value to `expirationBlock` — this is a UNIX timestamp in seconds (not a block number) representing "earliest acceptance time". Document the semantic difference in JSDoc.

**Rationale**: The unified `PendingOwnershipTransfer.expirationBlock` field is required (not optional) in `@openzeppelin/ui-types`. EVM Ownable2Step has no expiration mechanism — pending transfers persist until accepted or overwritten. We cannot change the unified type without coordinating with the `openzeppelin-ui` repo. Using `0` as a sentinel is clear and the Role Manager already handles the `expired` state being absent for EVM (per spec clarification FR-023).

For AccessControlDefaultAdminRules, the `defaultAdminTransferSchedule()` returns a timestamp (seconds since epoch) after which the transfer can be accepted. This maps naturally to `expirationBlock` as a numeric value, but the semantics differ:

- Stellar: "must accept BEFORE this ledger" (deadline)
- EVM: "can accept AFTER this timestamp" (earliest acceptance)

**Alternatives considered**:

- `Number.MAX_SAFE_INTEGER` for no expiration: Technically safe but less obvious. Rejected for clarity.
- Propose updating `@openzeppelin/ui-types` to make `expirationBlock` optional: Correct long-term fix but requires cross-repo coordination. Flagged as follow-up.
- Store accept schedule in `metadata` field instead: Would break the unified API contract. Rejected.

**Planned**: PR-1 in `openzeppelin-ui` repo will make `expirationBlock` optional in `PendingOwnershipTransfer` and `PendingAdminTransfer`. Implementation should target `undefined` from the start. If PR-1 is not merged when implementation begins, use `0` as a temporary sentinel with a `// TODO: replace with undefined after PR-1` comment. Tests should assert against the target value (`undefined`).

**Important semantic note**: For `PendingAdminTransfer`, the `expirationBlock` field stores a UNIX timestamp in seconds (from the contract's `pendingDefaultAdmin()` return value), NOT a block number. This is a naming mismatch inherited from the unified type. Stellar interprets this field as a ledger deadline ("must accept BEFORE this ledger"), while EVM interprets it as an accept schedule ("can accept AFTER this timestamp"). Consumers (like the Role Manager) must be aware of this divergence when displaying transfer timing information.

## R6: HistoryChangeType Extension for EVM-Specific Events

**Decision**: Map EVM-specific events to existing `HistoryChangeType` values where semantically equivalent. Use `UNKNOWN` for event types not represented in the current union. Propose new change types as a follow-up.

**Mapping**:

| EVM Indexer Event Type                 | HistoryChangeType              | Notes |
| -------------------------------------- | ------------------------------ | ----- |
| `ROLE_GRANTED`                         | `GRANTED`                      | Direct match |
| `ROLE_REVOKED`                         | `REVOKED`                      | Direct match |
| `ROLE_ADMIN_CHANGED`                   | `ROLE_ADMIN_CHANGED`           | Direct match |
| `OWNERSHIP_TRANSFER_STARTED`           | `OWNERSHIP_TRANSFER_STARTED`   | Direct match |
| `OWNERSHIP_TRANSFER_COMPLETED`         | `OWNERSHIP_TRANSFER_COMPLETED` | Direct match |
| `OWNERSHIP_RENOUNCED`                  | `OWNERSHIP_RENOUNCED`          | Direct match |
| `ADMIN_TRANSFER_INITIATED`             | `ADMIN_TRANSFER_INITIATED`     | Direct match (Stellar equivalent) |
| `ADMIN_TRANSFER_COMPLETED`             | `ADMIN_TRANSFER_COMPLETED`     | Direct match (Stellar equivalent) |
| `ADMIN_RENOUNCED`                      | `ADMIN_RENOUNCED`              | Direct match (exists in both indexers) |
| `DEFAULT_ADMIN_TRANSFER_SCHEDULED`     | `ADMIN_TRANSFER_INITIATED`     | EVM-specific alias for transfer initiation |
| `DEFAULT_ADMIN_TRANSFER_CANCELED`      | `UNKNOWN` → `ADMIN_TRANSFER_CANCELED` (after PR-2) | EVM-only, no current equivalent |
| `DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED` | `UNKNOWN` → `ADMIN_DELAY_CHANGE_SCHEDULED` (after PR-2) | EVM-only, no current equivalent |
| `DEFAULT_ADMIN_DELAY_CHANGE_CANCELED`  | `UNKNOWN` → `ADMIN_DELAY_CHANGE_CANCELED` (after PR-2) | EVM-only, no current equivalent |

**Rationale**: The EVM indexer defines 13 event types (from `access-control-indexers/packages/common/src/types.ts`). 10 map directly to existing `HistoryChangeType` values. 3 EVM-only types (`DEFAULT_ADMIN_TRANSFER_CANCELED`, delay changes) map to `UNKNOWN` until PR-2 adds the corresponding variants.

**Planned**: PR-2 in `openzeppelin-ui` repo will add `ADMIN_TRANSFER_CANCELED`, `ADMIN_DELAY_CHANGE_SCHEDULED`, and `ADMIN_DELAY_CHANGE_CANCELED` to the `HistoryChangeType` union. Once published, the EVM adapter maps all 13 event types correctly. Until the types update is published, the 3 unmapped types use `UNKNOWN`.

**PR-2 downstream impact**: The Role Manager uses `Record<HistoryChangeType, RoleChangeAction>` for event mapping (`apps/role-manager/src/types/role-changes.ts`). Adding new union members will break TypeScript compilation until the mapping is updated. The Role Manager's existing code uses a `?? 'grant'` runtime fallback but the `Record` type constraint still requires compile-time exhaustiveness.

## R7: Network Config Extension for Indexer URL

**Decision**: Add `accessControlIndexerUrl?: string` to `EvmNetworkConfig` in `@openzeppelin/ui-types` (PR-3 in `openzeppelin-ui` repo), and consume it in the EVM core package.

**Rationale**: The Stellar adapter includes the indexer URL in its `StellarNetworkConfig` from `@openzeppelin/ui-types`. Adding it to the canonical `EvmNetworkConfig` maintains consistency and avoids local type extensions. The `EvmCompatibleNetworkConfig` in `adapter-evm-core` inherits it automatically via the `extends` chain.

**Alternatives considered**:

- Extend only locally in `EvmCompatibleNetworkConfig`: Works temporarily but diverges from the pattern set by Stellar. Rejected in favor of canonical location.
- Pass indexer URL as a separate config to the service constructor: Would diverge from the Stellar pattern. Rejected.
- Use `metadata` field on `EvmNetworkConfig`: Too loosely typed; loses discoverability. Rejected.

**Implementation notes**:

- Each network config in `packages/adapter-evm/src/networks/` updated with the indexer URL for that network
- The indexer URLs follow the pattern from the `access-control-indexers` repo's deployment configuration
- Config precedence in `EvmIndexerClient`: user override > runtime override > `networkConfig.accessControlIndexerUrl`

## R8: EVM Address and Role Validation

**Decision**: Use viem's `isAddress()` for EVM address validation and regex pattern for bytes32 role validation.

**Rationale**: viem's `isAddress()` handles both checksummed and non-checksummed hex addresses, which is the EVM standard. For role IDs, EVM AccessControl uses `bytes32` values (64 hex chars with `0x` prefix), validated by a simple regex pattern.

**Alternatives considered**:

- Custom regex for addresses: Would miss EIP-55 checksum validation. Rejected.
- ethers.js `isAddress()`: Would add an unnecessary dependency. Rejected (viem is already a dependency).

**Validation rules**:

- Contract address: `isAddress(addr)` from viem, required `0x` prefix, 42 chars
- Account address: Same as contract address (EVM doesn't distinguish)
- Role ID: `/^0x[0-9a-fA-F]{64}$/` (bytes32 hex string)
- `DEFAULT_ADMIN_ROLE`: `0x0000000000000000000000000000000000000000000000000000000000000000`

## R9: Service Lifecycle and Transaction Execution

**Decision**: The `EvmAccessControlService` assembles transaction data (as `WriteContractParameters`) and delegates execution to a caller-provided execution function. The service does NOT import or depend on wallet/signing infrastructure directly.

**Rationale**: The Stellar adapter's service imports `signAndBroadcastStellarTransaction` directly, coupling it to the Stellar transaction pipeline. For EVM, we follow a cleaner pattern: the service constructor accepts an `executeTransaction` callback that the `EvmAdapter` provides (wrapping its existing `signAndBroadcast` method). This keeps the core package free of wallet dependencies and makes the service testable.

**Alternatives considered**:

- Import `executeEvmTransaction` directly in the service: Would couple core to wallet infrastructure. Rejected.
- Return only assembled data without execution: Would break the `AccessControlService` interface which requires `OperationResult` returns. Rejected.

**Implementation notes**:

- Service constructor: `createEvmAccessControlService(networkConfig, executeTransaction)`
- `executeTransaction` type: `(txData: WriteContractParameters, execConfig: ExecutionConfig, onStatusChange?, runtimeApiKey?) => Promise<OperationResult>`
- The `EvmAdapter` creates this callback in its constructor, wrapping `signAndBroadcast`
