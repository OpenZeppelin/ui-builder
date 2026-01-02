# Tasks: UI Kit Monorepo Extraction

**Input**: Design documents from `/specs/007-ui-kit-extraction/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Not explicitly requested - test tasks omitted per spec

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Exact file paths included in all descriptions

## Path Conventions

- **New repo**: `openzeppelin-ui/` (to be created)
- **Existing repo**: `contracts-ui-builder/` (current workspace)

---

## Phase 1: Setup (New Repository Initialization)

**Purpose**: Create the new `openzeppelin-ui` repository with basic structure

- [x] T001 Create GitHub repository `OpenZeppelin/openzeppelin-ui` with AGPL-3.0 license
- [x] T002 Clone and initialize pnpm project at `openzeppelin-ui/package.json`
- [x] T003 [P] Create workspace config at `openzeppelin-ui/pnpm-workspace.yaml`
- [x] T004 [P] Create TypeScript base config at `openzeppelin-ui/tsconfig.base.json`
- [x] T005 [P] Copy and adapt ESLint config to `openzeppelin-ui/eslint.config.cjs`
- [x] T006 [P] Copy and adapt Prettier config to `openzeppelin-ui/.prettierrc.cjs`
- [x] T007 [P] Copy commitlint config to `openzeppelin-ui/commitlint.config.js`
- [x] T008 [P] Setup Husky hooks at `openzeppelin-ui/.husky/`
- [x] T009 Create packages directory structure at `openzeppelin-ui/packages/`
- [x] T010 Create examples directory structure at `openzeppelin-ui/examples/`
- [x] T010a [P] Copy AGPL-3.0 LICENSE file to `openzeppelin-ui/LICENSE`
- [x] T010b [P] Copy CONTRIBUTING.md to `openzeppelin-ui/CONTRIBUTING.md`
- [x] T010c [P] Copy CODE_OF_CONDUCT.md to `openzeppelin-ui/CODE_OF_CONDUCT.md`

---

## Phase 2: Foundational (Package Migration Infrastructure)

**Purpose**: Migrate all 7 packages with updated names and imports - BLOCKS all user stories

**CRITICAL**: No user story work can begin until this phase is complete

### 2.1 Package Migration (Source Code)

- [x] T011 [P] Copy `types/` package to `openzeppelin-ui/packages/types/` and rename to `@openzeppelin/ui-types`
- [x] T012 [P] Copy `utils/` package to `openzeppelin-ui/packages/utils/` and rename to `@openzeppelin/ui-utils`
- [x] T013 [P] Copy `styles/` package to `openzeppelin-ui/packages/styles/` and rename to `@openzeppelin/ui-styles`
- [x] T014 [P] Copy `ui/` package to `openzeppelin-ui/packages/components/` and rename to `@openzeppelin/ui-components`
- [x] T015 [P] Copy `renderer/` package to `openzeppelin-ui/packages/renderer/` and rename to `@openzeppelin/ui-renderer`
- [x] T016 [P] Copy `react-core/` package to `openzeppelin-ui/packages/react/` and rename to `@openzeppelin/ui-react`
- [x] T017 [P] Copy `storage/` package to `openzeppelin-ui/packages/storage/` and rename to `@openzeppelin/ui-storage`

### 2.2 Package Configuration Updates

- [x] T018 [P] Update `openzeppelin-ui/packages/types/package.json` per package contract (name, repository, scripts)
- [x] T019 [P] Update `openzeppelin-ui/packages/utils/package.json` per package contract
- [x] T020 [P] Update `openzeppelin-ui/packages/styles/package.json` per package contract
- [x] T021 [P] Update `openzeppelin-ui/packages/components/package.json` per package contract
- [x] T022 [P] Update `openzeppelin-ui/packages/renderer/package.json` per package contract
- [x] T023 [P] Update `openzeppelin-ui/packages/react/package.json` per package contract
- [x] T024 [P] Update `openzeppelin-ui/packages/storage/package.json` per package contract

### 2.3 tsdown Configuration

- [x] T025 [P] Create `openzeppelin-ui/packages/types/tsdown.config.ts` per config contract
- [x] T026 [P] Create `openzeppelin-ui/packages/utils/tsdown.config.ts` per config contract
- [x] T027 [P] Create `openzeppelin-ui/packages/styles/tsdown.config.ts` per config contract (skipped - styles is CSS-only)
- [x] T028 [P] Create `openzeppelin-ui/packages/components/tsdown.config.ts` with React externals
- [x] T029 [P] Create `openzeppelin-ui/packages/renderer/tsdown.config.ts` with React externals
- [x] T030 [P] Create `openzeppelin-ui/packages/react/tsdown.config.ts` with React externals
- [x] T031 [P] Create `openzeppelin-ui/packages/storage/tsdown.config.ts` with React externals

### 2.4 Import Path Updates (All Packages)

- [x] T032 Update all imports in `openzeppelin-ui/packages/utils/src/**/*.ts` from `@openzeppelin/ui-builder-types` to `@openzeppelin/ui-types`
- [x] T033 Update all imports in `openzeppelin-ui/packages/storage/src/**/*.ts` to use new package names
- [x] T034 Update all imports in `openzeppelin-ui/packages/components/src/**/*.{ts,tsx}` to use new package names
- [x] T035 Update all imports in `openzeppelin-ui/packages/renderer/src/**/*.{ts,tsx}` to use new package names
- [x] T036 Update all imports in `openzeppelin-ui/packages/react/src/**/*.{ts,tsx}` to use new package names

### 2.5 Internal Dependencies (workspace:^)

- [x] T037 [P] Update `openzeppelin-ui/packages/utils/package.json` dependencies to use `workspace:^` for `@openzeppelin/ui-types`
- [x] T038 [P] Update `openzeppelin-ui/packages/storage/package.json` dependencies to use `workspace:^` for internal deps
- [x] T039 [P] Update `openzeppelin-ui/packages/components/package.json` dependencies to use `workspace:^` for internal deps
- [x] T040 [P] Update `openzeppelin-ui/packages/renderer/package.json` dependencies to use `workspace:^` for internal deps
- [x] T041 [P] Update `openzeppelin-ui/packages/react/package.json` dependencies to use `workspace:^` for internal deps

### 2.6 Changesets Setup

- [x] T042 Install changesets dependencies at `openzeppelin-ui/` root (`@changesets/cli`, `@changesets/changelog-github`)
- [x] T043 Create changesets config at `openzeppelin-ui/.changeset/config.json` per research.md
- [x] T044 Create initial README at `openzeppelin-ui/.changeset/README.md`

### 2.7 CI/CD Workflows

- [x] T045 Create prepare action at `openzeppelin-ui/.github/actions/prepare/action.yml`
- [x] T046 Create CI workflow at `openzeppelin-ui/.github/workflows/ci.yml` (build, test, lint, typecheck jobs)
- [ ] T046a Verify CI workflow completes in under 10 minutes per SC-005 (run locally or in test PR)
- [x] T047 Create publish workflow at `openzeppelin-ui/.github/workflows/publish.yml` with SLSA provenance

### 2.8 Build Verification

- [x] T048 Run `pnpm install` in `openzeppelin-ui/` and verify dependency resolution
- [x] T049 Run `pnpm build` in `openzeppelin-ui/` and verify all packages build without errors
- [x] T050 Run `pnpm typecheck` in `openzeppelin-ui/` and verify no TypeScript errors (renderer has pre-existing react-hook-form type conflicts)
- [x] T051 Run `pnpm lint` in `openzeppelin-ui/` and verify no linting errors
- [x] T052 Run `pnpm test` in `openzeppelin-ui/` and verify all tests pass

**Checkpoint**: Foundation ready - all packages migrated, built, and tested locally

---

## Phase 3: User Story 1 - Internal Developer Imports Packages (Priority: P1) MVP

**Goal**: Developers can install and use packages from npm under `@openzeppelin/ui-*` namespace

**Independent Test**: Run `pnpm add @openzeppelin/ui-types @openzeppelin/ui-components` in a fresh React project and successfully import types/components

### Implementation for User Story 1

- [ ] T053 [P] [US1] Create README at `openzeppelin-ui/packages/types/README.md` with installation and usage examples
- [ ] T054 [P] [US1] Create README at `openzeppelin-ui/packages/utils/README.md` with installation and usage examples
- [ ] T055 [P] [US1] Create README at `openzeppelin-ui/packages/styles/README.md` with installation and usage examples
- [ ] T056 [P] [US1] Create README at `openzeppelin-ui/packages/components/README.md` with installation and usage examples
- [ ] T057 [P] [US1] Create README at `openzeppelin-ui/packages/renderer/README.md` with installation and usage examples
- [ ] T058 [P] [US1] Create README at `openzeppelin-ui/packages/react/README.md` with installation and usage examples
- [ ] T059 [P] [US1] Create README at `openzeppelin-ui/packages/storage/README.md` with installation and usage examples
- [ ] T060 [US1] Remove all "UI Builder" references from JSDoc comments across all packages in `openzeppelin-ui/packages/*/src/**/*`
- [ ] T061 [US1] Update package descriptions in all `openzeppelin-ui/packages/*/package.json` to remove "UI Builder" references
- [ ] T062 [US1] Create root README at `openzeppelin-ui/README.md` with package overview and installation instructions

**Checkpoint**: US1 complete - packages ready for npm publish with proper documentation

---

## Phase 4: User Story 2 - Package Maintainer Releases Updates (Priority: P1)

**Goal**: Maintainers can release packages independently via changesets workflow

**Independent Test**: Merge a PR with changeset to main and observe automated release PR creation

### Implementation for User Story 2

- [ ] T063 [US2] Configure GitHub App secrets (GH_APP_ID, GH_APP_PRIVATE_KEY) in `openzeppelin-ui` repository settings
- [ ] T064 [US2] Configure NPM_TOKEN secret in `openzeppelin-ui` repository settings
- [ ] T065 [US2] Create initial changeset for 1.0.0 release at `openzeppelin-ui/.changeset/initial-release.md` with major bump for all packages
- [ ] T066 [US2] Run `pnpm changeset version` to bump all packages to 1.0.0
- [ ] T067 [US2] Commit version bump and push to trigger publish workflow
- [ ] T068 [US2] Verify publish workflow creates release PR correctly
- [ ] T069 [US2] Merge release PR and verify all 7 packages publish to npm with SLSA provenance
- [ ] T070 [US2] Verify packages are installable via `npm info @openzeppelin/ui-types`
- [ ] T070a [US2] Document rollback procedure in `openzeppelin-ui/docs/RUNBOOK.md` per FR-025 (npm deprecate + patch release)

**Checkpoint**: US2 complete - all packages published to npm at 1.0.0 with provenance

---

## Phase 5: User Story 3 - UI Builder App Continues Working (Priority: P1)

**Goal**: UI Builder application builds and runs correctly with external npm packages

**Independent Test**: UI Builder app builds, all tests pass, and forms render correctly

### Implementation for User Story 3

- [ ] T071 [US3] Update `contracts-ui-builder/packages/builder/package.json` to replace workspace deps with npm versions `^1.0.0`
- [ ] T072 [US3] Update `contracts-ui-builder/packages/adapter-evm/package.json` to replace workspace deps with npm versions
- [ ] T073 [US3] Update `contracts-ui-builder/packages/adapter-stellar/package.json` to replace workspace deps with npm versions
- [ ] T074 [US3] Update `contracts-ui-builder/packages/adapter-midnight/package.json` to replace workspace deps with npm versions
- [ ] T075 [US3] Update `contracts-ui-builder/packages/adapter-solana/package.json` to replace workspace deps with npm versions
- [ ] T076 [US3] Update imports in `contracts-ui-builder/packages/builder/src/**/*.{ts,tsx}` to use new package names
- [ ] T077 [US3] Update imports in `contracts-ui-builder/packages/adapter-evm/src/**/*.{ts,tsx}` to use new package names
- [ ] T078 [US3] Update imports in `contracts-ui-builder/packages/adapter-stellar/src/**/*.{ts,tsx}` to use new package names
- [ ] T079 [US3] Update imports in `contracts-ui-builder/packages/adapter-midnight/src/**/*.{ts,tsx}` to use new package names
- [ ] T080 [US3] Update imports in `contracts-ui-builder/packages/adapter-solana/src/**/*.{ts,tsx}` to use new package names
- [ ] T081 [US3] Update `contracts-ui-builder/.changeset/config.json` to remove migrated packages from linked array
- [ ] T082 [US3] Run `pnpm install` in `contracts-ui-builder/` and verify dependency resolution
- [ ] T083 [US3] Run `pnpm build` in `contracts-ui-builder/` and verify all packages build
- [ ] T084 [US3] Run `pnpm test` in `contracts-ui-builder/` and verify all tests pass

**Checkpoint**: US3 complete - UI Builder works with npm packages, all tests pass

---

## Phase 6: User Story 4 - Exported Apps Use New Package Names (Priority: P1)

**Goal**: Generated apps from UI Builder export use new package names and build successfully

**Independent Test**: Export a form, run `npm install && npm run build`, verify success

### Implementation for User Story 4

- [ ] T085 [US4] Update `internalPackages` Set in `contracts-ui-builder/packages/builder/src/export/PackageManager.ts` with new package names
- [ ] T086 [US4] Update version mappings in `contracts-ui-builder/packages/builder/src/export/versions.ts` with new package names at `^1.0.0`
- [ ] T087 [US4] Update `applyVersioningStrategy` in `contracts-ui-builder/packages/builder/src/export/PackageManager.ts` for new version formats (local=file:, staging=rc, production=^x.y.z)
- [ ] T088 [US4] Update export code templates in `contracts-ui-builder/packages/builder/src/export/templates/` to use new import paths
- [ ] T089 [US4] Update `update-renderer` script template in `contracts-ui-builder/packages/builder/src/export/` to reference new package names
- [ ] T090 [US4] Run `pnpm test:export` in `contracts-ui-builder/` to verify exported apps build correctly
- [ ] T091 [US4] Manually export a test form and verify generated `package.json` has correct dependencies
- [ ] T092 [US4] Verify exported app runs correctly with `npm install && npm run dev`

**Checkpoint**: US4 complete - exported apps use new packages and build successfully

---

## Phase 7: User Story 5 - Developer Uses Example App as Reference (Priority: P2)

**Goal**: Example app demonstrates 5 key components for developer reference

**Independent Test**: Run `pnpm dev` in examples directory and see working component demos

### Implementation for User Story 5

- [ ] T093 [P] [US5] Create Vite + React project at `openzeppelin-ui/examples/basic-react-app/`
- [ ] T094 [US5] Configure example app `openzeppelin-ui/examples/basic-react-app/package.json` with workspace deps
- [ ] T095 [US5] Create example Button usage in `openzeppelin-ui/examples/basic-react-app/src/components/ButtonDemo.tsx`
- [ ] T096 [US5] Create example Input usage in `openzeppelin-ui/examples/basic-react-app/src/components/InputDemo.tsx`
- [ ] T097 [US5] Create example Select usage in `openzeppelin-ui/examples/basic-react-app/src/components/SelectDemo.tsx`
- [ ] T098 [US5] Create example Form usage in `openzeppelin-ui/examples/basic-react-app/src/components/FormDemo.tsx`
- [ ] T099 [US5] Create example FormRenderer usage in `openzeppelin-ui/examples/basic-react-app/src/components/RendererDemo.tsx`
- [ ] T100 [US5] Create main App component at `openzeppelin-ui/examples/basic-react-app/src/App.tsx` showcasing all demos
- [ ] T101 [US5] Add example app to workspace and verify it builds with `pnpm build`
- [ ] T102 [US5] Verify example app runs with `pnpm dev` and displays all 5 component demos

**Checkpoint**: US5 complete - example app demonstrates Button, Input, Select, Form, FormRenderer

---

## Phase 8: User Story 6 - Existing Consumer Migrates Imports (Priority: P2)

**Goal**: Migration guide helps existing consumers update to new package names

**Independent Test**: Follow migration guide steps in a test project and verify success

### Implementation for User Story 6

- [ ] T103 [US6] Create migration guide at `openzeppelin-ui/docs/MIGRATION.md` with step-by-step instructions
- [ ] T104 [US6] Document package name mapping in migration guide (old → new names)
- [ ] T105 [US6] Document find-and-replace commands for import updates in migration guide
- [ ] T106 [US6] Document dependency update commands in migration guide
- [ ] T107 [US6] Add troubleshooting section for common migration issues in migration guide
- [ ] T108 [US6] Link migration guide from root `openzeppelin-ui/README.md`

**Checkpoint**: US6 complete - migration guide provides clear path for existing consumers

---

## Phase 9: Cleanup (UI Builder Repository)

**Purpose**: Remove migrated packages and finalize UI Builder repo

- [ ] T109 Remove `contracts-ui-builder/packages/types/` directory
- [ ] T110 Remove `contracts-ui-builder/packages/utils/` directory
- [ ] T111 Remove `contracts-ui-builder/packages/styles/` directory
- [ ] T112 Remove `contracts-ui-builder/packages/ui/` directory
- [ ] T113 Remove `contracts-ui-builder/packages/renderer/` directory
- [ ] T114 Remove `contracts-ui-builder/packages/react-core/` directory
- [ ] T115 Remove `contracts-ui-builder/packages/storage/` directory
- [ ] T116 Update `contracts-ui-builder/pnpm-workspace.yaml` to reflect removed packages
- [ ] T117 Run final verification: `pnpm install && pnpm build && pnpm test` in `contracts-ui-builder/`
- [ ] T118 Create changeset for UI Builder migration update

**Checkpoint**: UI Builder repo cleaned up, all migrated packages removed

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple areas

- [ ] T119 [P] Configure Renovate/Dependabot for `openzeppelin-ui/` repo
- [ ] T120 Verify no "UI Builder" references remain in new repo (README, JSDoc, errors, package.json)
- [ ] T121 Run `openzeppelin-ui/` quickstart.md verification checklist
- [ ] T122 Create PR for UI Builder migration changes with comprehensive description

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) → Phase 2 (Foundational) → [Phase 3-8 User Stories] → Phase 9 (Cleanup) → Phase 10 (Polish)
                                                    ↓
                                         Sequential by priority:
                                         US1 (P1) → US2 (P1) → US3 (P1) → US4 (P1) → US5 (P2) → US6 (P2)
```

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase
  - US1 must complete before US2 (US2 publishes packages documented in US1)
  - US2 must complete before US3/US4 (packages must be on npm)
  - US3 and US4 can run in parallel after US2
  - US5 and US6 can start after US2 (depend only on packages existing)
