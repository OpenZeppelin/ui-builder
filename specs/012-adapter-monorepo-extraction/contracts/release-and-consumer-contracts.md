# Release And Consumer Contracts: Adapter Monorepo Extraction

**Feature**: 012-adapter-monorepo-extraction  
**Date**: 2026-03-18

## Overview

This document defines the operational contracts that must hold between the new `openzeppelin-adapters` repository and its consumers. The goal is to preserve release behavior, exported app correctness, and local development ergonomics while moving adapter ownership into a separate monorepo.

---

## 1. Published Package Contract

### Public Packages

The new adapter repo MUST publish these packages under the `@openzeppelin/adapter-*` namespace:

| Current Package                             | Target Package                   |
| ------------------------------------------- | -------------------------------- |
| `@openzeppelin/ui-builder-adapter-evm`      | `@openzeppelin/adapter-evm`      |
| `@openzeppelin/ui-builder-adapter-midnight` | `@openzeppelin/adapter-midnight` |
| `@openzeppelin/ui-builder-adapter-polkadot` | `@openzeppelin/adapter-polkadot` |
| `@openzeppelin/ui-builder-adapter-solana`   | `@openzeppelin/adapter-solana`   |
| `@openzeppelin/ui-builder-adapter-stellar`  | `@openzeppelin/adapter-stellar`  |

### Internal Package

`@openzeppelin/adapter-evm-core` moves into the new repo but remains an internal/private workspace package bundled into public adapters rather than published as a standalone runtime dependency.

### Rules

- Public adapter packages release as one linked version set.
- Public package metadata MUST point at the new repository.
- Consumer-facing entry points already used by downstream repos MUST remain compatible.

---

## 2. Release Channel Contract

### Adapter Repository Responsibilities

The new adapter repo MUST:

1. Create or update a Changesets release PR on merges to `main`
2. Publish RC builds to the npm `rc` channel
3. Publish stable releases only after release preparation is complete
4. Produce release provenance for stable published packages

### Consumer Responsibilities

Consumers MUST:

1. Resolve their own required adapter versions from published metadata
2. Not rely on pushed sync commits from the adapter repo
3. Treat `rc` as the staging validation channel
4. Treat stable published versions as the production channel

---

## 3. `ui-builder` Export Version Contract

`ui-builder` owns generated application package references and MUST keep them synchronized with published adapter versions.

### Required Behavior

- `scripts/update-export-versions.cjs` remains the source for generating `apps/builder/src/export/versions.ts`
- `apps/builder/src/export/versions.ts` remains the single canonical Builder artifact for generated application package version references
- Non-release PRs continue to validate that `versions.ts` is synchronized
- Release PRs continue to auto-update `versions.ts` and related export snapshots
- After extraction, adapter versions in that script MUST be resolved from published npm metadata instead of local adapter workspace manifests

### Environment Resolution Rules

| Environment  | Adapter Version Source        |
| ------------ | ----------------------------- |
| `local`      | local path/workspace override |
| `staging`    | npm `rc` channel              |
| `production` | stable published version set  |

### Verification Targets

- `apps/builder/src/export/__tests__/VersioningSafetyGuard.test.ts`
- `apps/builder/src/export/__tests__/PackageManager.test.ts`
- `apps/builder/src/export/__tests__/PackageManagerConfigLoading.test.ts`
- `.github/workflows/check-versions.yml`
- `.github/workflows/update-versions.yml`

---

## 4. Staging And Production Deployment Contract

### `ui-builder` Responsibilities

`ui-builder` remains the deployment orchestrator for its own application environments.

- Staging deployment remains owned by `ui-builder`
- Production deployment remains owned by `ui-builder`
- Staging workflows MUST resolve adapter versions from the `rc` channel
- Production workflows MUST resolve stable adapter versions

### Triggering Rules

- Builder code changes continue to use existing Builder-triggered workflows
- Adapter-only changes MUST still be testable in staging via a Builder-owned trigger path, with `workflow_dispatch` retained as the minimum explicit deployment path when no Builder code changed
- Staging redeploy requirements MUST not depend on the adapter repo pushing version updates or dispatch events into consumer repositories

---

## 5. Local Development Contract

Consumers MUST keep a supported path for local sibling-repo adapter development.

### Canonical Contract

- Canonical adapter repo path variable: `LOCAL_ADAPTERS_PATH`
- Resolution mechanism: `.pnpmfile.cjs` rewrites from published package names to local `file:` references
- Consumer scripts SHOULD provide `dev:local` and `dev:npm` entry points where they already exist today

### Compatibility Rules

- Existing consumer-specific variables such as `LOCAL_UI_BUILDER_PATH` MAY remain as compatibility aliases during migration
- Documentation MUST describe the canonical path variable and any temporary aliases
- Consumer repositories MUST converge toward the canonical variable and package-map contract rather than preserving permanent divergent local-linking conventions

---

## 6. Consumer Compatibility Contract

### `role-manager`

- Must continue to resolve root and subpath entry points such as `/metadata` and `/networks`
- Must preserve dynamic ecosystem loading behavior

### `openzeppelin-ui`

- Example app must remain able to consume adapter packages from npm and local sibling checkouts

### `rwa-wizard`

- Manifest-level adapter dependencies and local development hooks must be updated even if runtime imports are limited today
- A lagging `rwa-wizard` migration does not block other consumers from adopting the new packages, but migration completion cannot be declared until its manifests, local-dev hooks, and docs are updated

---

## 7. Migration Contract

When the migration is complete:

- No maintained consumer repository should reference `@openzeppelin/ui-builder-adapter-*`
- `ui-builder` should no longer carry adapter package source directories
- The adapter repo should be the sole source of truth for adapter implementation, release automation, patch assets, and adapter-specific build support

During rollout:

- Consumers that have not yet migrated may remain on the last stable legacy adapter versions until they adopt the new package names
- No new functionality introduced after rollout begins may depend on legacy package naming

---

## 8. Governance And Preconditions Contract

- The constitution amendment ratifying the adapter repository boundary must merge before any implementation PR that modifies protected branches, release automation, or the production migration path is merged
- Governance documents affected by the repository-boundary change, including release contracts and local-development instructions, must be updated in the same ratified migration documentation set
- Reviewers should treat the constitution amendment and migration-document updates as formal merge gates for implementation readiness
