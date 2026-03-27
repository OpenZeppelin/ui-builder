# Feature Specification: Adapter Monorepo Extraction

**Feature Branch**: `012-adapter-monorepo-extraction`  
**Created**: 2026-03-18  
**Status**: Draft  
**Input**: User description: "Implement the adapter packages extraction into a separate monorepo. Use @ui-builder/specs/007-ui-kit-extraction as a template. Read proposal document on Notion (using MCP) named \"Proposal: Adapter Packages Extraction to Separate Repository\""

## Overview

Extract the ecosystem adapter packages from the `ui-builder` repository into a dedicated `openzeppelin-adapters` repository with independent release ownership and publishing under the `@openzeppelin` namespace while preserving coordinated linked versioning for the public adapter family. This gives internal OpenZeppelin products and future external contributors a clear home for adapter work, removes the remaining `ui-builder` naming dependency, and allows adapter releases to ship without waiting for the Builder application.

### Package Renaming

| Current Package Name                        | New Package Name                 |
| ------------------------------------------- | -------------------------------- |
| `@openzeppelin/ui-builder-adapter-evm`      | `@openzeppelin/adapter-evm`      |
| `@openzeppelin/ui-builder-adapter-evm-core` | `@openzeppelin/adapter-evm-core` |
| `@openzeppelin/ui-builder-adapter-stellar`  | `@openzeppelin/adapter-stellar`  |
| `@openzeppelin/ui-builder-adapter-midnight` | `@openzeppelin/adapter-midnight` |
| `@openzeppelin/ui-builder-adapter-polkadot` | `@openzeppelin/adapter-polkadot` |
| `@openzeppelin/ui-builder-adapter-solana`   | `@openzeppelin/adapter-solana`   |

### Scope Boundaries

#### In Scope

- Creating the dedicated adapter repository and release process
- Migrating all current adapter packages into that repository
- Updating consuming repositories to use the new package names
- Updating generated applications so they reference the new adapter packages
- Updating local cross-repository development workflows
- Preserving the current release lifecycle across release-candidate validation, release preparation, and production rollout
- Preserving `apps/builder/src/export/versions.ts` as the Builder-owned canonical source for generated application package version references
- Publishing migration guidance for internal consumers

#### Out of Scope

- Functional redesign of adapter behavior
- Introducing new adapter capabilities as part of the migration
- Maintaining deprecated wrapper packages under the old names
- Moving shared UI contracts that already belong to existing shared packages

## Clarifications

### Session 2026-03-18

- Q: Which repository owns the end-to-end release orchestration after extraction? → A: The new adapter repo owns adapter RC/stable publishing and release PRs, while `ui-builder` remains responsible for staging deployment, production deployment, and consuming the published adapter versions.
- Q: How should consuming repositories learn adapter versions after RC and stable publishes? → A: Each consumer, especially `ui-builder`, resolves the appropriate published adapter version within its own release and deployment workflows rather than receiving downstream syncs from the adapter repo.
- Q: Should adapter packages version independently or as a coordinated release set? → A: The adapter packages release together as one linked version set.
- Q: How should staging choose release-candidate adapter versions? → A: Staging resolves adapter versions from the published npm `rc` tag at runtime, while production resolves from the stable release set.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Product Maintainer Adopts Extracted Adapters (Priority: P1)

An internal product maintainer working on UI Builder, Role Manager, or RWA Wizard needs to depend on adapter packages from a dedicated repository and namespace without changing product behavior for end users.

**Why this priority**: This is the primary business outcome of the extraction. If consuming products cannot adopt the new packages safely, the repo split does not deliver value.

**Independent Test**: Update one consuming product to the new package names, complete a fresh dependency install, run its existing verification flow, and confirm adapter-driven user journeys still work.

**Acceptance Scenarios**:

1. **Given** a consuming product that still depends on legacy adapter package names, **When** the maintainer updates its dependencies and imports to the new package names, **Then** the product resolves the new packages successfully.
2. **Given** a consuming product updated to the new package names, **When** the maintainer runs its current verification flow, **Then** adapter-driven behavior remains equivalent to pre-migration behavior.
3. **Given** a consuming product that works with more than one ecosystem, **When** the maintainer upgrades to the extracted packages, **Then** ecosystem-specific behavior remains available through the same user-facing flows.

---

### User Story 2 - Adapter Maintainer Ships Independent Releases (Priority: P1)

An adapter maintainer needs to release a bug fix or new ecosystem support from the adapter repository without waiting for a UI Builder application release.

