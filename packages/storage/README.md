# @openzeppelin/ui-builder-storage

A React-first storage abstraction built on Dexie.js for IndexedDB. This package provides a reusable foundation for creating type-safe storage services that can be used across multiple applications.

## Description

This package provides a generic storage infrastructure built on top of IndexedDB using Dexie.js. It includes a base class for creating type-safe storage services, a React live-query hook, database creation utilities, and helpful abstractions. Each consuming application defines its own database name, schema, and domain-specific storage classes.

## Features

- 🗄️ **Generic Storage Base Class**: Extensible `DexieStorage` class for creating new storage services
- ⚛️ **React Support**: `useLiveQuery` re-exported for convenience
- 🔧 **App-Agnostic Schemas**: Each app defines its own DB name and stores
- 🔒 **Type Safety**: Full TypeScript support
- 🚀 **Performance**: Optimized for large datasets
- 📦 **CRUD Operations**: Create, Read, Update, Delete helpers
- 🔄 **Bulk Operations**: Efficient bulk add/put/delete
- 🔍 **Index Queries**: Query by indexed fields
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

export interface SettingRecord extends BaseRecord {
  key: string;
  value: unknown;
}
```

### 3. Create Storage Services

```typescript
import { DexieStorage, useLiveQuery } from '@openzeppelin/ui-builder-storage';

import { db } from './database';
import type { ItemRecord } from './types';

export class ItemStorage extends DexieStorage<ItemRecord> {
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

### `DexieStorage<T>`

Generic base class for creating storage services.

**Constructor:**

```typescript
constructor(
  db: Dexie,
  tableName: string,
)
```

**Methods:**

- `save(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
- `update(id: string, updates: Partial<T>): Promise<void>`
- `delete(id: string): Promise<void>`
- `get(id: string): Promise<T | undefined>`
- `getAll(): Promise<T[]>`
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

## Examples

### UI Builder App

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
import { DexieStorage } from '@openzeppelin/ui-builder-storage';
import { db } from './database';
import type { ContractUIRecord } from './types';

export class ContractUIStorage extends DexieStorage<ContractUIRecord> {
  constructor() {
    super(db, 'contractUIs');
  }
  // Domain-specific methods...
}
```

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
