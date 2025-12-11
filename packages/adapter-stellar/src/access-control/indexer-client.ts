/**
 * Stellar Indexer Client
 *
 * Provides access to historical access control events via a GraphQL indexer.
 * Implements config precedence: runtime override > network-config default > derived-from-RPC (if safe) > none.
 */

import type {
  HistoryChangeType,
  HistoryEntry,
  HistoryQueryOptions,
  IndexerEndpointConfig,
  PageInfo,
  PaginatedHistoryResult,
  RoleIdentifier,
  StellarNetworkConfig,
} from '@openzeppelin/ui-builder-types';
import {
  ConfigurationInvalid,
  IndexerUnavailable,
  OperationFailed,
} from '@openzeppelin/ui-builder-types';
import { appConfigService, logger } from '@openzeppelin/ui-builder-utils';

const LOG_SYSTEM = 'StellarIndexerClient';

/**
 * GraphQL query response types for indexer
 */
interface IndexerHistoryEntry {
  id: string;
  role?: string; // Nullable for Ownership events
  account: string;
  type:
    | 'ROLE_GRANTED'
    | 'ROLE_REVOKED'
    | 'OWNERSHIP_TRANSFER_COMPLETED'
    | 'OWNERSHIP_TRANSFER_STARTED';
  txHash: string;
  timestamp: string;
  blockHeight: string;
  /** Ledger sequence of the event */
  ledger?: string;
  /** Admin/owner who initiated the transfer (for OWNERSHIP_TRANSFER_STARTED) */
  admin?: string;
}

/**
 * Ownership Transfer Started Event
 *
 * Contains details about a pending two-step ownership transfer from the indexer.
 *
 * Note: The indexer does not store `live_until_ledger` expiration value.
 * To determine if a pending transfer has expired, the caller must query
 * the contract's on-chain state directly using `get_pending_owner()`.
 */
export interface OwnershipTransferStartedEvent {
  /** Previous owner (admin) who initiated the transfer */
  previousOwner: string;
  /** Pending owner address (account) - the new owner */
  pendingOwner: string;
  /** Transaction hash of the initiation */
  txHash: string;
  /** ISO8601 timestamp of the event */
  timestamp: string;
  /** Ledger sequence of the event */
  ledger: number;
}

interface IndexerPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