**Why this priority**: Independent release cadence is one of the main reasons for the extraction and is required to reduce bottlenecks across products.

**Independent Test**: Prepare a release in the new repository, publish the linked adapter release set, and verify that consumers can install the new version without any Builder app release.

**Acceptance Scenarios**:

1. **Given** changes to one or more adapter packages in the new repository, **When** a maintainer completes the release workflow, **Then** the linked public adapter release set is published from the adapter repository without requiring a Builder app release.
2. **Given** changes awaiting stable release, **When** the release-candidate workflow runs, **Then** pre-release package versions are made available for staging validation before stable publication.
3. **Given** a release preparation branch is created or updated, **When** the release metadata is synchronized, **Then** generated application version references are updated before stable publication.
4. **Given** a new adapter package version has been published, **When** a consuming product updates to that version, **Then** it can install the package without depending on a UI Builder release.
5. **Given** a release issue is detected after publication, **When** the maintainer performs the documented recovery process, **Then** the affected version is clearly marked as unusable and a corrected version can be published.

---

### User Story 3 - UI Builder Exports Applications With New Adapter Names (Priority: P1)

A UI Builder user exporting an application needs the generated project to reference only the new adapter package names so that the exported application remains installable and distributable.

**Why this priority**: Exported applications are user-facing deliverables. If they reference old package names after the migration, the extraction creates immediate downstream breakage.

**Independent Test**: Export an application from UI Builder after the migration, perform a fresh dependency install in the generated project, and confirm it completes its standard build successfully.

**Acceptance Scenarios**:

1. **Given** a UI Builder instance updated to the extracted adapter packages, **When** a user exports an application, **Then** the generated dependency manifest contains only the new adapter package names.
2. **Given** an exported application generated after the migration, **When** its maintainer performs a fresh dependency install and build, **Then** the exported application succeeds without manual dependency edits.
3. **Given** an exported application that uses adapter-backed functionality, **When** it is run after installation, **Then** the adapter-backed behavior matches the behavior seen before export.

---

### User Story 4 - Cross-Repo Developer Uses Local Adapter Sources (Priority: P2)

A developer working across sibling repositories needs to switch a consuming repository between published adapter packages and local adapter packages from the new repository without manual dependency rewriting.

**Why this priority**: Local cross-repository development is a core internal workflow. If this becomes brittle, iteration speed drops across multiple teams even if published packages work.

**Independent Test**: Follow the local-development instructions in a consuming repository, point it at a local checkout of the adapter repository, and confirm dependency resolution works without hand-editing dependency manifests.

**Acceptance Scenarios**:

1. **Given** a developer working in sibling repositories, **When** they enable local adapter development, **Then** the consuming repository resolves adapter packages from the local adapter repository.
2. **Given** a developer has been using local adapter packages, **When** they switch back to published packages, **Then** the consuming repository returns to standard published dependency resolution without cleanup steps.

---

### Edge Cases

