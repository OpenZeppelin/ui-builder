# @openzeppelin/ui-builder-storage

A React-first storage abstraction built on Dexie.js for IndexedDB. This package provides a reusable foundation for creating type-safe storage services that can be used across multiple applications.

## Description

This package provides a generic storage infrastructure built on top of IndexedDB using Dexie.js. It includes base classes for creating type-safe storage services, a React live-query hook, database creation utilities, and helpful abstractions. Each consuming application defines its own database name, schema, and domain-specific storage classes.

## Features

- 🗄️ **Entity Storage**: `EntityStorage` class for creating entity/record storage services
- 🔑 **Key-Value Storage**: `KeyValueStorage` class for settings, preferences, and configuration stores
- ⚛️ **React Support**: `useLiveQuery` re-exported for convenience
- 🔧 **App-Agnostic Schemas**: Each app defines its own DB name and stores
- 🔒 **Type Safety**: Full TypeScript support with generics
- 🚀 **Performance**: Optimized for large datasets with configurable limits
- 📦 **CRUD Operations**: Create, Read, Update, Delete helpers
- 🔄 **Bulk Operations**: Efficient bulk add/put/delete
- 🔍 **Index Queries**: Query by indexed fields
- ⚠️ **Quota Handling**: Cross-browser quota exceeded error detection
- 🧰 **Ecosystem utilities**: Uses `@openzeppelin/ui-builder-utils` for logging and ID generation

## Installation

```bash
pnpm add @openzeppelin/ui-builder-storage
```

## Quick Start

### 1. Define Your Database Schema

```typescript
import { createDexieDatabase } from '@openzeppelin/ui-builder-storage';

export const db = createDexieDatabase('MyApp', [
  {
    version: 1,
    stores: {
      items: '++id, name, createdAt, updatedAt',
      settings: '&key',
    },
  },
  {
    version: 2,
    stores: {
      items: '++id, name, createdAt, updatedAt, category',
      settings: '&key',
    },
    upgrade: async (trans) => {
      // Migration logic for version 2
      // Access db via trans.db if needed
    },
  },
]);
```

### 2. Define Your Record Types

```typescript
import type { BaseRecord } from '@openzeppelin/ui-builder-storage';

export interface ItemRecord extends BaseRecord {
  name: string;
  category?: string;
}
```

### 3. Create Storage Services

```typescript
import { EntityStorage, useLiveQuery } from '@openzeppelin/ui-builder-storage';

import { db } from './database';
import type { ItemRecord } from './types';

export class ItemStorage extends EntityStorage<ItemRecord> {
  constructor() {
    super(db, 'items');
  }

  async getByName(name: string): Promise<ItemRecord | undefined> {
    return await this.findByIndex('name', name).then((results) => results[0]);
  }

  async getByCategory(category: string): Promise<ItemRecord[]> {
    return await this.findByIndex('category', category);
  }
}

export const itemStorage = new ItemStorage();

export function useItems() {
  const items = useLiveQuery(() => itemStorage.getAll());
  const isLoading = items === undefined;
  return { items, isLoading };
}
```

## API Reference

### `createDexieDatabase(name, versions)`

Creates a configured Dexie database instance with versioned stores.

**Parameters:**

- `name: string` - Database name (e.g., 'UIBuilder', 'RoleManager')
- `versions: DbVersion[]` - Array of version definitions

**Returns:** `Dexie` - Configured database instance

### `EntityStorage<T>`

Abstract base class for entity storage. Use this for collections of records with auto-generated IDs (users, items, contracts, etc.).

**When to use `EntityStorage` vs `KeyValueStorage`:**

| Use Case                                     | Base Class           | Schema      |
| -------------------------------------------- | -------------------- | ----------- |
| Entity collections (users, items, contracts) | `EntityStorage<T>`   | `++id, ...` |
| Settings, preferences, config                | `KeyValueStorage<V>` | `&key`      |

**Constructor:**

```typescript
constructor(
  db: Dexie,
  tableName: string,
  options?: EntityStorageOptions
)
```

**Options:**

```typescript
interface EntityStorageOptions {
  maxRecordSizeBytes?: number; // Default: 10MB
}
```

**Methods:**

