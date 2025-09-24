# Phase 1 Data Model: Entities for Rename

## Entities

### ProductBrand

- Fields: `currentName` ("UI Builder"), `legacyName` ("Contracts UI Builder"), `qualifierPolicy` (use "OpenZeppelin UI Builder" only when replacing "OpenZeppelin Contracts UI Builder").

### PackageMapping

- Purpose: Records mapping from legacy package names to new package names and status.
- Fields: `oldName`, `newName`, `status` (planned | deprecated | published), `notes`.
- Mapping table (finalized in PR C):

| oldName                                             | newName                                   | status  | notes               |
| --------------------------------------------------- | ----------------------------------------- | ------- | ------------------- |
| @openzeppelin/contracts-ui-builder-react-core       | @openzeppelin/ui-builder-react-core       | planned |                     |
| @openzeppelin/contracts-ui-builder-renderer         | @openzeppelin/ui-builder-renderer         | planned |                     |
| @openzeppelin/contracts-ui-builder-types            | @openzeppelin/ui-builder-types            | planned |                     |
| @openzeppelin/contracts-ui-builder-styles           | @openzeppelin/ui-builder-styles           | planned |                     |
| @openzeppelin/contracts-ui-builder-storage          | @openzeppelin/ui-builder-storage          | planned |                     |
| @openzeppelin/contracts-ui-builder-ui               | @openzeppelin/ui-builder-ui               | planned |                     |
| @openzeppelin/contracts-ui-builder-utils            | @openzeppelin/ui-builder-utils            | planned |                     |
| @openzeppelin/contracts-ui-builder-adapter-evm      | @openzeppelin/ui-builder-adapter-evm      | planned |                     |
| @openzeppelin/contracts-ui-builder-adapter-solana   | @openzeppelin/ui-builder-adapter-solana   | planned |                     |
| @openzeppelin/contracts-ui-builder-adapter-stellar  | @openzeppelin/ui-builder-adapter-stellar  | planned |                     |
| @openzeppelin/contracts-ui-builder-adapter-midnight | @openzeppelin/ui-builder-adapter-midnight | planned |                     |
| @openzeppelin/contracts-ui-builder-app              | @openzeppelin/ui-builder-app              | planned | private workspace   |
| contracts-ui-builder-exported                       | ui-builder-exported                       | planned | export template app |

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
