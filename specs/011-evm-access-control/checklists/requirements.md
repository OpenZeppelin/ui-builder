# Requirements Quality Checklist: EVM Adapter Access Control Module

**Purpose**: Thorough author self-validation of specification completeness, cross-repo consistency, and API parity before starting implementation  
**Created**: 2026-02-09  
**Updated**: 2026-02-09 (all items addressed)  
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [research.md](../research.md) | [data-model.md](../data-model.md) | [quickstart.md](../quickstart.md)

**Scope**: Cross-repo alignment (openzeppelin-ui, ui-builder, access-control-indexers) AND 1:1 API parity with Stellar adapter  
**Audience**: Author (self-validation before implementation)

---

## A — Requirement Completeness

- [x] CHK-A01 — **`renounceOwnership` transaction assembly.** Added FR-009a and US-4 acceptance scenario 5. Added `assembleRenounceOwnershipAction` to quickstart Step 5. Added `renounceOwnership()` to API contract. Documented as EVM-specific extension not in unified interface.
- [x] CHK-A02 — **`renounceDefaultAdmin` transaction assembly.** Resolved: there is no standalone `renounceDefaultAdmin()` in OZ v5. Admin renounce is achieved through `beginDefaultAdminTransfer(address(0))` + `acceptDefaultAdminTransfer()`. Updated data-model state transitions and added edge case documentation in spec.
- [x] CHK-A03 — **Error taxonomy.** Added FR-024 defining `ConfigurationInvalid` and `OperationFailed` error classes (matching Stellar). Added error documentation block to API contract.
- [x] CHK-A04 — **Timeout and retry policy.** Added NFR-003: explicitly deferred — timeouts inherited from viem defaults and `fetch` defaults, matching Stellar adapter's approach.
- [x] CHK-A05 — **`getAdminAccount` helper.** Resolved: Stellar's `getAdminAccount` is a convenience helper NOT part of the unified `AccessControlService` interface. EVM provides the same information via `getAdminInfo()`. Intentionally excluded — not a parity gap.
- [x] CHK-A06 — **`DEFAULT_ADMIN_ROLE` auto-inclusion.** Added FR-026: system MUST NOT auto-include `DEFAULT_ADMIN_ROLE`. Consumers provide it explicitly or rely on indexer discovery. Matches Stellar behavior.
- [x] CHK-A07 — **Network identifier format for indexer queries.** Added FR-027: the `network` filter value MUST match `networkConfig.id` (kebab-case, e.g., `ethereum-mainnet`).
- [x] CHK-A08 — **Lazy vs eager service initialization.** Added NFR-004: lazy initialization on first `getAccessControlService()` call. Updated quickstart Step 9 with explicit guidance.
- [x] CHK-A09 — **`renounceRole` caller constraint.** Updated US-6 scenario 3 with note: `renounceRole(role, account)` requires caller === account, enforced on-chain. Updated FR-011 with the same note.

## B — Requirement Clarity

- [x] CHK-B01 — **`expirationBlock` semantics for `AdminInfo`.** Updated data-model §4 with bold semantic note: `expirationBlock` stores a UNIX timestamp in seconds (NOT a block number) for EVM. Documented Stellar vs EVM divergence ("must accept BEFORE" vs "can accept AFTER"). Updated research §R5 with matching note. Added clarification Q&A in spec.
- [x] CHK-B02 — **Graceful degradation behavior.** Expanded FR-017 with per-method degradation specification: `getCapabilities` → `supportsHistory: false`, `getOwnership` → on-chain only, `getHistory` → empty result, etc. Seven specific behaviors defined.
- [x] CHK-B03 — **"1 block of latency" in SC-003.** Updated SC-003: changed to "results consistent with on-chain state as of the latest block available from the RPC endpoint. Freshness depends on the RPC node's sync status." Removed quantified block count.
- [x] CHK-B04 — **`NO_EXPIRATION` sentinel transition.** Added clarification Q&A in spec: write code targeting `undefined`, use `0` with `// TODO` comment only if PR-1 not merged. Tests assert against `undefined`. Updated data-model Constants table with implementation guidance.
- [x] CHK-B05 — **Assemble vs execute boundary.** Updated FR-009/009a/010/010a/011 language: "assemble transaction data and delegate execution [...] returning an `OperationResult`." The two-step flow (assemble + callback) is now explicit.
- [x] CHK-B06 — **Known vs discovered role IDs merge semantics.** Added clarification Q&A in spec: union with deduplication, matching Stellar adapter behavior. `getCurrentRoles()` uses the union of known + discovered IDs.

## C — Requirement Consistency

