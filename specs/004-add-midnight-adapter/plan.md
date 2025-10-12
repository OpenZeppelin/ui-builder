# Implementation Plan: Add Midnight Adapter

**Branch**: `004-add-midnight-adapter` | **Date**: 2025-10-11 | **Spec**: /Users/ghost/dev/repos/OpenZeppelin/contracts-ui-builder/specs/004-add-midnight-adapter/spec.md
**Input**: Feature specification from `/specs/004-add-midnight-adapter/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.cursor/commands/speckit.plan.md` for the execution workflow.

## Summary

Mirror EVM and Stellar adapter patterns for Midnight, reusing existing adapter architecture, naming, and directory conventions. v1 focuses on wallet-only signing, contract definition ingestion (persistence + load), automatic simple view rendering via `ContractStateWidget`, write function form customization with execution through the wallet, and export parity so generated apps run out of the box. For contract loading, interactions, serialization, transaction building, and execution, follow the established patterns from the Midnight Deploy CLI to avoid re-inventing logic, adapting them to the adapter interface. Deliver work in testable phases.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict), React in UI packages, Tailwind + shadcn/ui.  
**Primary Dependencies**: `@openzeppelin/ui-builder-types`, `@openzeppelin/ui-builder-utils`, `@openzeppelin/ui-builder-react-core`, adapter packages (EVM/Stellar as references), `packages/adapter-midnight` (wallet implemented), Midnight libraries for patterns (`@midnight-ntwrk/*`) as conceptual templates (no direct coupling in chain-agnostic layers).  
**Storage**: Builder storage services for persisting contract artifacts (per existing storage patterns in the monorepo).  
**Testing**: Vitest for unit/integration; add missing unit tests for wallet adapter surface and contract ingestion logic.  
**Target Platform**: Web app (Builder/Renderer) and exported React app.  
**Project Type**: Monorepo with adapter packages.  
**Performance Goals**: Match Success Criteria in spec (connect ≤30s, view ≤5s, load ≤10s p90).  
**Constraints**: Chain-agnostic core; chain-specific code stays in `packages/adapter-midnight`; reuse-first; v1 wallet-only execution; no external explorer dependency.  
**Scale/Scope**: Parity with EVM/Stellar for flows included in spec; defer advanced view params and relayer to later phases.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Chain-Agnostic Core: PASS — all Midnight logic confined to `packages/adapter-midnight`; Builder/Renderer remain agnostic.
- Type Safety & Linting: PASS — strict TS, no `any` without justification, use `logger`.
- Tooling/Packaging/Releases: PASS — pnpm workspace, tsup/tsc outputs, changesets for public packages.
- UI/Design System: PASS — shadcn/ui and Tailwind rules; export respects design system.
- Testing/Docs/Exports: PASS — add missing unit tests; exported apps must run with Midnight.
- TDD for Business Logic: PASS — contract ingestion/formatting follows TDD.
- Reuse-First: PASS — mirror EVM/Stellar adapter structure; leverage Midnight Deploy CLI patterns for loading/serialization/transaction building & execution (excluding deployment in v1).

## Project Structure

### Documentation (this feature)

```
specs/004-add-midnight-adapter/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (adapter integration and export manifest)
└── tasks.md             # Phase 2 (via /speckit.tasks)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
packages/
├── adapter-evm/                 # Reference structure (mirrored)
├── adapter-stellar/             # Reference structure (mirrored)
└── adapter-midnight/
    └── src/
        ├── adapter.ts
        ├── wallet/             # Completed; unit tests to add
        │   ├── components/
        │   ├── context/
        │   ├── hooks/
        │   └── implementation/
        ├── configuration/      # RPC validation/test helpers
        ├── networks/           # mainnet.ts, testnet.ts (mirror evm/stellar)
        ├── mapping/            # type-mapper.ts, field-generator.ts (mirror)
        ├── transaction/        # sender.ts, eoa.ts (wallet-only v1)
        ├── utils/              # parse/validate artifacts, managers
        └── types/

packages/renderer/
└── src/components/ContractStateWidget/ContractStateWidget.tsx  # auto simple views

packages/builder/
└── src/core/ecosystemManager.ts  # adapter instantiation (already supports midnight)

tests/
└── adapter-midnight/                          # Mirror EVM/Stellar test layout
    ├── src/__tests__/adapter-parsing.test.ts  # Parity with EVM's adapter tests
    ├── src/__tests__/wallet-connect.test.ts   # Wallet status/connectivity tests
    ├── src/__tests__/timeouts.test.ts         # Behavioral timeouts if applicable
    ├── configuration/__tests__/rpc.test.ts    # RPC validation/tests
    ├── configuration/__tests__/explorer.test.ts
    ├── mapping/__tests__/type-mapper.test.ts  # Field mapping parity
    ├── mapping/__tests__/field-generator.test.ts
    ├── utils/__tests__/artifacts.test.ts      # Artifact validation
    ├── types/__tests__/artifacts.test.ts
    ├── wallet/utils/__tests__/uiKitService.test.ts
    ├── transaction/components/__tests__/useRelayerOptions.test.ts (scaffold only)
    # Note: Names mirror EVM/Stellar; content scoped to wallet-only v1 where needed
```

**Structure Decision**: Adopt the EVM/Stellar adapter structure verbatim for Midnight (wallet/, configuration/, networks/, mapping/, transaction/, utils/, types/). Keep all chain-specific code inside `packages/adapter-midnight`. Reuse Renderer’s `ContractStateWidget` for simple views. Export uses existing export module conventions to include Midnight adapter packages.

**Dependency Sync Policy (v1)**: Adapter dependency declarations in `packages/adapter-midnight/src/config.ts` MUST mirror the export manifest for v1 functionality. Placeholder or future dependencies are allowed in the adapter config only if clearly commented as inactive for v1 and excluded from export manifests.

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
