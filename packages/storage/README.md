# @openzeppelin/contracts-ui-builder-storage

Local storage services for the OpenZeppelin Contracts UI Builder ecosystem.

## Description

This package provides a reusable storage infrastructure built on top of IndexedDB using Dexie.js. It includes a generic base class for creating type-safe storage services, along with specific implementations for Contract UI configurations.

## Features

- 🗄️ **Generic Storage Base Class**: Extensible `DexieStorage` class for creating new storage services
- 🔄 **Reactive Updates**: Live queries with `dexie-react-hooks` for automatic UI updates
- 🔒 **Type Safety**: Full TypeScript support with proper type definitions
- 🚀 **Performance**: Optimized for handling 1000+ records efficiently
- 🔧 **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- 📦 **Import/Export**: Built-in JSON import/export capabilities
- 🔄 **Multi-tab Sync**: Automatic synchronization across browser tabs

## Installation

```bash
pnpm add @openzeppelin/contracts-ui-builder-storage
```

## Usage

### Basic Usage

```typescript
import { useContractUIStorage } from '@openzeppelin/contracts-ui-builder-storage';

function MyComponent() {
  const {
    contractUIs,
    isLoading,
    saveContractUI,
    updateContractUI,
    deleteContractUI,
    exportContractUIs,
    importContractUIs
  } = useContractUIStorage();

  // Save a new configuration
  const handleSave = async () => {
    const id = await saveContractUI({
      title: 'My Contract UI',
      ecosystem: 'evm',
      networkId: '1',
      contractAddress: '0x...',
      functionId: 'transfer',
      formConfig: { /* ... */ }
    });
  };

  // Export configurations
  const handleExport = async () => {
    await exportContractUIs(); // Exports all
    // or
    await exportContractUIs(['id1', 'id2']); // Export specific
  };

  return (
    <div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {contractUIs?.map(ui => (
            <li key={ui.id}>{ui.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Creating a Custom Storage Service

```typescript
import { DexieStorage, db } from '@openzeppelin/contracts-ui-builder-storage';

interface TransactionRecord extends BaseRecord {
  hash: string;
  networkId: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

class TransactionStorage extends DexieStorage<TransactionRecord> {
  constructor() {
    super(db, 'transactions');
  }

  async getByHash(hash: string): Promise<TransactionRecord | undefined> {
    return await this.table.where('hash').equals(hash).first();
  }

  async getPending(): Promise<TransactionRecord[]> {
    return await this.table.where('status').equals('pending').toArray();
  }
}

export const transactionStorage = new TransactionStorage();
```

## API Reference

### `DexieStorage<T>`

Generic base class for creating storage services.

#### Methods

- `save(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>`
- `update(id: string, updates: Partial<T>): Promise<void>`
- `delete(id: string): Promise<void>`
- `get(id: string): Promise<T | undefined>`
- `getAll(): Promise<T[]>`
- `clear(): Promise<void>`

### `useContractUIStorage()`

React hook for Contract UI storage operations.

#### Returns

- `contractUIs: ContractUIRecord[] | undefined` - Array of saved configurations
- `isLoading: boolean` - Loading state
- `saveContractUI` - Save a new configuration
- `updateContractUI` - Update an existing configuration
- `deleteContractUI` - Delete a configuration
- `deleteAllContractUIs` - Delete all configurations
- `duplicateContractUI` - Duplicate a configuration
- `exportContractUIs` - Export configurations as JSON
- `importContractUIs` - Import configurations from file

## Types

### `ContractUIRecord`

```typescript
interface ContractUIRecord extends BaseRecord {
  title: string;
  ecosystem: string;
  networkId: string;
  contractAddress: string;
  functionId: string;
  formConfig: RenderFormSchema;
  executionConfig?: ExecutionConfig;
  uiKitConfig?: UiKitConfiguration;
  metadata?: Record<string, unknown>;
}
```

### `BaseRecord`

```typescript
interface BaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

## License

MIT
