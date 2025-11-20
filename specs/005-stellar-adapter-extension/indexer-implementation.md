# Stellar Access Control Indexer — Implementation Summary

## Overview

A production-ready SubQuery indexer for OpenZeppelin Stellar Access Control and Ownable contracts, deployed to capture all 9 event types and provide historical data for the Stellar adapter's `getHistory()` functionality.

## Repository

**Location:** `stellar-access-control-indexer` (sibling repository to `contracts-ui-builder`)

**Technology Stack:**

- SubQuery Framework (v6.1.0)
- PostgreSQL (database)
- GraphQL (query interface)
- TypeScript
- Vitest (testing)

## Event Coverage

### Access Control Events (6/6 implemented)

1. **role_granted** - Role assignment to account
2. **role_revoked** - Role removal from account
3. **role_admin_changed** - Admin role for a role is changed
4. **admin_transfer_initiated** - Admin transfer started (2-step process)
5. **admin_transfer_completed** - Admin transfer accepted
6. **admin_renounced** - Admin permanently renounced

### Ownable Events (3/3 implemented)

7. **ownership_transfer** - Ownership transfer initiated (2-step process)
8. **ownership_transfer_completed** - Ownership accepted by new owner
9. **ownership_renounced** - Ownership permanently renounced

## Event Structure Discoveries

Real-world testing revealed important differences between Rust type definitions and actual on-chain event structures:

### Wrapped Structures

- **role_granted/role_revoked**: `caller` field wrapped in Map: `{ caller: Address }`
- **ownership_transfer**: Map with `{ old_owner: Address, new_owner: Address, live_until_ledger: u32 }`

### Topic/Value Distribution

- **admin_transfer_initiated**: `current_admin` in topic[1], data contains `{ new_admin, live_until_ledger }`
- **admin_transfer_completed**: `new_admin` in topic[1], data contains `{ previous_admin }`
- **ownership_renounced/admin_renounced**: Address may be in topic[1] OR event.value (varies by version)

### Handler Strategy

All handlers include robust fallback logic to handle structure variations:

```typescript
// Example: Handle both topic and value locations
let admin: string;
if (event.topic[1]) {
  admin = scValToNative(event.topic[1]) as string;
} else if (event.value) {
  const eventData = scValToNative(event.value);
  // Handle wrapped or direct structures
}
```

## GraphQL Schema

### Core Entities

**AccessControlEvent**

- Tracks all role and ownership changes
- Fields: contract, role, account, admin, type, blockHeight, timestamp, txHash, ledger
- Indexed on: contract, role, account, type, timestamp

**RoleMembership**

- Current state of role assignments
- Fields: contract, role, account, grantedAt, grantedBy, txHash

**ContractOwnership**

- Current ownership state
- Fields: contract, owner, previousOwner, transferredAt, txHash

**Contract**

- Metadata about indexed contracts
- Fields: address, type (ACCESS_CONTROL | OWNABLE | ACCESS_CONTROL_OWNABLE), deployedAt, lastActivityAt

### Query Interface

```graphql
type Query {
  # All events with filtering
  accessControlEvents(
    filter: AccessControlEventFilter
    orderBy: [AccessControlEventOrderBy!]
  ): AccessControlEventsConnection

  # Current role memberships
  roleMemberships(filter: RoleMembershipFilter): RoleMembershipsConnection

  # Current ownership
  contractOwnerships(filter: ContractOwnershipFilter): ContractOwnershipsConnection

  # Contract metadata
  contracts(filter: ContractFilter): ContractsConnection
}
```

## Testing

**Coverage:** 26 unit tests (all passing)

**Test Categories:**

1. ScVal decoding (symbols, strings, addresses, maps, arrays, numbers)
2. Event structure variations (wrapped fields, topic vs value placement)
3. Edge cases (void, empty strings, booleans, bytes)
4. Real-world event simulation (all 9 event types)

**Key Test Files:**

- `src/mappings/mappingHandlers.test.ts` - Comprehensive ScVal decoding tests

## Configuration

### Network Support

**Testnet (default):**

