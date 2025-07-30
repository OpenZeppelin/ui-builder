/**
 * Database Migration: Add Contract Schema Fields
 *
 * This migration adds contract schema persistence fields to the ContractUIRecord interface
 * while maintaining backward compatibility with existing data.
 */

import { logger } from '@openzeppelin/contracts-ui-builder-utils';

import type { ContractUIRecord } from '../types';

/**
 * Migrates the database to version 2 by adding contract schema fields
 *
 * Schema Changes:
 * - contractSchema?: string - JSON string of the contract schema
 * - schemaSource: 'fetched' | 'manual' | 'hybrid' - Source of the schema
 * - schemaHash?: string - SHA-256 hash for quick comparison
 * - lastSchemaFetched?: Date - When schema was last fetched
 * - schemaMetadata?: ContractSchemaMetadata - Additional metadata
 */
// Using any for db parameter because Dexie's migration API has complex internal types
// that are not exposed for direct use in migration functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function migrateToV2(db: any): Promise<void> {
  logger.info('Migration', 'Starting migration to version 2: Add contract schema fields');

  try {
    const currentVersion = db.verno;

    if (currentVersion >= 2) {
      logger.info('Migration', 'Migration to version 2 already applied');
      return;
    }

    // Close the database before applying schema changes
    db.close();

    // Define the new schema with contract schema indexes
    db.version(2)
      .stores({
        contractUIs:
          '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId, schemaHash, lastSchemaFetched, schemaSource',
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upgrade(async (tx: any) => {
        // Dexie transaction type not exposed for migrations
        logger.info('Migration', 'Upgrading existing records with default contract schema values');

        // Update existing records with default schema values
        await tx
          .table('contractUIs')
          .toCollection()
          .modify((record: ContractUIRecord) => {
            // Set default schemaSource for existing records
            if (!record.schemaSource) {
              record.schemaSource = 'manual';
            }

            // Initialize optional fields as undefined (they'll remain undefined in storage)
            if (record.contractSchema === undefined) {
              record.contractSchema = undefined;
            }
            if (record.schemaHash === undefined) {
              record.schemaHash = undefined;
            }
            if (record.lastSchemaFetched === undefined) {
              record.lastSchemaFetched = undefined;
            }
            if (record.schemaMetadata === undefined) {
              record.schemaMetadata = undefined;
            }
          });

        const recordCount = await tx.table('contractUIs').count();
        logger.info(
          'Migration',
          `Updated ${recordCount} existing records with default schema values`
        );
      });

    // Reopen the database with the new schema
    await db.open();

    logger.info('Migration', 'Successfully completed migration to version 2');
  } catch (error) {
    logger.error('Migration', `Failed to migrate to version 2: ${(error as Error).message}`);
    throw new Error(`Database migration to version 2 failed: ${(error as Error).message}`);
  }
}

/**
 * Validates that the migration was successful
 */
// Using any for db parameter because Dexie's validation API types are not exposed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateV2Migration(db: any): Promise<boolean> {
  try {
    const version = db.verno;
    if (version < 2) {
      logger.error('Migration Validation', `Expected version 2, but got version ${version}`);
      return false;
    }

    // Test that we can read records with new schema
    const testRecords = await db.table('contractUIs').limit(1).toArray();
    logger.info(
      'Migration Validation',
      `Successfully validated migration, tested ${testRecords.length} records`
    );

    return true;
  } catch (error) {
    logger.error(
      'Migration Validation',
      `Migration validation failed: ${(error as Error).message}`
    );
    return false;
  }
}

/**
 * Rollback function (for emergency use)
 * WARNING: This will remove all contract schema data from existing records
 */
// Using any for db parameter because Dexie's rollback API types are not exposed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function rollbackFromV2(db: any): Promise<void> {
  logger.warn(
    'Migration Rollback',
    'Rolling back from version 2 - contract schema data will be lost'
  );

  try {
    // Close the database
    db.close();

    // Revert to version 1 schema (removing contract schema fields)
    db.version(1)
      .stores({
        contractUIs:
          '++id, title, createdAt, updatedAt, ecosystem, networkId, contractAddress, functionId',
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upgrade(async (tx: any) => {
        // Dexie transaction type not exposed for migrations
        // Remove contract schema fields from existing records
        await tx
          .table('contractUIs')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((record: any) => {
            // Dexie record type is dynamic during migrations
            delete record.contractSchema;
            delete record.schemaSource;
            delete record.schemaHash;
            delete record.lastSchemaFetched;
            delete record.schemaMetadata;
          });

        const recordCount = await tx.table('contractUIs').count();
        logger.info(
          'Migration Rollback',
          `Removed contract schema fields from ${recordCount} records`
        );
      });

    // Reopen with old schema
    await db.open();

    logger.info('Migration Rollback', 'Successfully rolled back to version 1');
  } catch (error) {
    logger.error('Migration Rollback', `Rollback failed: ${(error as Error).message}`);
    throw new Error(`Database rollback failed: ${(error as Error).message}`);
  }
}
