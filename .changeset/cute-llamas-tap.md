---
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-types': minor
'@openzeppelin/ui-builder-utils': minor
---

Add Access Control and Ownable support for Stellar (Soroban) contracts

### @openzeppelin/ui-builder-adapter-stellar

- Add `AccessControlService` implementation with full support for OpenZeppelin Access Control and Ownable patterns
- Add capability detection to identify contracts implementing AccessControl, Ownable, or both
- Support role management: query current roles, grant/revoke roles, check permissions
- Support ownership management: transfer ownership, query current owner
- Add historical queries via SubQuery indexer integration for complete role change and ownership transfer history
- Implement server-side filtering by contract, role, account, and limit
- Add graceful degradation when indexer is unavailable (on-chain queries continue to work)
- Add comprehensive address validation using shared utilities at all service entry points
- Export access control service via `getAccessControlService()` method on `StellarAdapter`
- Add snapshot export functionality for current access control state
- Support both account addresses (G...) and contract addresses (C...) for ownership transfers

### @openzeppelin/ui-builder-types

- Add `AccessControlService` interface and related types (`AccessControlCapabilities`, `OwnershipInfo`, `RoleAssignment`, `AccessSnapshot`, `HistoryEntry`, `OperationResult`)
- Add `getAccessControlService?()` optional method to `ContractAdapter` interface
- Extend `BaseNetworkConfig` with optional `indexerUri` and `indexerWsUri` fields for GraphQL endpoint configuration

### @openzeppelin/ui-builder-utils

- Add access control snapshot utilities (`validateSnapshot`, `serializeSnapshot`, `deserializeSnapshot`, `createEmptySnapshot`, `findRoleAssignment`, `compareSnapshots`)
- Add access control error utilities (`isAccessControlError`, error message extraction helpers)
- Export address normalization utilities (`normalizeAddress`, `addressesEqual`) for chain-agnostic address comparison
