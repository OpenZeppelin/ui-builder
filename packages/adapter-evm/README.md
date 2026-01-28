# EVM Adapter (`@openzeppelin/ui-builder-adapter-evm`)

This package provides the `ContractAdapter` implementation for EVM-compatible blockchains (Ethereum, Polygon, BSC, etc.) for the UI Builder.

It is responsible for:

- Implementing the `ContractAdapter` interface from `@openzeppelin/ui-types`.
- Defining and exporting specific EVM network configurations (e.g., Ethereum Mainnet, Sepolia Testnet) as `EvmNetworkConfig` objects. These are located in `src/networks/` and include details like RPC URLs, Chain IDs, explorer URLs, and native currency information.
- Loading contract ABIs (from JSON strings or via Etherscan, using the `apiUrl` from the provided `EvmNetworkConfig`).
- Mapping EVM-specific data types to the form field types used by the builder app.
- Parsing user input (including complex types like structs and arrays) into EVM-compatible transaction data, according to the `EvmNetworkConfig`.
- Formatting results from view function calls.
- **Transaction Execution**: Handling the signing and broadcasting of transactions via different strategies (EOA, Relayer).
- Interacting with EVM wallets (via Wagmi/Viem) using the `wallet` module.
- Providing other EVM-specific configurations and validation for execution methods.

---

## Transaction Execution

The EVM adapter uses an **Execution Strategy** pattern to handle transaction submissions. This decouples the core `signAndBroadcast` logic from the specific implementation of each execution method.

### Supported Strategies

1.  **EOA (Externally Owned Account)**: The default method. It directly uses the user's connected wallet (via Wagmi) to sign and broadcast the transaction.
2.  **Relayer**: Allows for gasless transactions by sending the transaction to the OpenZeppelin Relayer service. This strategy uses the `@openzeppelin/relayer-sdk`.

The adapter selects the appropriate strategy at runtime based on the `ExecutionConfig` provided by the user.

### Configuration

In the UI Builder, the execution method is configured in the "Customize" step. The UI provides options to select between `EOA` and `Relayer` and configure their specific parameters (e.g., Relayer API credentials, EOA address restrictions).

This configuration is then passed to the `EvmAdapter`'s `signAndBroadcast` method, which uses a factory to instantiate the correct execution strategy.

---

## Wallet Integration & UI

All wallet integration logic, UI components, facade hooks, and the UI context provider (e.g., `EvmBasicUiContextProvider` for Wagmi) for EVM-compatible chains are located in the [`src/wallet/`](./src/wallet/) module of this adapter.

The `EvmAdapter` implements the optional UI facilitation methods from the `ContractAdapter` interface (`getEcosystemReactUiContextProvider`, `getEcosystemReactHooks`, `getEcosystemWalletComponents`). These capabilities are consumed by the `builder` application's `WalletStateProvider`, which manages the global wallet state and makes these hooks and components accessible to the rest of the application via the `useWalletState()` hook.

**For full documentation on the `src/wallet/` module, its exports, configuration, and usage examples, see [`src/wallet/README.md`](./src/wallet/README.md).**

---

This adapter generally follows the standard module structure outlined in the main project [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md).

## Package Structure

```text
adapter-evm/
├── src/
│   ├── configuration/           # Adapter-specific configuration wrappers
│   ├── networks/                # EVM network configurations (mainnet, testnet)
│   ├── query/                   # View function query wrappers
│   ├── transaction/             # Transaction UI components
│   │   └── components/          # React components (EvmRelayerOptions)
│   ├── wallet/                  # Wallet integration (see wallet/README.md)
│   │   ├── hooks/               # Wagmi hook facades
│   │   ├── implementation/      # Wagmi wallet implementation
│   │   ├── rainbowkit/          # RainbowKit component factories
│   │   └── utils/               # Wallet utilities
│   ├── adapter.ts               # Main EvmAdapter class implementation
│   └── index.ts                 # Public package exports
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── README.md
```

## Relationship with adapter-evm-core

Core EVM functionality has been extracted to `@openzeppelin/ui-builder-adapter-evm-core`. This adapter imports and delegates to core modules for:

