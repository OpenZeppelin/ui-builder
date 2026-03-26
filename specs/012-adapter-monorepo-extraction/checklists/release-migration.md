# Release Migration Checklist: Adapter Monorepo Extraction

**Purpose**: Validate whether the release, deployment, consumer-migration, and governance requirements are complete, clear, consistent, and ready to gate implementation planning and review.
**Created**: 2026-03-19
**Feature**: [spec.md](../spec.md)

**Note**: This checklist evaluates the quality of the written requirements and planning artifacts. It does not verify code or workflow behavior.

## Requirement Completeness

- [x] CHK001 Are the release ownership requirements fully specified for both the new adapter repository and `ui-builder` without leaving any shared responsibilities implicit? [Completeness, Spec §FR-010 to §FR-017]
- [x] CHK002 Are the consumer migration requirements defined for all in-scope repositories, including `ui-builder`, `openzeppelin-ui`, `role-manager`, and `rwa-wizard`? [Completeness, Spec §FR-019 to §FR-025]
- [x] CHK003 Is the Builder-owned generated-application version reference responsibility explicitly documented as a mandatory requirement rather than only implied by release flow language? [Completeness, Spec §FR-015; Contract §3; Research §3]
- [x] CHK004 Are the requirements explicit about what moves to `openzeppelin-adapters` versus what stays in `ui-builder` after migration? [Completeness, Spec §Scope Boundaries; Plan §Project Structure]
- [x] CHK005 Are package build-tooling requirements for the new adapter repository explicitly specified, including the decision to use `tsdown` and the choice of `openzeppelin-ui` as the template? [Completeness, Plan §Technical Context; Research §10-§11]
- [x] CHK006 Does the documentation explicitly define the required outcome for the internal `adapter-evm-core` package and its non-public status? [Completeness, Spec §Package Renaming; Data Model §Internal Adapter Package; Research §7]

## Requirement Clarity

- [x] CHK007 Is “preserve the current three-step release lifecycle as closely as possible” clarified with concrete boundaries for what must remain equivalent versus what may change? [Clarity, Ambiguity, Spec §FR-007]
- [x] CHK008 Is the meaning of “consumer-owned version resolution” specific enough that reviewers can tell whether a proposed design improperly reintroduces push-based downstream synchronization? [Clarity, Spec §FR-013 to §FR-015; Research §2]
- [x] CHK009 Is the role of the npm `rc` channel defined precisely enough to distinguish staging validation requirements from stable production requirements? [Clarity, Spec §FR-012 to §FR-014; Contract §2; Contract §3]
- [x] CHK010 Is the requirement around generated-application package version references specific enough to show whether the Builder release-preparation step must update one source of truth or multiple independent artifacts? [Clarity, Spec §FR-015; Contract §3; Research §3]
- [x] CHK011 Is the term “linked version set” defined clearly enough to avoid ambiguity about whether all public adapters always move together or only under some release conditions? [Clarity, Spec §FR-006a; Research §6]
- [x] CHK012 Is the local-development compatibility expectation clear enough to distinguish canonical environment-variable naming from temporary migration aliases? [Clarity, Contract §5; Research §9]

## Requirement Consistency

- [x] CHK013 Do the spec, plan, and contracts consistently assign RC/stable publishing to the adapter repo and staging/production deployment to `ui-builder` with no contradictory ownership language? [Consistency, Spec §Clarifications; Spec §FR-010 to §FR-017; Contract §2; Contract §4; Research §1]
- [x] CHK014 Do the release-channel requirements align across the spec, contracts, research, and quickstart for staging=`rc` and production=stable, with no conflicting alternative source defined elsewhere? [Consistency, Spec §FR-012 to §FR-014; Contract §3; Research §4; Quickstart §Phase 4]
- [x] CHK015 Are the package-build-tooling requirements consistent across plan, research, and quickstart now that `tsdown` has replaced `tsup`? [Consistency, Plan §Technical Context; Research §10-§11; Quickstart §Step 1.3-1.4]
- [x] CHK016 Are repository-boundary statements consistent between the feature documents and the constitutional precondition described in the plan? [Consistency, Plan §Constitution Check; Spec §Scope Boundaries; Gap]
- [x] CHK017 Do the migration requirements and contracts consistently treat `adapter-evm-core` as internal/private rather than accidentally implying a public published package? [Consistency, Spec §Package Renaming; Contract §1; Data Model §Internal Adapter Package]

