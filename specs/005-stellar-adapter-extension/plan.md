# Implementation Plan: Stellar Adapter Extension — Access Control

**Branch**: `005-stellar-adapter-extension` | **Date**: 2025-11-11 | **Spec**: specs/005-stellar-adapter-extension/spec.md
**Input**: Feature specification from `/specs/005-stellar-adapter-extension/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver an adapter-led Access Control capability for Stellar (Soroban) that:

- Detects contract capabilities (Ownable, AccessControl, enumerable roles, history availability)
- Reads current state (owner and role memberships) using on-chain-first strategy
- Performs role mutations (grant/revoke) and ownership transfer via prepared transactions
- Exports a current-state snapshot (ownership + role assignments)
- Optionally reads history/enumeration from a hosted indexer when configured; degrades cleanly when absent

Approach: Extend the Stellar adapter with a headless AccessControl service that implements chain-agnostic types. Prefer on-chain reads for current state; use indexer for historical/enumerable data as needed. Expose capability flags for safe UI gating. Keep all chain-specific logic within `packages/adapter-stellar`, add shared interfaces to `packages/types`, and place cross-chain helpers in `packages/utils`. No UI logic is introduced.

Support scope: Only official OpenZeppelin Stellar Access Control contracts are supported; non‑conforming/custom AC implementations are reported as unsupported. See [OpenZeppelin Stellar Access Control](https://github.com/OpenZeppelin/stellar-contracts/tree/main/packages/access).

Indexer configuration: NetworkConfig exposes optional indexer endpoints and may ship per‑network defaults (e.g., testnet/mainnet) when stable endpoints exist. Precedence: runtime override > network‑config default > derived‑from‑RPC (if a safe pattern exists) > none (on‑chain‑only fallback with `supportsHistory=false`).

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict), workspace-wide standards  
**Primary Dependencies**: UI Builder monorepo packages; optional lightweight GraphQL client for indexer access (or fetch)  
**Storage**: N/A for adapter (UI persists to IndexedDB via storage package)  
**Testing**: Vitest (unit + integration); mock RPC and mock indexer responses  
**Target Platform**: Library consumed by the Builder and future UIs (browser-first; Node-compatible builds)  
**Project Type**: Monorepo package feature (adapter-led, chain-agnostic types/utils contributions)  
**Performance Goals**: Capability + current owner/roles in ≤ 3s; snapshot in ≤ 2s; changes reflected within 30s (network dependent)  
**Constraints**: Chain-agnostic boundaries; no chain-specific deps in shared packages; no `any`; no console in source; address validation centralized  
**Scale/Scope**: Single adapter service + shared types; no backend; optional indexer configuration

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Chain-Agnostic Core, Adapter-Led Architecture: PASS
  - All access-control logic lives in `packages/adapter-stellar`.
  - New chain-agnostic interfaces added to `packages/types`; no chain-specific deps elsewhere.
- Type Safety, Linting, and Code Quality: PASS
  - Strict TS, no `any`; JSDoc on public APIs; no console in source.
- Tooling, Packaging, and Releases: PASS
  - pnpm, shared configs, Changesets for public packages.
- UI/Design System Consistency: PASS (no UI delivered in this feature).
- Testing, Documentation, and Exported Apps: PASS
  - Vitest tests for detection, reads, mutations, snapshot, and history fallback.
- TDD for Business Logic: PASS
  - Add failing tests first for service methods; implement; refactor.
- Reuse-First Development: PASS
  - Reuse `AppConfigService`, shared validators, and address validation source of truth; extend adapter interface with rule updates as required.

Re-check after Phase 1 design: PASS (no violations identified).

## Project Structure

### Documentation (this feature)

```text
specs/005-stellar-adapter-extension/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
packages/
├── adapter-stellar/
│   ├── src/
│   │   ├── services/access-control.ts
│   │   ├── indexer/indexer-client.ts
│   │   ├── feature-detection.ts
│   │   ├── onchain-reader.ts
│   │   ├── merger.ts
│   │   ├── actions.ts
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   └── configuration/network-services.ts
│   └── tests/
│       ├── access-control.spec.ts
│       ├── detection.spec.ts
│       ├── indexer-client.spec.ts
│       └── merger.spec.ts
├── types/
│   └── src/access-control.ts       # New chain-agnostic interfaces
└── utils/
    └── src/access/snapshot.ts      # Snapshot helpers (serializer/validator)
```

**Structure Decision**: Adapter-led change scoped to `packages/adapter-stellar` with shared type additions in `packages/types` and reusable helpers in `packages/utils`. No modifications to chain-agnostic renderer, builder, or UI packages beyond consuming the new interfaces.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