- **ABI loading**: `loadEvmContract`, `loadAbiFromEtherscan`, `loadAbiFromSourcify`
- **Type mapping**: `mapEvmParamTypeToFieldType`, `generateEvmDefaultField`
- **Transaction execution**: `EoaExecutionStrategy`, `RelayerExecutionStrategy`
- **Query handling**: `queryEvmViewFunction`, `isEvmViewFunction`
- **Input/output transformation**: `parseEvmInput`, `formatEvmFunctionResult`
- **Wallet infrastructure**: `WagmiWalletImplementation`, UI kit management

The core package is bundled internally (not a runtime dependency) via `tsup` with `noExternal: ['@openzeppelin/ui-builder-adapter-evm-core']`.

**What remains in this adapter:**

- Ethereum/EVM network configurations (mainnet, Sepolia, Polygon, etc.)
- Adapter-specific wrapper functions
- React UI components for transaction options
- RainbowKit integration and configuration

---

## Usage (Adapter Instantiation)

The `EvmAdapter` class is instantiated with a specific `EvmNetworkConfig` object, making it aware of the target network from its creation:

```typescript
import { ethereumSepolia, EvmAdapter } from '@openzeppelin/ui-builder-adapter-evm';

// Or any other exported EvmNetworkConfig

const networkConfig = ethereumSepolia;
const evmAdapter = new EvmAdapter(networkConfig);

// Now use evmAdapter for operations on the Ethereum Sepolia testnet
```

Network configurations for various EVM chains (mainnets and testnets) are exported from `src/networks/index.ts` within this package (e.g., `ethereumMainnet`, `polygonMainnet`, `ethereumSepolia`, `polygonAmoy`). The full list of available networks is exported as `evmNetworks`.

## RPC URL Configuration

The `EvmNetworkConfig` objects defined in `src/networks/` (e.g., `ethereumMainnet`) each specify a default public `rpcUrl`.

This default RPC URL can be overridden at runtime by the consuming application (either the main UI Builder app or an exported app) through the central `AppConfigService`. This service loads configurations from environment variables (for the builder app) or a `public/app.config.json` file (for exported apps).

To override an RPC URL, the application's configuration should define an entry in the `rpcEndpoints` section, keyed by the network's string ID (e.g., `"ethereum-mainnet"`). For example:

In `.env` for the builder app:
`VITE_APP_CFG_RPC_ENDPOINT_ETHEREUM_MAINNET="https://your-custom-mainnet-rpc.io/key"`

In `public/app.config.json` for an exported app:

```json
{
  // ... other configs ...
  "rpcEndpoints": {
    "ethereum-mainnet": "https://your-custom-mainnet-rpc.io/key"
  }
}
```

The `EvmAdapter`, when performing operations like view function queries (specifically its fallback public client) or when initializing its underlying Wagmi configuration for wallet interactions, will prioritize these runtime-configured RPC URLs.

### Wagmi `defaultSupportedChains` and RPC Overrides

The `src/wallet/implementation/wagmi-implementation.ts` file configures Wagmi with a `defaultSupportedChains` array (e.g., Mainnet, Sepolia, Polygon). For RPC overrides from `AppConfigService` to apply to these chains within Wagmi's transports, a mapping is maintained in `viemChainIdToAppNetworkId` within `wagmi-implementation.ts`. If new chains are added to `defaultSupportedChains` and their RPCs need to be overridable, this internal map must also be updated to link the Viem chain ID to your application's string-based network ID (e.g., `[polygon.id]: 'polygon-mainnet'`).

## Network Configurations

Network configurations for various EVM chains (mainnets and testnets) are exported from `src/networks/index.ts` within this package (e.g., `ethereumMainnet`, `polygonMainnet`, `ethereumSepolia`, `polygonAmoy`). Each `EvmNetworkConfig` includes:

- `id`: A unique string identifier for the network (e.g., "ethereum-mainnet").
- `primaryExplorerApiIdentifier`: A string key (e.g., "etherscan-v2", "routescan") used to resolve explorer API keys.
- Default `rpcUrl`, Chain ID, `apiUrl` for explorers, `explorerUrl`, and native currency information.

For details on how explorer API keys and RPC URLs are resolved, see the [adapter-evm-core Configuration Module](../adapter-evm-core/README.md#configuration-module).
