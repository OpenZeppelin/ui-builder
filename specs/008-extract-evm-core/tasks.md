# Tasks: Extract EVM Core Package

**Input**: Design documents from `/specs/008-extract-evm-core/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/module-exports.ts ✅

**Tests**: Unit tests are MIGRATED from adapter-evm (not written new). Per FR-010, tests move with their modules.

**Organization**: Tasks grouped by implementation phase aligned with user stories for independent validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

## Path Conventions

- **Core package**: `packages/adapter-evm-core/`
- **EVM adapter**: `packages/adapter-evm/`
- **Workspace root**: Repository root for config files

---

## Phase 1: Setup (Package Initialization)

**Purpose**: Create adapter-evm-core package with all configuration files

- [X] T001 Create directory `packages/adapter-evm-core/` with empty `src/index.ts`
- [X] T002 Create `packages/adapter-evm-core/package.json` with `"private": true`, dependencies per research.md
- [X] T003 [P] Create `packages/adapter-evm-core/tsconfig.json` with `"strict": true` extending workspace base
- [X] T004 [P] Create `packages/adapter-evm-core/tsup.config.ts` with ESM+CJS output, entry: [index.ts, vite-config.ts]
- [X] T005 [P] Create `packages/adapter-evm-core/vitest.config.ts` with workspace-compatible config
- [X] T006 [P] Create `packages/adapter-evm-core/src/vite-config.ts` with `getEvmCoreViteConfig()` returning minimal config

**Checkpoint**: ✅ Package compiles with `pnpm --filter @openzeppelin/ui-builder-adapter-evm-core build`

---

## Phase 2: Foundational (Directory Structure)

**Purpose**: Create all module directories and index files (blocking for module extraction)

**⚠️ CRITICAL**: All user story work depends on this structure existing

- [X] T007 Create `packages/adapter-evm-core/src/abi/index.ts` with placeholder exports
- [X] T008 [P] Create `packages/adapter-evm-core/src/mapping/index.ts` with placeholder exports
- [X] T009 [P] Create `packages/adapter-evm-core/src/transform/index.ts` with placeholder exports
- [X] T010 [P] Create `packages/adapter-evm-core/src/query/index.ts` with placeholder exports
- [X] T011 [P] Create `packages/adapter-evm-core/src/transaction/index.ts` with placeholder exports
- [X] T012 [P] Create `packages/adapter-evm-core/src/configuration/index.ts` with placeholder exports
- [X] T013 [P] Create `packages/adapter-evm-core/src/proxy/index.ts` with placeholder export
- [X] T014 [P] Create `packages/adapter-evm-core/src/validation/index.ts` with placeholder exports
- [X] T015 [P] Create `packages/adapter-evm-core/src/utils/index.ts` with placeholder exports
- [X] T016 [P] Create `packages/adapter-evm-core/src/types/index.ts` with placeholder exports
- [X] T017 Update `packages/adapter-evm-core/src/index.ts` to re-export all modules per contracts/module-exports.ts

**Checkpoint**: ✅ Build succeeds, all exports compile (placeholder values)

---

## Phase 3: User Story 1 - Adapter Developer Creates EVM-Compatible Adapter (Priority: P1) 🎯 MVP

**Goal**: Extract all core modules from adapter-evm to adapter-evm-core, enabling new adapter creation

**Independent Test**: Build adapter-evm-core successfully; all migrated tests pass

### ABI Module Extraction

- [ ] T018 [US1] Move `packages/adapter-evm/src/abi/loader.ts` → `packages/adapter-evm-core/src/abi/loader.ts`
- [ ] T019 [P] [US1] Move `packages/adapter-evm/src/abi/transformer.ts` → `packages/adapter-evm-core/src/abi/transformer.ts`
- [ ] T020 [P] [US1] Move `packages/adapter-evm/src/abi/etherscan.ts` → `packages/adapter-evm-core/src/abi/etherscan.ts`
- [ ] T021 [P] [US1] Move `packages/adapter-evm/src/abi/etherscan-v2.ts` → `packages/adapter-evm-core/src/abi/etherscan-v2.ts`
- [ ] T022 [P] [US1] Move `packages/adapter-evm/src/abi/sourcify.ts` → `packages/adapter-evm-core/src/abi/sourcify.ts`
- [ ] T023 [P] [US1] Move `packages/adapter-evm/src/abi/comparison.ts` → `packages/adapter-evm-core/src/abi/comparison.ts`
- [ ] T024 [P] [US1] Move `packages/adapter-evm/src/abi/types.ts` → `packages/adapter-evm-core/src/abi/types.ts`
- [ ] T025 [US1] Update `packages/adapter-evm-core/src/abi/index.ts` with real exports from moved files
- [ ] T026 [US1] Move `packages/adapter-evm/src/abi/__tests__/` → `packages/adapter-evm-core/src/abi/__tests__/`
- [ ] T027 [US1] Update imports in all moved abi files to use relative paths, logger from ui-utils

### Mapping Module Extraction

- [ ] T028 [P] [US1] Move `packages/adapter-evm/src/mapping/type-mapper.ts` → `packages/adapter-evm-core/src/mapping/type-mapper.ts`
- [ ] T029 [P] [US1] Move `packages/adapter-evm/src/mapping/field-generator.ts` → `packages/adapter-evm-core/src/mapping/field-generator.ts`
- [ ] T030 [P] [US1] Move `packages/adapter-evm/src/mapping/constants.ts` → `packages/adapter-evm-core/src/mapping/constants.ts`
- [ ] T031 [US1] Update `packages/adapter-evm-core/src/mapping/index.ts` with real exports
- [ ] T032 [US1] Move `packages/adapter-evm/src/mapping/__tests__/` → `packages/adapter-evm-core/src/mapping/__tests__/`

### Transform Module Extraction

> **Note**: Transform module has no unit tests in adapter-evm (tested via integration tests in adapter-evm/__tests__/)

- [ ] T033 [P] [US1] Move `packages/adapter-evm/src/transform/input-parser.ts` → `packages/adapter-evm-core/src/transform/input-parser.ts`
- [ ] T034 [P] [US1] Move `packages/adapter-evm/src/transform/output-formatter.ts` → `packages/adapter-evm-core/src/transform/output-formatter.ts`
- [ ] T035 [US1] Update `packages/adapter-evm-core/src/transform/index.ts` with real exports

### Query Module Extraction

> **Note**: Query module has no unit tests in adapter-evm (tested via integration tests in adapter-evm/__tests__/)

- [ ] T036 [P] [US1] Move `packages/adapter-evm/src/query/handler.ts` → `packages/adapter-evm-core/src/query/handler.ts`
- [ ] T037 [P] [US1] Move `packages/adapter-evm/src/query/view-checker.ts` → `packages/adapter-evm-core/src/query/view-checker.ts`
- [ ] T038 [US1] Update `packages/adapter-evm-core/src/query/index.ts` with real exports

### Transaction Module Extraction (Interface Only)

> **Note**: Transaction formatter has no unit tests (UI components tested separately in adapter-evm)

- [ ] T039 [P] [US1] Move `packages/adapter-evm/src/transaction/formatter.ts` → `packages/adapter-evm-core/src/transaction/formatter.ts`
- [ ] T040 [P] [US1] Create `packages/adapter-evm-core/src/transaction/execution-strategy.ts` with ExecutionStrategy interface (extracted from adapter-evm)
- [ ] T041 [US1] Update `packages/adapter-evm-core/src/transaction/index.ts` with real exports

### Configuration Module Extraction

- [ ] T042 [P] [US1] Move `packages/adapter-evm/src/configuration/rpc.ts` → `packages/adapter-evm-core/src/configuration/rpc.ts`
- [ ] T043 [P] [US1] Move `packages/adapter-evm/src/configuration/explorer.ts` → `packages/adapter-evm-core/src/configuration/explorer.ts`
- [ ] T044 [US1] Update `packages/adapter-evm-core/src/configuration/index.ts` with real exports
- [ ] T045 [US1] Move `packages/adapter-evm/src/configuration/__tests__/` → `packages/adapter-evm-core/src/configuration/__tests__/`

### Proxy Module Extraction

> **Note**: Proxy detection has no unit tests (async RPC-dependent, tested via integration)

- [ ] T046 [US1] Move `packages/adapter-evm/src/proxy/detection.ts` → `packages/adapter-evm-core/src/proxy/detection.ts`
- [ ] T047 [US1] Update `packages/adapter-evm-core/src/proxy/index.ts` with real export

### Validation Module Extraction

> **Note**: Validation functions tested via configuration/__tests__/ (address validation is part of config tests)

- [ ] T048 [P] [US1] Move `packages/adapter-evm/src/validation/eoa.ts` → `packages/adapter-evm-core/src/validation/eoa.ts`
- [ ] T049 [P] [US1] Move `packages/adapter-evm/src/validation/relayer.ts` → `packages/adapter-evm-core/src/validation/relayer.ts`
- [ ] T050 [US1] Update `packages/adapter-evm-core/src/validation/index.ts` with real exports (including isValidEvmAddress)

### Utils Module Extraction

- [ ] T051 [P] [US1] Move `packages/adapter-evm/src/utils/json.ts` → `packages/adapter-evm-core/src/utils/json.ts`
- [ ] T052 [P] [US1] Move `packages/adapter-evm/src/utils/formatting.ts` → `packages/adapter-evm-core/src/utils/formatting.ts`
- [ ] T053 [P] [US1] Move `packages/adapter-evm/src/utils/gas.ts` → `packages/adapter-evm-core/src/utils/gas.ts`
- [ ] T054 [P] [US1] Move `packages/adapter-evm/src/utils/validation.ts` → `packages/adapter-evm-core/src/utils/validation.ts`
- [ ] T055 [P] [US1] Move `packages/adapter-evm/src/utils/artifacts.ts` → `packages/adapter-evm-core/src/utils/artifacts.ts`
- [ ] T056 [US1] Update `packages/adapter-evm-core/src/utils/index.ts` with real exports
- [ ] T057 [US1] Move `packages/adapter-evm/src/utils/__tests__/` → `packages/adapter-evm-core/src/utils/__tests__/`

### Types Module Extraction

- [ ] T058 [P] [US1] Move `packages/adapter-evm/src/types/artifacts.ts` → `packages/adapter-evm-core/src/types/artifacts.ts`
- [ ] T059 [P] [US1] Move `packages/adapter-evm/src/types/providers.ts` → `packages/adapter-evm-core/src/types/providers.ts`
- [ ] T060 [US1] Update `packages/adapter-evm-core/src/types/index.ts` with real exports
- [ ] T061 [US1] Move `packages/adapter-evm/src/types/__tests__/` → `packages/adapter-evm-core/src/types/__tests__/`

### Core Package Finalization

- [ ] T062 [US1] Update `packages/adapter-evm-core/src/index.ts` to export all modules per contracts/module-exports.ts
- [ ] T063 [US1] Replace any `console` usage with `logger` from `@openzeppelin/ui-utils` in all core files
- [ ] T064 [US1] Verify all core modules accept configuration as parameters (no global state)
- [ ] T065 [US1] Verify all core modules propagate errors with descriptive messages per FR-012 (no swallowing errors)
- [ ] T066 [US1] Run `pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test` - all migrated tests must pass

**Checkpoint**: adapter-evm-core builds and all migrated tests pass. Core modules are usable by new adapters.

---

## Phase 4: User Story 2 - EVM Adapter Continues Working Unchanged (Priority: P1)

**Goal**: Refactor adapter-evm to import from adapter-evm-core; public API unchanged

**Independent Test**: Run full adapter-evm test suite; all tests pass without modification

### Dependency Configuration

- [ ] T067 [US2] Add `"@openzeppelin/ui-builder-adapter-evm-core": "workspace:*"` to `packages/adapter-evm/package.json`
- [ ] T068 [US2] Update `packages/adapter-evm/tsup.config.ts` to add `noExternal: ['@openzeppelin/ui-builder-adapter-evm-core']`

### Adapter Refactoring

- [ ] T069 [US2] Update `packages/adapter-evm/src/adapter.ts` to import from `@openzeppelin/ui-builder-adapter-evm-core`
- [ ] T070 [US2] Remove now-empty module directories from `packages/adapter-evm/src/` (keep stubs if needed for re-exports)
- [ ] T071 [US2] Verify `packages/adapter-evm/src/index.ts` public API unchanged (same exports as before)
- [ ] T072 [US2] Update any remaining internal imports in adapter-evm to use core package
- [ ] T073 [US2] Run `pnpm --filter @openzeppelin/ui-builder-adapter-evm test` - ALL existing tests must pass

**Checkpoint**: adapter-evm builds and all 168+ tests pass. Public API identical to before extraction.

---

## Phase 5: User Story 3 - Internal Package Not Published to npm (Priority: P2)

**Goal**: Verify adapter-evm-core is bundled into consuming adapters, not published

**Independent Test**: Build adapter-evm; verify dist contains inlined core code, no external core import

- [ ] T074 [US3] Verify `packages/adapter-evm-core/package.json` has `"private": true`
- [ ] T075 [US3] Build adapter-evm with `pnpm --filter @openzeppelin/ui-builder-adapter-evm build`
- [ ] T076 [US3] Inspect `packages/adapter-evm/dist/index.js` - verify no external imports from `@openzeppelin/ui-builder-adapter-evm-core`
- [ ] T077 [US3] Verify adapter-evm dist contains inlined core module code (search for core function names)
- [ ] T078 [US3] Measure bundle size: adapter-evm dist size must increase by <5% (SC-004)

**Checkpoint**: Core package bundled into adapter-evm, not exposed as external dependency

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T079 Run full workspace build: `pnpm build`
- [ ] T080 Run full workspace tests: `pnpm test` - verify total tests ≥168 (SC-001)
- [ ] T081 [P] Verify TypeScript strict mode: no `any` types in adapter-evm-core
- [ ] T082 [P] Verify logging: grep for `console.` in adapter-evm-core - should be 0 results
- [ ] T083 Test with builder app: load contract, query view function, verify behavior unchanged
- [ ] T084 [P] Update quickstart.md with any implementation details discovered
- [ ] T085 Clean up any unused imports or dead code in both packages
- [ ] T086 [P] Create minimal test adapter in `specs/008-extract-evm-core/validation/` demonstrating <50% code reuse (SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - core extraction
- **US2 (Phase 4)**: Depends on US1 - adapter refactoring
- **US3 (Phase 5)**: Depends on US2 - bundling validation
- **Polish (Phase 6)**: Depends on US3 - final checks

### User Story Dependencies

```
Setup → Foundational → US1 (extract core) → US2 (refactor adapter) → US3 (validate bundling) → Polish
```

Note: US1 and US2 are sequential because US2 requires the extracted modules to exist.

### Within Phase 3 (US1): Module Extraction Order

Modules can be extracted in parallel groups:

1. **Types first** (T058-T061): No dependencies on other modules
2. **Utils** (T051-T057): May depend on types
3. **All other modules** (T018-T050): Can be parallelized once types/utils done

### Parallel Opportunities

```text
# Phase 1 parallel tasks (T003-T006)
T003 tsconfig.json
T004 tsup.config.ts
T005 vitest.config.ts
T006 vite-config.ts