interface IndexerHistoryResponse {
  data?: {
    accessControlEvents?: {
      nodes: IndexerHistoryEntry[];
      pageInfo: IndexerPageInfo;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Response type for ownership transfer queries
 */
interface IndexerOwnershipTransferResponse {
  data?: {
    accessControlEvents?: {
      nodes: IndexerHistoryEntry[];
      pageInfo?: IndexerPageInfo;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Response type for role discovery query
 */
interface IndexerRoleDiscoveryResponse {
  data?: {
    accessControlEvents?: {
      nodes: Array<{
        role: string | null;
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Grant information for a specific member
 */
export interface GrantInfo {
  /** ISO8601 timestamp of the grant */
  timestamp: string;
  /** Transaction ID of the grant */
  txId: string;
  /** Block/ledger number of the grant */
  ledger: number;
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
   * Query history entries for a contract with pagination support
   * @param contractAddress The contract address to query
   * @param options Optional filtering and pagination options
   * @returns Promise resolving to paginated history result
   * @throws IndexerUnavailable if indexer is not available
   * @throws OperationFailed if query fails
   */
  async queryHistory(
    contractAddress: string,
    options?: HistoryQueryOptions
  ): Promise<PaginatedHistoryResult> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new IndexerUnavailable(
        'Indexer not available for this network',
        contractAddress,
        this.networkConfig.id
      );
    }

    const endpoints = this.resolveIndexerEndpoints();
    if (!endpoints.http) {
      throw new ConfigurationInvalid(
        'No indexer HTTP endpoint configured',
        contractAddress,
        'indexer.http'
      );
    }

    // Build query with server-side filtering and pagination
    const query = this.buildHistoryQuery(contractAddress, options);
    const variables = this.buildQueryVariables(contractAddress, options);

    try {
      const response = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new OperationFailed(
          `Indexer query failed with status ${response.status}`,
          contractAddress,
          'queryHistory'
        );
      }

      const result = (await response.json()) as IndexerHistoryResponse;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join('; ');
        throw new OperationFailed(
          `Indexer query errors: ${errorMessages}`,
          contractAddress,
          'queryHistory'
        );
      }

      if (!result.data?.accessControlEvents?.nodes) {
        logger.debug(LOG_SYSTEM, `No history data returned for contract ${contractAddress}`);
        return {
          items: [],
          pageInfo: { hasNextPage: false },
        };
      }

      const items = this.transformIndexerEntries(result.data.accessControlEvents.nodes);
      const pageInfo: PageInfo = {
        hasNextPage: result.data.accessControlEvents.pageInfo.hasNextPage,
        endCursor: result.data.accessControlEvents.pageInfo.endCursor,
      };

      return { items, pageInfo };
    } catch (error) {
      logger.error(
        LOG_SYSTEM,
        `Failed to query indexer history: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Discover all unique role identifiers for a contract by querying historical events
   *
   * Queries all ROLE_GRANTED and ROLE_REVOKED events and extracts unique role values.
   * This enables role enumeration even when knownRoleIds are not provided.
   *
   * @param contractAddress The contract address to discover roles for
   * @returns Promise resolving to array of unique role identifiers
   * @throws IndexerUnavailable if indexer is not available
   * @throws OperationFailed if query fails
   */
  async discoverRoleIds(contractAddress: string): Promise<string[]> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new IndexerUnavailable(
        'Indexer not available for this network',
        contractAddress,
        this.networkConfig.id
      );
    }

    const endpoints = this.resolveIndexerEndpoints();
    if (!endpoints.http) {
      throw new ConfigurationInvalid(
        'No indexer HTTP endpoint configured',
        contractAddress,
        'indexer.http'
      );
    }

    logger.info(LOG_SYSTEM, `Discovering role IDs for contract ${contractAddress}`);

    const query = this.buildRoleDiscoveryQuery();
    const variables = { contract: contractAddress };

    try {
      const response = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new OperationFailed(
          `Indexer query failed with status ${response.status}`,
          contractAddress,
          'discoverRoleIds'
        );
      }

      const result = (await response.json()) as IndexerRoleDiscoveryResponse;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join('; ');
        throw new OperationFailed(
          `Indexer query errors: ${errorMessages}`,
          contractAddress,
          'discoverRoleIds'
        );
      }

      if (!result.data?.accessControlEvents?.nodes) {
        logger.debug(LOG_SYSTEM, `No role events found for contract ${contractAddress}`);
        return [];
      }

      // Extract unique role IDs, filtering out null/undefined values (ownership events)
      const uniqueRoles = new Set<string>();
      for (const node of result.data.accessControlEvents.nodes) {
        if (node.role) {
          uniqueRoles.add(node.role);
        }
      }

      const roleIds = Array.from(uniqueRoles);
      logger.info(
        LOG_SYSTEM,
        `Discovered ${roleIds.length} unique role(s) for ${contractAddress}`,
        {
          roles: roleIds,
        }
      );

      return roleIds;
    } catch (error) {
      logger.error(
        LOG_SYSTEM,
        `Failed to discover role IDs: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Query the latest grant events for a set of members with a specific role
   *
   * Returns the most recent ROLE_GRANTED event for each member address.
   * This is used to enrich role assignments with grant timestamps.
   *
   * @param contractAddress The contract address
   * @param roleId The role identifier to query
   * @param memberAddresses Array of member addresses to look up
   * @returns Promise resolving to a Map of address -> GrantInfo
   * @throws IndexerUnavailable if indexer is not available
   * @throws OperationFailed if query fails
   */
  async queryLatestGrants(
    contractAddress: string,
    roleId: string,
    memberAddresses: string[]
  ): Promise<Map<string, GrantInfo>> {
    if (memberAddresses.length === 0) {
      return new Map();
    }

    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new IndexerUnavailable(
        'Indexer not available for this network',
        contractAddress,
        this.networkConfig.id
      );
    }

    const endpoints = this.resolveIndexerEndpoints();
    if (!endpoints.http) {
      throw new ConfigurationInvalid(
        'No indexer HTTP endpoint configured',
        contractAddress,
        'indexer.http'
      );
    }

    logger.debug(
      LOG_SYSTEM,
      `Querying latest grants for ${memberAddresses.length} member(s) with role ${roleId}`
    );

    const query = this.buildLatestGrantsQuery();
    const variables = {
      contract: contractAddress,
      role: roleId,
      accounts: memberAddresses,
    };

    try {
      const response = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new OperationFailed(
          `Indexer query failed with status ${response.status}`,
          contractAddress,
          'queryLatestGrants'
        );
      }

      const result = (await response.json()) as IndexerHistoryResponse;

      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors.map((e) => e.message).join('; ');
        throw new OperationFailed(
          `Indexer query errors: ${errorMessages}`,
          contractAddress,
          'queryLatestGrants'
        );
      }

      if (!result.data?.accessControlEvents?.nodes) {
        logger.debug(LOG_SYSTEM, `No grant events found for role ${roleId}`);
        return new Map();
      }

      // Build map of address -> latest grant info
      // Since we order by TIMESTAMP_DESC, we take the first occurrence per account
      const grantMap = new Map<string, GrantInfo>();
      for (const entry of result.data.accessControlEvents.nodes) {
        if (!grantMap.has(entry.account)) {
          grantMap.set(entry.account, {
            timestamp: entry.timestamp,
            txId: entry.txHash,
            ledger: parseInt(entry.blockHeight, 10),
          });
        }
      }

      logger.debug(
        LOG_SYSTEM,
        `Found grant info for ${grantMap.size} of ${memberAddresses.length} member(s)`
      );

      return grantMap;
    } catch (error) {
      logger.error(
        LOG_SYSTEM,
        `Failed to query latest grants: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * Query the latest pending ownership transfer for a contract
   *
   * Queries the indexer for `OWNERSHIP_TRANSFER_INITIATED` events and checks if
   * a corresponding `OWNERSHIP_TRANSFER_COMPLETED` event exists after the initiation.
   * If no completion event exists, returns the pending transfer details.
   *
   * @param contractAddress The contract address to query
   * @returns Promise resolving to pending transfer info, or null if no pending transfer
   * @throws IndexerUnavailable if indexer is not available
   * @throws OperationFailed if query fails
   *
   * @example
   * ```typescript
   * const pending = await client.queryPendingOwnershipTransfer('CABC...XYZ');
   * if (pending) {
   *   console.log(`Pending owner: ${pending.pendingOwner}`);
   *   console.log(`Transfer started at ledger: ${pending.ledger}`);
   * }
   * ```
   */
  async queryPendingOwnershipTransfer(
    contractAddress: string
  ): Promise<OwnershipTransferStartedEvent | null> {
    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      throw new IndexerUnavailable(
        'Indexer not available for this network',
        contractAddress,
        this.networkConfig.id
      );
    }

    const endpoints = this.resolveIndexerEndpoints();
    if (!endpoints.http) {
      throw new ConfigurationInvalid(
        'No indexer HTTP endpoint configured',
        contractAddress,
        'indexer.http'
      );
    }

    logger.info(LOG_SYSTEM, `Querying pending ownership transfer for ${contractAddress}`);

    // Step 1: Query latest OWNERSHIP_TRANSFER_STARTED event
    const initiationQuery = this.buildOwnershipTransferStartedQuery();
    const initiationVariables = { contract: contractAddress };

    try {
      const initiationResponse = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: initiationQuery, variables: initiationVariables }),
      });

      if (!initiationResponse.ok) {
        throw new OperationFailed(
          `Indexer query failed with status ${initiationResponse.status}`,
          contractAddress,
          'queryPendingOwnershipTransfer'
        );
      }

      const initiationResult =
        (await initiationResponse.json()) as IndexerOwnershipTransferResponse;

      if (initiationResult.errors && initiationResult.errors.length > 0) {
        const errorMessages = initiationResult.errors.map((e) => e.message).join('; ');
        throw new OperationFailed(
          `Indexer query errors: ${errorMessages}`,
          contractAddress,
          'queryPendingOwnershipTransfer'
        );
      }

      const initiatedNodes = initiationResult.data?.accessControlEvents?.nodes;
      if (!initiatedNodes || initiatedNodes.length === 0) {
        logger.debug(LOG_SYSTEM, `No ownership transfer initiated for ${contractAddress}`);
        return null;
      }

      const latestInitiation = initiatedNodes[0];

      // Step 2: Check if a completion event exists after the initiation
      const completionQuery = this.buildOwnershipTransferCompletedQuery();
      const completionVariables = {
        contract: contractAddress,
        afterTimestamp: latestInitiation.timestamp,
      };

      const completionResponse = await fetch(endpoints.http, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: completionQuery, variables: completionVariables }),
      });

      if (!completionResponse.ok) {
        throw new OperationFailed(
          `Indexer completion query failed with status ${completionResponse.status}`,
          contractAddress,
          'queryPendingOwnershipTransfer'
        );
      }

      const completionResult =
        (await completionResponse.json()) as IndexerOwnershipTransferResponse;

      // Check for GraphQL errors in completion query (same as initiation query)
      if (completionResult.errors && completionResult.errors.length > 0) {
        const errorMessages = completionResult.errors.map((e) => e.message).join('; ');
        throw new OperationFailed(
          `Indexer completion query errors: ${errorMessages}`,
          contractAddress,
          'queryPendingOwnershipTransfer'
        );
      }

      const completedNodes = completionResult.data?.accessControlEvents?.nodes;
      if (completedNodes && completedNodes.length > 0) {
        // Transfer was completed after initiation - no pending transfer
        logger.debug(LOG_SYSTEM, `Ownership transfer was completed for ${contractAddress}`);
        return null;
      }

      // No completion - validate required fields before returning pending transfer info
      // The admin field is required for OWNERSHIP_TRANSFER_STARTED events
      if (!latestInitiation.admin) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer returned OWNERSHIP_TRANSFER_STARTED event without admin field for ${contractAddress}. ` +
            `This indicates incomplete indexer data. Treating as no valid pending transfer.`
        );
        return null;
      }

      logger.info(
        LOG_SYSTEM,
        `Found pending ownership transfer for ${contractAddress}: pending owner=${latestInitiation.account}`
      );

      return {
        previousOwner: latestInitiation.admin,
        pendingOwner: latestInitiation.account,
        txHash: latestInitiation.txHash,
        timestamp: latestInitiation.timestamp,
        ledger: parseInt(latestInitiation.ledger || latestInitiation.blockHeight, 10),
      };
    } catch (error) {
      if (error instanceof IndexerUnavailable || error instanceof OperationFailed) {
        throw error;
      }
      logger.error(
        LOG_SYSTEM,
        `Failed to query pending ownership transfer: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new OperationFailed(
        `Failed to query pending ownership transfer: ${(error as Error).message}`,
        contractAddress,
        'queryPendingOwnershipTransfer'
      );
    }
  }

  /**
   * Build GraphQL query for OWNERSHIP_TRANSFER_STARTED events
   *
   * Note: The OpenZeppelin Stellar contract emits `ownership_transfer` event
   * which is indexed as `OWNERSHIP_TRANSFER_STARTED`.
   *
   * Schema mapping:
   * - `account`: pending new owner
   * - `admin`: current owner who initiated the transfer
   * - `ledger`: block height of the event
   *
   * Note: `live_until_ledger` is NOT stored in the indexer schema.
   */
  private buildOwnershipTransferStartedQuery(): string {
    return `
      query GetOwnershipTransferStarted($contract: String!) {
        accessControlEvents(
          filter: {
            contract: { equalTo: $contract }
            type: { equalTo: OWNERSHIP_TRANSFER_STARTED }
          }
          orderBy: TIMESTAMP_DESC
          first: 1
        ) {
          nodes {
            id
            account
            admin
            txHash
            timestamp
            ledger
            blockHeight
          }
        }
      }
    `;
  }

  /**
   * Build GraphQL query for OWNERSHIP_TRANSFER_COMPLETED events after a given timestamp
   */
  private buildOwnershipTransferCompletedQuery(): string {
    return `
      query GetOwnershipTransferCompleted($contract: String!, $afterTimestamp: Datetime!) {
        accessControlEvents(
          filter: {
            contract: { equalTo: $contract }
            type: { equalTo: OWNERSHIP_TRANSFER_COMPLETED }
            timestamp: { greaterThan: $afterTimestamp }
          }
          orderBy: TIMESTAMP_DESC
          first: 1
        ) {
          nodes {
            id
            txHash
            timestamp
          }
        }
      }
    `;
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
   * Maps internal changeType to GraphQL EventType enum
   * GraphQL enum values: ROLE_GRANTED, ROLE_REVOKED, OWNERSHIP_TRANSFER_COMPLETED
   */
  private mapChangeTypeToGraphQLEnum(changeType: HistoryChangeType): string {
    const mapping: Record<HistoryChangeType, string> = {
      GRANTED: 'ROLE_GRANTED',
      REVOKED: 'ROLE_REVOKED',
      TRANSFERRED: 'OWNERSHIP_TRANSFER_COMPLETED',
    };
    return mapping[changeType];
  }

  /**
   * Build GraphQL query for history with SubQuery filtering and pagination
   */
  private buildHistoryQuery(_contractAddress: string, options?: HistoryQueryOptions): string {
    const roleFilter = options?.roleId ? ', role: { equalTo: $role }' : '';
    const accountFilter = options?.account ? ', account: { equalTo: $account }' : '';
    // Type filter uses inline enum value (consistent with buildLatestGrantsQuery pattern)
    const typeFilter = options?.changeType
      ? `, type: { equalTo: ${this.mapChangeTypeToGraphQLEnum(options.changeType)} }`
      : '';
    const txFilter = options?.txId ? ', txHash: { equalTo: $txHash }' : '';
    // Build combined timestamp filter to avoid duplicate keys
    const timestampConditions: string[] = [];
    if (options?.timestampFrom) {
      timestampConditions.push('greaterThanOrEqualTo: $timestampFrom');
    }
    if (options?.timestampTo) {
      timestampConditions.push('lessThanOrEqualTo: $timestampTo');
    }
    const timestampFilter =
      timestampConditions.length > 0 ? `, timestamp: { ${timestampConditions.join(', ')} }` : '';
    const ledgerFilter = options?.ledger ? ', blockHeight: { equalTo: $blockHeight }' : '';
    const limitClause = options?.limit ? ', first: $limit' : '';
    const cursorClause = options?.cursor ? ', after: $cursor' : '';

    // Build variable declarations
    // Note: SubQuery uses Datetime for timestamp filters and BigFloat for blockHeight filtering
    const varDeclarations = [
      '$contract: String!',
      options?.roleId ? '$role: String' : '',
      options?.account ? '$account: String' : '',
      options?.txId ? '$txHash: String' : '',
      options?.timestampFrom ? '$timestampFrom: Datetime' : '',
      options?.timestampTo ? '$timestampTo: Datetime' : '',
      options?.ledger ? '$blockHeight: BigFloat' : '',
      options?.limit ? '$limit: Int' : '',
      options?.cursor ? '$cursor: Cursor' : '',
    ]
      .filter(Boolean)
      .join(', ');

    return `
      query GetHistory(${varDeclarations}) {
        accessControlEvents(
          filter: {
            contract: { equalTo: $contract }${roleFilter}${accountFilter}${typeFilter}${txFilter}${timestampFilter}${ledgerFilter}
          }
          orderBy: TIMESTAMP_DESC${limitClause}${cursorClause}
        ) {
          nodes {
            id
            role
            account
            type
            txHash
            timestamp
            blockHeight
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }

  /**
   * Build query variables including pagination cursor
   */
  private buildQueryVariables(
    contractAddress: string,
    options?: HistoryQueryOptions
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
    if (options?.txId) {
      variables.txHash = options.txId;
    }
    if (options?.timestampFrom) {
      variables.timestampFrom = options.timestampFrom;
    }
    if (options?.timestampTo) {
      variables.timestampTo = options.timestampTo;
    }
    if (options?.ledger) {
      // GraphQL expects blockHeight as string
      variables.blockHeight = String(options.ledger);
    }
    if (options?.limit) {
      variables.limit = options.limit;
    }
    if (options?.cursor) {
      variables.cursor = options.cursor;
    }

    return variables;
  }

  /**
   * Build GraphQL query for role discovery
   * Queries all ROLE_GRANTED and ROLE_REVOKED events to extract unique role identifiers
   * Note: EventType is a GraphQL enum, so values must not be quoted
   */
  private buildRoleDiscoveryQuery(): string {
    return `
      query DiscoverRoles($contract: String!) {
        accessControlEvents(
          filter: {
            contract: { equalTo: $contract }
            type: { in: [ROLE_GRANTED, ROLE_REVOKED] }
          }
        ) {
          nodes {
            role
          }
        }
      }
    `;
  }

  /**
   * Build GraphQL query for latest grants
   * Queries ROLE_GRANTED events for a specific role and set of accounts
   * Ordered by timestamp descending so first occurrence per account is the latest
   */
  private buildLatestGrantsQuery(): string {
    return `
      query LatestGrants($contract: String!, $role: String!, $accounts: [String!]!) {
        accessControlEvents(
          filter: {
            contract: { equalTo: $contract }
            role: { equalTo: $role }
            account: { in: $accounts }
            type: { equalTo: ROLE_GRANTED }
          }
          orderBy: TIMESTAMP_DESC
        ) {
          nodes {
            account
            txHash
            timestamp
            blockHeight
          }
        }
      }
    `;
  }

  /**
   * Transform indexer entries to standard HistoryEntry format
   */
  private transformIndexerEntries(entries: IndexerHistoryEntry[]): HistoryEntry[] {
    return entries.map((entry) => {
      const role: RoleIdentifier = {
        id: entry.role || 'OWNER', // Map ownership events to special role
      };

      // Map SubQuery event types to internal types
      let changeType: HistoryChangeType;
      if (entry.type === 'ROLE_GRANTED') {
        changeType = 'GRANTED';
      } else if (entry.type === 'ROLE_REVOKED') {
        changeType = 'REVOKED';
      } else if (entry.type === 'OWNERSHIP_TRANSFER_COMPLETED') {
        changeType = 'TRANSFERRED';
      } else {
        // Default to GRANTED for unknown types (shouldn't happen)
        changeType = 'GRANTED';
      }

      return {
        role,
        account: entry.account,
        changeType,
        txId: entry.txHash,
        timestamp: entry.timestamp,
        ledger: parseInt(entry.blockHeight, 10),
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
