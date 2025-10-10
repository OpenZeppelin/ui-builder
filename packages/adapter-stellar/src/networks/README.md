# Stellar Adapter Networks

This directory defines the Stellar network configurations exported by the adapter.

## Available Networks

Exports from `index.ts`:

- `stellarPublic` (mainnet)
- `stellarTestnet` (testnet)
- `stellarMainnetNetworks`: `StellarNetworkConfig[]` containing all mainnet networks
- `stellarTestnetNetworks`: `StellarNetworkConfig[]` containing all testnet networks
- `stellarNetworks`: union of all supported networks

Each `StellarNetworkConfig` includes:

- `id`: Unique identifier (e.g., `"stellar-public"`, `"stellar-testnet"`)
- `name`: Display name
- `ecosystem`: `"stellar"`
- `network`: `"stellar"`
- `type`: `"mainnet" | "testnet"`
- `isTestnet`: boolean
- `horizonUrl`: Horizon REST URL
- `sorobanRpcUrl`: Soroban JSON-RPC URL
- `networkPassphrase`: Network passphrase
- `explorerUrl`: Base explorer URL (for display links)
- `icon`: Icon identifier

## Soroban RPC URL Overrides

You can override the default `sorobanRpcUrl` at runtime through `AppConfigService`.

In `.env` (Builder app):
`VITE_APP_CFG_RPC_ENDPOINT_STELLAR_TESTNET="https://your-custom-soroban-rpc.testnet.example"`

In `public/app.config.json` (exported apps):

```json
{
  "rpcEndpoints": {
    "stellar-testnet": "https://your-custom-soroban-rpc.testnet.example",
    "stellar-public": "https://your-custom-soroban-rpc.public.example"
  }
}
```

Resolution order used by the adapter:

1. User RPC from `UserRpcConfigService`
2. `AppConfigService.getRpcEndpointOverride(networkId)`
3. Default `sorobanRpcUrl` from the network config

## Adding a New Stellar Network

1. Add the network to `mainnet.ts` or `testnet.ts`:

```typescript
export const stellarCustom: StellarNetworkConfig = {
  id: 'stellar-custom',
  exportConstName: 'stellarCustom',
  name: 'Stellar Custom',
  ecosystem: 'stellar',
  network: 'stellar',
  type: 'testnet',
  isTestnet: true,
  horizonUrl: 'https://horizon.custom.example',
  sorobanRpcUrl: 'https://soroban.custom.example',
  networkPassphrase: 'Custom Network Passphrase',
  explorerUrl: 'https://stellar.expert/explorer/custom',
  iconComponent: NetworkStellarCustom,
};
```

1. Include it in the appropriate array and export it from `index.ts`.
2. Re-export from the package root in `src/index.ts` if you want it available to consumers.

## Explorer URLs

Explorers are used for display only. The adapter builds links using `explorerUrl`:

- Address or contract: `.../account/{address}` or `.../contract/{id}`
- Transaction: `.../tx/{hash}`

No explorer API keys are required for Stellar adapter functionality.
