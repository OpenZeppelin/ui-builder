# Implementation Plan: Rename to 'UI Builder'

**Branch**: `002-rename-to-ui-builder` | **Date**: 2025-09-22 | **Spec**: /Users/ghost/dev/repos/OpenZeppelin/contracts-ui-builder/specs/002-rename-to-ui-builder/spec.md
**Input**: Feature specification from `/Users/ghost/dev/repos/OpenZeppelin/contracts-ui-builder/specs/002-rename-to-ui-builder/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (optional)
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach and generate tasks.md for this plan
9. STOP - Ready for implementation PRs
```

## Summary

Rename the entire monorepo brand from "Contracts UI Builder" to "UI Builder". Execute in distinct PRs: (A) fast pass on user-facing surfaces (builder, adapters, other packages) to ensure no old name remains in the app and docs UIs; (B) codebase and documentation renaming across comments, headings, slugs, repo name/URLs, and code identifier + file/directory renames where the legacy brand appears (e.g., `ContractsUIBuilder` → `UIBuilder`); (C) package and import renaming with npm deprecations for old packages and migration notes. No backwards compatibility required.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 20+  
**Primary Dependencies**: pnpm workspaces, tsup, TypeScript, ESLint/Prettier, Changesets, Vitest  
**Storage**: N/A  
**Testing**: Vitest for unit/integration; Playwright/e2e where applicable  
**Target Platform**: Browser (React app) + Node (tooling/CI)  
**Project Type**: Monorepo (web app + libraries/adapters)  
**Performance Goals**: N/A  
**Constraints**: Chain‑agnostic core; adapter‑led architecture; no chain‑specific deps in core; no `any`; logging off by default; Changesets governs releases; CI must remain green.  
**Scale/Scope**: All packages, docs, and repo metadata; npm deprecations for legacy names; imports updated; repo slug updated.

Incorporated user-provided plan and phasing:

- First, a quick pass on user-facing surfaces in builder, adapters, and other packages; the builder app must not reference the old name. This is a separate PR.
- Subsequent PRs by priority:
  1. Codebase and docs renaming (separate PR)
  2. Package and imports renaming with migration and npm deprecations (separate PR)

## Constitution Check

- Chain‑agnostic core preserved (no adapter code/logic added to builder): PASS
- Adapter‑led pattern maintained; EVM remains template; Stellar mirrors EVM structure: PASS
- No chain‑specific deps in chain‑agnostic packages (rename is textual/metadata): PASS
- Type safety, linting, and code quality rules unchanged and enforced: PASS
- Tooling and release via pnpm + Changesets intact; CI updated for package renames/deprecations: PASS
- UI/design system unaffected by rename (ensure assets/text only): PASS
- TDD: Not applicable for textual rename; any behavioral logic touched must follow TDD: PASS

## Project Structure

### Documentation (this feature)

```
specs/002-rename-to-ui-builder/
├── plan.md              # This file (/plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (generated here per command)
```

**Structure Decision**: Existing monorepo structure retained; no new app/API projects introduced.

## Phase 0: Outline & Research

1. Unknowns resolved from the spec (all clarified by user):
   - Package names/import paths will be renamed; legacy packages will be deprecated on npm.
   - Repository name/slug and first‑party URLs will be updated.
   - Brand qualifier "OpenZeppelin UI Builder" used only where prior usage was "OpenZeppelin Contracts UI Builder".
   - No backwards compatibility required.
   - Naming policy: remove "contracts" from names/slugs (e.g., `contracts-ui-builder-types` → `ui-builder-types`).
2. Risks & mitigations consolidated in `research.md`.

Output: `research.md` with decisions, risks, alternatives.

## Phase 1: Design & Contracts

1. Entities extracted into `data-model.md` (brands, packages mapping, repo slug mapping, user-facing surfaces).
2. Contracts documented in `contracts/package-migration-contracts.md` (npm deprecation notice content, mapping expectations, CI gates).
3. Quickstart authored for running the three-PR sequence and checks.
4. Define a Code Identifier & Path Mapping in `data-model.md` for component/class/function names and file/directory paths that contain the legacy brand (e.g., `ContractsUIBuilder` → `UIBuilder`, `.../ContractsUIBuilder/*` → `.../UIBuilder/*`).

Output: `data-model.md`, `/contracts/*`, `quickstart.md`.

## Phase 2: Task Planning Approach

- Generate a task list aligned to three separate PRs:
  - PR A: User‑facing rename sweep (builder/adapters/other pkg UIs, docs UI); no code behavior changes.
  - PR B: Codebase and docs rename (comments, headings, repo slug/URLs, badges, alt text) plus component/file/directory and code identifier renames.
  - PR C: Package/import renames with npm deprecations and CI/CD updates; migration notes visible on legacy npm pages.
- Parallelizable tasks are marked [P] in `tasks.md` where safe.

Estimated Output: tasks.md with ordered tasks per PR.

## Complexity Tracking

None identified; rename is textual/metadata with CI and release adjustments.

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/.specify/memory/constitution.md`_
