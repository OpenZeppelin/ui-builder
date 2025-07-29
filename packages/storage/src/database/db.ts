import Dexie from 'dexie';

// Single database instance shared across all storage services
export const db = new Dexie('ContractsUIBuilder');

// Define initial schema
db.version(1).stores({
  contractUIs:
    '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
});

// Future versions can add more tables
// db.version(2).stores({
//   contractUIs: '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
//   transactions: '++id, hash, createdAt, networkId, status'
// });
