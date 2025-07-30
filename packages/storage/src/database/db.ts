import Dexie from 'dexie';

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import type { ContractUIRecord } from '../types';

// Single database instance shared across all storage services
export const db = new Dexie('ContractsUIBuilder');

// Version 1: Initial schema
db.version(1).stores({
  contractUIs:
    '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
});

// Version 2: Add contract schema fields
db.version(2)
  .stores({
    contractUIs:
      '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId, schemaHash, lastSchemaFetched, schemaSource',
  })
  .upgrade(async (tx) => {
    logger.info('Database Migration', 'Upgrading to version 2: Adding contract schema fields');

    // Update existing records with default contract schema values
    await tx
      .table('contractUIs')
      .toCollection()
      .modify((record: ContractUIRecord) => {
        // Set default schemaSource for existing records (required field)
        if (!record.schemaSource) {
          record.schemaSource = 'manual';
        }

        // Optional fields remain undefined unless explicitly set
        // This ensures backward compatibility
      });

    const recordCount = await tx.table('contractUIs').count();
    logger.info(
      'Database Migration',
      `Updated ${recordCount} existing records with default schema values`
    );
  });
