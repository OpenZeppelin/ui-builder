# Stellar Adapter (`@openzeppelin/ui-builder-adapter-stellar`)

This package provides the `ContractAdapter` implementation for the Stellar (Soroban) ecosystem for the UI Builder.

It is responsible for:

- Implementing the `ContractAdapter` interface from `@openzeppelin/ui-builder-types`.
- Defining and exporting Stellar network configurations (Public Network and Testnet) as `StellarNetworkConfig` objects in `src/networks/` (Horizon URL, Soroban RPC URL, network passphrase, explorer URL, icon, etc.).
- Loading Stellar contract definitions and metadata and transforming them into the builder’s chain‑agnostic `ContractSchema`.
- Mapping Soroban value types to builder form fields and validating user input.
- Parsing user inputs into Soroban `ScVal` types for transaction execution and formatting view results.
- Transaction execution using an execution strategy pattern (EOA and Relayer strategies).
- Wallet integration and UI via the `src/wallet/` module.
- Adapter‑specific configuration and validation helpers (RPC resolution, explorer URLs, execution configuration validation).

---

## Transaction Execution

The Stellar adapter uses an execution strategy pattern similar to the EVM adapter to handle transaction submissions.

### Supported Strategies

1. EOA (Externally Owned Account): Uses the connected Stellar wallet (via Stellar Wallets Kit) to sign and submit Soroban transactions directly.
2. Relayer: Uses the OpenZeppelin Relayer service to submit transactions. The adapter exposes a `StellarRelayerOptions` React component to configure strategy‑specific options in the Builder UI.

The adapter selects the strategy at runtime based on the `ExecutionConfig` provided by the application.

### Configuration in the Builder

The Builder application’s “Customize” step passes an `ExecutionConfig` to the adapter’s `signAndBroadcast` method. The adapter uses a factory to instantiate the appropriate strategy and reports live status updates via the provided `onStatusChange` callback.

---

## Access Control Support

The Stellar adapter includes first-class support for OpenZeppelin Access Control and Ownable contracts through a dedicated service module.

### Features

- **Feature Detection**: Automatically detects contracts implementing AccessControl, Ownable, or both
- **Role Management**: Query current roles, grant/revoke roles, check permissions
- **Ownership Management**: Transfer ownership, query current owner
- **Dynamic Role Discovery**: Automatically discover role IDs via indexer when not explicitly provided
- **Historical Queries**: View complete history of role changes and ownership transfers via SubQuery indexer
- **Server-Side Filtering**: Filter events by contract, role, account, and limit (when indexer is available)

### Role Discovery

Since OpenZeppelin's Stellar contracts don't expose a `get_all_roles()` method, the adapter supports multiple ways to obtain role identifiers:

#### 1. Explicit Role IDs (Recommended for known contracts)

```typescript
const service = adapter.getAccessControlService();
service.registerContract(contractAddress, schema, ['admin', 'minter', 'burner']);
```

#### 2. Dynamic Discovery via Indexer

If no role IDs are provided, the service automatically queries the indexer for historical `role_granted` and `role_revoked` events:

```typescript
// Register without role IDs - discovery happens automatically
service.registerContract(contractAddress, schema);

// Or explicitly discover roles
const roles = await service.discoverKnownRoleIds(contractAddress);
// => ['admin', 'minter', 'burner']
```

#### 3. Adding Roles Manually

For newly created roles that haven't been granted yet (no historical events), you can add them manually:

```typescript
// Add roles that may not exist in historical events
service.addKnownRoleIds(contractAddress, ['new_role', 'another_role']);
```

Role IDs are validated against Soroban Symbol constraints:
- Must start with a letter or underscore
- Can contain only alphanumeric characters and underscores
- Maximum 32 characters

### Indexer Integration

