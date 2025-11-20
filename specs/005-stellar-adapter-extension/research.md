# Research: Stellar Adapter Extension — Access Control

## Decisions

1. Indexer usage is optional; on-chain is primary

- Decision: Prefer on-chain reads for current state (owner, role membership) when contract exposes view functions; use indexer only for historical data and enumeration when on-chain is insufficient.
- Rationale: Reduces external dependencies, improves reliability, and aligns with “adapters first” and graceful degradation.
- Alternatives considered: Require indexer; Rejected due to availability and configuration variability.

2. Indexer configuration and precedence

- Decision: NetworkConfig may include official per-network indexer defaults (e.g., testnet/mainnet) when stable endpoints exist. Resolution order — user-provided override > network-config default > derived-from-RPC (if a safe pattern exists) > none.
- Rationale: Aligns with Midnight’s approach of providing defaults in network config while preserving operator control via overrides.
- Alternatives considered: Only network defaults; Rejected because projects often require custom endpoints.

Derivation rule (clarified): Derivation is DISABLED by default. It is only enabled when an explicit provider mapping is implemented (e.g., known host/path transformation documented in code). If no mapping exists for the current RPC host, derivation is skipped.

3. Capability detection and verification

- Decision: Detect Ownable/AccessControl via contract spec and known entrypoints; verify presence of role admin/membership and optional enumeration methods. Mark unsupported features explicitly.
- Rationale: Ensures safe behavior under varying contract implementations.
- Alternatives considered: Assume conformance; Rejected—risks incorrect assumptions.

4. History entry model (adapter-specific)

- Decision: History entries include { roleId, account, changeType: GRANTED|REVOKED, txId, timestamp|ledger }. Filtering by role supported when history is available.
- Rationale: Sufficient for audits and UI filtering without over-specifying indexer schema.
- Alternatives considered: Full event envelopes; Rejected for complexity at this stage.

5. Error taxonomy

- Decision: Typed errors: UnsupportedContractFeatures, PermissionDenied, IndexerUnavailable, ConfigurationInvalid, OperationFailed.
- Rationale: Enables actionable UI behavior and testing.
- Alternatives considered: Generic error strings; Rejected—hurts ergonomics and testability.

6. Address validation

- Decision: Use single source of truth from shared validation (`isValidAddress(address, addressType?)`); adapter provides addressType guidance where relevant.
- Rationale: Avoids duplication and inconsistent validation.
- Alternatives considered: Adapter-local validators; Rejected—violates “single source of truth”.

7. Contracts and schema surface (GraphQL)

- Decision: Provide GraphQL schema for planning artifacts with queries for capabilities, ownership, roles, history and mutations for grant/revoke/transfer; adapter remains headless and not bound to any transport.
- Rationale: Satisfies planning deliverable and documents API shape for consumers.
- Alternatives considered: REST OpenAPI; acceptable alternative; GraphQL chosen for compactness.

8. Testing approach

- Decision: Unit tests with mocked RPC/indexer; integration tests on Stellar testnet verifying read/mutate/read loops; snapshot export parity tests.
- Rationale: Ensures correctness and isolation; aligns with TDD mandate.
- Alternatives considered: Integration-only; Rejected—slower and brittle.

9. Support scope (official OZ Access Control only)

- Decision: Limit support to official OpenZeppelin Stellar Access Control contracts from the `packages/access` module; non‑conforming/custom AC implementations are treated as unsupported.
- Rationale: Ensures predictable interfaces, reliable verification, and alignment with OpenZeppelin standards.
- Alternatives considered: Attempt to support arbitrary/custom AC contracts; Rejected due to variability and increased risk/maintenance.
- Reference: [OpenZeppelin Stellar Access Control](https://github.com/OpenZeppelin/stellar-contracts/tree/main/packages/access)

10. SubQuery Indexer Adoption

- Decision: Use SubQuery Managed Service for indexing Access Control and Ownable events.
- Rationale: Provides robust, scalable indexing with built-in server-side filtering, pagination, and sorting, eliminating the need for complex client-side filtering logic.
- Alternatives considered: Custom bespoke indexer (high maintenance), pure on-chain logs (inefficient/limited filtering).
- Implementation: Production-ready indexer deployed at `stellar-access-control-indexer` repository capturing all 9 OpenZeppelin events:
  - **Access Control Events (6):** role_granted, role_revoked, role_admin_changed, admin_transfer_initiated, admin_transfer_completed, admin_renounced
  - **Ownable Events (3):** ownership_transfer, ownership_transfer_completed, ownership_renounced
- Key learnings: Event structures from deployed OpenZeppelin contracts include Map wrappers (e.g., `{ caller: Address }`) and variable topic/value placement requiring robust fallback logic in handlers.
- Testing: 26 unit tests covering ScVal decoding, event structure variations, and all event types.
- Documentation: Comprehensive README with deployment guide, event structure notes, and SubQuery Managed Service integration instructions.

## Open Questions (resolved)

- Default indexer endpoints: NetworkConfig may ship defaults for official networks when stable endpoints are available; otherwise leave unset. Operators can override via runtime configuration. Derivation from RPC is optional and only used when a safe, known pattern exists.
- Role identifier representation: Use string `id` with optional `label`; chain-specific formats mapped to string IDs.
- Pagination strategy: For large role sets, prefer on-chain enumeration when available; otherwise page history queries in adapter implementation. For planning, keep API surface simple; pagination details can be adapter-internal.

## Summary of Impacts

- Shared types extended with AccessControl models; lint rule update required if base adapter interface gains optional accessor (e.g., `getAccessControlService`).
- Adapter-stellar adds service, detection, indexer client, merger, actions, and errors, plus network service configuration for indexer endpoints.
- No changes to chain-agnostic UI; consumers gate features using capabilities.\*\*\*
