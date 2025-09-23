# Tasks: Contract Definition Provider Integration + Deep Links

**Input**: Design documents from `/specs/001-sourcify-integration/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup

- [x] T002 [P] Add RouterService wrapper (no usage yet) in utils
  - Path: `packages/utils/src/RouterService.ts`
  - Expose: `getParam(name)`, `navigate(path)`, `currentLocation()`
  - Dependency: None

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [x] T003 [P] Unit tests for RouterService basic behavior
  - Path: `packages/utils/src/__tests__/RouterService.test.ts`
- [x] T004 [P] Unit tests for deep-link parsing and precedence (forced service, fallback rules)
  - Path: `packages/utils/src/__tests__/deepLink.test.ts`
- [x] T005 [P] Unit tests for EVM provider selection (Etherscan→Sourcify order, timeouts)
  - Path: `packages/adapter-evm/src/__tests__/providerSelection.test.ts`
- [x] T006 [P] Unit tests for EVM provenance links using `resolveExplorerConfig()`
  - Path: `packages/adapter-evm/src/__tests__/provenanceLinks.test.ts`
- [x] T007 [P] Orchestrator test: Deep link takes precedence over saved session
  - Path: `packages/builder/src/core/deeplink/__tests__/orchestrator.test.ts`
- [x] T008 [P] Orchestrator test: Forced service unsupported → auto-fallback to adapter default order
  - Path: `packages/builder/src/core/deeplink/__tests__/orchestrator.test.ts`
- [x] T009 [P] Orchestrator test: Forced service fails → stop with clear message
  - Path: `packages/builder/src/core/deeplink/__tests__/orchestrator.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T010 [P] Implement RouterService in `packages/utils/src/RouterService.ts`
  - Export minimal API used by builder
- [x] T011 [P] Add deep-link helpers (parse/serialize) chain-agnostic
  - Path: `packages/utils/src/deepLink.ts`
  - Use typed unions for provider keys per adapter
- [x] T012 Integrate RouterService usage in builder deep-link handling
  - Path: `packages/builder/src/components/UIBuilder/hooks/useBuilderLifecycle.ts` (or central loader)
  - Map params to `getContractDefinitionInputs()` names
- [x] T013 EVM: Implement thin Sourcify provider module (fallback only)
  - Path: `packages/adapter-evm/src/abi/sourcify.ts`
  - Behavior: fetch definition, transform to `ContractSchema` using existing transformer; no keys
  - Timeouts: 4s per provider (use AbortController)
- [x] T014 EVM: Provider selection orchestrator (respect forced service, precedence, timeouts)
  - Path: `packages/adapter-evm/src/abi/loader.ts` (augment existing flow without duplicating logic)
  - Reuse `loadAbiFromEtherscan`/`loadAbiFromEtherscanV2` first, then Sourcify
- [x] T015 EVM: Provenance link wiring via `resolveExplorerConfig()` and existing explorer helpers
  - Path: `packages/adapter-evm/src/abi/loader.ts` (metadata.fetchedFrom)
- [x] T016 Stellar: No new providers — ensure provenance uses `getStellarExplorerAddressUrl` or RPC URL
  - Path: `packages/adapter-stellar/src/contract/loader.ts`

## Phase 3.4: Integration

- [x] T017 Builder: Expose default provider selection in existing settings UI (reuse Explorer panel where applicable)
  - Path: `packages/ui/src/components/explorer/ExplorerSettingsPanel.tsx`
  - Ensure values persist via `UserExplorerConfigService` and `AppConfigService`

## Phase 3.5: Polish

- [x] T019 [P] Add unit tests for provider timeout handling (4s per provider, 10s overall)
  - Path: `packages/adapter-evm/src/__tests__/timeouts.test.ts`
- [x] T020 [P] Update spec and quickstart with final examples and any new notes
  - Paths: `specs/001-sourcify-integration/spec.md`, `.../quickstart.md`
- [x] T021 Validate docs point to existing services (no duplication of config types)
  - Paths: `specs/001-sourcify-integration/*`

## Dependencies

- T001 before T018
- T002 before T003, T010, T012
- T003–T009 must be written and failing before T010–T016
- T013 after T005; T014 after T013; T015 after T014
- T016 independent (ensures provenance path only)
- T017 after T001

## Parallel Example

```bash
# Launch unit tests in parallel:
Task: "Unit tests for RouterService" (T003)
Task: "Deep-link parsing/precedence tests" (T004)
Task: "EVM provider selection tests" (T005)
Task: "EVM provenance link tests" (T006)
```

## Notes

- Use literal unions for `ProviderKey` per adapter (e.g., EVM: 'etherscan' | 'sourcify').
- Reuse `resolveExplorerConfig()`, `UserExplorerConfigService`, `AppConfigService`.
- Map deep-link params to `getContractDefinitionInputs()` names and validate with `isValidAddress`.
