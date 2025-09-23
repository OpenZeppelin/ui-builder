# Phase 1 Data Model: Entities for Rename

## Entities

### ProductBrand

- Fields: `currentName` ("UI Builder"), `legacyName` ("Contracts UI Builder"), `qualifierPolicy` (use "OpenZeppelin UI Builder" only when replacing "OpenZeppelin Contracts UI Builder").

### PackageMapping

- Purpose: Records mapping from legacy package names to new package names and status.
- Fields: `oldName`, `newName`, `status` (planned | deprecated | published), `notes`.
- Example rows (to be completed during PR C):
  - `@openzeppelin/contracts-ui-builder-types` → `@openzeppelin/ui-builder-types`
  - `@openzeppelin/contracts-ui-builder-utils` → `@openzeppelin/ui-builder-utils`
  - `@openzeppelin/contracts-ui-builder-storage` → `@openzeppelin/ui-builder-storage`

### RepoSlugMapping

- Fields: `oldSlug`, `newSlug`, `redirectsUpdated` (boolean), `updatedLinks` (array of paths/URLs touched).

### UserFacingSurface

- Fields: `surface` (app UI, docs pages, readmes, badges, exports), `location` (paths/pkgs), `owner` (team/package), `status` (pending | updated | verified).

### CodeIdentifierMapping

- Purpose: Track renames of components/classes/functions that include the legacy brand.
- Fields: `oldSymbol`, `newSymbol`, `locations` (files), `notes`.
- Example rows:
  - `ContractsUIBuilder` → `UIBuilder` (e.g., `packages/builder/src/components/ContractsUIBuilder/index.tsx` → `.../UIBuilder/index.tsx`)

### FilePathMapping

- Purpose: Track renames of files/directories that include the legacy brand.
- Fields: `oldPath`, `newPath`, `impactedImports` (count/notes).
- Example rows:
  - `packages/builder/src/components/ContractsUIBuilder/` → `packages/builder/src/components/UIBuilder/`

## Validation Rules

- All current user-facing strings must use `ProductBrand.currentName`.
- Historical records may retain `ProductBrand.legacyName` where appropriate.
- All packages in `PackageMapping` must move to status `deprecated` for `oldName` and `published` for `newName` before release completion.
- `RepoSlugMapping.redirectsUpdated` must be true and `updatedLinks` must include README/docs/config references.
- All entries in `CodeIdentifierMapping` and `FilePathMapping` must be applied and verified via build/tests.
