# Phase 0 Research: Rename to 'UI Builder'

## Decisions (confirmed)

- Rename scope: entire monorepo from "Contracts UI Builder" → "UI Builder".
- PR sequence:
  1. Fast pass on user‑facing surfaces (builder, adapters, other packages) to remove legacy name from UI; separate PR.
  2. Codebase and docs renaming (comments, headings, badges alt text, repo slug/URLs); separate PR.
  3. Packages and imports renaming with migration; deprecate legacy npm packages and publish new ones; separate PR.
- Repository rename: update repo name/slug and first‑party URLs.
- Packages/imports: will be renamed; legacy packages deprecated on npm with migration notes linking to new packages and a brief rationale.
- Brand qualifier: use "OpenZeppelin UI Builder" only where prior usage was "OpenZeppelin Contracts UI Builder"; otherwise use "UI Builder".
- Backwards compatibility: not required.
- Naming policy: remove the keyword "contracts" from package names and slugs (e.g., `ui-builder-types` → `ui-builder-types`).
- Component and identifier renames: UI component names, file/directory names, and code identifiers (classes/functions) that include the legacy brand will be renamed (e.g., `ContractsUIBuilder` → `UIBuilder`).

## Risks & Mitigations

- Broken imports across the monorepo after package/name/file path renames → plan a coordinated rename, update all internal deps, TS path aliases, and run full typecheck/build in CI before merge.
- Discovery issues after repo slug change → update README badges, docs links, package `homepage`/`repository` fields, and any hard‑coded URLs.
- npm deprecation messaging clarity → standardize a concise message and link to new package names and migration notes.
- CI/CD publish flow changes → update publish matrix to include new packages and skip/deprecate old ones; verify Changesets configuration and release workflows.
- Downstream consumers on legacy packages → provide clear deprecation notices and a mapping table; since no backwards compatibility is required, emphasize upgrade path simplicity.
- File/directory renames may break story/test imports and snapshots → update import paths, Storybook stories, and test snapshots accordingly.

## Alternatives Considered

- In‑place rename of npm packages (not supported) → rejected.
- Temporary compatibility shims/alias packages → rejected due to "no backwards compatibility" decision and to reduce maintenance overhead.

## Next Steps

- Execute PR A: user‑facing rename sweep.
- Execute PR B: codebase/docs rename, repo slug/URL updates, and code identifier + file/directory renames.
- Execute PR C: package/import renames with npm deprecations, CI updates, and Changesets.
