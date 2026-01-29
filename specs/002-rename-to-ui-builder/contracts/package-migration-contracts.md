# Package Migration Contracts

## Deprecation Notice Content (Legacy Packages)

- Title: "Package deprecated in favor of UI Builder"
- Message: "This package has been deprecated as part of the rename from 'Contracts UI Builder' to 'UI Builder'. Please install the new package name listed below. See migration notes for details."
- Include: link to new package, link to monorepo README, link to migration notes in repo.

## Mapping Requirements

- Provide a 1:1 mapping table from legacy → new package names in README and in each legacy package description.
- Ensure `package.json` fields updated: `name`, `description`, `homepage`, `repository`, `bugs`.
- Ensure `keywords` reflect new brand.

## Release & CI Gates

- Changesets PR includes new package entries and marks legacy packages with deprecation changes.
- Publish workflow publishes new packages and runs deprecation step for legacy packages.
- Typecheck/build must pass after import path updates across the monorepo.
- Post-publish verification: `npm info` checks confirm new packages exist and legacy packages show deprecation.

## Migration Notes (Consumers)

- Upgrade path: replace imports from `@openzeppelin/ui-builder-*` to `@openzeppelin/ui-builder-*`.
- No breaking runtime changes; brand and package names only.
- Rationale: simplify naming, broaden scope beyond contracts.
