# Quickstart: Adapter Monorepo Extraction

**Feature**: 012-adapter-monorepo-extraction  
**Date**: 2026-03-18

## Prerequisites

- Node.js >= 20.19.0
- pnpm 10.x
- Access to create `OpenZeppelin/openzeppelin-adapters`
- npm publish permissions for `@openzeppelin/adapter-*`
- GitHub App and npm publish credentials for the new adapter repo
- Local checkouts of `ui-builder`, `openzeppelin-ui`, `role-manager`, and `rwa-wizard`

## Phase 0: Governance Baseline

Before implementation work that affects protected branches, release automation, or the production migration path proceeds:

- verify the ratified constitution amendment covering adapter repository ownership is the governing baseline
- update the release contract and local-development documentation set so they stay aligned with that ratified amendment

## Phase 1: Create The New Adapter Repository

### Step 1.1: Initialize Repository Structure

```bash
# Create the new repo under the OpenZeppelin org, then clone it locally
git clone git@github.com:OpenZeppelin/openzeppelin-adapters.git
cd openzeppelin-adapters
```

### Step 1.2: Copy Adapter Packages And Support Assets

From `ui-builder/`, migrate:

- `packages/adapter-evm`
- `packages/adapter-evm-core`
- `packages/adapter-midnight`
- `packages/adapter-polkadot`
- `packages/adapter-solana`
- `packages/adapter-stellar`
- `patches/`
- `scripts/sync-patches-to-adapters.js`
- `scripts/validate-adapter-vite-configs.cjs`
- `scripts/remove-midnight-sourcemaps.js`

### Step 1.3: Copy Root Tooling

Copy/adapt the adapter-relevant root files from `ui-builder/`, but use `openzeppelin-ui` as the template for package build tooling:

- `package.json`
- `.changeset/config.json`
- `.npmrc`
- `.nvmrc`
- `.prettierrc.cjs`
- `eslint.config.cjs`
- `tsconfig.base.json`
- `tsconfig.json`
- `tsconfig.node.json`
- `vitest.shared.config.ts`
- `.github/actions/prepare/action.yml`

From `openzeppelin-ui/`, mirror the package build conventions:

- root `tsdown` dependency and scripts in `package.json`
- package-level `tsdown.config.ts`
- package `build` scripts using `tsdown`

### Step 1.4: Standardize On `tsdown`

Use `tsdown` instead of `tsup` in the new adapter repo:

- add `tsdown` to the new repo root dev dependencies
- convert package build scripts to `tsdown`
- create package-level `tsdown.config.ts` files based on `openzeppelin-ui/packages/*/tsdown.config.ts`
- preserve any adapter-specific externalization/bundling behavior when converting configs

## Phase 2: Rebrand Package Metadata

### Step 2.1: Rename Packages

Update package names and repository metadata:

- `@openzeppelin/ui-builder-adapter-evm` -> `@openzeppelin/adapter-evm`
- `@openzeppelin/ui-builder-adapter-evm-core` -> `@openzeppelin/adapter-evm-core`
- `@openzeppelin/ui-builder-adapter-midnight` -> `@openzeppelin/adapter-midnight`
- `@openzeppelin/ui-builder-adapter-polkadot` -> `@openzeppelin/adapter-polkadot`
- `@openzeppelin/ui-builder-adapter-solana` -> `@openzeppelin/adapter-solana`
- `@openzeppelin/ui-builder-adapter-stellar` -> `@openzeppelin/adapter-stellar`

### Step 2.2: Preserve Internal Packaging Rules

- Keep `adapter-evm-core` internal/private and bundled into public adapters
- Preserve Midnight patch/runtime support in the new repo
- Preserve subpath exports used by current consumers

## Phase 3: Configure Release Automation

### Step 3.1: Stable Release Workflow

Set up Changesets stable publishing in the new repo so merges to `main`:

1. create or update the release PR
2. publish stable adapter packages after the release PR merge
3. generate release provenance

### Step 3.2: RC Release Workflow

Set up RC publication in the new repo so merges to `main` also:

1. publish the linked public adapter set to the npm `rc` channel
2. make the latest RC set available to consumers without pushing version sync commits downstream

### Step 3.3: Verify Repo Build

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

## Phase 4: Update `ui-builder`

### Step 4.1: Replace Old Adapter Package Names

Update:

- `apps/builder/src/core/ecosystemManager.ts`
- `apps/builder/src/config/wallet/rainbowkit.config.ts`
- `apps/builder/src/export/PackageManager.ts`
- `apps/builder/src/export/versions.ts`
- `apps/builder/src/export/cli/export-app.cjs`
- related export tests and snapshots

### Step 4.2: Preserve Export Version Flow

Adjust `scripts/update-export-versions.cjs` so that:

- adapter versions come from published npm metadata
- staging resolves adapter versions from the `rc` channel
- production resolves stable adapter versions
- `apps/builder/src/export/versions.ts` remains synchronized and validated by CI

### Step 4.3: Preserve Deployment Ownership

Keep `ui-builder` responsible for:

- staging deployment (`docker-stg.yaml`)
- production deployment (`docker-prod.yaml`)
- export-version validation (`check-versions.yml`)
- release PR version sync (`update-versions.yml`)

Retain a Builder-owned trigger path for staging redeploys after adapter-only RC publishes, with `workflow_dispatch` as the minimum explicit mechanism when no Builder code changes are present.

## Phase 5: Update Downstream Consumers

### Step 5.1: `openzeppelin-ui`

Update:

- example app dependencies/imports
- `.pnpmfile.cjs`
- `dev:local` / `dev:npm` scripts

### Step 5.2: `role-manager`

Update:

- adapter dependencies/imports and subpath usage
- `.pnpmfile.cjs`
- local dev scripts

### Step 5.3: `rwa-wizard`

Update:

- adapter dependency declarations
- `.pnpmfile.cjs`
- local dev scripts
- docs/readme references

### Step 5.4: Converge Local Development Naming

Across consumer repos:

- standardize on `LOCAL_ADAPTERS_PATH` as the canonical adapter repo path variable
- document any temporary compatibility aliases such as `LOCAL_UI_BUILDER_PATH`
- remove permanent divergence in package-map/local-dev instructions

## Phase 6: Verification

### Step 6.1: Verify New Adapter Repo

- RC publication works for the linked public adapter set
- stable release PR is created and merges cleanly
- stable package publish succeeds with provenance

### Step 6.2: Verify `ui-builder`

```bash
pnpm install
pnpm build
pnpm test
pnpm test:export
```

### Step 6.3: Verify Staging Flow

1. Publish an adapter RC from `openzeppelin-adapters`
2. Run the Builder-owned staging deployment path
3. Confirm staging exports resolve adapter versions from the `rc` channel

### Step 6.4: Verify Production Flow

1. Merge the adapter release PR
2. Confirm stable packages are published
3. Confirm `ui-builder` resolves stable adapter versions
4. Publish the Builder production release and verify deployment

## Final Success Checks

- [ ] Public adapters publish from `openzeppelin-adapters`
- [ ] `ui-builder` no longer owns adapter source packages
- [ ] `apps/builder/src/export/versions.ts` stays synchronized from published metadata
- [ ] Staging validates adapter RCs without downstream push syncs from the adapter repo
- [ ] Production exports and deployments resolve stable adapter versions
- [ ] `role-manager`, `openzeppelin-ui`, and `rwa-wizard` are updated for new package names and local dev paths
