# Implementation Plan: Contract Definition Provider Integration + Deep Links (Chain-Agnostic)

**Branch**: `001-sourcify-integration` | **Date**: 2025-09-16 | **Spec**: /Users/ghost/dev/repos/OpenZeppelin/contracts-ui-builder/specs/001-sourcify-integration/spec.md
**Input**: Feature specification from `/specs/001-sourcify-integration/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → OK
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Clarifications resolved in spec; see Edge Cases and FRs
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → No violations; adapter‑led, chain‑agnostic preserved
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → Router selection, provider precedence patterns, deep‑link schema
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
7. Re-evaluate Constitution Check section
   → PASS; Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach and produce tasks.md
9. STOP - Ready for task execution
```

## Summary

Implement a chain‑ and adapter‑agnostic contract definition provider integration and deep‑linking system. The builder loads a contract definition from the active adapter’s primary provider and falls back per adapter precedence. Deep links are chain‑agnostic and adapter‑interpreted, with an optional `service` parameter to force provider selection. Users can set provider defaults via app config or UI. Adopt a modern, popular React routing solution and design an internal routing abstraction to keep future router swaps possible. Adapter files remain orchestrators; business logic resides in purpose‑specific modules.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: React Router (Data Router, v6+), Vite, Dexie (existing), lodash.debounce (existing)
**Storage**: Existing storage package with IndexedDB via Dexie
**Testing**: Vitest (unit/integration), existing setup
**Target Platform**: Web (Vite)
**Project Type**: Web application (builder UI)
**Performance Goals**: Responsive UX; per‑provider timeout 4s, global 10s; avoid blocking UI thread
**Constraints**: Adapter‑led, chain‑agnostic core; strict linting; no `any`; feature‑flagged rollout (`contractDefinitionProviderIntegration` default ON)
**Scale/Scope**: Multi‑adapter support; future providers can be added without core changes

- Routing: Use React Router v6+ (Data APIs). Wrap with a small internal RouterService in `@openzeppelin/contracts-ui-builder-utils` to allow future router support without touching app code. Keep adapter‑specific deep‑link parsing in adapter packages.
- Types: Introduce base common types in `@openzeppelin/contracts-ui-builder-types` for provider precedence, deep‑link schema, and router integration; extend per adapter as needed.
- Adapters: When extending `ContractAdapter` in `packages/types/src/adapters/base.ts`, update `.eslint/rules/no-extra-adapter-methods.cjs` accordingly. Keep `adapter.ts` as an orchestrator delegating to small modules.

## Constitution Check

- Chain‑agnostic core preserved; all provider logic and deep‑link schema interpretation live in adapters.
- No chain‑specific deps added to chain‑agnostic packages; RouterService abstraction is generic.
- Type safety maintained; new types live in `packages/types`.
- Lint rule honored; any new adapter methods added to base interface and lint rule updated.
- Reuse existing utils (logger, AppConfigService, debounce) and storage; no reinvention.

Result: PASS (Initial + Post‑Design)

## Project Structure

### Documentation (this feature)

```
specs/001-sourcify-integration/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/plan per command)
```

### Source Code (repository root)

```
packages/
├── builder/                # React app; integrate RouterService; chain‑agnostic
├── types/                  # New base types for providers/deep links/router abstraction
├── utils/                  # RouterService (wrapper), deep‑link utilities
├── adapter-*/              # Adapter‑specific provider precedence, deep‑link schema
└── ui/, storage/, styles/  # Existing
```

**Structure Decision**: Web application (builder UI)

## Phase 0: Outline & Research

- Router choice: React Router (v6+) over TanStack Router due to wider adoption, docs, ecosystem, and Data APIs alignment. Abstraction via RouterService keeps future swap viable.
- Provider precedence patterns: Adapter‑declared array with primary→fallback. Forced `service` overrides precedence; unsupported forces fall back to adapter default; failed forces stop with message.
- Deep‑link schema: Adapter‑declared schema for required params (network, identifier) and optional params (service). Chain‑agnostic core parses generically, delegates interpretation to adapter.

Output: research.md

## Phase 1: Design & Contracts

- Data Model (entities/relationships): ContractDefinitionProvider, ProviderPreference, DeepLinkParameters, AdapterDeepLinkSchema, RouterIntegration.
- Contracts:
  - Deep‑link parameter contract (query keys, validation, precedence)
  - Provider precedence contract (ordering, timeouts, forced service behavior)
  - Adapter base interface deltas (if any) and lint rule update
- Quickstart: Steps to configure defaults via app config/UI; examples for deep links; enabling feature flag.

Outputs: data-model.md, contracts/\*, quickstart.md

## Phase 2: Task Planning Approach

- TDD focus for non‑UI modules (utils/types/adapters). UI exempt.
- Tasks generated across: types, utils, builder integration, adapter updates, tests, docs, lint updates.

Estimated Output: 25 tasks in tasks.md

## Complexity Tracking

None.

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A)

---

_Based on Constitution v1.1.0 - See `/memory/constitution.md`_