## Acceptance Criteria Quality

- [x] CHK018 Are the success criteria for release-flow parity measurable enough to determine whether staging and production requirements were satisfied without relying on subjective judgment? [Measurability, Spec §SC-004 to §SC-006]
- [x] CHK019 Are the migration-completion success criteria specific enough to determine whether consumer repositories and documentation have fully eliminated legacy adapter naming? [Measurability, Spec §SC-008; Contract §7]
- [x] CHK020 Is the success criterion for keeping generated-application package version references synchronized objective enough to detect requirement gaps around release preparation timing? [Acceptance Criteria, Spec §SC-006; Research §3]

## Scenario Coverage

- [x] CHK021 Are primary requirements defined for all major scenario classes: adapter release, Builder staging deployment, Builder production deployment, exported app generation, and downstream consumer migration? [Coverage, Spec §User Stories 1-4]
- [x] CHK022 Are alternate-path requirements defined for adapter-only changes that require staging validation without a simultaneous Builder code change? [Coverage, Contract §4; Research §5; Gap]
- [x] CHK023 Are recovery-path requirements defined for defective releases, including both package deprecation and downstream consumer expectations after a bad publish? [Coverage, Spec §FR-028; Spec §Edge Cases; Research §3]

## Edge Case Coverage

- [x] CHK024 Are the written requirements explicit about what should happen when staging would otherwise resolve an outdated stable version or stale RC instead of the intended release-candidate channel? [Edge Case, Spec §Edge Cases; Spec §FR-012; Research §4-§5]
- [x] CHK025 Are mixed-state migration scenarios covered, such as consumers temporarily referencing old and new package names or documentation lagging behind package publication? [Edge Case, Spec §Edge Cases; Contract §7]
- [x] CHK026 Are local-development failure scenarios specified for wrong sibling paths, outdated checkouts, or inconsistent compatibility aliases across consumer repositories? [Edge Case, Spec §Edge Cases; Contract §5; Research §9]
- [x] CHK027 Does the requirement set define what happens if one consumer repository updates promptly while another intentionally lags on adopting the new adapter packages? [Gap, Coverage, Spec §FR-023 to §FR-029; Research §2]

## Non-Functional Requirements

- [x] CHK028 Are operational readiness requirements sufficiently defined for release provenance, release cadence, and staging redeployability after extraction? [Non-Functional, Spec §FR-018; Contract §2; Contract §4]
- [x] CHK029 Are maintainability requirements specified for duplicated local-development hooks and consumer configuration drift across repositories? [Non-Functional, Research §9; Gap]
- [x] CHK030 Are the release-governance requirements explicit enough to ensure the extracted design does not silently weaken existing release controls or CI guardrails? [Non-Functional, Plan §Constitution Check; Contract §2-§4]

## Dependencies & Assumptions

- [x] CHK031 Are all critical external dependencies for successful migration documented, including npm namespace availability, GitHub repo creation, and CI credentials? [Completeness, Spec §Dependencies; Research §Dependencies Verified]
- [x] CHK032 Are the assumptions about consumer coordination, staging redeploy triggers, and release-channel consumption validated or clearly marked as assumptions rather than settled requirements? [Assumption, Spec §Assumptions; Research §5]
- [x] CHK033 Is the dependency on `openzeppelin-ui` as the packaging/build template documented clearly enough to prevent later drift in bundler conventions or package structure expectations? [Dependency, Plan §Technical Context; Research §11; Quickstart §Step 1.3-1.4]

## Governance & Preconditions

- [x] CHK034 Is the constitutional precondition stated clearly enough to function as a release gate for implementation planning and merge approval? [Clarity, Plan §Constitution Check]
- [x] CHK035 Do the requirements make it explicit whether the constitution amendment must land before implementation starts, before merge, or before release? [Ambiguity, Plan §Gate Result; Gap]
- [x] CHK036 Are governance responsibilities defined for updating docs, local-development instructions, and release contracts after the repo-boundary change is ratified? [Completeness, Spec §FR-025; Contract §7; Gap]

## Notes

- This is a formal release-gate checklist for requirement quality, not an implementation QA checklist.
- Focus areas included: release/deployment requirements, consumer migration requirements, and governance/constitution preconditions.
- Depth level: Formal release gate.
- Intended audience/timing: PR reviewers and plan/spec authors before task generation and implementation kickoff.
- Reviewed and resolved against the current spec, plan, contracts, research, and quickstart on 2026-03-19.
