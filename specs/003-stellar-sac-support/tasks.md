# Tasks: Stellar SAC Support

**Status**: ✅ COMPLETE - All phases implemented and tested

**Input**: Design documents from `/specs/003-stellar-sac-support/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Implementation Summary

- ✅ Successfully implemented SAC (Stellar Asset Contract) support
- ✅ SAC detection via RPC ledger entries
- ✅ Dynamic loading of SAC specifications from GitHub
- ✅ XDR encoding using `@stellar/stellar-xdr-json` with CDN-loaded WASM
- ✅ In-memory caching to avoid redundant fetches
- ✅ Full UI parity with WASM contracts (enums, structs, all field types)
- ✅ All tests passing (455 tests)
- ✅ Documentation updated (README, inline comments, spec notes)

## Key Technical Decisions

1. **WASM Loading**: After extensive testing with Vite bundling approaches, implemented CDN loading for the 3MB WASM module to avoid bundling issues and reduce bundle size
2. **Dynamic Imports**: SAC support code only loads when SAC contracts are actually used
3. **Caching Strategy**: In-memory cache for SAC specs during session to minimize network requests

## Phase 3.1: Setup

- [x] T001 Ensure adapter-only scope per constitution (no chain-specific deps outside `packages/adapter-stellar`)
- [x] T002 Add dependencies in `packages/adapter-stellar/package.json`: `@stellar/stellar-xdr-json`, `lossless-json`
- [x] T003 [P] Install workspace deps and build: `pnpm -r install && pnpm -r build`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [x] T004 [P] Unit test: contract type detection (SAC vs Wasm) in `packages/adapter-stellar/test/contract/type-detection.test.ts`
- [x] T005 [P] Unit test: SAC spec fetch + XDR encode in `packages/adapter-stellar/test/sac/spec-encoding.test.ts`
- [x] T006 [P] Integration test: loader returns schema for SAC (functions present) in `packages/adapter-stellar/test/contract/loader-sac.test.ts`
- [x] T007 [P] Integration test: query flow works with SAC schema in `packages/adapter-stellar/test/query/sac-query.test.ts`
- [x] T008 [P] Unit test: SAC spec fetch failure surfaces friendly error in `packages/adapter-stellar/test/sac/spec-error.test.ts`
- [x] T009 [P] Integration test: cache behavior avoids refetch on second load in `packages/adapter-stellar/test/sac/spec-cache.test.ts`
- [x] T010 [P] Integration test: parity UX includes enum/struct fields via `metadata.specEntries` in `packages/adapter-stellar/test/mapping/sac-parity.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T011 Implement contract type detection: `packages/adapter-stellar/src/contract/type.ts`
- [x] T012 Implement SAC spec source (runtime fetch + cache hook): `packages/adapter-stellar/src/sac/spec-source.ts`
- [x] T013 Implement XDR init/encode utilities: `packages/adapter-stellar/src/sac/xdr.ts`
- [x] T014 Integrate SAC branch into loader: `packages/adapter-stellar/src/contract/loader.ts` (inject `contract.Spec` and `specEntries`)
- [x] T015 Ensure mapping uses `metadata.specEntries` for enums/structs (no change if already present)
- [x] T016 Wire adapter barrel exports if needed: `packages/adapter-stellar/src/index.ts`

## Phase 3.4: Integration & Validation

- [x] T017 Validate query path with SAC: `packages/adapter-stellar/src/query/handler.ts` (no changes expected; verify against tests)
- [x] T018 Validate transaction path with SAC: `packages/adapter-stellar/src/transaction/formatter.ts` (ensure inputs parsed OK)
- [x] T019 Add README updates: `packages/adapter-stellar/README.md` (SAC support, limits, caching) - COMPLETED
- [x] T020 Add CHANGELOG entry: `packages/adapter-stellar/CHANGELOG.md` - COMPLETED

## Phase 3.5: Polish

- [x] T021 [P] Add error messages for SAC fetch/encode failures (user-friendly) with `logger`
- [x] T022 [P] Add lightweight in-memory caching guard (in addition to Query defaults)
- [x] T023 [P] Add docs note: public/testnet only; TODO for custom networks - COMPLETED

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
