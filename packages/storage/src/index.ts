// Base classes
export { EntityStorage } from './base/EntityStorage';
export type { BaseRecord, EntityStorageOptions } from './base/EntityStorage';

export { KeyValueStorage } from './base/KeyValueStorage';
export type { KeyValueRecord, KeyValueStorageOptions } from './base/KeyValueStorage';

// Utilities
export { isQuotaError, withQuotaHandling } from './base/utils';

// Core utilities
export { createDexieDatabase } from './core';
export type { DbVersion } from './core';

// React utilities
export {
  useLiveQuery,
  createLiveQueryHook,
  createCrudHook,
  createJsonFileIO,
  createRepositoryHook,
} from './react';
