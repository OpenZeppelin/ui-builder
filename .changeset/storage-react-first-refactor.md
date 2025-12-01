---
'@openzeppelin/ui-builder-storage': major
---

Refactor storage package to be React-first, app-agnostic, and easier to consume across apps.

Highlights:

- New React utilities: `useLiveQuery` (re-export), `createLiveQueryHook`, `createCrudHook`, `createJsonFileIO`, `createRepositoryHook`.
- Core: `DexieStorage` now uses `@openzeppelin/ui-builder-utils` (`logger`, `generateId`); `createDexieDatabase` helper for versioned Dexie setup.
- Exports consolidated at the root (no `./react` subpath).
- Dependencies: add `dexie-react-hooks`; keep `react` as a peer dependency.

BREAKING CHANGES:

- Remove builder-specific exports from this package: `ContractUIStorage`, `contractUIStorage`, `useContractUIStorage`, `db`, and `ContractUIRecord`/`ContractUIExportData` types.
- Consumers must define app-local repositories/types and use the new React helpers.

Migration (typical):

- Move app-specific repositories (e.g., `ContractUIStorage`) and types into the app.
- Create the Dexie instance in the app with `createDexieDatabase`.
- Use the new React helpers to replace ad-hoc storage hooks (e.g., `createRepositoryHook`).
