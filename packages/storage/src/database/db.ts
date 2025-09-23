import Dexie from 'dexie';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

// Single database instance shared across all storage services
export const db = new Dexie('UIBuilder');

// Version 1: Initial schema with indexed fields for efficient queries
db.version(1).stores({
  contractUIs:
    // contractAddress and functionId are indexed for fast lookup/filtering
    // (these fields are also stored in nested formConfig for different architectural purposes)
    '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
});

// Version 2: Add contract schema fields
db.version(2)
  .stores({
    contractUIs:
      // contractAddress and functionId remain indexed for database performance
      '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId, contractDefinitionSource, contractDefinitionOriginal',
  })
  .upgrade(() => {
    logger.info(
      'Database Migration',
      'Upgrading to version 2: Adding contract schema fields. No data modification is necessary.'
    );
  });