For historical queries (e.g., `getHistory()`), the adapter integrates with the [Stellar Access Control Indexer](https://github.com/OpenZeppelin/stellar-access-control-indexer), a SubQuery project that indexes Access Control and Ownable events.

#### Configuring the Indexer

Add `indexerUri` to your `StellarNetworkConfig`:

```typescript
const stellarTestnet: StellarNetworkConfig = {
  // ... other config
  indexerUri: 'https://api.subquery.network/sq/openzeppelin/stellar-access-control-indexer',
};
```

#### Deployment

The indexer is production-ready and compatible with:

- **SubQuery Network** (decentralized, recommended for production)
- Self-hosted infrastructure (Docker)

For deployment instructions, see the [Indexer Deployment Guide](https://github.com/OpenZeppelin/stellar-access-control-indexer/blob/main/DEPLOYMENT.md).

#### Graceful Degradation

If no indexer is configured or the indexer is unavailable:

- On-chain queries (roles, ownership) work normally
- Historical queries return an empty array with a warning
- UI remains functional for all current-state operations

---

## Wallet Integration & UI

All wallet integration logic, UI components, facade hooks, and the UI context provider for Stellar are located in `src/wallet/`.

The `StellarAdapter` implements the optional UI methods from `ContractAdapter`:

- `getEcosystemReactUiContextProvider()` returns `StellarWalletUiRoot`, a stable provider root for Stellar wallet state.
- `getEcosystemReactHooks()` returns `stellarFacadeHooks` for account and connection status.
- `getEcosystemWalletComponents()` returns available wallet UI components (e.g., `ConnectButton`, `AccountDisplay`) for the active UI kit.

For full documentation on the wallet module, see `src/wallet/README.md`.

---

This adapter follows the standard module structure outlined in the main project Adapter Architecture Guide.

## Package Structure

```text
adapter-stellar/
├── src/
│   ├── access-control/          # Access Control & Ownable support (service, indexer)
│   ├── configuration/           # Adapter-specific configuration (RPC, explorer, execution)
│   ├── contract/                # Contract loading & metadata
│   ├── mapping/                 # Soroban ↔ form field mapping & generators
│   ├── networks/                # Stellar network configurations
│   ├── query/                   # View function execution
│   ├── transaction/             # Transaction execution system (EOA, Relayer)
│   │   ├── components/                # React components for configuration
│   │   ├── formatter.ts               # Build Soroban tx data from form inputs
│   │   ├── execution-strategy.ts      # Strategy interface
│   │   ├── eoa.ts / relayer.ts        # Strategy implementations
│   ├── transform/               # Input parsing and output formatting
│   ├── types/                   # Adapter-specific types
│   ├── utils/                   # Utilities (artifact handling, formatting, etc.)
│   ├── validation/              # Validation utilities (addresses, configs)
│   ├── wallet/                  # Wallet integration (see wallet/README.md)
│   │   ├── components/                # Wallet UI components
│   │   ├── context/                   # Wallet context
│   │   ├── hooks/                     # Facade & low-level hooks
│   │   ├── implementation/            # Stellar Wallets Kit implementation
│   │   ├── services/                  # Config resolution for wallet UI
│   │   ├── stellar-wallets-kit/       # Kit-specific helpers
│   │   ├── README.md                  # Detailed wallet documentation
│   ├── adapter.ts               # Main StellarAdapter class implementation
│   └── index.ts                 # Public package exports
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

---

## Usage (Adapter Instantiation)

Instantiate the adapter with a specific `StellarNetworkConfig`:

```typescript
import { StellarAdapter, stellarTestnet } from '@openzeppelin/ui-builder-adapter-stellar';

const networkConfig = stellarTestnet; // or stellarPublic
const stellarAdapter = new StellarAdapter(networkConfig);

// Use stellarAdapter for operations on the configured Stellar network
```

Network configurations for Stellar networks are exported from `src/networks/index.ts` (`stellarPublic`, `stellarTestnet`, arrays `stellarMainnetNetworks`, `stellarTestnetNetworks`, and `stellarNetworks`).

## Soroban RPC URL Configuration

Each `StellarNetworkConfig` specifies a default `sorobanRpcUrl`.

This URL can be overridden at runtime by the consuming application through the central `AppConfigService`. Configuration is loaded from environment variables (for the Builder app) or a `public/app.config.json` file (for exported apps).

To override a RPC URL, define an entry in `rpcEndpoints` keyed by the network’s string ID (e.g., `"stellar-testnet"`).

In `.env` for the Builder app:
`VITE_APP_CFG_RPC_ENDPOINT_STELLAR_TESTNET="https://your-custom-soroban-rpc.testnet.example"`

In `public/app.config.json` for an exported app:

```json
{
  "rpcEndpoints": {
    "stellar-testnet": "https://your-custom-soroban-rpc.testnet.example",
    "stellar-public": "https://your-custom-soroban-rpc.public.example"
  }
}
```

The adapter resolves Soroban RPC in this order:

1. User-provided RPC config from `UserRpcConfigService` (advanced user input)
2. RPC override via `AppConfigService.getRpcEndpointOverride(networkId)`
3. Default `sorobanRpcUrl` from the active `StellarNetworkConfig`

## Explorer URLs

Stellar explorers are used for display only. The adapter constructs URLs using `explorerUrl` from the network config:

- `getExplorerUrl(address)` → `.../account/{address}` or `.../contract/{id}` (Soroban contracts)
- `getExplorerTxUrl(txHash)` → `.../tx/{hash}`

No explorer API keys are required for adapter functionality.

## Network Configurations

Stellar networks are exported from `src/networks/`. Each `StellarNetworkConfig` includes:

- `id`: Unique network identifier (e.g., `"stellar-public"`, `"stellar-testnet"`)
- `name`: Display name
- `ecosystem`: Always `"stellar"`
- `network`: Always `"stellar"`
- `type`: `"mainnet"` or `"testnet"`
- `isTestnet`: boolean
- `horizonUrl`: Horizon endpoint for the network
- `sorobanRpcUrl`: Soroban JSON-RPC endpoint
- `networkPassphrase`: The network passphrase used by Wallets Kit / SDK
- `explorerUrl`: Base URL for the explorer (display only)
- `icon`: Icon identifier

See `src/networks/README.md` for details on adding networks and overriding RPC.

## Stellar Asset Contract (SAC) Support

The adapter fully supports Stellar Asset Contracts (SACs), which are special contracts that wrap native Stellar assets. SACs are automatically detected via RPC ledger entries and their specifications are loaded dynamically.

### How SAC Support Works

1. **Detection**: When loading a contract, the adapter checks its executable type via RPC
2. **Specification Loading**: For SAC contracts, the adapter fetches the official SAC specification from GitHub
3. **XDR Encoding**: The JSON spec is converted to XDR format using `@stellar/stellar-xdr-json`
4. **UI Generation**: The adapter generates the same UI fields as regular WASM contracts

### Technical Implementation Details

#### WASM Loading Strategy

The `@stellar/stellar-xdr-json` library requires a ~3MB WebAssembly module for XDR encoding. After extensive testing with various Vite bundling approaches (including `vite-plugin-wasm`, `vite-plugin-top-level-await`, and `?url` imports), we encountered persistent issues where Vite would serve HTML instead of the WASM binary, resulting in WebAssembly instantiation errors.

**Solution**: The WASM module is loaded from CDN (`unpkg.com`) rather than bundled. This approach:

- Avoids Vite bundling complexities and errors
- Reduces bundle size by 3MB for users who don't use SAC contracts
- Loads the WASM only when a SAC contract is actually detected (lazy loading)
- Simplifies the build configuration

---

This adapter generally follows the standard module structure and developer experience provided by the EVM adapter, while keeping the core app chain‑agnostic.
