# Implementation Plan: UI Kit Monorepo Extraction

**Branch**: `007-ui-kit-extraction` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-ui-kit-extraction/spec.md`

## Summary

Extract seven core packages (types, utils, styles, ui, renderer, react-core, storage) from the UI Builder monorepo into a new standalone `openzeppelin-ui` monorepo. The new repo will have independent CI/CD with changesets, SLSA provenance, and npm publishing. After packages are published at version 1.0.0, the UI Builder repo will be updated to consume them from npm, including updates to the export pipeline for generated apps.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: pnpm 10.x, tsdown (successor to tsup), @changesets/cli, React 19, Tailwind CSS 4, Radix UI primitives
**Storage**: N/A (npm registry for package distribution)
**Testing**: Vitest for unit/integration tests
**Target Platform**: npm registry (ESM + CJS dual builds), React 19+ applications
**Project Type**: Monorepo with 7 packages + example app
**Performance Goals**: CI pipeline < 10 minutes (SC-005)
**Constraints**: API-compatible with existing packages (FR-009), no breaking changes
**Scale/Scope**: 7 packages, ~500 source files total, internal OpenZeppelin consumers

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                  | Status | Notes                                                                          |
| -------------------------- | ------ | ------------------------------------------------------------------------------ |
| I. Chain-Agnostic Core     | PASS   | Extracting the chain-agnostic packages themselves; adapters stay in UI Builder |
| II. Type Safety & Linting  | PASS   | Will maintain strict TypeScript, eslint, prettier configs from source          |
| III. Tooling & Releases    | PASS   | pnpm workspaces, tsdown builds, changesets for versioning                      |
| IV. UI/Design System       | PASS   | styles package preserves Tailwind/shadcn design system                         |
| V. Testing & Exports       | PASS   | Vitest tests migrate with packages; export pipeline updated                    |
| VI. TDD for Business Logic | PASS   | No new business logic; migration preserves existing tests                      |
| VII. Reuse-First           | PASS   | Reusing existing CI workflows, configs, and patterns                           |

**Gate Result**: PASS - No violations. Proceed to Phase 0.

### Post-Design Re-Check (Phase 1 Complete)

| Principle                  | Status | Notes                                                            |
| -------------------------- | ------ | ---------------------------------------------------------------- |
| I. Chain-Agnostic Core     | PASS   | Extracted packages remain chain-agnostic; adapters stay separate |
| II. Type Safety & Linting  | PASS   | All config files preserved, strict TypeScript maintained         |
| III. Tooling & Releases    | PASS   | pnpm, tsdown, changesets all configured per contracts            |
| IV. UI/Design System       | PASS   | ui-styles package preserves design tokens and Tailwind config    |
| V. Testing & Exports       | PASS   | Vitest tests migrate; export pipeline updates documented         |
| VI. TDD for Business Logic | PASS   | No new business logic; existing tests preserved                  |
| VII. Reuse-First           | PASS   | Reusing CI workflows, configs; no unnecessary new abstractions   |

**Post-Design Gate**: PASS - Design artifacts align with constitution.

## Project Structure

### Documentation (this feature)

```text
specs/007-ui-kit-extraction/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (migration contracts)
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code - New Repository (OpenZeppelin/openzeppelin-ui)

```text
openzeppelin-ui/
├── .changeset/
│   └── config.json
├── .github/
│   ├── actions/
│   │   └── prepare/
│   │       └── action.yml
│   └── workflows/
│       ├── ci.yml
│       └── publish.yml
├── packages/
│   ├── types/           # @openzeppelin/ui-types
│   ├── utils/           # @openzeppelin/ui-utils
│   ├── styles/          # @openzeppelin/ui-styles
│   ├── components/      # @openzeppelin/ui-components (renamed from ui)
│   ├── renderer/        # @openzeppelin/ui-renderer
│   ├── react/           # @openzeppelin/ui-react (renamed from react-core)
│   └── storage/         # @openzeppelin/ui-storage
├── examples/
│   └── basic-react-app/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.cjs
├── .prettierrc.cjs
└── README.md
```

### Source Code - UI Builder Updates (contracts-ui-builder)

```text
contracts-ui-builder/
├── packages/
│   ├── builder/         # Updated to consume @openzeppelin/ui-* from npm
│   │   └── src/
│   │       └── export/
│   │           ├── PackageManager.ts  # Updated package names
│   │           └── versions.ts        # Updated version mappings
│   ├── adapter-evm/     # Updated imports
│   ├── adapter-stellar/ # Updated imports
│   ├── adapter-midnight/# Updated imports
│   └── adapter-solana/  # Updated imports
│   # REMOVED: types/, utils/, styles/, ui/, renderer/, react-core/, storage/
├── .changeset/
│   └── config.json      # Updated to exclude migrated packages
└── package.json         # Updated dependencies
```

**Structure Decision**: Monorepo pattern with pnpm workspaces, matching the existing UI Builder structure for consistency and familiarity.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | N/A        | N/A                                  |
