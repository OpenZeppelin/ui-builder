# @openzeppelin/ui-builder-adapter-evm-core

## 1.1.0

### Minor Changes

- [#338](https://github.com/OpenZeppelin/ui-builder/pull/338) [`da33121`](https://github.com/OpenZeppelin/ui-builder/commit/da33121ba20f17d414e121b3cb28ad1b2988b28b) Thanks [@pasevin](https://github.com/pasevin)! - Add access control module for EVM-compatible contracts
  - Capability detection for Ownable, Ownable2Step, AccessControl, AccessControlEnumerable, and AccessControlDefaultAdminRules patterns via ABI analysis
  - On-chain reads for ownership state, admin state, role assignments, and role enumeration via viem public client
  - Transaction assembly for ownership transfer/accept/renounce, admin transfer/accept/cancel, admin delay change/rollback, and role grant/revoke/renounce as WriteContractParameters
  - GraphQL indexer client for historical event queries with filtering and pagination, role discovery, pending transfer queries, and grant timestamp enrichment
  - Input validation for EVM addresses and bytes32 role IDs
  - Full API parity with the Stellar adapter's AccessControlService (13 unified methods + EVM-specific extensions)
  - Graceful degradation when indexer is unavailable

- [#338](https://github.com/OpenZeppelin/ui-builder/pull/338) [`da33121`](https://github.com/OpenZeppelin/ui-builder/commit/da33121ba20f17d414e121b3cb28ad1b2988b28b) Thanks [@pasevin](https://github.com/pasevin)! - Add human-readable role labels for EVM access control
  - Well-known role dictionary (DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE, UPGRADER_ROLE) with resolveRoleLabel()
  - ABI-based role constant extraction via findRoleConstantCandidates() and discoverRoleLabelsFromAbi()
  - addKnownRoleIds() accepts { id, label } pairs for externally-provided labels
  - roleLabelMap threaded through readCurrentRoles(), queryHistory(), and resolveRoleFromEvent()
  - Label resolution precedence: external > ABI-extracted > well-known > undefined

- [#338](https://github.com/OpenZeppelin/ui-builder/pull/338) [`da33121`](https://github.com/OpenZeppelin/ui-builder/commit/da33121ba20f17d414e121b3cb28ad1b2988b28b) Thanks [@pasevin](https://github.com/pasevin)! - Add chain-agnostic capability flags, expiration metadata, and admin delay info
  - Detect `hasRenounceOwnership`, `hasRenounceRole`, `hasCancelAdminTransfer`, `hasAdminDelayManagement` from ABI in feature-detection
  - Implement `getExpirationMetadata()` returning `mode: 'none'` for ownership and `mode: 'contract-managed'` for admin transfers
  - Populate `delayInfo` (current delay from `defaultAdminDelay()`) in `getAdminInfo()` response
