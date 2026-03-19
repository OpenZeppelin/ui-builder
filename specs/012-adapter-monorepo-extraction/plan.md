# Implementation Plan: Adapter Monorepo Extraction

**Branch**: `012-adapter-monorepo-extraction` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-adapter-monorepo-extraction/spec.md`

## Summary

Extract the adapter packages from `ui-builder` into a new `openzeppelin-adapters` monorepo while preserving the current release behavior as closely as possible. The new repo will own linked adapter package releases, RC publication, stable publication, and release PR management, while `ui-builder` will remain responsible for staging deployment, production deployment, exported app version references, and resolving the correct published adapter versions for each environment.

The design keeps consumer repositories self-sufficient: `ui-builder`, `role-manager`, `openzeppelin-ui`, and `rwa-wizard` will resolve adapter versions from published npm metadata instead of receiving pushed sync commits from the adapter repo. The plan also preserves key operational contracts that exist today, especially the importance of `apps/builder/src/export/versions.ts`, release-channel handling (`rc` for staging, stable for production), linked adapter versioning, and the special handling required by `adapter-evm-core` bundling and Midnight patches.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js >= 20.19.0  
**Primary Dependencies**: pnpm 10.x, `@changesets/cli`, tsdown, Vitest, React 19, Vite 7, GitHub Actions, npm dist-tags  
**Storage**: N/A for application data; npm registry, git, and generated export metadata files are the operational persistence layer  
**Testing**: Vitest unit/integration tests, export tests, workflow-based release validation  
**Target Platform**: npm-published adapter packages consumed by internal React/Vite applications and GitHub Actions release pipelines  
**Project Type**: Multi-repo monorepo extraction with one new package monorepo and coordinated updates across consumer repos  
**Performance Goals**: Preserve same-day RC/stable availability, keep exported app version references synchronized before release merge, and keep local repo switching within 10 minutes  
**Constraints**: Preserve linked adapter releases; `ui-builder` keeps staging/production orchestration; consumers resolve versions from published metadata; staging resolves `rc` channel while production resolves stable versions; maintain exported app compatibility; preserve subpath entry points used by consumers; keep Midnight patch/runtime support intact  
**Scale/Scope**: 6 migrated adapter packages total, 5 public publishable adapters plus 1 internal bundled core package, 4 consuming repositories, multiple GitHub workflows spanning release, deployment, and export verification

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                        | Status | Notes                                                                                                                                                         |
| ------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Chain-Agnostic Core, Adapter-Led Architecture | PASS   | The constitution now ratifies the dedicated adapter repository boundary while preserving adapter-led architecture and dynamic Builder ecosystem registration. |
| II. Type Safety, Linting, and Code Quality       | PASS   | Extraction preserves strict TypeScript, shared linting, and existing package quality gates.                                                                   |
| III. Tooling, Packaging, and Releases            | PASS   | Plan keeps `pnpm`, Changesets, CI publication, and dual-format package builds using `tsdown` aligned with `openzeppelin-ui`.                                  |
| IV. UI/Design System Consistency                 | PASS   | No new design-system divergence; consumers continue using shared `@openzeppelin/ui-*` packages.                                                               |
| V. Testing, Documentation, and Exported Apps     | PASS   | Exported app version resolution, export tests, and migration docs are explicit design requirements.                                                           |
| VI. Test-Driven Development for Business Logic   | PASS   | Work is primarily migration and infrastructure; existing business logic tests migrate and remain authoritative.                                               |
| VII. Reuse-First Development                     | PASS   | Plan reuses existing workflows, scripts, package patterns, and sibling-repo local development mechanisms where practical.                                     |

**Gate Result**: PASS - the constitution now ratifies adapter extraction into the dedicated adapter monorepo, so implementation can proceed subject to the remaining documented release and rollout constraints.

### Post-Design Re-Check (Phase 1 Complete)

| Principle                                        | Status | Notes                                                                                                                                                           |
| ------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Chain-Agnostic Core, Adapter-Led Architecture | PASS   | Design keeps chain-specific logic in adapter packages, preserves dynamic registration, and now aligns with the ratified adapter repository boundary.            |
| II. Type Safety, Linting, and Code Quality       | PASS   | Plan keeps TypeScript strictness, existing scripts, and workflow-based version guards.                                                                          |
| III. Tooling, Packaging, and Releases            | PASS   | Design explicitly preserves Changesets, RC and stable release channels, provenance workflows, and `tsdown`-based package builds aligned with `openzeppelin-ui`. |
| IV. UI/Design System Consistency                 | PASS   | UI contracts remain external to the adapter repo and continue to flow through `@openzeppelin/ui-*`.                                                             |
| V. Testing, Documentation, and Exported Apps     | PASS   | `versions.ts`, export tests, and environment-specific version resolution remain first-class design artifacts.                                                   |
| VI. Test-Driven Development for Business Logic   | PASS   | No new business-logic contract bypasses are introduced; migration keeps existing adapter behavior and tests.                                                    |
| VII. Reuse-First Development                     | PASS   | Design reuses current release, build scripts, local-dev hooks, and consumer integration patterns instead of inventing a parallel system.                        |

**Post-Design Gate**: PASS - design is constitutionally aligned, with release-flow sequencing and rollout validation remaining the key implementation gates.

## Project Structure

### Documentation (this feature)

```text
specs/012-adapter-monorepo-extraction/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── release-and-consumer-contracts.md
└── tasks.md
```

### Source Code - New Repository (`OpenZeppelin/openzeppelin-adapters`)

```text
openzeppelin-adapters/
├── .changeset/
│   └── config.json
├── .github/
│   ├── actions/
│   │   └── prepare/
│   └── workflows/
│       ├── ci.yml
│       ├── publish.yml
│       └── publish-rc.yml
├── packages/
│   ├── adapter-evm/
│   ├── adapter-evm-core/      # internal/private, bundled by public adapters
│   ├── adapter-midnight/
│   ├── adapter-polkadot/
│   ├── adapter-solana/
│   └── adapter-stellar/
├── docs/
│   ├── DEVOPS_SETUP.md
│   └── RUNBOOK.md
├── patches/
├── scripts/
│   ├── sync-patches-to-adapters.js
│   ├── validate-adapter-vite-configs.cjs
│   └── remove-midnight-sourcemaps.js
├── lint-adapters.cjs
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.cjs
├── vitest.shared.config.ts
└── README.md
```

### Source Code - `ui-builder` Updates

```text
ui-builder/
├── apps/
│   └── builder/
│       └── src/
│           ├── core/
│           │   └── ecosystemManager.ts
│           ├── config/
│           │   └── wallet/
│           └── export/
│               ├── PackageManager.ts
│               ├── versions.ts
│               ├── cli/
│               └── __tests__/
├── .github/
│   └── workflows/
│       ├── check-versions.yml
│       ├── update-versions.yml
│       ├── export-testing.yml
│       ├── docker-stg.yaml
│       └── docker-prod.yaml
├── .pnpmfile.cjs
├── package.json
├── docs/
│   └── LOCAL_DEVELOPMENT.md
└── packages/
    └── adapter-*              # removed after migration
```

### Source Code - Downstream Consumer Updates

```text
openzeppelin-ui/
├── .pnpmfile.cjs
├── package.json
└── examples/
    └── basic-react-app/

role-manager/
├── .pnpmfile.cjs
├── package.json
└── apps/role-manager/

rwa-wizard/
├── .pnpmfile.cjs
├── package.json
└── apps/rwa-wizard/
```

**Structure Decision**: Use a dedicated adapter monorepo plus coordinated consumer updates. Release automation splits cleanly by responsibility: the new adapter repo owns package publication, while `ui-builder` and other consumers keep their own dependency resolution and deployment workflows. `ui-builder` also keeps the Builder-owned canonical generated-application version artifact, `apps/builder/src/export/versions.ts`, and the staging redeploy trigger path for adapter-only RC validation. Rollout should be landed as focused phases so the initial adapter publish path is validated before consumer cutovers merge.

## Complexity Tracking

| Decision Area              | Why Needed                                                                                               | Simpler Alternative Rejected Because                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Focused rollout sequencing | Release-flow refactors and consumer cutovers carry different risks and need separate validation windows. | Landing all repo-boundary, release, and consumer changes together would make failures harder to isolate and raise rollback complexity. |