# Phase 2 parallel tasks (T008-T016)
All module index.ts files can be created in parallel

# Phase 3 (US1) - within each module, files can be moved in parallel
# Example: ABI module (T018-T024 all [P])
T018 loader.ts
T019 transformer.ts
T020 etherscan.ts
T021 etherscan-v2.ts
T022 sourcify.ts
T023 comparison.ts
T024 types.ts

# Phase 6 parallel tasks (T081-T082, T084, T086)
T081 TypeScript strict check
T082 console.log check
T084 quickstart.md update
T086 SC-002 validation adapter
```

---

## Implementation Strategy

### MVP First (US1 Complete)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T017)
3. Complete Phase 3: US1 - Extract all modules (T018-T066)
4. **STOP and VALIDATE**: `pnpm --filter @openzeppelin/ui-builder-adapter-evm-core test`
5. Core package is usable by new adapters at this point

### Full Feature (US1 + US2 + US3)

1. MVP complete (above)
2. Complete Phase 4: US2 - Refactor adapter-evm (T067-T073)
3. **VALIDATE**: All adapter-evm tests pass
4. Complete Phase 5: US3 - Bundling validation (T074-T078)
5. Complete Phase 6: Polish (T079-T086)

### Recommended Approach

Execute sequentially within phases, parallelize marked tasks:

```bash
# Phase 1
T001 → T002 → [T003, T004, T005, T006 in parallel]

# Phase 2
T007 → [T008-T016 in parallel] → T017

# Phase 3 - Extract by module group
# Types first
[T058, T059 in parallel] → T060 → T061

# Then all other modules in parallel
[ABI: T018-T027] || [Mapping: T028-T032] || [Transform: T033-T035] || ...

# Finalize
T062 → T063 → T064 → T065 → T066

# Phase 4-6 sequential with parallel where marked
```

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Setup | T001-T006 | 4 tasks parallel |
| Foundational | T007-T017 | 10 tasks parallel |
| US1 (Core Extract) | T018-T066 | High parallelism per module |
| US2 (Refactor) | T067-T073 | Sequential |
| US3 (Bundling) | T074-T078 | Sequential |
| Polish | T079-T086 | 5 tasks parallel |
| **Total** | **86 tasks** | |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Test migration: tests move WITH modules (not written new)
- Commit after each module group extraction
- Run tests frequently to catch regressions early
- SC-001: Total tests (core + adapter) must ≥168
- SC-004: Bundle size increase <5%
