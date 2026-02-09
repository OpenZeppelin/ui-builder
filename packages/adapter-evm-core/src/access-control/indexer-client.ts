/**
 * EVM Access Control Indexer Client
 *
 * Provides access to historical access control events via a GraphQL indexer.
 * Uses `fetch()` for GraphQL POST requests (available in both browser and Node.js).
 *
 * Endpoint resolution precedence:
 * 1. `networkConfig.accessControlIndexerUrl`
 *
 * Graceful degradation: catches network errors, returns null/empty results
 * with appropriate logging. The service layer handles unavailability transparently.
 *
 * **Reorg handling**: Chain reorganizations are the indexer's responsibility.
 * This client treats all indexer responses as best-effort historical data.
 *
 * @module access-control/indexer-client
 * @see quickstart.md §Step 4
 * @see contracts/indexer-queries.graphql
 * @see research.md §R3 — GraphQL Indexer Client
 */

import { logger } from '@openzeppelin/ui-utils';

import type { EvmCompatibleNetworkConfig } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const LOG_SYSTEM = 'EvmIndexerClient';

/** Pending ownership transfer enrichment data from the indexer */
export interface PendingOwnershipTransferData {
  /** Address of the pending new owner */
  pendingOwner: string;
  /** ISO8601 timestamp of the initiation event */
  initiatedAt: string;
  /** Transaction hash of the initiation event */
  initiatedTxId: string;
  /** Block number of the initiation event */
  initiatedBlock: number;
}

/** Pending admin transfer enrichment data from the indexer */
export interface PendingAdminTransferData {
  /** Address of the pending new admin */
  pendingAdmin: string;
  /** UNIX timestamp (seconds) at which the transfer can be accepted */
  acceptSchedule: number;
  /** ISO8601 timestamp of the initiation event */
  initiatedAt: string;
  /** Transaction hash of the initiation event */
  initiatedTxId: string;
  /** Block number of the initiation event */
  initiatedBlock: number;
}

/** Internal GraphQL response shape for access control events */
interface IndexerEventNode {
  id: string;
  eventType: string;
  blockNumber: string;
  timestamp: string;
  txHash: string;
  newOwner?: string;
  newAdmin?: string;
  acceptSchedule?: string;
  role?: string;
  account?: string;
}

interface IndexerEventsResponse {
  data?: {
    accessControlEvents?: {
      nodes: IndexerEventNode[];
      totalCount?: number;
      pageInfo?: {
        hasNextPage: boolean;
        hasPreviousPage?: boolean;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

// ---------------------------------------------------------------------------
// GraphQL Queries
// ---------------------------------------------------------------------------

const HEALTH_CHECK_QUERY = '{ __typename }';

const PENDING_OWNERSHIP_TRANSFER_QUERY = `
  query GetPendingOwnershipTransfer($network: String!, $contract: String!) {
    accessControlEvents(
      filter: {
        network: { equalTo: $network }
        contract: { equalTo: $contract }
        eventType: { equalTo: OWNERSHIP_TRANSFER_STARTED }
      }
      first: 1
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        id
        eventType
        blockNumber
        timestamp
        txHash
        newOwner
      }
    }
  }
`;

const PENDING_ADMIN_TRANSFER_QUERY = `
  query GetPendingAdminTransfer($network: String!, $contract: String!) {
    accessControlEvents(
      filter: {
        network: { equalTo: $network }
        contract: { equalTo: $contract }
        eventType: { in: [DEFAULT_ADMIN_TRANSFER_SCHEDULED, ADMIN_TRANSFER_INITIATED] }
      }
      first: 1
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        id
        eventType
        blockNumber
        timestamp
        txHash
        newAdmin
        acceptSchedule
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Client Implementation
// ---------------------------------------------------------------------------

/**
 * EVM Indexer Client
 *
 * Handles GraphQL queries to the configured indexer for historical access control data.
 * The client is designed for graceful degradation — all query methods return null
 * instead of throwing when the indexer is unavailable.
 */
export class EvmIndexerClient {
  private readonly networkConfig: EvmCompatibleNetworkConfig;
  private readonly endpoint: string | undefined;
  private availabilityChecked = false;
  private available = false;

  constructor(networkConfig: EvmCompatibleNetworkConfig) {
    this.networkConfig = networkConfig;
    this.endpoint = networkConfig.accessControlIndexerUrl;
  }

  // ── Availability ──────────────────────────────────────────────────────

  /**
   * Check if the indexer is available and configured.
   *
   * Performs a lightweight health check (`{ __typename }`) on the first call,
   * then caches the result for subsequent calls.
   *
   * @returns true if the indexer endpoint is configured and responds to health checks
   */
  async isAvailable(): Promise<boolean> {
    if (this.availabilityChecked) {
      return this.available;
    }

    if (!this.endpoint) {
      logger.info(LOG_SYSTEM, `No indexer configured for network ${this.networkConfig.id}`);
      this.availabilityChecked = true;
      this.available = false;
      return false;
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: HEALTH_CHECK_QUERY }),
      });

      if (response.ok) {
        logger.info(
          LOG_SYSTEM,
          `Indexer available for network ${this.networkConfig.id} at ${this.endpoint}`
        );
        this.available = true;
      } else {
        logger.warn(
          LOG_SYSTEM,
          `Indexer endpoint ${this.endpoint} returned status ${response.status}`
        );
        this.available = false;
      }
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to connect to indexer at ${this.endpoint}: ${error instanceof Error ? error.message : String(error)}`
      );
      this.available = false;
    }

    this.availabilityChecked = true;
    return this.available;
  }

