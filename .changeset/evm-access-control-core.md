---
"@openzeppelin/ui-builder-adapter-evm-core": minor
---

Add access control module for EVM-compatible contracts

- Capability detection for Ownable, Ownable2Step, AccessControl, AccessControlEnumerable, and AccessControlDefaultAdminRules patterns via ABI analysis
- On-chain reads for ownership state, admin state, role assignments, and role enumeration via viem public client
- Transaction assembly for ownership transfer/accept/renounce, admin transfer/accept/cancel, admin delay change/rollback, and role grant/revoke/renounce as WriteContractParameters
- GraphQL indexer client for historical event queries with filtering and pagination, role discovery, pending transfer queries, and grant timestamp enrichment
- Input validation for EVM addresses and bytes32 role IDs
- Full API parity with the Stellar adapter's AccessControlService (13 unified methods + EVM-specific extensions)
- Graceful degradation when indexer is unavailable
