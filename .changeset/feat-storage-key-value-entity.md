---
'@openzeppelin/ui-builder-storage': minor
---

Add `KeyValueStorage` base class and rename `DexieStorage` to `EntityStorage`.

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
