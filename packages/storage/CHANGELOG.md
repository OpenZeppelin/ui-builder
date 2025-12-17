# @openzeppelin/ui-builder-storage

## 1.0.0

### Major Changes

- [#257](https://github.com/OpenZeppelin/ui-builder/pull/257) [`923e016`](https://github.com/OpenZeppelin/ui-builder/commit/923e01634b94d6bf421a57f67aac4512e9b9b091) Thanks [@pasevin](https://github.com/pasevin)! - Refactor storage package to be React-first, app-agnostic, and easier to consume across apps.

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

### Minor Changes

- [#258](https://github.com/OpenZeppelin/ui-builder/pull/258) [`4a496fe`](https://github.com/OpenZeppelin/ui-builder/commit/4a496fe6522d4f7f30602ac25856e1a711025d7c) Thanks [@pasevin](https://github.com/pasevin)! - Add `KeyValueStorage` base class and rename `DexieStorage` to `EntityStorage`.

  New features:
  - **`KeyValueStorage<V>`**: Base class for key-value stores using `&key` primary key schema. Includes `set`, `get`, `getOrDefault`, `delete`, `has`, `keys`, `getAll`, `clear`, `count`, `setMany`, `getMany`, `deleteMany` methods with configurable key length and value size limits.
  - **`EntityStorage<T>`**: Renamed from `DexieStorage` for clarity. Now includes configurable `maxRecordSizeBytes` option (default 10MB) and quota error handling.
  - **Shared utilities**: `isQuotaError()` and `withQuotaHandling()` exported for custom storage implementations.

  Improvements:
  - Both base classes now handle `QuotaExceededError` consistently across browsers (including Safari iOS code 22).
  - Record/value size validation prevents accidental quota exhaustion.
  - Builder app's `ContractUIStorage` now uses 50MB limit for large contract definitions.

  Migration:
  - Replace `DexieStorage` imports with `EntityStorage` (same API).
  - For key-value stores, extend `KeyValueStorage` instead of implementing custom logic.

### Patch Changes

- Updated dependencies [[`bfbbf9b`](https://github.com/OpenZeppelin/ui-builder/commit/bfbbf9bf55883ae61d6672436cfea66040251d48)]:
  - @openzeppelin/ui-builder-utils@1.0.0

## 0.16.0

### Patch Changes

- Updated dependencies [[`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195), [`9a92127`](https://github.com/OpenZeppelin/ui-builder/commit/9a921273e858b58f3fc1ef7456ee67339c186195)]:
  - @openzeppelin/ui-builder-utils@0.16.0
  - @openzeppelin/ui-builder-types@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [[`faff555`](https://github.com/OpenZeppelin/ui-builder/commit/faff555be188b679c8ba9c22e9e01b4a9c22ecff)]:
  - @openzeppelin/ui-builder-types@0.15.0
  - @openzeppelin/ui-builder-utils@0.15.0

## 0.14.0

### Patch Changes

- [#205](https://github.com/OpenZeppelin/ui-builder/pull/205) [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00) Thanks [@pasevin](https://github.com/pasevin)! - Midnight adapter contract ingestion and shared gating
  - Midnight: move loading to contract/loader; return contractDefinitionArtifacts; keep adapter thin.
  - Builder: replace local required-field gating with shared utils (getMissingRequiredContractInputs); remove redundant helper.
  - Utils: add contractInputs shared helpers and tests.
  - Storage/App/UI: persist and rehydrate contractDefinitionArtifacts; auto-save triggers on artifact changes.

- Updated dependencies [[`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00), [`6ebbdc2`](https://github.com/OpenZeppelin/ui-builder/commit/6ebbdc2d98cbb053e043eb4c9c97900d44643c00)]:
  - @openzeppelin/ui-builder-types@0.14.0
  - @openzeppelin/ui-builder-utils@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [[`68c0aed`](https://github.com/OpenZeppelin/ui-builder/commit/68c0aed14f3597df8c52dc8667e420624399b8d2)]:
  - @openzeppelin/ui-builder-types@0.13.0
  - @openzeppelin/ui-builder-utils@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [[`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500), [`eb4f5da`](https://github.com/OpenZeppelin/ui-builder/commit/eb4f5da65ddc16f2c8cb0bd5644a700c9a14f500)]:
  - @openzeppelin/ui-builder-types@0.12.0
  - @openzeppelin/ui-builder-utils@0.12.0

## 0.10.0

### Minor Changes

- [#172](https://github.com/OpenZeppelin/ui-builder/pull/172) [`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d) Thanks [@pasevin](https://github.com/pasevin)! - Rename packages from "@openzeppelin/contracts-ui-builder-_" to "@openzeppelin/ui-builder-_" and update imports across the monorepo. Legacy packages will be deprecated on npm with guidance to the new names.

### Patch Changes

- Updated dependencies [[`5bf6ceb`](https://github.com/OpenZeppelin/ui-builder/commit/5bf6ceb81dacbe013eed92d6a0aee05d00c1863d)]:
  - @openzeppelin/ui-builder-types@0.10.0
  - @openzeppelin/ui-builder-utils@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [[`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`dca7f1c`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/dca7f1c4eb93be062c687186b85bd6f61eca8b93), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47), [`9ed15f4`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/9ed15f4b0460d5fd8c4e94d5392dbbbeda082c47)]:
  - @openzeppelin/contracts-ui-builder-types@0.9.0
  - @openzeppelin/contracts-ui-builder-utils@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [[`011123e`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/011123ed8345f0a1ef11f0796bcb2422504763b9)]:
  - @openzeppelin/ui-builder-types@0.8.0
  - @openzeppelin/ui-builder-utils@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [[`b566f80`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/b566f804b8fbc439f66fc3459c211ae4e96b75ec)]:
  - @openzeppelin/ui-builder-utils@0.7.0

## 0.3.4

### Patch Changes

- Updated dependencies [[`ce96c10`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ce96c104e9e5df22ba335a8746cda740a70dbd0b)]:
  - @openzeppelin/ui-builder-types@0.4.0
  - @openzeppelin/ui-builder-utils@0.4.1

## 0.3.2

### Patch Changes

- Updated dependencies [[`521dc09`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/521dc092e2394501affc9f3f37144ba8c735591c)]:
  - @openzeppelin/ui-builder-utils@0.4.0

## 0.3.1

### Patch Changes

- [#72](https://github.com/OpenZeppelin/contracts-ui-builder/pull/72) [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca) Thanks [@pasevin](https://github.com/pasevin)! - refactor: Updated the `ContractUIStorage` service to include the `contractDefinitionOriginal` field, allowing the original ABI of a contract to be preserved for comparison purposes.

- Updated dependencies [[`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca), [`ba62702`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/ba62702eea64cc2a1989f2d1f568f22ff414a4ca)]:
  - @openzeppelin/ui-builder-utils@0.3.1
  - @openzeppelin/ui-builder-types@0.3.0

## 0.3.0

### Minor Changes

- [#66](https://github.com/OpenZeppelin/contracts-ui-builder/pull/66) [`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103) Thanks [@pasevin](https://github.com/pasevin)! - initial release

### Patch Changes

- Updated dependencies [[`60fd645`](https://github.com/OpenZeppelin/contracts-ui-builder/commit/60fd6457fef301f87303fd22b03e12df10c26103)]:
  - @openzeppelin/ui-builder-utils@0.3.0
