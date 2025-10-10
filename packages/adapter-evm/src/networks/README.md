# EVM Adapter (`@openzeppelin/ui-builder-adapter-evm`)

This package provides the `ContractAdapter` implementation for EVM-compatible blockchains (Ethereum, Polygon, BSC, etc.) for the UI Builder.

It is responsible for:
// ... (existing responsibilities) ...

- Providing other EVM-specific configurations and validation (e.g., for execution methods).

## Usage

// ... (existing usage section) ...

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

## Adding a New Network

Follow these steps to add support for a new EVM network:

### 1. Verify Viem Chain Support

First, ensure the network is available in `viem/chains`:

```typescript
import { myNewChain } from 'viem/chains';
```

If the chain is not available in viem, it cannot be added as wagmi requires viem chain objects.

### 2. Add Network Configuration

Add the network configuration to the appropriate file:

- **Mainnet networks**: Add to `src/networks/mainnet.ts`
- **Testnet networks**: Add to `src/networks/testnet.ts`

Example configuration:

```typescript
import { myNewChain, myNewChainTestnet } from 'viem/chains';

export const myNewNetworkMainnet: EvmNetworkConfig = {
  id: 'mynewnetwork-mainnet',
  name: 'My New Network',
  ecosystem: 'evm',
  chainId: 12345,
  rpcUrl: 'https://rpc.mynewnetwork.io',
  explorerUrl: 'https://explorer.mynewnetwork.io',
  apiUrl: 'https://api.explorer.mynewnetwork.io/api',
  primaryExplorerApiIdentifier: 'mynewnetwork-mainnet',
  iconComponent: NetworkMyNewNetwork,
  nativeCurrency: {
    name: 'My Token',
    symbol: 'MTK',
    decimals: 18,
  },
  viemChain: myNewChain,
};
```

### 3. Update Network Arrays and Exports

In the same file (`mainnet.ts` or `testnet.ts`), add your network to the appropriate array:

```typescript
export const evmMainnetNetworks: EvmNetworkConfig[] = [
  // ... existing networks ...
  myNewNetworkMainnet,
];
```

### 4. Export from Index

Add your network to `src/networks/index.ts`:

```typescript
export {
  // ... existing exports ...
  myNewNetworkMainnet,
  myNewNetworkTestnet,
} from './mainnet';
// or from './testnet' for testnets
```

### 5. Export from Package Root

Add your network to the main package export in `src/index.ts`:

```typescript
export {
  // ... existing exports ...
  myNewNetworkMainnet,
  myNewNetworkTestnet,
} from './networks';
```

### 6. Test Integration

Run the adapter tests to verify wagmi integration:

```bash
pnpm --filter @openzeppelin/ui-builder-adapter-evm test
```

The tests will verify that:

- Your network is properly recognized by wagmi
- Chain ID mappings are correctly generated
- All supported chains are accessible
