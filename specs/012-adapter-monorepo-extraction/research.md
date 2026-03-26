# Research: Adapter Monorepo Extraction

**Feature**: 012-adapter-monorepo-extraction  
**Date**: 2026-03-18

## Research Tasks

### 1. Release Ownership Split

**Decision**: The new `openzeppelin-adapters` repo owns adapter RC publication, stable publication, and release PR management, while `ui-builder` remains the deployment orchestrator for staging and production.

**Rationale**: This preserves the current operational shape as closely as possible while avoiding tight coupling between package publishing and application deployment. Adapter release automation belongs with the adapter repo, but staging and production UI deployments still belong with `ui-builder`, because they are builder app concerns rather than package concerns.

**Alternatives Considered**:

- Adapter repo owns full end-to-end deployment - Rejected: it would centralize application deployment logic in a package repo and create unnecessary cross-repo coupling.
- Cross-repo orchestration pushed into every consumer - Rejected: it would make the adapter repo responsible for downstream sync behavior across multiple consumers.

---

### 2. Consumer-Owned Version Resolution

**Decision**: Each consumer repository resolves the adapter versions it needs from published npm metadata inside its own workflows; the adapter repo does not push version updates into consumers.

**Rationale**: Multiple repositories consume adapters, and each has different operational responsibilities. Keeping version resolution local to each consumer scales better, keeps ownership clear, and avoids a fragile fan-out model where the adapter repo must know every downstream integration path.

**Alternatives Considered**:

- Adapter repo opens update PRs or pushes sync commits to consumers - Rejected: operationally brittle and misaligned with the chosen ownership model.
- Shared downstream registry of consumer states - Rejected: unnecessary complexity for an internal package migration.

---

### 3. `versions.ts` Remains a First-Class Builder Contract

**Decision**: `apps/builder/src/export/versions.ts` remains a critical Builder-owned artifact, and `ui-builder` keeps the workflows that validate and update it; the update logic must change from reading local adapter workspace package versions to resolving published adapter metadata.

**Rationale**: Today `check-versions.yml`, `update-versions.yml`, `scripts/update-export-versions.cjs`, and export tests all treat `versions.ts` as the generated source of truth for exported app package references. Extraction changes where adapter versions come from, but does not remove the Builder's need to maintain synchronized export metadata.

**Alternatives Considered**:

- Remove `versions.ts` and resolve package versions only at runtime - Rejected: exported applications need concrete dependency references and stable test coverage.
- Have the adapter repo own Builder export metadata - Rejected: export metadata is a consumer concern, not a package publisher concern.

---

### 4. Release Channel Strategy

**Decision**: Staging resolves adapter versions from the npm `rc` dist-tag at runtime, while production resolves stable published versions. `ui-builder` remains responsible for selecting the right channel by environment.

**Rationale**: This matches the clarified spec and preserves the Builder's current environment-based export behavior. It also avoids the adapter repo needing to maintain consumer-specific manifests while still allowing consumers to validate RC builds independently.

**Alternatives Considered**:

- Push concrete RC versions into every consumer - Rejected: conflicts with consumer-owned version resolution.
- Publish a release manifest that every consumer must ingest - Rejected: adds an extra synchronization system without solving a proven problem.

---

### 5. Staging Redeploy Strategy After Extraction

**Decision**: `ui-builder` staging deployment should remain runnable from `ui-builder` itself, with `workflow_dispatch` retained as the explicit mechanism to redeploy Builder against the latest published adapter RC set after extraction.

**Rationale**: Today `docker-stg.yaml` already supports `workflow_dispatch`, and after extraction there may be adapter RC publishes without Builder code changes. Using a Builder-owned manual staging redeploy keeps the consumer in control of its environment resolution without requiring the adapter repo to trigger downstream pipelines.

**Alternatives Considered**:

- Adapter repo triggers `repository_dispatch` into `ui-builder` - Rejected: effectively reintroduces downstream push orchestration from the package repo.
- Scheduled polling by `ui-builder` for new RCs - Rejected: less predictable for QA and adds unnecessary background automation.

---

### 6. Linked Versioning for Public Adapters

**Decision**: Preserve linked Changesets versioning for the public adapter family so public adapters continue to release as one coordinated version set.

**Rationale**: The current repository already links public adapter versions, and the clarified spec explicitly keeps that behavior. Linked versioning reduces compatibility ambiguity across ecosystem packages and simplifies staging/production validation while extraction is already introducing structural change.

**Alternatives Considered**:

- Fully independent versioning - Rejected: increases coordination and compatibility overhead during a migration that already changes repo boundaries and package names.
- Hybrid versioning - Rejected: premature complexity without a clear business need today.

---

### 7. `adapter-evm-core` Treatment