```typescript
chainId: 'Test SDF Network ; September 2015';
endpoint: ['https://horizon-testnet.stellar.org'];
sorobanEndpoint: 'https://soroban-testnet.stellar.org';
```

**Mainnet (production):**

```typescript
chainId: 'Public Global Stellar Network ; September 2015';
endpoint: ['https://horizon.stellar.org'];
sorobanEndpoint: 'https://soroban-mainnet.stellar.org';
```

### Rate Limiting

**Important:** Public Stellar endpoints have strict rate limits (~200 req/min).

**For production:**

- Use private Horizon node
- Get API key from provider (BlockDaemon, QuickNode)
- Run self-hosted Horizon instance

**Docker Configuration:**

```yaml
environment:
  STELLAR_ENDPOINT_RETRY_ATTEMPTS: 10
  STELLAR_ENDPOINT_RETRY_DELAY: 20000 # 20 seconds
  STELLAR_ENDPOINT_TIMEOUT: 120000 # 120 seconds
command:
  - --workers=1
  - --batch-size=1 # Reduced for rate limits
  - --force-clean
  - --timeout=120000
```

## Deployment

### Local Development

```bash
# Install dependencies
yarn install

# Generate types from schema
yarn codegen

# Build project
yarn build

# Run with Docker
docker compose up -d

# GraphQL playground
open http://localhost:3000
```

### SubQuery Managed Service

**Prerequisites:**

1. IPFS deployment of project
2. SubQuery account with CLI authentication

**Deployment:**

```bash
# Build and deploy
subql build
subql publish

# Access via managed endpoint
https://api.subquery.network/sq/{org}/{project}
```

**Multi-Network Strategy:**

- Single codebase
- Multiple `project-*.yaml` manifests (e.g., `project-testnet.yaml`, `project-mainnet.yaml`)
- Deploy separate projects per network

## Integration with Stellar Adapter

The indexer provides the data source for `StellarAccessControlService.getHistory()`:

```typescript
// In adapter-stellar/src/access-control/service.ts
async getHistory(
  contractAddress: string,
  options?: HistoryQueryOptions
): Promise<AccessControlHistory> {
  // Check indexer availability
  const indexerAvailable = await this.indexerClient.checkAvailability();

  if (!indexerAvailable) {
    return { entries: [], supportsHistory: false };
  }

  // Query indexer with filters
  return this.indexerClient.queryHistory(contractAddress, options);
}
```

**Query Options:**

- `role?: string` - Filter by specific role
- `account?: string` - Filter by specific account
- `limit?: number` - Limit results
- `offset?: number` - Pagination offset

## Documentation

**Key Files:**

- `README.md` - Setup, usage, deployment guide
- `DEPLOYMENT.md` - Comprehensive SubQuery Managed Service deployment instructions
- `schema.graphql` - GraphQL schema definition
- `project.ts` - SubQuery project configuration

## Status

✅ **Implementation Complete - Deployment Pending**

- All 9 event types captured
- 26 unit tests passing
- Comprehensive documentation
- Successfully tested locally with Docker and real contracts
- Robust error handling and fallback logic
- Ready for SubQuery Network deployment

⏳ **Remaining Steps:**

- Deploy to SubQuery Network (IPFS + production deployment)
- Integration testing with Stellar adapter's `getHistory()` method
- Unit tests for adapter-indexer integration (T031-T033)

## Next Steps for Adapter Integration

1. ✅ Indexer client implementation (T028)
2. ✅ getHistory implementation (T029)
3. ✅ Indexer implementation complete with local testing (T030)
4. ⏳ Deploy indexer to SubQuery Network (T030a)
5. ⏳ Integration test with Stellar adapter (T030b)
6. ⏳ Unit tests for history queries - mock GraphQL (T031)
7. ⏳ Unit tests for on-chain + indexer merger (T032)
8. ⏳ Unit tests for graceful fallback when indexer unavailable (T033)

## References

- **OpenZeppelin Stellar Contracts:** https://github.com/OpenZeppelin/stellar-contracts/tree/main/packages/access
- **SubQuery Documentation:** https://academy.subquery.network/
- **Stellar SDK:** https://github.com/stellar/js-stellar-sdk
