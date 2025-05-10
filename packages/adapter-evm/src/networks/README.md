# EVM Adapter (`@openzeppelin/transaction-form-adapter-evm`)

This package provides the `ContractAdapter` implementation for EVM-compatible blockchains (Ethereum, Polygon, BSC, etc.) for the Transaction Form Builder.

It is responsible for:
// ... (existing responsibilities) ...

- Providing other EVM-specific configurations and validation (e.g., for execution methods).

## Usage

// ... (existing usage section) ...

## RPC URL Configuration

The `EvmNetworkConfig` objects defined in `src/networks/` (e.g., `ethereumMainnet`) each specify a default public `rpcUrl`.

This default RPC URL can be overridden at runtime by the consuming application (either the core Transaction Form Builder app or an exported form) through the central `AppConfigService`. This service loads configurations from environment variables (for the core app) or a `public/app.config.json` file (for exported apps).

To override an RPC URL, the application's configuration should define an entry in the `rpcEndpoints` section, keyed by the network's string ID (e.g., `"ethereum-mainnet"`). For example:

In `.env` for the core app:
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

The `src/wallet/wagmi-implementation.ts` file configures Wagmi with a `defaultSupportedChains` array (e.g., Mainnet, Sepolia, Polygon). For RPC overrides from `AppConfigService` to apply to these chains within Wagmi's transports, a mapping is maintained in `viemChainIdToAppNetworkId` within `wagmi-implementation.ts`. If new chains are added to `defaultSupportedChains` and their RPCs need to be overridable, this internal map must also be updated to link the Viem chain ID to your application's string-based network ID (e.g., `[polygon.id]: 'polygon-mainnet'`).

## Network Configurations

Network configurations for various EVM chains (mainnets and testnets) are exported from `src/networks/index.ts` within this package (e.g., `ethereumMainnet`, `polygonMainnet`, `ethereumSepolia`, `polygonAmoy`). Each `EvmNetworkConfig` includes:
// ... (rest of the section as before, ensuring primaryExplorerApiIdentifier is mentioned if not already)

- `explorerApiIdentifier`: A string key (e.g., "etherscan-mainnet") used by `AppConfigService` to fetch a specific API key for this network's explorer from `networkServiceConfigs`.

* `primaryExplorerApiIdentifier`: A string key (e.g., "etherscan-mainnet") used by `AppConfigService` to fetch a specific API key for this network's explorer from `networkServiceConfigs`.

- It also includes details like RPC URLs, Chain IDs, explorer URLs, and native currency information.

* It also includes a default public `rpcUrl`, Chain ID, `apiUrl` for explorers, `explorerUrl`, and native currency information.

## Internal Structure

// ... (existing internal structure section) ...
