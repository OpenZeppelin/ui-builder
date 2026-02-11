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

import type {
  HistoryChangeType,
  HistoryEntry,
  HistoryQueryOptions,
  PageInfo,
  PaginatedHistoryResult,
  RoleIdentifier,
} from '@openzeppelin/ui-types';
import { logger } from '@openzeppelin/ui-utils';

import type { EvmCompatibleNetworkConfig } from '../types';
import { DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE_LABEL, resolveRoleLabel } from './constants';

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

/** Grant info data returned from queryLatestGrants */
export interface GrantInfo {
  /** The account address */
  account: string;
  /** The role ID */
  role: string;
  /** ISO8601 timestamp of the grant event */
  grantedAt: string;
  /** Transaction hash of the grant event */
  txHash: string;
  /** Who granted the role */
  grantedBy?: string;
}

/**
 * Build the composite key used for grant map lookups.
 *
 * Keys on `role:account` (both lowercased) so that an account holding
 * multiple roles gets a distinct entry per role, avoiding stale grant
 * metadata cross-contamination.
 *
 * @param roleId - The bytes32 role identifier
 * @param account - The account address
 * @returns A composite key in the form `roleId:account` (lowercased)
 */
export function grantMapKey(roleId: string, account: string): string {
  return `${roleId.toLowerCase()}:${account.toLowerCase()}`;
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

/** Internal GraphQL response shape for role membership nodes */
interface RoleMembershipNode {
  role: string;
  account: string;
  grantedAt: string;
  grantedBy?: string;
  txHash: string;
}

interface IndexerEventsResponse {
  data?: {
    accessControlEvents?: {
      nodes: IndexerEventNode[];
      totalCount?: number;
      pageInfo?: {
        hasNextPage: boolean;
        hasPreviousPage?: boolean;
        endCursor?: string;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

interface IndexerDiscoverRolesResponse {
  data?: {
    accessControlEvents?: {
      nodes: Array<{ role?: string | null }>;
    };
  };
  errors?: Array<{ message: string }>;
}

interface IndexerRoleMembershipsResponse {
  data?: {
    roleMemberships?: {
      nodes: RoleMembershipNode[];
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

const ROLE_MEMBERSHIPS_QUERY = `
  query GetRoleMembers($network: String!, $contract: String!, $roles: [String!]) {
    roleMemberships(
      filter: {
        network: { equalTo: $network }
        contract: { equalTo: $contract }
        role: { in: $roles }
      }
      orderBy: GRANTED_AT_DESC
    ) {
      nodes {
        role
        account
        grantedAt
        grantedBy
        txHash
      }
    }
  }
`;

const DISCOVER_ROLES_QUERY = `
  query DiscoverRoles($network: String!, $contract: String!) {
    accessControlEvents(
      filter: {
        network: { equalTo: $network }
        contract: { equalTo: $contract }
      }
      first: 1000
      orderBy: TIMESTAMP_DESC
    ) {
      nodes {
        role
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
// EVM Event Type → HistoryChangeType Mapping (research.md §R6)
// ---------------------------------------------------------------------------

/**
 * Maps all 13 EVM indexer event types to unified HistoryChangeType values.
 *
 * 10 types map directly. 3 EVM-specific types (DEFAULT_ADMIN_TRANSFER_CANCELED,
 * DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED, DEFAULT_ADMIN_DELAY_CHANGE_CANCELED)
 * map to their PR-2 variants (ADMIN_TRANSFER_CANCELED, ADMIN_DELAY_CHANGE_SCHEDULED,
 * ADMIN_DELAY_CHANGE_CANCELED) which are now available in @openzeppelin/ui-types@1.7.0.
 *
 * DEFAULT_ADMIN_TRANSFER_SCHEDULED is an EVM-specific alias for ADMIN_TRANSFER_INITIATED.
 */
const EVM_EVENT_TYPE_TO_CHANGE_TYPE: Record<string, HistoryChangeType> = {
  ROLE_GRANTED: 'GRANTED',
  ROLE_REVOKED: 'REVOKED',
  ROLE_ADMIN_CHANGED: 'ROLE_ADMIN_CHANGED',
  OWNERSHIP_TRANSFER_STARTED: 'OWNERSHIP_TRANSFER_STARTED',
  OWNERSHIP_TRANSFER_COMPLETED: 'OWNERSHIP_TRANSFER_COMPLETED',
  OWNERSHIP_RENOUNCED: 'OWNERSHIP_RENOUNCED',
  ADMIN_TRANSFER_INITIATED: 'ADMIN_TRANSFER_INITIATED',
  ADMIN_TRANSFER_COMPLETED: 'ADMIN_TRANSFER_COMPLETED',
  ADMIN_RENOUNCED: 'ADMIN_RENOUNCED',
  // EVM-specific aliases
  DEFAULT_ADMIN_TRANSFER_SCHEDULED: 'ADMIN_TRANSFER_INITIATED',
  DEFAULT_ADMIN_TRANSFER_CANCELED: 'ADMIN_TRANSFER_CANCELED',
  DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED: 'ADMIN_DELAY_CHANGE_SCHEDULED',
  DEFAULT_ADMIN_DELAY_CHANGE_CANCELED: 'ADMIN_DELAY_CHANGE_CANCELED',
};

/**
 * Reverse mapping: HistoryChangeType → EVM indexer GraphQL enum value.
 * Used to filter by event type in history queries.
 */
const CHANGE_TYPE_TO_EVENT_TYPE: Record<HistoryChangeType, string> = {
  GRANTED: 'ROLE_GRANTED',
  REVOKED: 'ROLE_REVOKED',
  ROLE_ADMIN_CHANGED: 'ROLE_ADMIN_CHANGED',
  OWNERSHIP_TRANSFER_STARTED: 'OWNERSHIP_TRANSFER_STARTED',
  OWNERSHIP_TRANSFER_COMPLETED: 'OWNERSHIP_TRANSFER_COMPLETED',
  OWNERSHIP_RENOUNCED: 'OWNERSHIP_RENOUNCED',
  ADMIN_TRANSFER_INITIATED: 'ADMIN_TRANSFER_INITIATED',
  ADMIN_TRANSFER_COMPLETED: 'ADMIN_TRANSFER_COMPLETED',
  ADMIN_TRANSFER_CANCELED: 'DEFAULT_ADMIN_TRANSFER_CANCELED',
  ADMIN_RENOUNCED: 'ADMIN_RENOUNCED',
  ADMIN_DELAY_CHANGE_SCHEDULED: 'DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED',
  ADMIN_DELAY_CHANGE_CANCELED: 'DEFAULT_ADMIN_DELAY_CHANGE_CANCELED',
  UNKNOWN: 'UNKNOWN',
};

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

  // ── Role Membership Queries (Phase 5 — US3) ────────────────────────────

  /**
   * Query the indexer for current role membership grant data.
   *
   * Queries `roleMemberships` for the specified roles, returning a map of
   * `role:account → GrantInfo` for enrichment of role assignments. The composite
   * key ensures that an account holding multiple roles retains distinct grant
   * metadata per role. Use {@link grantMapKey} to build lookup keys.
   *
   * Returns an empty Map if roleIds is empty. Returns null if the indexer
   * is unavailable or the query fails (graceful degradation).
   *
   * @param contractAddress - The contract address to query
   * @param roleIds - Array of bytes32 role IDs to query
   * @returns Map of `role:account` composite key to GrantInfo, or null on failure
   */
  async queryLatestGrants(
    contractAddress: string,
    roleIds: string[]
  ): Promise<Map<string, GrantInfo> | null> {
    if (roleIds.length === 0) {
      return new Map();
    }

    const isUp = await this.isAvailable();
    if (!isUp || !this.endpoint) {
      return null;
    }

    logger.info(
      LOG_SYSTEM,
      `Querying latest grants for ${roleIds.length} role(s) on ${contractAddress}`
    );

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: ROLE_MEMBERSHIPS_QUERY,
          variables: {
            network: this.networkConfig.id,
            contract: contractAddress,
            roles: roleIds,
          },
        }),
      });

      if (!response.ok) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query failed with status ${response.status} for role memberships`
        );
        return null;
      }

      const result = (await response.json()) as IndexerRoleMembershipsResponse;

      if (result.errors && result.errors.length > 0) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query errors: ${result.errors.map((e) => e.message).join('; ')}`
        );
        return null;
      }

      const nodes = result.data?.roleMemberships?.nodes;
      if (!nodes || nodes.length === 0) {
        logger.debug(LOG_SYSTEM, `No role membership data found for ${contractAddress}`);
        return new Map();
      }

      // Build map of role:account → GrantInfo (composite key prevents
      // cross-role contamination when an account holds multiple roles)
      const grantMap = new Map<string, GrantInfo>();
      for (const node of nodes) {
        const key = grantMapKey(node.role, node.account);
        // Keep only the first (most recent) grant per role+account since ordered by GRANTED_AT_DESC
        if (!grantMap.has(key)) {
          grantMap.set(key, {
            account: node.account,
            role: node.role,
            grantedAt: node.grantedAt,
            txHash: node.txHash,
            grantedBy: node.grantedBy,
          });
        }
      }

      logger.debug(
        LOG_SYSTEM,
        `Found grant info for ${grantMap.size} member(s) across ${roleIds.length} role(s)`
      );

      return grantMap;
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to query latest grants: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  // ── Role Discovery (Phase 11 — US9) ────────────────────────────────────

  /**
   * Discover all unique role identifiers for a contract by querying historical events.
   *
   * Queries all `accessControlEvents` for the contract and extracts unique, non-empty
   * `role` values. This enables role enumeration even when `knownRoleIds` are not
   * provided at registration.
   *
   * Graceful degradation: returns null if the indexer is unavailable or the query fails.
   *
   * @param contractAddress - The contract address to discover roles for
   * @returns Array of unique role identifiers, or null on failure
   */
  async discoverRoleIds(contractAddress: string): Promise<string[] | null> {
    const isUp = await this.isAvailable();
    if (!isUp || !this.endpoint) {
      return null;
    }

    logger.info(LOG_SYSTEM, `Discovering role IDs for ${contractAddress}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: DISCOVER_ROLES_QUERY,
          variables: {
            network: this.networkConfig.id,
            contract: contractAddress,
          },
        }),
      });

      if (!response.ok) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query failed with status ${response.status} for role discovery`
        );
        return null;
      }

      const result = (await response.json()) as IndexerDiscoverRolesResponse;

      if (result.errors && result.errors.length > 0) {
        logger.warn(
          LOG_SYSTEM,
          `Indexer query errors: ${result.errors.map((e) => e.message).join('; ')}`
        );
        return null;
      }

      const nodes = result.data?.accessControlEvents?.nodes;
      if (!nodes || nodes.length === 0) {
        logger.debug(LOG_SYSTEM, `No events found for role discovery on ${contractAddress}`);
        return [];
      }

      // Extract unique, non-empty role values
      const uniqueRoles = [...new Set(nodes.map((n) => n.role).filter((r): r is string => !!r))];

      logger.debug(
        LOG_SYSTEM,
        `Discovered ${uniqueRoles.length} unique role(s) for ${contractAddress}`
      );

      return uniqueRoles;
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to discover role IDs: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  // ── History Queries (Phase 9 — US7) ────────────────────────────────────

  /**
   * Query historical access control events with filtering and pagination.
   *
   * Queries `accessControlEvents` with the specified filters. All 13 EVM event types
   * are mapped to `HistoryChangeType` values per research.md §R6.
   *
   * Graceful degradation: returns null if the indexer is unavailable or the query fails.
   *
   * @param contractAddress - The contract address to query
   * @param options - Optional filtering and pagination options
   * @returns Paginated history result, or null on failure
   */
  async queryHistory(
    contractAddress: string,
    options?: HistoryQueryOptions,
    roleLabelMap?: Map<string, string>
  ): Promise<PaginatedHistoryResult | null> {
    const isUp = await this.isAvailable();
    if (!isUp || !this.endpoint) {
      return null;
    }

    logger.info(LOG_SYSTEM, `Querying history for ${contractAddress}`);

    const query = this.buildHistoryQuery(options);
    const variables = this.buildHistoryVariables(contractAddress, options);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        logger.warn(LOG_SYSTEM, `Indexer query failed with status ${response.status} for history`);
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
        logger.debug(LOG_SYSTEM, `No history events found for ${contractAddress}`);
        return {
          items: [],
          pageInfo: { hasNextPage: false },
        };
      }

      const items = this.transformToHistoryEntries(nodes, roleLabelMap);
      const pageInfo: PageInfo = {
        hasNextPage: result.data?.accessControlEvents?.pageInfo?.hasNextPage ?? false,
        endCursor: result.data?.accessControlEvents?.pageInfo?.endCursor,
      };

      logger.debug(LOG_SYSTEM, `Retrieved ${items.length} history event(s) for ${contractAddress}`);

      return { items, pageInfo };
    } catch (error) {
      logger.warn(
        LOG_SYSTEM,
        `Failed to query history: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  /**
   * Builds the dynamic GraphQL history query with conditional filter clauses.
   *
   * Filter conditions are added only when the corresponding option is present.
   * EventType filter uses inline GraphQL enum values (not quoted strings).
   */
  private buildHistoryQuery(options?: HistoryQueryOptions): string {
    const roleFilter = options?.roleId ? ', role: { equalTo: $role }' : '';
    const accountFilter = options?.account ? ', account: { equalTo: $account }' : '';
    const typeFilter = options?.changeType
      ? `, eventType: { equalTo: ${CHANGE_TYPE_TO_EVENT_TYPE[options.changeType]} }`
      : '';
    const txFilter = options?.txId ? ', txHash: { equalTo: $txHash }' : '';

    // Build combined timestamp filter
    const timestampConditions: string[] = [];
    if (options?.timestampFrom) {
      timestampConditions.push('greaterThanOrEqualTo: $timestampFrom');
    }
    if (options?.timestampTo) {
      timestampConditions.push('lessThanOrEqualTo: $timestampTo');
    }
    const timestampFilter =
      timestampConditions.length > 0 ? `, timestamp: { ${timestampConditions.join(', ')} }` : '';

    const ledgerFilter = options?.ledger ? ', blockNumber: { equalTo: $blockNumber }' : '';
    const limitClause = options?.limit ? ', first: $limit' : '';
    const cursorClause = options?.cursor ? ', after: $cursor' : '';

    // Build variable declarations
    const varDeclarations = [
      '$network: String!',
      '$contract: String!',
      options?.roleId ? '$role: String' : '',
      options?.account ? '$account: String' : '',
      options?.txId ? '$txHash: String' : '',
      options?.timestampFrom ? '$timestampFrom: Datetime' : '',
      options?.timestampTo ? '$timestampTo: Datetime' : '',
      options?.ledger ? '$blockNumber: BigFloat' : '',
      options?.limit ? '$limit: Int' : '',
      options?.cursor ? '$cursor: Cursor' : '',
    ]
      .filter(Boolean)
      .join(', ');

    return `
      query GetHistory(${varDeclarations}) {
        accessControlEvents(
          filter: {
            network: { equalTo: $network }
            contract: { equalTo: $contract }${roleFilter}${accountFilter}${typeFilter}${txFilter}${timestampFilter}${ledgerFilter}
          }
          orderBy: TIMESTAMP_DESC${limitClause}${cursorClause}
        ) {
          nodes {
            id
            eventType
            blockNumber
            timestamp
            txHash
            role
            account
            newOwner
            newAdmin
            acceptSchedule
          }
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
  }

  /**
   * Builds query variables for history queries, mapping options to GraphQL variables.
   */
  private buildHistoryVariables(
    contractAddress: string,
    options?: HistoryQueryOptions
  ): Record<string, unknown> {
    const variables: Record<string, unknown> = {
      network: this.networkConfig.id,
      contract: contractAddress,
    };

    if (options?.roleId) variables.role = options.roleId;
    if (options?.account) variables.account = options.account;
    if (options?.txId) variables.txHash = options.txId;
    if (options?.timestampFrom) variables.timestampFrom = options.timestampFrom;
    if (options?.timestampTo) variables.timestampTo = options.timestampTo;
    if (options?.ledger) variables.blockNumber = String(options.ledger);
    if (options?.limit) variables.limit = options.limit;
    if (options?.cursor) variables.cursor = options.cursor;

    return variables;
  }

  /**
   * Transforms indexer event nodes to unified HistoryEntry format.
   *
   * Maps EVM event types to HistoryChangeType, normalizes account field
   * based on event type (role → account, ownership → newOwner, admin → newAdmin),
   * and resolves the role identifier using event-type-aware logic so that
   * `role.id` is always a valid bytes32 hex string in the EVM context.
   */
  private transformToHistoryEntries(
    nodes: IndexerEventNode[],
    roleLabelMap?: Map<string, string>
  ): HistoryEntry[] {
    return nodes.map((node) => {
      const role = this.resolveRoleFromEvent(node, roleLabelMap);
      const changeType = this.mapEventTypeToChangeType(node.eventType);
      const account = this.normalizeAccountFromEvent(node);

      return {
        role,
        account,
        changeType,
        txId: node.txHash,
        timestamp: node.timestamp,
        ledger: parseInt(node.blockNumber, 10),
      };
    });
  }

  /**
   * Resolves the RoleIdentifier from an indexer event node based on event type.
   *
   * - **Role events** (ROLE_GRANTED, ROLE_REVOKED, ROLE_ADMIN_CHANGED): Use the
   *   actual `node.role` bytes32 value from the indexed event; label from
   *   roleLabelMap or well-known dictionary.
   * - **Ownership events** (OWNERSHIP_*): The Ownable pattern has no AccessControl
   *   role, so we use `DEFAULT_ADMIN_ROLE` (bytes32 zero) as a canonical sentinel
   *   with `label: 'OWNER'` for display context.
   * - **Admin events** (ADMIN_*, DEFAULT_ADMIN_*): These events concern the default
   *   admin role, so we use `DEFAULT_ADMIN_ROLE` with its standard label.
   *
   * This ensures `role.id` is always a valid bytes32 hex string, maintaining
   * consistency with EVM's address/role format conventions. Consumers can use
   * `role.label` to distinguish ownership vs. admin events.
   */
  private resolveRoleFromEvent(
    node: IndexerEventNode,
    roleLabelMap?: Map<string, string>
  ): RoleIdentifier {
    const roleId = node.role || DEFAULT_ADMIN_ROLE;
    switch (node.eventType) {
      // Role events — use the actual bytes32 role from the indexed event
      case 'ROLE_GRANTED':
      case 'ROLE_REVOKED':
      case 'ROLE_ADMIN_CHANGED':
        return {
          id: roleId,
          label: resolveRoleLabel(roleId, roleLabelMap),
        };

      // Ownership events — no AccessControl role; use bytes32 zero as sentinel
      case 'OWNERSHIP_TRANSFER_STARTED':
      case 'OWNERSHIP_TRANSFER_COMPLETED':
      case 'OWNERSHIP_RENOUNCED':
        return {
          id: DEFAULT_ADMIN_ROLE,
          label: 'OWNER',
        };

      // Admin events — semantically about the default admin role
      case 'ADMIN_TRANSFER_INITIATED':
      case 'ADMIN_TRANSFER_COMPLETED':
      case 'ADMIN_RENOUNCED':
      case 'DEFAULT_ADMIN_TRANSFER_SCHEDULED':
      case 'DEFAULT_ADMIN_TRANSFER_CANCELED':
      case 'DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED':
      case 'DEFAULT_ADMIN_DELAY_CHANGE_CANCELED':
        return {
          id: DEFAULT_ADMIN_ROLE,
          label: DEFAULT_ADMIN_ROLE_LABEL,
        };

      // Fallback for unknown event types — preserve node.role if available
      default:
        return {
          id: roleId,
          label: resolveRoleLabel(roleId, roleLabelMap),
        };
    }
  }

  /**
   * Maps an EVM indexer event type string to the unified HistoryChangeType.
   * Returns 'UNKNOWN' for unrecognized event types.
   */
  private mapEventTypeToChangeType(eventType: string): HistoryChangeType {
    const mapped = EVM_EVENT_TYPE_TO_CHANGE_TYPE[eventType];
    if (mapped) {
      return mapped;
    }

    logger.warn(LOG_SYSTEM, `Unknown event type: ${eventType}, assigning changeType to UNKNOWN`);
    return 'UNKNOWN';
  }

  /**
   * Normalizes the account field from an indexer event node.
   *
   * Different event types store the relevant account in different fields:
   * - Role events (ROLE_GRANTED, ROLE_REVOKED, ROLE_ADMIN_CHANGED): `account`
   * - Ownership events: `newOwner`
   * - Admin events: `newAdmin`
   * - Fallback: `account` or empty string
   */
  private normalizeAccountFromEvent(node: IndexerEventNode): string {
    switch (node.eventType) {
      case 'ROLE_GRANTED':
      case 'ROLE_REVOKED':
      case 'ROLE_ADMIN_CHANGED':
        return node.account || '';

      case 'OWNERSHIP_TRANSFER_STARTED':
      case 'OWNERSHIP_TRANSFER_COMPLETED':
      case 'OWNERSHIP_RENOUNCED':
        return node.newOwner || '';

      case 'ADMIN_TRANSFER_INITIATED':
      case 'ADMIN_TRANSFER_COMPLETED':
      case 'ADMIN_RENOUNCED':
      case 'DEFAULT_ADMIN_TRANSFER_SCHEDULED':
      case 'DEFAULT_ADMIN_TRANSFER_CANCELED':
      case 'DEFAULT_ADMIN_DELAY_CHANGE_SCHEDULED':
      case 'DEFAULT_ADMIN_DELAY_CHANGE_CANCELED':
        return node.newAdmin || '';

      default:
        return node.account || '';
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
