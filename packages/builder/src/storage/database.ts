import { createDexieDatabase } from '@openzeppelin/ui-builder-storage';

// Single database instance shared across all storage services
export const db = createDexieDatabase('UIBuilder', [
  // Version 1: Initial schema with indexed fields for efficient queries
  {
    version: 1,
    stores: {
      contractUIs:
        // contractAddress and functionId are indexed for fast lookup/filtering
        // (these fields are also stored in nested formConfig for different architectural purposes)
        '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
    },
  },
  // Version 2: Add contract schema fields
  {
    version: 2,
    stores: {
      contractUIs:
        // contractAddress and functionId remain indexed for database performance
        '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId, contractDefinitionSource, contractDefinitionOriginal',
    },
    upgrade: async (_trans) => {
      // Migration logic: No data modification is necessary for this version
      // The new fields are optional and will be populated as records are updated
    },
  },
]);
