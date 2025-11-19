# SubQuery Indexer Setup: Stellar Access Control

This guide outlines the step-by-step process to deploy a dedicated SubQuery indexer for OpenZeppelin Stellar Access Control and Ownable contracts. This setup enables server-side filtering, pagination, and historical queries, replacing the client-side filtering workaround in the current adapter.

## Phase 1: Project Initialization

- [ ] **Install SubQuery CLI**
  ```bash
  npm install -g @subql/cli
  ```
- [ ] **Initialize Stellar Project**
      Use the Stellar starter template to scaffold the project.
  ```bash
  subql init --starter stellar-starter
  # Project Name: stellar-access-control-indexer
  # Network: Stellar
  ```
- [ ] **Install Dependencies**
      Navigate to the directory and install deps.
  ```bash
  cd stellar-access-control-indexer
  yarn install
  ```

## Phase 2: Schema Definition (`schema.graphql`)

Define the entities with `@index` to enable the server-side filtering required by the UI Builder.

- [ ] **Define `AccessControlEvent` Entity**

  ```graphql
  type AccessControlEvent @entity {
    id: ID!
    contract: String! @index
    role: String @index # Nullable for Ownership events
    account: String! @index # The account receiving the role or ownership
    admin: String # The admin/grantor (if available)
    type: EventType! @index
    blockHeight: BigInt!
    timestamp: Date! @index
    txHash: String!
  }

  enum EventType {
    ROLE_GRANTED
    ROLE_REVOKED
    OWNERSHIP_TRANSFERRED
  }
  ```

- [ ] **Define `CurrentState` Entity (Optional but Recommended)**
      Useful for quick lookups of "current roles" without replaying history.
  ```graphql
  type RoleMembership @entity {
    id: ID! # format: "contract-role-account"
    contract: String! @index
    role: String! @index
    account: String! @index
  }
  ```

## Phase 3: Manifest Configuration (`project.ts`)

Configure the project to listen to specific contracts or factory events on the Stellar network.

- [ ] **Configure Network Endpoint**
      Set the appropriate Horizon or RPC endpoint for Testnet/Mainnet.
- [ ] **Define Data Sources**
      Since we need to index _any_ contract using these libraries, we typically track a specific start block or a set of known contract addresses.
      _Note: For a factory-based architecture, track the factory. For a general indexer, you might filter all transactions for specific event topics._
- [ ] **Setup Event Filters**
      Configure mappings to listen for the specific event topics emitted by OpenZeppelin contracts:
  - `RoleGranted` (topic: `["RoleGranted", role_id, account]`)
  - `RoleRevoked` (topic: `["RoleRevoked", role_id, account]`)
  - `OwnershipTransferred` (topic: `["OwnershipTransferred", new_owner]`)

## Phase 4: Mapping Logic (`src/mappings/mappingHandlers.ts`)

Write the transformation logic to convert Stellar events into the entities defined in Phase 2.

- [ ] **Implement `handleRoleGranted`**
  - Extract `role`, `account`, `sender` from event body/topics.
  - Create/Save `AccessControlEvent` (type: `ROLE_GRANTED`).
  - Create/Save `RoleMembership` entity.
- [ ] **Implement `handleRoleRevoked`**
  - Extract `role`, `account`, `sender`.
  - Create/Save `AccessControlEvent` (type: `ROLE_REVOKED`).
  - Delete `RoleMembership` entity.
- [ ] **Implement `handleOwnershipTransferred`**
  - Extract `previous_owner`, `new_owner`.
  - Create/Save `AccessControlEvent` (type: `OWNERSHIP_TRANSFERRED`).

## Phase 5: Build & Local Testing

- [ ] **Generate Types**
  ```bash
  yarn codegen
  ```
- [ ] **Build Project**
  ```bash
  yarn build
  ```
- [ ] **Run Locally (Docker)**
      Spin up a local postgres and query node to test indexing.
  ```bash
  yarn start:docker
  ```
- [ ] **Verify Queries**
      Open `http://localhost:3000` and test the queries that were previously impossible:
  ```graphql
  query {
    accessControlEvents(
      filter: {
        contract: { equalTo: "..." }
        account: { equalTo: "..." } # Server-side filtering!
        type: { equalTo: ROLE_GRANTED }
      }
    ) {
      nodes {
        id
        role
        timestamp
      }
    }
  }
  ```

## Phase 6: Deployment

- [ ] **Create Project in SubQuery Managed Service**
      Go to [managed.subquery.network](https://managed.subquery.network), login with GitHub.
- [ ] **Deploy**
      Upload the project (via CLI or UI) to the Managed Service.
- [ ] **Get HTTP Endpoint**
      Note the production GraphQL endpoint provided by SubQuery (e.g., `https://api.subquery.network/sq/user/project`).

## Phase 7: Adapter Integration Update

Once the indexer is live, update the adapter to use the new capabilities.

- [ ] **Update `indexer-client.ts`**
  - Modify `buildHistoryQuery` to use the auto-generated `filter` arguments.
  - Remove the client-side array filtering logic.
  - Map the new SubQuery response format to the `HistoryEntry` adapter interface.
