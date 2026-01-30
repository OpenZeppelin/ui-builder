# Feature Specification: Rename to 'UI Builder'

**Feature Branch**: `002-rename-to-ui-builder`
**Created**: 2025-09-22  
**Status**: Ready for Implementation  
**Input**: User description: "Rename to 'UI Builder'. Rename this whole monorepo from 'Contracts UI Builder' to 'UI Builder'. That includes user facing parts first of all, and then everything internally: comments, docs, codebase, package names etc."

## Execution Flow (main)

```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a stakeholder and end user, I want the product to be consistently named "UI Builder" across all user-facing surfaces so that communication, documentation, and the application experience are aligned and unambiguous. The legacy name "Contracts UI Builder" should no longer appear in active user-facing content.

### Acceptance Scenarios

1. **Given** a new user views public documentation and the repository README, **When** they read titles, headings, badges, and copy, **Then** they only see the product referred to as "UI Builder" with no remaining "Contracts UI Builder" references in user-facing content.
2. **Given** a user opens the application, **When** they navigate through pages, dialogs, toasts, and headers, **Then** all product mentions use "UI Builder" consistently.
3. **Given** a developer examines packages and registry entries, **When** they view package names, import paths, descriptions, and deprecation notices, **Then** legacy packages are clearly deprecated and new packages exist with updated names that use "UI Builder"; package metadata reflects the new brand.
4. **Given** a user exports a standalone app or artifact, **When** they inspect the exported UI and any included README/text, **Then** the product name used is "UI Builder".
5. **Given** historical documents such as old changelogs or past release notes, **When** users review earlier records, **Then** historical references may retain "Contracts UI Builder" for accuracy while current content reflects "UI Builder".
6. **Given** the repository and associated URLs, **When** users view the repository name/slug and any first-party links, **Then** they reflect the new naming (removing "contracts") and remain discoverable.
7. **Given** search across the repository, **When** scanning user-facing content, **Then** there are no unintentional remaining instances of "Contracts UI Builder".
8. **Given** a code search for component/class/function/file/directory names containing the legacy brand (e.g., `ContractsUIBuilder`), **When** the rename is executed, **Then** identifiers, filenames, and directory names are updated to use "UIBuilder" (or appropriate new naming) and all references/imports are consistent.

### Edge Cases

- Historical artifacts (older changelogs entries, past release notes) may intentionally retain the legacy name for historical integrity.
- Third-party references (blogs, external docs) cannot be updated and are out of scope.
- Repository name/slug and related first-party URLs will be updated; ensure references are aligned to the new slug.
- npm package names and import paths will be renamed; legacy packages will be deprecated with migration notes linking to new packages.
- The brand qualifier "OpenZeppelin UI Builder" is used only where the prior form was "OpenZeppelin Contracts UI Builder"; elsewhere use "UI Builder".
- Backwards compatibility will not be provided; users are expected to migrate to the new package names.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: All user-facing content MUST use the product name "UI Builder".
- **FR-002**: The legacy name "Contracts UI Builder" MUST be removed from current user-facing surfaces (docs, app UI, exports, examples, marketing copy), except where preserved for historical accuracy.
- **FR-003**: Application UI copy (titles, navigation labels, dialog headings, notifications) MUST consistently use "UI Builder".
- **FR-004**: Public documentation (README, docs site pages, badges alt text, repository description) MUST consistently use "UI Builder".
- **FR-005**: Exported artifacts (e.g., generated applications, ZIP filenames, embedded README or text) MUST reference "UI Builder".
- **FR-006**: Registry package names and import paths MUST be renamed; legacy packages MUST be deprecated in npm with clear migration notes linking to new packages and a brief rationale for the change.
- **FR-007**: Repository name/slug and related first-party URLs MUST be updated to remove "contracts" and reflect the new naming; internal references MUST be aligned accordingly.
- **FR-008**: Where the prior brand was "OpenZeppelin Contracts UI Builder", the updated brand SHOULD be "OpenZeppelin UI Builder"; elsewhere use "UI Builder".
- **FR-009**: Code comments and inline documentation SHOULD refer to "UI Builder" consistently (non-user-facing but part of internal consistency scope).
- **FR-010**: CI/CD and release automation MUST be updated to publish under new package names and to apply deprecation to legacy packages.
- **FR-011**: Migration guidance MUST be visible on legacy npm package pages with links to the new packages; no backwards compatibility is required.
- **FR-012**: A naming policy MUST be applied to remove "contracts" from names and slugs (e.g., `contracts-ui-builder-types` → `ui-builder-types`).
- **FR-013**: Before release, a quality check MUST confirm no unintended "Contracts UI Builder" strings remain in current user-facing content.
- **FR-014**: Code identifiers (component names, classes, functions) and file/directory names that embed the legacy brand MUST be renamed to the new naming (e.g., `ContractsUIBuilder` → `UIBuilder`), and all imports/references MUST be updated consistently across the codebase.

### Key Entities _(include if feature involves data)_

- **Product Name (New)**: "UI Builder" — canonical brand string for all current content.
- **Product Name (Legacy)**: "Contracts UI Builder" — legacy term to be deprecated in current content.
- **Naming Policy**: Remove the term "contracts" from names and slugs across repository, packages, and internal references (e.g., `contracts-ui-builder-types` → `ui-builder-types`).
- **Package Migration**: Legacy packages deprecated on npm with migration notes linking to new packages; new packages published under updated names; no backwards compatibility.
- **Repository and URLs**: Repository name/slug and first-party URLs updated to reflect the new naming; references updated accordingly.
- **Brand Qualifier Policy**: Use "OpenZeppelin UI Builder" only where the previous usage was "OpenZeppelin Contracts UI Builder"; otherwise use "UI Builder".
- **Code Identifier & Path Mapping**: Mapping of legacy → new component/class/function names and file/directory paths (e.g., `packages/builder/src/components/ContractsUIBuilder/*` → `.../UIBuilder/*`).

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
