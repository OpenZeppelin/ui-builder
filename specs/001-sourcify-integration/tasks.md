# Tasks: Contract Definition Provider Integration + Deep Links

**Input**: Design documents from `/specs/001-sourcify-integration/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup

- [ ] T001 Ensure feature flag plumbing: add `contractDefinitionProviderIntegration` default ON via AppConfigService docs (no code change yet)
- [ ] T002 Add RouterService scaffold in `packages/utils/src/router/RouterService.ts` (no implementation)
- [ ] T003 Add base types skeleton in `packages/types/src/contract-definition/providers.ts`
- [ ] T004 Verify lint rule alignment for adapter base extensions in `.eslint/rules/no-extra-adapter-methods.cjs`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [ ] T005 [P] Unit tests for RouterService API in `packages/utils/tests/router/RouterService.test.ts`
- [ ] T006 [P] Unit tests for deep-link parse/serialize in `packages/utils/tests/deeplink/deepLink.test.ts`
- [ ] T007 [P] Unit tests for provider precedence/timeouts/force in `packages/adapter-evm/tests/providers/precedence.test.ts`
- [ ] T008 [P] Unit tests for adapter deep-link schema (EVM) in `packages/adapter-evm/tests/deeplink/schema.test.ts`
- [ ] T009 [P] Integration test: deep link overrides saved session in `packages/builder/tests/integration/deeplink-precedence.test.ts`
- [ ] T010 [P] Integration test: provenance messaging/link in `packages/builder/tests/integration/provenance-display.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T011 Implement RouterService wrapper in `packages/utils/src/router/RouterService.ts` (getParam, navigate)
- [ ] T012 [P] Implement deep-link helpers in `packages/utils/src/deeplink/index.ts` (parse, serialize, precedence)
- [ ] T013 Define base types in `packages/types/src/contract-definition/providers.ts` (ContractDefinitionProvider, ProviderPreference, DeepLinkParameters, AdapterDeepLinkSchema)
- [ ] T014 Extend `packages/types/src/adapters/base.ts` with adapter getters for provider precedence and deep-link schema; update `.eslint/rules/no-extra-adapter-methods.cjs`
- [ ] T015 EVM adapter: implement provider precedence (Etherscan → Sourcify) in `packages/adapter-evm/src/definition/providers/precedence.ts`
- [ ] T016 EVM adapter: implement deep-link schema in `packages/adapter-evm/src/definition/deeplink/schema.ts`
- [ ] T017 EVM adapter: selection/orchestration with timeouts + forced service in `packages/adapter-evm/src/definition/loader/selectProvider.ts`
- [ ] T018 Builder: integrate RouterService and deep-link hydration in `packages/builder/src/App.tsx` and relevant hooks (respect feature flag)
- [ ] T019 Builder: provenance UI hook/labels reuse in `packages/builder/src/components/ContractsUIBuilder/hooks/builder/useBuilderLifecycle.ts` (use existing patterns; minimal changes)
- [ ] T020 AppConfigService: support default provider per network lookup in `packages/utils/src/AppConfigService.ts`
- [ ] T021 UI: provider default selection via existing settings panel wired to `userExplorerConfigService` or equivalent in `packages/ui/src/components/explorer/ExplorerSettingsPanel.tsx`

## Phase 3.4: Integration

- [ ] T022 Wire EVM adapter provenance link templates in `packages/adapter-evm/src/definition/providers/provenance.ts`
- [ ] T023 Ensure per‑provider timeout (4s) and global budget (10s) respected in selection orchestration
- [ ] T024 Handle unsupported forced service → automatic fallback to adapter default order (message)
- [ ] T025 Handle forced service failure → stop with clear message (no fallback)

## Phase 3.5: Polish

- [ ] T026 [P] Update docs: `specs/001-sourcify-integration/quickstart.md` examples verified
- [ ] T027 [P] Update architecture docs to mention RouterService and provider abstraction
- [ ] T028 [P] Ensure no `any` types; run `pnpm -r format:check` and tests

## Dependencies

- Setup (T001–T004) precedes tests
- Tests (T005–T010) precede core implementation (T011–T021)
- Types/base (T013–T014) precede adapter impl (T015–T017)
- RouterService/deeplink utils (T011–T012) precede builder integration (T018)
- Provenance/timeouts behaviors (T022–T025) after core adapter selection
- Polish (T026–T028) last

## Parallel Execution Examples

```
# Run unit test authoring in parallel:
Task: T005, T006, T007, T008

# After core types and utils:
Task: T015, T016, T017 in parallel (different files)
Task: T026, T027, T028 in parallel (docs/lint)
```
