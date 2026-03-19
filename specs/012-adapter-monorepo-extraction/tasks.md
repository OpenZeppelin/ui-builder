# Tasks: Adapter Monorepo Extraction

**Input**: Design documents from `/specs/012-adapter-monorepo-extraction/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Focused test tasks are included where business-logic changes require TDD under the constitution; the remaining verification tasks use existing suites and workflow checks

**Organization**: Tasks are grouped by user story so each migration outcome can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-task dependency)
- **[Story]**: Which user story this task belongs to (`US1`-`US4`)
- Exact file or directory paths are included in every description

## Path Conventions

- **Current repo**: `ui-builder/` (this workspace)
- **New repo**: `../openzeppelin-adapters/` (new sibling repository to create)
- **Existing consumer repo**: `../openzeppelin-ui/`
- **Existing consumer repo**: `../role-manager/`
- **Existing consumer repo**: `../rwa-wizard/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new adapter repository shell and reusable top-level tooling

- [ ] T001 Create the new repo scaffold in `../openzeppelin-adapters/package.json`, `../openzeppelin-adapters/pnpm-workspace.yaml`, and `../openzeppelin-adapters/README.md`
- [ ] T002 [P] Copy root TypeScript, lint, and test config into `../openzeppelin-adapters/tsconfig.base.json`, `../openzeppelin-adapters/tsconfig.json`, `../openzeppelin-adapters/tsconfig.node.json`, `../openzeppelin-adapters/eslint.config.cjs`, and `../openzeppelin-adapters/vitest.shared.config.ts`
- [ ] T003 [P] Copy package-manager and formatting defaults into `../openzeppelin-adapters/.npmrc`, `../openzeppelin-adapters/.nvmrc`, and `../openzeppelin-adapters/.prettierrc.cjs`
- [ ] T004 [P] Copy the reusable prepare action into `../openzeppelin-adapters/.github/actions/prepare/action.yml`
- [ ] T005 [P] Create release-operations docs in `../openzeppelin-adapters/docs/DEVOPS_SETUP.md` and `../openzeppelin-adapters/docs/RUNBOOK.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core repository and governance work that MUST be complete before consumer cutovers

**CRITICAL**: No user story rollout should be completed until this phase is done

- [ ] T006 Ratify the repository-boundary amendment in `.specify/memory/constitution.md`
- [ ] T007 Configure linked Changesets releases in `../openzeppelin-adapters/.changeset/config.json`
- [ ] T007a Set the initial `1.0.0` release baseline in `../openzeppelin-adapters/.changeset/initial-release.md` and `../openzeppelin-adapters/packages/*/package.json`
- [ ] T008 [P] Migrate adapter support scripts into `../openzeppelin-adapters/scripts/sync-patches-to-adapters.js`, `../openzeppelin-adapters/scripts/validate-adapter-vite-configs.cjs`, and `../openzeppelin-adapters/scripts/remove-midnight-sourcemaps.js`
- [ ] T009 [P] Migrate shared patch assets into `../openzeppelin-adapters/patches/`
- [ ] T010 [P] Copy adapter package sources into `../openzeppelin-adapters/packages/adapter-evm/`, `../openzeppelin-adapters/packages/adapter-evm-core/`, `../openzeppelin-adapters/packages/adapter-midnight/`, `../openzeppelin-adapters/packages/adapter-polkadot/`, `../openzeppelin-adapters/packages/adapter-solana/`, and `../openzeppelin-adapters/packages/adapter-stellar/`
- [ ] T011 [P] Replace deprecated bundling setup with `tsdown` in `../openzeppelin-adapters/package.json`
- [ ] T012 [P] Add package-level `tsdown` configs in `../openzeppelin-adapters/packages/adapter-evm/tsdown.config.ts`, `../openzeppelin-adapters/packages/adapter-midnight/tsdown.config.ts`, `../openzeppelin-adapters/packages/adapter-polkadot/tsdown.config.ts`, `../openzeppelin-adapters/packages/adapter-solana/tsdown.config.ts`, and `../openzeppelin-adapters/packages/adapter-stellar/tsdown.config.ts`
- [ ] T013 Create the baseline verification workflow in `../openzeppelin-adapters/.github/workflows/ci.yml`

**Checkpoint**: Foundation ready - repository bootstrap, governance gate, and build tooling are in place

---

## Phase 3: User Story 1 - Product Maintainer Adopts Extracted Adapters (Priority: P1) MVP

**Goal**: Maintainers can migrate consumer repositories to the new adapter namespace without changing product behavior

**Independent Test**: Update one consumer to the new package names, run a fresh install plus its current verification flow, and confirm adapter-backed behavior still works

### Implementation for User Story 1

- [ ] T014 [P] [US1] Rename EVM package metadata in `../openzeppelin-adapters/packages/adapter-evm/package.json` and `../openzeppelin-adapters/packages/adapter-evm-core/package.json`
- [ ] T015 [P] [US1] Rename Midnight and Polkadot package metadata in `../openzeppelin-adapters/packages/adapter-midnight/package.json` and `../openzeppelin-adapters/packages/adapter-polkadot/package.json`
- [ ] T016 [P] [US1] Rename Solana and Stellar package metadata in `../openzeppelin-adapters/packages/adapter-solana/package.json` and `../openzeppelin-adapters/packages/adapter-stellar/package.json`
- [ ] T017 [US1] Preserve private-core bundling and consumer-facing subpath exports in `../openzeppelin-adapters/packages/adapter-evm/package.json`, `../openzeppelin-adapters/packages/adapter-polkadot/package.json`, and `../openzeppelin-adapters/packages/adapter-evm-core/package.json`
- [ ] T018 [US1] Update internal adapter source imports to `@openzeppelin/adapter-*` across `../openzeppelin-adapters/packages/adapter-evm/src/`, `../openzeppelin-adapters/packages/adapter-midnight/src/`, `../openzeppelin-adapters/packages/adapter-polkadot/src/`, `../openzeppelin-adapters/packages/adapter-solana/src/`, and `../openzeppelin-adapters/packages/adapter-stellar/src/`
- [ ] T019 [US1] Replace Builder workspace adapter dependencies in `package.json` and `pnpm-workspace.yaml`
- [ ] T020 [US1] Update Builder runtime adapter references in `apps/builder/src/core/ecosystemManager.ts` and `apps/builder/src/config/wallet/rainbowkit.config.ts`
- [ ] T021 [P] [US1] Migrate example-consumer dependencies and adapter imports in `../openzeppelin-ui/package.json`, `../openzeppelin-ui/.pnpmfile.cjs`, and `../openzeppelin-ui/examples/basic-react-app/src/core/ecosystemManager.ts`
- [ ] T022 [P] [US1] Migrate Role Manager dependencies and adapter imports in `../role-manager/package.json`, `../role-manager/.pnpmfile.cjs`, and `../role-manager/apps/role-manager/src/core/ecosystems/ecosystemManager.ts`
- [ ] T023 [P] [US1] Migrate RWA Wizard adapter dependencies and references in `../rwa-wizard/package.json`, `../rwa-wizard/.pnpmfile.cjs`, and `../rwa-wizard/apps/rwa-wizard/src/services/codegen/types.ts`

**Checkpoint**: Consumer repositories can point at the extracted package namespace without legacy-package behavior regressions

---

## Phase 4: User Story 2 - Adapter Maintainer Ships Independent Releases (Priority: P1)

**Goal**: Maintainers can publish linked RC and stable adapter releases from the new repository while `ui-builder` keeps deployment ownership

**Independent Test**: Prepare a release in `../openzeppelin-adapters/`, publish RC and stable packages, and verify consumers can resolve them without a Builder app release

### Tests for User Story 2

- [ ] T023a [P] [US2] Add failing coverage for published adapter metadata resolution in `scripts/__tests__/update-export-versions.test.ts`
- [ ] T023b [P] [US2] Add failing coverage for Builder release-channel resolution in `apps/builder/src/export/__tests__/VersioningSafetyGuard.test.ts` and `apps/builder/src/export/__tests__/PackageManagerConfigLoading.test.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Create the stable release workflow in `../openzeppelin-adapters/.github/workflows/publish.yml`
- [ ] T025 [US2] Create the RC publication workflow in `../openzeppelin-adapters/.github/workflows/publish-rc.yml`
- [ ] T026 [US2] Document release credentials, provenance setup, and release-PR expectations in `../openzeppelin-adapters/docs/DEVOPS_SETUP.md` and `../openzeppelin-adapters/docs/RUNBOOK.md`
- [ ] T027 [US2] Add Changesets release documentation in `../openzeppelin-adapters/.changeset/README.md`
- [ ] T027a [US2] Verify old wrapper packages are absent from `../openzeppelin-adapters/packages/`, `../openzeppelin-adapters/pnpm-workspace.yaml`, and `../openzeppelin-adapters/.github/workflows/publish.yml`
- [ ] T028 [US2] Resolve published adapter metadata inside `scripts/update-export-versions.cjs`
- [ ] T029 [US2] Preserve Builder version-sync enforcement in `.github/workflows/check-versions.yml` and `.github/workflows/update-versions.yml`
- [ ] T030 [US2] Preserve Builder environment ownership in `.github/workflows/docker-stg.yaml` and `.github/workflows/docker-prod.yaml`
- [ ] T031 [US2] Keep export validation aligned with published adapters in `.github/workflows/export-testing.yml`
- [ ] T032 [US2] Document Builder-owned staging redeploy and defective-release recovery in `docs/LOCAL_DEVELOPMENT.md` and `../openzeppelin-adapters/docs/RUNBOOK.md`
- [ ] T032a [US2] Add the focused rollout gate requiring initial adapter publish validation before consumer-cutover merges in `../openzeppelin-adapters/docs/RUNBOOK.md`, `docs/LOCAL_DEVELOPMENT.md`, and `../openzeppelin-adapters/.github/workflows/publish.yml`

**Checkpoint**: The adapter repo can publish RC/stable packages independently and Builder workflows still resolve the right release channel per environment

---

## Phase 5: User Story 3 - UI Builder Exports Applications With New Adapter Names (Priority: P1)

**Goal**: Exported Builder applications reference only `@openzeppelin/adapter-*` packages and remain installable

**Independent Test**: Export an application, perform a fresh install in the generated project, and confirm the build succeeds with only new adapter package names

### Tests for User Story 3

- [ ] T032b [P] [US3] Add failing export dependency coverage in `apps/builder/src/export/__tests__/PackageManager.test.ts` and `apps/builder/src/export/__tests__/VersioningSafetyGuard.test.ts`

### Implementation for User Story 3

- [ ] T033 [US3] Update exported dependency mapping in `apps/builder/src/export/PackageManager.ts`
- [ ] T034 [US3] Regenerate canonical adapter version references in `apps/builder/src/export/versions.ts`
- [ ] T035 [US3] Update export CLI dependency generation in `apps/builder/src/export/cli/export-app.cjs`
- [ ] T036 [US3] Replace any remaining legacy adapter names in `apps/builder/src/export/templates/`
- [ ] T037 [US3] Update export verification coverage in `apps/builder/src/export/__tests__/VersioningSafetyGuard.test.ts`, `apps/builder/src/export/__tests__/PackageManager.test.ts`, and `apps/builder/src/export/__tests__/PackageManagerConfigLoading.test.ts`
- [ ] T038 [US3] Refresh export snapshots and fixtures in `apps/builder/src/export/__snapshots__/` and related files under `apps/builder/src/export/`

**Checkpoint**: Exported apps install and build with only the extracted adapter namespace

---

## Phase 6: User Story 4 - Cross-Repo Developer Uses Local Adapter Sources (Priority: P2)

**Goal**: Developers can switch between published adapters and a local `openzeppelin-adapters` checkout without hand-editing manifests

**Independent Test**: Follow the documented local-dev workflow in a consumer repo, point it at a sibling adapter checkout, and verify install/switch-back behavior works cleanly

### Tests for User Story 4

- [ ] T038a [P] [US4] Add failing local-override coverage in `.pnpmfile.test.cjs`, `../openzeppelin-ui/.pnpmfile.test.cjs`, `../role-manager/.pnpmfile.test.cjs`, and `../rwa-wizard/.pnpmfile.test.cjs`

### Implementation for User Story 4

- [ ] T039 [P] [US4] Standardize local adapter switching in `../openzeppelin-ui/.pnpmfile.cjs` and `../openzeppelin-ui/package.json`
- [ ] T040 [P] [US4] Standardize local adapter switching in `../role-manager/.pnpmfile.cjs` and `../role-manager/package.json`
- [ ] T041 [P] [US4] Standardize local adapter switching in `../rwa-wizard/.pnpmfile.cjs` and `../rwa-wizard/package.json`
- [ ] T042 [US4] Standardize Builder local adapter switching in `.pnpmfile.cjs`, `package.json`, and `docs/LOCAL_DEVELOPMENT.md`
- [ ] T043 [US4] Document canonical `LOCAL_ADAPTERS_PATH` usage and compatibility aliases in `../openzeppelin-adapters/README.md`
- [ ] T044 [US4] Add clear bad-path diagnostics to `.pnpmfile.cjs`, `../openzeppelin-ui/.pnpmfile.cjs`, `../role-manager/.pnpmfile.cjs`, and `../rwa-wizard/.pnpmfile.cjs`

**Checkpoint**: Cross-repo local development works through a shared, documented override contract

---

## Phase 7: Cleanup (Legacy Source Removal)

**Purpose**: Remove obsolete workspace ownership and legacy package references after the cutover

- [ ] T045 Remove legacy adapter workspace ownership from `pnpm-workspace.yaml` and `.changeset/config.json`
- [ ] T046 Delete the extracted adapter source directories at `packages/adapter-evm/`, `packages/adapter-evm-core/`, `packages/adapter-midnight/`, `packages/adapter-polkadot/`, `packages/adapter-solana/`, and `packages/adapter-stellar/`
- [ ] T047 Sweep remaining `@openzeppelin/ui-builder-adapter-*` references from `package.json`, `apps/builder/src/`, `../openzeppelin-ui/`, `../role-manager/`, and `../rwa-wizard/`
- [ ] T047a Add a rollout-closeout guard against new legacy-name usage in `../openzeppelin-adapters/docs/RUNBOOK.md` and `specs/012-adapter-monorepo-extraction/quickstart.md`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and closeout across repos and workflows

- [ ] T048 [P] Validate new-repo quality gates through `../openzeppelin-adapters/package.json`, `../openzeppelin-adapters/.github/workflows/ci.yml`, `../openzeppelin-adapters/.github/workflows/publish.yml`, and `../openzeppelin-adapters/.github/workflows/publish-rc.yml`
- [ ] T049 [P] Validate consumer verification entry points in `package.json`, `../openzeppelin-ui/package.json`, `../role-manager/package.json`, and `../rwa-wizard/package.json`
- [ ] T048a [P] Validate first-release installability and same-day release readiness against `SC-001` and `SC-004` in `../openzeppelin-adapters/docs/RUNBOOK.md`
- [ ] T049a [P] Validate local-switch timing against `SC-007` in `docs/LOCAL_DEVELOPMENT.md` and `../openzeppelin-adapters/README.md`
- [ ] T050 Run the end-to-end migration verification checklist from `specs/012-adapter-monorepo-extraction/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (Cleanup) → Phase 8 (Polish)
                                              └──────────── rollout gate: do not merge consumer cutovers before US2 publishes the initial adapter set
```

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - blocks rollout for all user stories
- **US1 (Phase 3)**: Can begin after Foundational, but final consumer cutover depends on the initial publish path from US2
- **US2 (Phase 4)**: Depends on Foundational and should complete before consumer cutovers are merged
- **US3 (Phase 5)**: Depends on US2 because `versions.ts` and export flows must resolve published adapter metadata
- **US4 (Phase 6)**: Depends on Foundational; validate fully once US1 package names and US2 publish workflows exist
- **Cleanup (Phase 7)**: Depends on US1-US4 completion
- **Polish (Phase 8)**: Depends on Cleanup

### User Story Dependencies

| Story | Depends On | Notes                                                                               |
| ----- | ---------- | ----------------------------------------------------------------------------------- |
| US1   | Phase 2    | Prepare consumer adoption early, but merge after US2 initial publish is ready       |
| US2   | Phase 2    | Establishes the publish/channel mechanics every rollout depends on                  |
| US3   | US2        | Export metadata must read published RC/stable versions                              |
| US4   | Phase 2    | Local-linking contract can be implemented in parallel, then validated after US1/US2 |

### Parallel Opportunities

- **Phase 1**: T002-T005 can run in parallel after T001 creates the repo shell
- **Phase 2**: T008-T012 can run in parallel after T006-T007a define governance and release-group rules
- **US1**: T014-T016 can run in parallel; T021-T023 can run in parallel across consumer repos
- **US2**: T023a-T023b can run in parallel first; T024-T025 can run in parallel once shared workflow conventions are established
- **US4**: T039-T041 can run in parallel across consumer repos
- **Polish**: T048-T049 and T048a-T049a can run in parallel before T050 final end-to-end verification

---

## Parallel Example: User Story 1 Consumer Cutovers

```bash
# Run the three consumer-repo updates in parallel after the new package namespace is defined:
T021: Update ../openzeppelin-ui/package.json, ../openzeppelin-ui/.pnpmfile.cjs, and ../openzeppelin-ui/examples/basic-react-app/src/core/ecosystemManager.ts
T022: Update ../role-manager/package.json, ../role-manager/.pnpmfile.cjs, and ../role-manager/apps/role-manager/src/core/ecosystems/ecosystemManager.ts
T023: Update ../rwa-wizard/package.json, ../rwa-wizard/.pnpmfile.cjs, and ../rwa-wizard/apps/rwa-wizard/src/services/codegen/types.ts
```

## Parallel Example: User Story 2 Release Workflows

```bash
# Start with failing release tests, then build both publishing workflows together:
T023a: Add scripts/__tests__/update-export-versions.test.ts
T023b: Update apps/builder/src/export/__tests__/VersioningSafetyGuard.test.ts and apps/builder/src/export/__tests__/PackageManagerConfigLoading.test.ts

# Then build both publishing workflows together once the repo scaffold is ready:
T024: Create ../openzeppelin-adapters/.github/workflows/publish.yml
T025: Create ../openzeppelin-adapters/.github/workflows/publish-rc.yml
```

## Parallel Example: User Story 4 Local-Dev Convergence

```bash
# Standardize consumer-side local overrides in parallel:
T039: Update ../openzeppelin-ui/.pnpmfile.cjs and ../openzeppelin-ui/package.json
T040: Update ../role-manager/.pnpmfile.cjs and ../role-manager/package.json
T041: Update ../rwa-wizard/.pnpmfile.cjs and ../rwa-wizard/package.json
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 consumer-preparation work
4. Complete Phase 4: US2 publish/release flow
5. **STOP and VALIDATE**: Publish the initial `1.0.0` adapter set, verify the rollout gate, then merge the prepared US1 consumer cutovers

### Incremental Delivery

1. Finish Setup + Foundational to unblock all repos
2. Prepare consumer adoption in US1 while building the publish machinery in US2
3. Add US3 once published metadata resolution is real
4. Add US4 to restore the full local-development ergonomics
5. Remove legacy sources only after all story checkpoints pass

### Suggested MVP Scope

- **Minimum safe rollout**: T001-T032a
- **Why**: This scope creates the new repo, preserves release ownership, publishes the initial adapter set, and prepares all consumer cutovers without prematurely deleting legacy sources

---

## Summary

| Category     | Tasks                  | Scope                                                                                                                   |
| ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Setup        | T001-T005              | New repo shell, root configs, initial docs                                                                              |
| Foundational | T006-T013, T007a       | Governance gate, `1.0.0` baseline, package migration base, `tsdown`, and CI                                             |
| US1 (P1)     | T014-T023              | Package renames and consumer adoption                                                                                   |
| US2 (P1)     | T023a-T032a            | Release-flow tests, RC and stable publishing, Builder version resolution, wrapper-package prevention, and rollout gates |
| US3 (P1)     | T032b-T038             | Export tests-first work, exported-app package names, and export verification                                            |
| US4 (P2)     | T038a-T044             | Local-dev tests-first work and convergence across sibling repos                                                         |
| Cleanup      | T045-T047a             | Remove legacy ownership, old package references, and add the rollout-closeout guard                                     |
| Polish       | T048-T050, T048a-T049a | Final workflow, timing, and multi-repo verification                                                                     |

**Total Tasks**: 60  
**Task Count by Story**: US1 = 10, US2 = 13, US3 = 7, US4 = 7  
**Parallel Opportunities**: 24 tasks marked `[P]`  
**Suggested MVP Scope**: T001-T032a  
**Format Validation**: All tasks follow `- [ ] TXXX [P?] [US?] Description with path`
