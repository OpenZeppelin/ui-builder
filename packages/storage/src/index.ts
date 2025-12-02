// Base classes
export { DexieStorage } from './base/DexieStorage';
export type { BaseRecord } from './base/DexieStorage';

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