- What happens if a consumer repository mixes legacy adapter package names and new package names during the migration window? The migration must fail clearly and direct the maintainer to complete the rename consistently.
- What happens if one adapter package is published successfully but a related consumer update is not yet merged? Consumers must remain on published legacy versions until their migration is complete, rather than relying on partially updated references.
- What happens if release-candidate packages are published but the staging environment still resolves stable versions? The migration must prevent staging validation from silently testing the wrong package set by resolving adapter versions from the published release-candidate channel during staging runs.
- What happens if adapter RC packages are published but no `ui-builder` code changed? A Builder-owned trigger path must still allow staging redeployment against the latest adapter RC set.
- What happens if a local development path points to the wrong repository or an outdated checkout? The workflow must surface a clear setup error instead of silently resolving the wrong package source.
- What happens if consumer repositories migrate on different schedules? Each consumer may remain on the last stable legacy adapter versions until it adopts the new package names, but migration completion cannot be declared until all in-scope consumers and docs are updated.
- What happens if the Solana adapter remains mostly placeholder code at migration time? It must either move as-is with the rest of the adapter family or be explicitly excluded from scope before release closeout.
- What happens if a newly published adapter version is found to be defective? Maintainers must have a documented recovery path that does not require restoring the old namespace.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST create a dedicated repository for the ecosystem adapter packages with its own release lifecycle and ownership boundary.
- **FR-002**: The migration MUST include the current EVM, EVM core, Stellar, Midnight, Polkadot, and Solana adapter packages in the new repository.
- **FR-003**: Each migrated package MUST be published under the new `@openzeppelin/adapter-*` naming scheme defined in the package renaming table.
- **FR-004**: Each migrated package MUST preserve the public behavior and externally consumed contract that current OpenZeppelin products rely on at the time of migration.
- **FR-005**: The first release of each migrated package in the new namespace MUST start at version `1.0.0`.
- **FR-006**: The new adapter repository MUST support releasing changed adapter packages without requiring a UI Builder application release.
- **FR-006a**: The migrated adapter packages MUST use linked versioning so the adapter family releases as one coordinated version set.
- **FR-007**: The new adapter repository MUST preserve the current three-step release lifecycle with these invariants unchanged: adapter RC publication precedes staging validation, release preparation occurs through a release pull request, stable adapter publication precedes production rollout, and `ui-builder` remains the owner of Builder deployment environments and generated application version references.
- **FR-008**: When changes that affect adapter packages are merged to the main branch of the new adapter repository, the release automation MUST create or update a release pull request for the pending stable release.
- **FR-009**: When changes that affect adapter packages are merged to the main branch of the new adapter repository, the release automation MUST publish release-candidate adapter package versions for staging validation before stable publication.
- **FR-010**: The new adapter repository MUST own adapter package release-candidate publication, stable publication, and release pull request management.
- **FR-011**: `ui-builder` MUST remain the system responsible for staging deployment, production deployment, and adoption of the published adapter package versions.
- **FR-012**: The release-candidate workflow MUST ensure that staging validation resolves adapter versions from the published release-candidate channel rather than the previous stable release set.
- **FR-012a**: `ui-builder` MUST provide a Builder-owned trigger path for staging redeployment against published adapter RC versions even when no Builder source code changed in the same cycle.
- **FR-013**: Each consuming repository MUST resolve the adapter package versions it needs from published package metadata within its own release or deployment workflows rather than relying on push-based synchronization from the adapter repository.
- **FR-014**: `ui-builder` MUST resolve adapter versions from the published release-candidate channel for staging workflows and from the stable release set for production workflows.
- **FR-015**: The `ui-builder` release preparation workflow MUST update the single canonical Builder source of generated-application package version references, `apps/builder/src/export/versions.ts`, and any coupled export snapshots before the stable release is merged so production exports reflect the released package set.
- **FR-016**: The stable release workflow MUST publish production adapter package versions only after the release preparation step is completed.
- **FR-017**: The stable release workflow MUST trigger production rollout only after the stable adapter package publication succeeds.
- **FR-018**: The new adapter repository MUST provide a standard verification and publishing workflow that confirms package quality before publication and produces verifiable release provenance.
- **FR-019**: UI Builder MUST replace all in-scope legacy adapter dependencies and references with the new package names.
- **FR-020**: UI Builder MUST generate exported applications that depend only on the new adapter package names after the migration.
- **FR-021**: UI Builder MUST remove the migrated adapter package directories and direct workspace references after it has adopted the published packages.
- **FR-022**: `openzeppelin-ui` MUST update its local development workflow so it can resolve adapter packages from the new adapter repository under the new names.
- **FR-023**: `role-manager` MUST update its dependencies, references, and local development workflow to the new adapter package names and repository location.
- **FR-024**: `rwa-wizard` MUST update its adapter dependencies and local development workflow to the new adapter package names for every adapter it consumes directly.
- **FR-025**: The migration MUST include documentation that maps old package names to new package names, explains how consuming repositories adopt the new source of truth, and defines the canonical local-development variable name plus any temporary compatibility aliases.
- **FR-026**: Deprecated wrapper packages under the old `@openzeppelin/ui-builder-adapter-*` names MUST NOT be published as part of this migration.
- **FR-027**: The migration MUST be executed sequentially so that the new adapter repository is published before consuming repositories switch to the new package names.
- **FR-027a**: The migration rollout MUST use focused implementation phases so the initial adapter publish path is validated before consumer-cutover PRs are merged.
- **FR-028**: The migration MUST define a release recovery process for defective published versions that allows maintainers to deprecate the affected version and publish a corrected replacement.
- **FR-029**: All maintained OpenZeppelin repositories included in scope for this migration MUST remove in-scope references to the legacy adapter package names before the migration is considered complete.
- **FR-029a**: Consumers that have not yet migrated MAY remain on the last stable legacy adapter versions until they adopt the new package names, but no new functionality may depend on legacy package naming after the migration rollout begins.
- **FR-030**: The migration MUST define a maintainability rule for local-development hooks and package maps so that consumer repositories converge on a canonical adapter path variable and documented compatibility strategy rather than permanent divergent configurations.
- **FR-031**: Implementation PRs that change protected branches, release automation, or the production migration path MUST comply with the ratified constitution amendment that authorizes the adapter repository boundary.
- **FR-032**: Governance artifacts affected by the repository-boundary change, including release contracts and local-development instructions, MUST be updated as part of the ratified migration documentation set.