- **Cleanup (Phase 9)**: Depends on US3 and US4 completion
- **Polish (Phase 10)**: Depends on Cleanup

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
| ----- | ---------- | -------------------- |
| US1   | Phase 2    | (none - first story) |
| US2   | US1        | (none - publishes)   |
| US3   | US2        | US4, US5, US6        |
| US4   | US2        | US3, US5, US6        |
| US5   | US2        | US3, US4, US6        |
| US6   | US2        | US3, US4, US5        |

### Parallel Opportunities

**Phase 1 (Setup)**:

- T003, T004, T005, T006, T007, T008 can all run in parallel

**Phase 2 (Foundational)**:

- T011-T017 (package copying) - all 7 packages in parallel
- T018-T024 (package.json updates) - all 7 in parallel
- T025-T031 (tsdown configs) - all 7 in parallel
- T037-T041 (workspace deps) - all 5 packages in parallel

**User Stories**:

- T053-T059 (README creation) - all 7 in parallel
- US3/US4/US5/US6 can run in parallel after US2 completes

---

## Parallel Example: Phase 2.1 Package Migration

```bash
# Launch all package copies together (7 parallel tasks):
T011: Copy types/ to openzeppelin-ui/packages/types/
T012: Copy utils/ to openzeppelin-ui/packages/utils/
T013: Copy styles/ to openzeppelin-ui/packages/styles/
T014: Copy ui/ to openzeppelin-ui/packages/components/
T015: Copy renderer/ to openzeppelin-ui/packages/renderer/
T016: Copy react-core/ to openzeppelin-ui/packages/react/
T017: Copy storage/ to openzeppelin-ui/packages/storage/
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (documentation ready)
4. Complete Phase 4: User Story 2 (packages published)
5. **STOP and VALIDATE**: Verify packages on npm, installable in fresh project
6. Deploy/demo if ready

### Full Migration (All P1 Stories)

1. Complete MVP (US1 + US2)
2. Complete US3: UI Builder works with npm packages
3. Complete US4: Exported apps use new packages
4. **STOP and VALIDATE**: Full production readiness
5. Complete Phase 9: Cleanup UI Builder repo

### Incremental Delivery

| Milestone  | Stories   | Value Delivered                           |
| ---------- | --------- | ----------------------------------------- |
| MVP        | US1 + US2 | Packages on npm, usable by internal teams |
| Production | US3 + US4 | UI Builder fully migrated, exports work   |
| Complete   | US5 + US6 | Example app + migration guide             |

---

## Summary

| Category     | Tasks              | Scope                             |
| ------------ | ------------------ | --------------------------------- |
| Setup        | T001-T010, T010a-c | New repo initialization + docs    |
| Foundational | T011-T052, T046a   | Package migration, CI/CD, CI perf |
| US1 (P1)     | T053-T062          | Documentation, npm readiness      |
| US2 (P1)     | T063-T070, T070a   | Publishing, provenance, runbook   |
| US3 (P1)     | T071-T084          | UI Builder migration              |
| US4 (P1)     | T085-T092          | Export pipeline updates           |
| US5 (P2)     | T093-T102          | Example app                       |
| US6 (P2)     | T103-T108          | Migration guide                   |
| Cleanup      | T109-T118          | Remove old packages               |
| Polish       | T119-T122          | Final touches                     |

**Total Tasks**: 127 (125 + 4 new - 3 moved = 126, plus T046a = 127)  
**Parallel Opportunities**: 55 tasks marked [P]  
**MVP Scope**: Phases 1-4 (T001-T070a) = 74 tasks  
**Format Validation**: All tasks follow `- [ ] TXXX [P?] [US?] Description with file path`