**Decision**: Migrate `adapter-evm-core` into the new repo as an internal/private workspace package and preserve the current bundling model where EVM and Polkadot adapters include it rather than depend on a separately published runtime package.

**Rationale**: The current implementation marks `adapter-evm-core` private and bundles it via `noExternal`. Preserving that design minimizes external API churn, avoids exposing an accidental public contract, and keeps the extraction focused on repo/package ownership rather than redesigning internal adapter layering.

**Alternatives Considered**:

- Publish `adapter-evm-core` as a new standalone public package - Rejected: expands public surface area and introduces a new compatibility promise not required for the migration.
- Inline EVM core logic into each adapter - Rejected: duplicates shared behavior and violates reuse-first principles.

---

### 8. Midnight Patch and Runtime Support

**Decision**: Move Midnight-specific patch assets and support scripts into the new adapter repo alongside `adapter-midnight`, and keep `ui-builder`/export flows consuming the published package behavior rather than owning Midnight patch maintenance.

**Rationale**: Midnight support currently depends on root-level patch files and scripts such as `sync-patches-to-adapters.js` and `remove-midnight-sourcemaps.js`. Those assets are adapter implementation concerns and should move with the adapter repo to avoid split ownership.

**Alternatives Considered**:

- Leave Midnight patch assets in `ui-builder` - Rejected: creates hidden build dependencies from the new adapter repo back into `ui-builder`.
- Redesign Midnight support during extraction - Rejected: combines architecture migration with business-logic change.

---

### 9. Local Development Contract

**Decision**: Preserve local sibling-repo development through `.pnpmfile.cjs` hooks, and standardize on `LOCAL_ADAPTERS_PATH` as the canonical adapter repo path variable.

**Rationale**: Multiple consumer repos already support local adapter linking, but the naming was inconsistent. Standardizing on one path variable improves maintainability, reduces onboarding ambiguity, and keeps the local-dev contract smaller.

**Alternatives Considered**:

- Leave each repo with unrelated environment variable names forever - Rejected: encourages documentation drift and duplicated troubleshooting.
- Replace local linking with manual dependency edits - Rejected: error-prone and slower for cross-repo development.

---

### 10. New Repository Bootstrap Baseline

**Decision**: Bootstrap `openzeppelin-adapters` by copying and adapting the existing adapter-oriented root configs, scripts, and workflows from `ui-builder` rather than inventing a fresh toolchain.

**Rationale**: The adapter packages already build and release successfully in the current monorepo, but the extracted repo should not carry forward deprecated bundling tooling. Reusing `pnpm`, Changesets, Vitest, the `prepare` GitHub Action, and existing support scripts while adopting `tsdown` from `openzeppelin-ui` gives the new repo a modern, already-proven package build template.

**Alternatives Considered**:

- Start the new repo from a blank template - Rejected: discards proven release/build conventions and increases migration risk.
- Keep `tsup` in the new repo - Rejected: `tsup` is deprecated, and `openzeppelin-ui` already provides an internal `tsdown` template we can mirror.

---

### 11. Package Build Tooling

**Decision**: Use `tsdown` for adapter package builds in `openzeppelin-adapters`, following the package-level `tsdown.config.ts` and `build: "tsdown"` pattern already used in `openzeppelin-ui`.

**Rationale**: `tsdown` is the current bundler direction inside OpenZeppelin shared package infrastructure, and `openzeppelin-ui` already demonstrates the desired package structure and configuration style. Using the same build tool reduces maintenance overhead and keeps package-repo conventions aligned across internal monorepos.

**Alternatives Considered**:

- Preserve current `tsup` configs as-is - Rejected: deprecated tooling should not be the basis for a new monorepo.
- Change bundlers later after extraction - Rejected: it would create unnecessary follow-up migration work immediately after repo creation.

---

## Resolved Clarifications

| Item                  | Resolution                                   |
| --------------------- | -------------------------------------------- |
| Release ownership     | Adapter repo publishes; `ui-builder` deploys |
| Consumer version sync | Consumers resolve published metadata locally |
| Versioning strategy   | Linked release group                         |
| Staging RC selection  | Resolve from npm `rc` dist-tag               |

---

## Dependencies Verified

| Dependency                                        | Status    | Notes                                                          |
| ------------------------------------------------- | --------- | -------------------------------------------------------------- |
| New GitHub repository creation                    | Pending   | Requires OpenZeppelin org access                               |
| npm package names under `@openzeppelin/adapter-*` | Pending   | Must be reserved/available before first publish                |
| GitHub App and npm credentials                    | Pending   | Needed in the new adapter repo and existing consumer repos     |
| Existing `ui-builder` release/version scripts     | Available | Can be adapted rather than rewritten from scratch              |
| Local development hooks across consumers          | Available | Existing `.pnpmfile.cjs` patterns can be reused and normalized |
