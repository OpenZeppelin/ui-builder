# Tasks: Stellar SAC Support

**Input**: Design documents from `/specs/003-stellar-sac-support/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup

- [ ] T001 Ensure adapter-only scope per constitution (no chain-specific deps outside `packages/adapter-stellar`)
- [ ] T002 Add dependencies in `packages/adapter-stellar/package.json`: `@stellar/stellar-xdr-json`, `lossless-json`
- [ ] T003 [P] Install workspace deps and build: `pnpm -r install && pnpm -r build`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [ ] T004 [P] Unit test: contract type detection (SAC vs Wasm) in `packages/adapter-stellar/test/contract/type-detection.test.ts`
- [ ] T005 [P] Unit test: SAC spec fetch + XDR encode in `packages/adapter-stellar/test/sac/spec-encoding.test.ts`
- [ ] T006 [P] Integration test: loader returns schema for SAC (functions present) in `packages/adapter-stellar/test/contract/loader-sac.test.ts`
- [ ] T007 [P] Integration test: query flow works with SAC schema in `packages/adapter-stellar/test/query/sac-query.test.ts`
- [ ] T008 [P] Unit test: SAC spec fetch failure surfaces friendly error in `packages/adapter-stellar/test/sac/spec-error.test.ts`
- [ ] T009 [P] Integration test: cache behavior avoids refetch on second load in `packages/adapter-stellar/test/sac/spec-cache.test.ts`
- [ ] T010 [P] Integration test: parity UX includes enum/struct fields via `metadata.specEntries` in `packages/adapter-stellar/test/mapping/sac-parity.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T011 Implement contract type detection: `packages/adapter-stellar/src/contract/type.ts`
- [ ] T012 Implement SAC spec source (runtime fetch + cache hook): `packages/adapter-stellar/src/sac/spec-source.ts`
- [ ] T013 Implement XDR init/encode utilities: `packages/adapter-stellar/src/sac/xdr.ts`
- [ ] T014 Integrate SAC branch into loader: `packages/adapter-stellar/src/contract/loader.ts` (inject `contract.Spec` and `specEntries`)
- [ ] T015 Ensure mapping uses `metadata.specEntries` for enums/structs (no change if already present)
- [ ] T016 Wire adapter barrel exports if needed: `packages/adapter-stellar/src/index.ts`

## Phase 3.4: Integration & Validation

- [ ] T017 Validate query path with SAC: `packages/adapter-stellar/src/query/handler.ts` (no changes expected; verify against tests)
- [ ] T018 Validate transaction path with SAC: `packages/adapter-stellar/src/transaction/formatter.ts` (ensure inputs parsed OK)
- [ ] T019 Add README updates: `packages/adapter-stellar/README.md` (SAC support, limits, caching)
- [ ] T020 Add CHANGELOG entry: `packages/adapter-stellar/CHANGELOG.md`

## Phase 3.5: Polish

- [ ] T021 [P] Add error messages for SAC fetch/encode failures (user-friendly) with `logger`
- [ ] T022 [P] Add lightweight in-memory caching guard (in addition to Query defaults)
- [ ] T023 [P] Add docs note: public/testnet only; TODO for custom networks

## Dependencies

- T004–T010 before T011–T016
- T011 blocks T014
- T012, T013 block T014
- T014 blocks T017–T018
- Docs (T019–T023) after core implementation

## Parallel Example

```
# Launch test tasks together (different files):
Task: "Unit test: contract type detection (SAC vs Wasm) in packages/adapter-stellar/test/contract/type-detection.test.ts"
Task: "Unit test: SAC spec fetch + XDR encode in packages/adapter-stellar/test/sac/spec-encoding.test.ts"
Task: "Integration test: loader returns schema for SAC in packages/adapter-stellar/test/contract/loader-sac.test.ts"
Task: "Integration test: query flow works with SAC schema in packages/adapter-stellar/test/query/sac-query.test.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Tests must fail before implementing
- Keep logs via `logger`; avoid console
- Scope limited to `packages/adapter-stellar`