  // ── Pending Ownership Transfer ────────────────────────────────────────

  /**
   * Query the indexer for the latest pending ownership transfer event.
   *
   * Queries for `OWNERSHIP_TRANSFER_STARTED` events, ordered by timestamp descending.
   * Returns the most recent event if found, or null if no pending transfer exists.
   *
   * Graceful degradation: returns null if the indexer is unavailable or the query fails.
   *
   * @param contractAddress - The contract address to query
   * @returns Pending transfer data or null
   */
  async queryPendingOwnershipTransfer(
    contractAddress: string
  ): Promise<PendingOwnershipTransferData | null> {
    const isUp = await this.isAvailable();
    if (!isUp || !this.endpoint) {
      return null;
    }

    logger.info(LOG_SYSTEM, `Querying pending ownership transfer for ${contractAddress}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: PENDING_OWNERSHIP_TRANSFER_QUERY,
          variables: {
            network: this.networkConfig.id,
            contract: contractAddress,
          },
        }),
      });

      if (!response.ok) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query failed with status ${response.status} for ownership transfer`
        );
        return null;
      }

      const result = (await response.json()) as IndexerEventsResponse;

      if (result.errors && result.errors.length > 0) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query errors: ${result.errors.map((e) => e.message).join('; ')}`
        );
        return null;
      }

      const nodes = result.data?.accessControlEvents?.nodes;
      if (!nodes || nodes.length === 0) {
        logger.debug(LOG_SYSTEM, `No pending ownership transfer found for ${contractAddress}`);
        return null;
      }

      const event = nodes[0];

      if (!event.newOwner) {
        logger.warn(
          LOG_SYSTEM,
          `OWNERSHIP_TRANSFER_STARTED event missing newOwner for ${contractAddress}`
        );
        return null;
      }

      return {
        pendingOwner: event.newOwner,
        initiatedAt: event.timestamp,
        initiatedTxId: event.txHash,
        initiatedBlock: parseInt(event.blockNumber, 10),
      };
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to query pending ownership transfer: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  // ── Pending Admin Transfer ────────────────────────────────────────────

  /**
   * Query the indexer for the latest pending admin transfer event.
   *
   * Queries for `DEFAULT_ADMIN_TRANSFER_SCHEDULED` or `ADMIN_TRANSFER_INITIATED` events,
   * ordered by timestamp descending. Returns the most recent event if found,
   * or null if no pending transfer exists.
   *
   * Graceful degradation: returns null if the indexer is unavailable or the query fails.
   *
   * @param contractAddress - The contract address to query
   * @returns Pending admin transfer data or null
   */
  async queryPendingAdminTransfer(
    contractAddress: string
  ): Promise<PendingAdminTransferData | null> {
    const isUp = await this.isAvailable();
    if (!isUp || !this.endpoint) {
      return null;
    }

    logger.info(LOG_SYSTEM, `Querying pending admin transfer for ${contractAddress}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: PENDING_ADMIN_TRANSFER_QUERY,
          variables: {
            network: this.networkConfig.id,
            contract: contractAddress,
          },
        }),
      });

      if (!response.ok) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query failed with status ${response.status} for admin transfer`
        );
        return null;
      }

      const result = (await response.json()) as IndexerEventsResponse;

      if (result.errors && result.errors.length > 0) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query errors: ${result.errors.map((e) => e.message).join('; ')}`
        );
        return null;
      }

      const nodes = result.data?.accessControlEvents?.nodes;
      if (!nodes || nodes.length === 0) {
        logger.debug(LOG_SYSTEM, `No pending admin transfer found for ${contractAddress}`);
        return null;
      }

      const event = nodes[0];

      if (!event.newAdmin) {
        logger.warn(LOG_SYSTEM, `Admin transfer event missing newAdmin for ${contractAddress}`);
        return null;
      }

      return {
        pendingAdmin: event.newAdmin,
        acceptSchedule: event.acceptSchedule ? parseInt(event.acceptSchedule, 10) : 0,
        initiatedAt: event.timestamp,
        initiatedTxId: event.txHash,
        initiatedBlock: parseInt(event.blockNumber, 10),
      };
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to query pending admin transfer: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an EvmIndexerClient instance for a network configuration.
 *
 * @param networkConfig - EVM network configuration (includes indexer URL)
 * @returns A new EvmIndexerClient instance
 */
export function createIndexerClient(networkConfig: EvmCompatibleNetworkConfig): EvmIndexerClient {
  return new EvmIndexerClient(networkConfig);
}