- [x] CHK-C01 — **FR list vs API contract methods.** Verified: FR-010 text explicitly lists `cancelDefaultAdminTransfer`. FR-010a covers delay operations. All API contract methods have corresponding FRs. FR-025 documents the unified interface (13 methods) plus EVM-specific extensions. Consistent.
- [x] CHK-C02 — **Data model state transitions vs FRs.** Fixed: ownership transitions now have FR-009a for `renounceOwnership`. Admin `renounceDefaultAdmin()` transition replaced with the actual two-step mechanism via `beginDefaultAdminTransfer(address(0))`. Data model and FRs are now aligned.
- [x] CHK-C03 — **`ADMIN_RENOUNCED` event mapping.** Fixed: updated research §R6 mapping table to include `ADMIN_RENOUNCED` → `ADMIN_RENOUNCED` (exists in both EVM and Stellar indexers). Also added the full 13-event mapping (was previously missing `ADMIN_TRANSFER_INITIATED`, `ADMIN_TRANSFER_COMPLETED`, `ADMIN_RENOUNCED`).
- [x] CHK-C04 — **`AccessSnapshot` schema.** Confirmed: unified `AccessSnapshot` has `roles` + `ownership` only — no `adminInfo`. Updated data-model §8 with note documenting the limitation and forward reference to future types enhancement. Updated US-8 scenario 1 to match. Consistent with Stellar.
- [x] CHK-C05 — **Quickstart Phase 0 vs spec Pre-Requisite notation.** Updated quickstart Step 0a: added inline comments to TypeScript snippets matching spec's `number | undefined` notation. Both artifacts now use consistent syntax.

## D — Cross-Repo Alignment

- [x] CHK-D01 — **PR-1 backward compatibility with Stellar adapter.** Verified: widening `number` to `number | undefined` is non-breaking in TypeScript. Stellar adapter continues to pass `number` — no code changes required. Added explicit note in quickstart Step 0a.
- [x] CHK-D02 — **PR-2 Role Manager impact.** CONFIRMED RISK and documented: Role Manager uses `Record<HistoryChangeType, RoleChangeAction>` which requires exhaustive keys. Added impact note to spec PR-2 section. Added quickstart Step 0d for updating the Role Manager mapping. Added downstream impact note in research §R6.
- [x] CHK-D03 — **Indexer GraphQL schema alignment.** Verified: all fields (`newAdmin: String`, `acceptSchedule: BigInt`, `newDelay: BigInt`, `effectSchedule: BigInt`) match the actual schema at `access-control-indexers/packages/schema/schema.graphql`. Field names, types, and nullability are consistent with query contracts.
- [x] CHK-D04 — **Indexer event type enum values.** Verified: `access-control-indexers/packages/common/src/types.ts` uses `SCREAMING_SNAKE_CASE` enum values (e.g., `ROLE_GRANTED = 'ROLE_GRANTED'`). Research §R6 mapping table uses matching string values. Updated table to include all 13 event types.
- [x] CHK-D05 — **`accessControlIndexerUrl` naming convention.** Documented: Stellar uses generic `indexerUri` from `BaseNetworkConfig`. EVM uses feature-specific `accessControlIndexerUrl` because EVM networks may have multiple independent indexers. Added naming rationale to spec PR-3 section.
- [x] CHK-D06 — **viem version alignment.** Verified: `adapter-evm-core/package.json` specifies `^2.33.3`, matching plan §Technical Context exactly.
- [x] CHK-D07 — **Types update sequencing.** Clarified in spec clarifications: implementation starts with workarounds immediately (targeting `undefined` with `0` fallback), PRs to openzeppelin-ui developed in parallel, workarounds removed once new types version is consumed. Updated plan §Pre-Req sequencing note.
- [x] CHK-D08 — **Changeset strategy.** Updated quickstart §Post-Implementation Cleanup to specify: separate changesets for `adapter-evm-core` (minor — new feature) and `adapter-evm` (minor — new feature).

## E — API Parity (EVM vs Stellar)

- [x] CHK-E01 — **Full method list parity.** Documented in FR-025: unified `AccessControlService` interface defines 13 methods (9 required, 4 optional) — all implemented by both adapters. Stellar adds `getAdminAccount` (convenience helper). EVM adds `renounceOwnership`, `renounceRole`, `cancelAdminTransfer`, `changeAdminDelay`, `rollbackAdminDelay`. Both add `registerContract`, `addKnownRoleIds`, `discoverKnownRoleIds`, `dispose`. Deltas are documented in API contract header comment.
- [x] CHK-E02 — **Return types match.** Verified: all shared methods use types from `@openzeppelin/ui-types` (`OwnershipInfo`, `AdminInfo`, `RoleAssignment[]`, `EnrichedRoleAssignment[]`, `AccessControlCapabilities`, `PaginatedHistoryResult`, `AccessSnapshot`, `OperationResult`). No EVM-specific wrapper types.
- [x] CHK-E03 — **`HistoryQueryOptions` filter support.** Verified: indexer GraphQL queries support filter by `network`, `contract`, `role`, `account`, `eventType`, `timestamp` range, with cursor-based pagination. Matches Stellar indexer client's filter support. Consistent with FR-012.
- [x] CHK-E04 — **Error semantics parity.** Documented in FR-024: `ConfigurationInvalid` for validation, `OperationFailed` for execution failures. Same classes as Stellar (both from `@openzeppelin/ui-types`). Error documentation added to API contract.
- [x] CHK-E05 — **`dispose()` cleanup parity.** Clarified: Stellar `dispose()` calls `indexerClient.dispose()` only — does NOT clear the `contractContexts` Map. EVM `dispose()` clears both the Map and any indexer client resources. This is a minor enhancement over Stellar, not a parity issue.
- [x] CHK-E06 — **`exportSnapshot` structure parity.** Confirmed: `AccessSnapshot` has `roles` + `ownership` only — no `adminInfo`. Both Stellar and EVM follow the same structure. Documented as known limitation in data-model §8 and US-8 scenario 1.
- [x] CHK-E07 — **EVM-only methods don't break unified interface.** Confirmed: EVM-specific methods are additive extensions beyond the 13-method unified interface. `EvmAccessControlService extends AccessControlService`. Documented in API contract header. Role Manager can call extensions only when `capabilities` flags indicate support (e.g., `hasOwnable` for `renounceOwnership`).

