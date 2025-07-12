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

### Automatic Wagmi Integration

The wagmi integration automatically uses all networks defined in `mainnet.ts` and `testnet.ts` that have a `viemChain` property. This ensures that:

1. **Single Source of Truth**: Network configurations are only defined in one place
2. **Automatic Synchronization**: Adding a new network to `mainnet.ts` or `testnet.ts` automatically makes it available in wagmi
3. **Wagmi Compatibility**: Only networks with `viemChain` (from `viem/chains`) are supported, ensuring wagmi compatibility
4. **No Manual Maintenance**: The system automatically generates the chain ID to network ID mapping for RPC overrides

To add a new EVM network:

1. Ensure the network is available in `viem/chains`
2. Add the network configuration to either `mainnet.ts` or `testnet.ts`
3. Include the `viemChain` property from the appropriate viem chain object
4. The wagmi integration will automatically detect and use the new network

## Network Configurations

Network configurations for various EVM chains (mainnets and testnets) are exported from `src/networks/index.ts` within this package (e.g., `ethereumMainnet`, `polygonMainnet`, `ethereumSepolia`, `polygonAmoy`). Each `EvmNetworkConfig` includes:

- `id`: A unique string identifier for the network (e.g., "ethereum-mainnet")
- `name`: Display name for the network
- `ecosystem`: Always "evm" for EVM networks
- `chainId`: The numeric chain ID
- `rpcUrl`: Default public RPC URL
- `explorerUrl`: URL for the blockchain explorer
- `apiUrl`: API URL for the blockchain explorer
- `primaryExplorerApiIdentifier`: A string key (e.g., "etherscan-mainnet") used by `AppConfigService` to fetch a specific API key for this network's explorer from `networkServiceConfigs`
- `icon`: Icon identifier for the network
- `nativeCurrency`: Native currency information (name, symbol, decimals)
- `viemChain`: The corresponding viem chain object (required for wagmi compatibility)

## Internal Structure

// ... (existing internal structure section) ...
