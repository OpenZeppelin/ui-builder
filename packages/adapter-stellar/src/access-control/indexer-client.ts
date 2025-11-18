/**
 * Stellar Indexer Client
 *
 * Provides access to historical access control events via a GraphQL indexer.
 * Implements config precedence: runtime override > network-config default > derived-from-RPC (if safe) > none.
 */

import type {
  HistoryEntry,
  IndexerEndpointConfig,
  RoleIdentifier,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';
import { appConfigService, logger } from '@openzeppelin/ui-builder-utils';

const LOG_SYSTEM = 'StellarIndexerClient';

/**
 * GraphQL query response types for indexer
 */
interface IndexerHistoryEntry {
  role: {
    id: string;
    label?: string;
  };
  account: string;
  changeType: 'GRANTED' | 'REVOKED';
  txId: string;
  timestamp?: string;
  ledger?: number;
}

interface IndexerHistoryResponse {
  data?: {
    history?: IndexerHistoryEntry[];
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Options for querying history
 */
export interface IndexerHistoryOptions {
  roleId?: string;
  account?: string;
  limit?: number;
}

/**
 * Stellar Indexer Client
 * Handles GraphQL queries to the configured indexer for historical access control data
 */
export class StellarIndexerClient {
  private readonly networkConfig: StellarNetworkConfig;
  private resolvedEndpoints: IndexerEndpointConfig | null = null;
  private availabilityChecked = false;
  private isAvailable = false;

  constructor(networkConfig: StellarNetworkConfig) {
    this.networkConfig = networkConfig;
  }

  /**
   * Check if indexer is available and configured
   * @returns True if indexer endpoints are configured and reachable
   */
  async checkAvailability(): Promise<boolean> {
    if (this.availabilityChecked) {
      return this.isAvailable;
    }

    const endpoints = this.resolveIndexerEndpoints();
    if (!endpoints.http) {
      logger.info(LOG_SYSTEM, `No indexer configured for network ${this.networkConfig.id}`);
      this.availabilityChecked = true;
      this.isAvailable = false;
      return false;
    }

    try {
      // Simple connectivity check with a minimal query
      const response = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '{ __typename }',
        }),
      });

      if (response.ok) {
        logger.info(
          LOG_SYSTEM,
          `Indexer available for network ${this.networkConfig.id} at ${endpoints.http}`
        );
        this.isAvailable = true;
      } else {
        logger.warn(
          LOG_SYSTEM,
          `Indexer endpoint ${endpoints.http} returned status ${response.status}`
        );
        this.isAvailable = false;
      }
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to connect to indexer at ${endpoints.http}: ${error instanceof Error ? error.message : String(error)}`
      );
      this.isAvailable = false;
    }

    this.availabilityChecked = true;
    return this.isAvailable;
  }

  /**
   * Query history entries for a contract
   * @param contractAddress The contract address to query
   * @param options Optional filtering options
   * @returns Promise resolving to array of history entries
   * @throws Error if indexer is not available or query fails
   */
  async queryHistory(
    contractAddress: string,
    options?: IndexerHistoryOptions
  ): Promise<HistoryEntry[]> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new Error(`Indexer not available for network ${this.networkConfig.id}`);
    }

    const endpoints = this.resolveIndexerEndpoints();
    if (!endpoints.http) {
      throw new Error('No indexer HTTP endpoint configured');
    }

    const query = this.buildHistoryQuery(contractAddress, options);
    const variables = this.buildQueryVariables(contractAddress, options);

    try {
      const response = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`Indexer query failed with status ${response.status}`);
      }

      const result = (await response.json()) as IndexerHistoryResponse;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join('; ');
        throw new Error(`Indexer query errors: ${errorMessages}`);
      }

      if (!result.data?.history) {
        logger.debug(LOG_SYSTEM, `No history data returned for contract ${contractAddress}`);
        return [];
      }

      return this.transformIndexerEntries(result.data.history);
    } catch (error) {
      logger.error(
        LOG_SYSTEM,
        `Failed to query indexer history: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Resolve indexer endpoints with config precedence
   * Priority:
   * 1. Runtime override from AppConfigService
   * 2. Network config defaults (indexerUri/indexerWsUri)
   * 3. Derived from RPC (if safe pattern exists)
   * 4. None (returns empty object)
   *
   * @returns Resolved indexer endpoints
   */
  private resolveIndexerEndpoints(): IndexerEndpointConfig {
    if (this.resolvedEndpoints) {
      return this.resolvedEndpoints;
    }

    const networkId = this.networkConfig.id;
    const endpoints: IndexerEndpointConfig = {};

    // Priority 1: Check AppConfigService for runtime override
    const indexerOverride = appConfigService.getIndexerEndpointOverride(networkId);
    if (indexerOverride) {
      if (typeof indexerOverride === 'string') {
        endpoints.http = indexerOverride;
        logger.info(
          LOG_SYSTEM,
          `Using runtime indexer override for ${networkId}: ${indexerOverride}`
        );
      } else if (typeof indexerOverride === 'object') {
        if ('http' in indexerOverride && indexerOverride.http) {
          endpoints.http = indexerOverride.http;
        }
        if ('ws' in indexerOverride && indexerOverride.ws) {
          endpoints.ws = indexerOverride.ws;
        }
        logger.info(
          LOG_SYSTEM,
          `Using runtime indexer override for ${networkId}: http=${endpoints.http}, ws=${endpoints.ws}`
        );
      }
      this.resolvedEndpoints = endpoints;
      return endpoints;
    }

    // Priority 2: Network config defaults
    if (this.networkConfig.indexerUri) {
      endpoints.http = this.networkConfig.indexerUri;
      logger.info(
        LOG_SYSTEM,
        `Using network config indexer URI for ${networkId}: ${endpoints.http}`
      );
    }
    if (this.networkConfig.indexerWsUri) {
      endpoints.ws = this.networkConfig.indexerWsUri;
      logger.debug(
        LOG_SYSTEM,
        `Using network config indexer WS URI for ${networkId}: ${endpoints.ws}`
      );
    }

    if (endpoints.http || endpoints.ws) {
      this.resolvedEndpoints = endpoints;
      return endpoints;
    }

    // Priority 3: Derive from RPC (only if safe, known pattern exists)
    // Currently DISABLED - no safe derivation pattern implemented
    // This would be enabled in the future when indexer/RPC relationship is well-defined
    logger.debug(LOG_SYSTEM, `No indexer derivation pattern available for ${networkId}`);

    // Priority 4: None - no indexer configured
    logger.debug(LOG_SYSTEM, `No indexer endpoints configured for ${networkId}`);
    this.resolvedEndpoints = endpoints;
    return endpoints;
  }

  /**
   * Build GraphQL query for history
   */
  private buildHistoryQuery(_contractAddress: string, options?: IndexerHistoryOptions): string {
    const roleFilter = options?.roleId ? ', role: $role' : '';
    const accountFilter = options?.account ? ', account: $account' : '';
    const limitClause = options?.limit ? ', limit: $limit' : '';

    return `
      query GetHistory($contract: ID!${roleFilter ? ', $role: ID' : ''}${accountFilter ? ', $account: String' : ''}${limitClause ? ', $limit: Int' : ''}) {
        history(contract: $contract${roleFilter}${accountFilter}${limitClause}) {
          role {
            id
            label
          }
          account
          changeType
          txId
          timestamp
          ledger
        }
      }
    `;
  }

  /**
   * Build query variables
   */
  private buildQueryVariables(
    contractAddress: string,
    options?: IndexerHistoryOptions
  ): Record<string, unknown> {
    const variables: Record<string, unknown> = {
      contract: contractAddress,
    };

    if (options?.roleId) {
      variables.role = options.roleId;
    }
    if (options?.account) {
      variables.account = options.account;
    }
    if (options?.limit) {
      variables.limit = options.limit;
    }

    return variables;
  }

  /**
   * Transform indexer entries to standard HistoryEntry format
   */
  private transformIndexerEntries(entries: IndexerHistoryEntry[]): HistoryEntry[] {
    return entries.map((entry) => {
      const role: RoleIdentifier = {
        id: entry.role.id,
        ...(entry.role.label ? { label: entry.role.label } : {}),
      };

      return {
        role,
        account: entry.account,
        changeType: entry.changeType,
        txId: entry.txId,
        ...(entry.timestamp ? { timestamp: entry.timestamp } : {}),
        ...(entry.ledger !== undefined ? { ledger: entry.ledger } : {}),
      };
    });
  }
}

/**
 * Factory function to create an indexer client for a network
 * @param networkConfig The Stellar network configuration
 * @returns A new indexer client instance
 */
export function createIndexerClient(networkConfig: StellarNetworkConfig): StellarIndexerClient {
  return new StellarIndexerClient(networkConfig);
}
