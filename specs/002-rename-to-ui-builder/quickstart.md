# Quickstart: Executing the Rename to 'UI Builder'

## Prerequisites

- pnpm installed
- CI green on main
- Changesets configured

## PR A: User-Facing Rename Sweep

1. Create branch `rename/ui-facing-sweep`.
2. Search for "Contracts UI Builder" across app UI, docs UI, exported artifacts.
3. Replace with "UI Builder"; where prior text was "OpenZeppelin Contracts UI Builder", use "OpenZeppelin UI Builder".
4. Build and run tests: `pnpm -r build && pnpm -r test`.
5. Submit PR with screenshots and updated docs.

## PR B: Codebase & Docs Rename

1. Create branch `rename/codebase-docs`.
2. Update comments, headings, badges, alt text, repo description, and internal links; prepare repo slug change.
3. Ensure READMEs/docs reflect new naming policy (remove "contracts" from names/slugs).
4. Verify no unintended legacy strings remain.
5. Submit PR.

## PR C: Packages & Imports + Migration

1. Create branch `rename/packages-imports`.
2. Define mapping in `data-model.md` and README; update `package.json` names.
3. Update all internal dependencies and import paths.
4. Update CI publish workflow and Changesets; add npm deprecation messages for legacy packages.
5. Build, typecheck, test across monorepo.
6. Submit PR; merge and publish.

## Verification

- Search repo for legacy term; ensure zero matches in current content.
- Confirm npm shows deprecation for old packages and new packages are published.
- Validate links and badges post repo slug change.