### Key Entities _(include if feature involves data)_

- **Adapter Package**: A publishable package that encapsulates ecosystem-specific behavior and is consumed by one or more OpenZeppelin products.
- **Adapter Repository**: The dedicated repository that becomes the source of truth for the extracted adapter packages, their release lifecycle, and their documentation.
- **Consumer Repository**: A maintained OpenZeppelin repository, such as UI Builder, `openzeppelin-ui`, `role-manager`, or `rwa-wizard`, that installs or locally resolves adapter packages.
- **Exported Application**: A generated application produced by UI Builder that must include the correct adapter package names for downstream installation and distribution.
- **Migration Guide**: The documentation artifact that explains package renames, rollout order, and how teams move from legacy package names to the new namespace.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All six migrated adapter packages are installable from the new namespace within 5 minutes of their first public release.
- **SC-002**: UI Builder, `role-manager`, and `rwa-wizard` each complete their current release-blocking verification flow with zero adapter-related regressions after migration.
- **SC-003**: 100% of applications exported from UI Builder after the migration reference only the new adapter package names and complete a fresh dependency install and production build successfully.
- **SC-004**: A maintainer can publish a change to an adapter package and make it available to consumers on the same business day without waiting for a UI Builder application release.
- **SC-005**: 100% of adapter changes intended for release can be validated in staging using package versions resolved from the published release-candidate channel before the corresponding stable release is published.
- **SC-006**: Stable publication updates generated-application package version references in time for the production rollout, with no manual version edits required after release approval.
- **SC-007**: A developer can switch a consuming repository from published adapters to a local checkout of the adapter repository in under 10 minutes using the documented workflow.
- **SC-008**: 100% of in-scope maintained repositories and migration documentation eliminate in-scope `ui-builder-adapter` references before the migration is closed.

## Assumptions

- The new repository will be named `OpenZeppelin/openzeppelin-adapters`.
- The new public package namespace will be `@openzeppelin/adapter-*`.
- The Solana adapter will migrate with the rest of the adapter family, even if it remains an early-stage package.
- The migrated adapter packages will remain a linked release group rather than moving to fully independent versioning during this extraction.
- Shared contracts already owned by existing shared packages will remain there rather than being moved into the adapter repository.
- OpenZeppelin has the permissions needed to publish the new package names and configure release automation for the new repository.
- Consumer repository owners can coordinate their migration work once the new adapter packages are published.
- The adapter repository will own adapter package RC/stable publishing and release pull requests, while `ui-builder` will remain the deployment orchestrator for staging and production environments.
- Consuming repositories will resolve the published adapter versions they need within their own workflows instead of receiving adapter-version updates pushed from the adapter repository.
- `ui-builder` staging workflows will resolve adapter versions from the published release-candidate channel, while production workflows will resolve the stable release set.

## Dependencies

- Access to create the new repository under the OpenZeppelin organization
- Access to publish the new adapter package names under the `@openzeppelin` namespace
- Availability of release automation credentials and provenance configuration for the new repository
- Coordination across UI Builder, `openzeppelin-ui`, `role-manager`, and `rwa-wizard` maintainers

## Risks

- **Consumer migration drift**: Repositories may migrate on different timelines and temporarily diverge. Mitigation: use a sequential rollout and shared migration guidance.
- **Export breakage**: Generated applications may continue referencing legacy names if export configuration is missed. Mitigation: make exported applications a release-blocking verification target.
- **Release-flow regression**: The extracted repository could lose the current release-candidate, release-preparation, or production automation guarantees. Mitigation: treat release-flow parity as a first-class migration requirement rather than follow-up polish.
- **Local workflow friction**: Cross-repository development may slow down if local source switching is not updated everywhere. Mitigation: treat local workflow updates as in-scope requirements, not optional cleanup.
- **Bad initial release**: An incorrect first publish could block adoption across several products. Mitigation: require a documented recovery process and visible version deprecation path.