## F — Scenario & Edge Case Coverage

- [x] CHK-F01 — **Calling admin ops without `hasTwoStepAdmin` capability.** Added US-5 acceptance scenario 6: calling admin operations on a contract without `hasTwoStepAdmin` throws `ConfigurationInvalid` before any on-chain interaction. Covered by FR-024 guard requirement.
- [x] CHK-F02 — **`getCurrentRoles` with zero data.** Added US-6 acceptance scenario 5: with no known role IDs, no indexer, and no enumeration support, returns an empty array.
- [x] CHK-F03 — **Partial enrichment failure.** Added US-3 acceptance scenario 6: on-chain succeeds but indexer enrichment fails → returns on-chain data without enrichment, logs a warning. Consistent with Stellar's graceful degradation.
- [x] CHK-F04 — **Both Ownable2Step and AccessControlDefaultAdminRules.** Added US-2 acceptance scenario 6: both capabilities detected and exposed independently — `getOwnership()` and `getAdminInfo()` return separate state objects.
- [x] CHK-F05 — **Proxy contracts.** Added edge case note: ABI-based detection is the defined boundary for v1. Proxy ABI mismatches are explicitly out of scope.

## G — Non-Functional Requirements

- [x] CHK-G01 — **Logging verbosity levels.** Added NFR-001: mirror Stellar adapter patterns — `info` for operations, `debug` for details, `warn` for degradation, `error` for failures.
- [x] CHK-G02 — **Concurrency safety.** Added NFR-002: single-consumer per instance, concurrent reads for different contracts are safe, concurrent writes to same contract not guarded (last write wins). Matches Stellar.
- [x] CHK-G03 — **Bundle size impact.** Acknowledged: no specific size budget for v1. Monitor during implementation. Explicitly deferred.

---

## Summary

| Category | Items | Status |
|----------|-------|--------|
| A — Completeness | 9 | All addressed |
| B — Clarity | 6 | All addressed |
| C — Consistency | 5 | All addressed |
| D — Cross-Repo | 8 | All addressed (D02 = confirmed risk, mitigated) |
| E — API Parity | 7 | All addressed |
| F — Scenarios | 5 | All addressed |
| G — Non-Functional | 3 | All addressed (G03 = deferred by design) |
| **Total** | **43** | **43/43 addressed** |

### Files Modified

| File | Changes |
|------|---------|
| `spec.md` | Added FR-009a, FR-024–FR-027, NFR-001–NFR-004. Updated FR-009/010/010a/011/017. Updated SC-003. Added US scenarios (US-2§6, US-3§6, US-4§5, US-5§6, US-6§3 note, US-6§5, US-8§1 note, US-8§3). Added edge cases (proxy, admin renounce mechanism). Added 4 clarification Q&As. Added PR-2 Role Manager impact note. Added PR-3 naming rationale. |
| `data-model.md` | Updated §4 expirationBlock semantic note. Fixed admin state transitions (removed standalone renounceDefaultAdmin, added two-step renounce via address(0)). Updated §8 AccessSnapshot limitation note. Updated Constants §NO_EXPIRATION with implementation guidance. |
| `research.md` | Updated §R5 expirationBlock decision and semantic note. Updated §R6 mapping table (13 events, added ADMIN_RENOUNCED + ADMIN_TRANSFER_INITIATED/COMPLETED). Added PR-2 downstream impact note. |
| `contracts/access-control-service.ts` | Added `renounceOwnership()` method. Added EVM-specific extensions documentation header. Added error classes documentation block. |
| `quickstart.md` | Added `assembleRenounceOwnershipAction` to Step 5. Fixed Step 0a TypeScript notation consistency. Updated Step 9 with lazy initialization guidance. Added Step 0d for Role Manager mapping update. Renumbered Step 0d→0e for publish/consume. |
