# Implementation Self-Review Checklist: Extract EVM Core Package

**Purpose**: Author self-review before/during implementation  
**Created**: 2026-01-09  
**Reviewed**: 2026-01-09 ✅  
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)  
**Depth**: Lightweight | **Audience**: Author

---

## Architecture & Module Boundaries

- [x] CHK001 - Are all modules to extract explicitly listed with clear in/out decisions? [Completeness, research.md]
- [x] CHK002 - Is the boundary between core (stateless logic) and adapter (orchestration/UI) clearly defined? [Clarity, Spec §FR-005]
- [x] CHK003 - Are dependency directions specified (core → ui-types/ui-utils, never core → adapter-evm)? [Clarity, Plan §Structure]
- [x] CHK004 - Is the "no global state" requirement clear for all core modules? [Clarity, Spec §FR-006]
- [x] CHK005 - Are override/extension patterns documented for consuming adapters? [Completeness, Spec §Edge Cases]

## API Surface Quality

- [x] CHK006 - Are all exported functions/types listed in contracts/module-exports.ts? [Completeness, contracts/]
- [x] CHK007 - Do function signatures specify all required parameters (no implicit dependencies)? [Clarity, Spec §FR-004]
- [x] CHK008 - Are return types explicitly defined for all exported functions? [Completeness, contracts/]
- [x] CHK009 - Is the re-export strategy (viem types, ui-types) documented? [Clarity, data-model.md]
- [x] CHK010 - Are async vs sync functions clearly distinguished? [Clarity, data-model.md §Async vs Sync]

## Build & Integration

- [x] CHK011 - Is `"private": true` requirement for package.json specified? [Completeness, Spec §FR-001]
- [x] CHK012 - Is tsup `noExternal` configuration for bundling documented? [Clarity, Plan §Structure]
- [x] CHK013 - Are both ESM and CJS output formats specified? [Completeness, Plan §Phase 1]
- [x] CHK014 - Is the workspace dependency syntax (`workspace:*`) specified? [Clarity, Plan §Phase 3]
- [x] CHK015 - Is the bundle size constraint (<5% increase) measurable? [Measurability, Spec §SC-004]

## Test Migration

- [x] CHK016 - Is the test migration mapping (which tests move where) documented? [Completeness, research.md]
- [x] CHK017 - Is the test count validation requirement (≥168 total) specified? [Measurability, Spec §SC-001]
- [x] CHK018 - Are integration tests explicitly excluded from migration? [Clarity, research.md]
- [x] CHK019 - Is the "tests move with modules" principle clear? [Clarity, Clarifications]

## Dependencies & Assumptions

- [x] CHK020 - Is viem as direct dependency (not peer) requirement documented? [Completeness, Clarifications]
- [x] CHK021 - Are @openzeppelin/ui-types and ui-utils dependencies specified? [Completeness, Plan §Technical Context]
- [x] CHK022 - Is the assumption about wallet/UI staying in adapter-evm explicit? [Completeness, Spec §Assumptions]
- [x] CHK023 - Are devDependencies (vitest, typescript, tsup) listed? [Completeness, research.md]

## Gaps & Ambiguities (Resolved)

- [x] CHK024 - Are error handling patterns for core modules defined? [Resolved → Spec §FR-012]
- [x] CHK025 - Is logging strategy (logger from ui-utils) specified for core? [Resolved → Spec §FR-011]
- [x] CHK026 - Are TypeScript strict mode requirements documented? [Resolved → Spec §FR-013]
- [x] CHK027 - Is the vite-config.ts requirement for core package addressed? [Resolved → Spec §FR-014, Plan §Structure]

---

## Review Summary

**Status**: ✅ All 27 items verified  
**Gaps Addressed**: 4 requirements added to spec (FR-011 through FR-014)  
**Files Updated**:
- `spec.md` - Added FR-011 (logging), FR-012 (error handling), FR-013 (strict mode), FR-014 (vite-config)
- `plan.md` - Added vite-config.ts to package structure
- `data-model.md` - Added async/sync classification table

## Post-Analysis Updates (2026-01-09)

**Analysis Findings Addressed**:
- ✅ C1 (HIGH): Added T065 for FR-012 error propagation verification
- ✅ C2 (MEDIUM): Added T086 for SC-002 validation (minimal test adapter)
- ✅ U1 (MEDIUM): Documented modules without unit tests in research.md and tasks.md
- ✅ A1 (MEDIUM): Clarified SC-002 baseline in spec.md (~2,500 LOC → <1,250 LOC)
- ✅ I1 (LOW): Updated plan.md file count (~15 → ~25)

**Tasks Updated**: 84 → 86 tasks (T065 FR-012, T086 SC-002 validation)

**Ready for**: Implementation