- `save(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
- `update(id: string, updates: Partial<T>): Promise<void>`
- `delete(id: string): Promise<void>`
- `get(id: string): Promise<T | undefined>`
- `getAll(): Promise<T[]>`
- `has(id: string): Promise<boolean>`
- `count(): Promise<number>`
- `clear(): Promise<void>`
- `bulkAdd(records: T[]): Promise<string[]>`
- `bulkPut(records: T[]): Promise<void>`
- `bulkDelete(ids: string[]): Promise<void>`
- `findByIndex(index: string, value: IndexableType): Promise<T[]>`

### `BaseRecord`

```typescript
interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### `KeyValueStorage<V>`

Abstract base class for key-value storage. Use this for settings, preferences, feature flags, or any data where you access by a string key rather than an auto-generated ID.

**Constructor:**

```typescript
constructor(
  db: Dexie,
  tableName: string,
  options?: KeyValueStorageOptions
)
```

**Options:**

```typescript
interface KeyValueStorageOptions {
  maxKeyLength?: number; // Default: 128
  maxValueSizeBytes?: number; // Default: 1MB
}
```

**Methods:**

- `set(key: string, value: V): Promise<void>` - Set a value (upsert)
- `get<T>(key: string): Promise<T | undefined>` - Get a value with type casting
- `getOrDefault<T>(key: string, defaultValue: T): Promise<T>` - Get with fallback
- `delete(key: string): Promise<void>` - Delete a key
- `has(key: string): Promise<boolean>` - Check if key exists
- `keys(): Promise<string[]>` - Get all keys
- `getAll(): Promise<KeyValueRecord<V>[]>` - Get all records
- `clear(): Promise<void>` - Clear all entries
- `count(): Promise<number>` - Count entries
- `setMany(entries: Record<string, V> | Map<string, V>): Promise<void>` - Bulk set
- `getMany(keys: string[]): Promise<Map<string, V>>` - Bulk get
- `deleteMany(keys: string[]): Promise<void>` - Bulk delete

### `KeyValueRecord<V>`

```typescript
interface KeyValueRecord<V = unknown> {
  key: string; // Primary key
  value: V; // The stored value
  createdAt: Date;
  updatedAt: Date;
}
```

## Examples

### Entity Storage (UI Builder App)

```typescript
// packages/builder/src/storage/database.ts
import { createDexieDatabase } from '@openzeppelin/ui-builder-storage';

export const db = createDexieDatabase('UIBuilder', [
  {
    version: 1,
    stores: {
      contractUIs: '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
    },
  },
]);

// packages/builder/src/storage/ContractUIStorage.ts
import { EntityStorage } from '@openzeppelin/ui-builder-storage';
import { db } from './database';
import type { ContractUIRecord } from './types';

export class ContractUIStorage extends EntityStorage<ContractUIRecord> {
  constructor() {
    // 50MB limit for records containing large contract definitions
    super(db, 'contractUIs', { maxRecordSizeBytes: 50 * 1024 * 1024 });
  }
  // Domain-specific methods...
}
```

### Key-Value Storage (Settings/Preferences)

```typescript
// database.ts
import { createDexieDatabase } from '@openzeppelin/ui-builder-storage';

export const db = createDexieDatabase('MyApp', [
  {
    version: 1,
    stores: {
      settings: '&key', // Key is the primary key
    },
  },
]);

// SettingsStorage.ts
import { KeyValueStorage } from '@openzeppelin/ui-builder-storage';
import { db } from './database';

class SettingsStorage extends KeyValueStorage<unknown> {
  constructor() {
    super(db, 'settings');
  }

  // Add typed convenience methods
  async getTheme(): Promise<'light' | 'dark'> {
    return (await this.get<'light' | 'dark'>('theme')) ?? 'light';
  }

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.set('theme', theme);
  }
}

export const settingsStorage = new SettingsStorage();

// Usage
await settingsStorage.set('theme', 'dark');
await settingsStorage.set('language', 'en');
await settingsStorage.set('notifications', { email: true, push: false });

const theme = await settingsStorage.get<string>('theme'); // 'dark'
const lang = await settingsStorage.getOrDefault('language', 'en'); // 'en'
const hasTheme = await settingsStorage.has('theme'); // true

// Bulk operations
await settingsStorage.setMany({
  theme: 'light',
  language: 'fr',
});

const values = await settingsStorage.getMany(['theme', 'language']);
// Map { 'theme' => 'light', 'language' => 'fr' }
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
