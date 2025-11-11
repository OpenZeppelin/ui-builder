# Quickstart: Stellar Adapter Extension — Access Control

This feature delivers an adapter-led Access Control service for Stellar (Soroban). It remains headless (no UI) and exposes capability flags and models that UIs can consume safely.

## What you can do

- Detect contract capabilities (Ownable, AccessControl, role enumeration, history availability)
- Read current owner and role memberships (on-chain first)
- Grant/revoke roles and transfer ownership (returns an operation/tx identifier)
- Export a current-state snapshot (roles + ownership)
- Optionally view history when a history source is configured

## Configuration

- Indexer is optional. Configure via network services with precedence: runtime override > network‑config default > derived‑from‑RPC (if a safe pattern exists) > none.
- When no history source is configured, history is unavailable but core reads and mutations work.

## Typical flow (pseudocode)

1. Resolve Stellar network configuration (RPC + optional indexer endpoints).
2. Instantiate the Stellar adapter with the network config.
3. Obtain the Access Control service accessor from the adapter.
4. Read capabilities, ownership, roles.
5. Perform grant/revoke/transfer as needed; re-read to confirm.
6. Export snapshot for audit or archival.

## Capability gating

- Always check capabilities before enabling UI actions:
  - `hasOwnable` → ownership reads/transfers
  - `hasAccessControl` → roles/mutations
  - `hasEnumerableRoles` → direct enumeration vs event reconstruction
  - `supportsHistory` → history queries enabled

## Errors & validation

- Errors are typed (e.g., UnsupportedContractFeatures, PermissionDenied, IndexerUnavailable, ConfigurationInvalid, OperationFailed).
- Use the shared address validation source of truth (`isValidAddress(address, addressType?)`).

## Notes

- The adapter remains the single locus of business logic. No UI logic is added.
- Shared types live in `packages/types`; cross-chain helpers in `packages/utils`.\*\*\*
