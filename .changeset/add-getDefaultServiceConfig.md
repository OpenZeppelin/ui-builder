---
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-adapter-solana': minor
'@openzeppelin/ui-builder-adapter-polkadot': minor
'@openzeppelin/ui-builder-adapter-midnight': minor
---

Add `getDefaultServiceConfig` method to all adapters for proactive network service health checks

This new required method enables the UI to proactively test network service connectivity (RPC, indexers, explorers) when a network is selected, displaying user-friendly error banners before users attempt operations that would fail.

**New method: `getDefaultServiceConfig(serviceId: string): Record<string, unknown> | null`**

Returns the default configuration values for a network service, extracted from the network config. This allows health check functionality without requiring user configuration.

Implementation per adapter:

- **EVM**: Returns `rpcUrl` for 'rpc' service, `explorerUrl` for 'explorer' service
- **Stellar**: Returns `sorobanRpcUrl` for 'rpc' service, `indexerUri`/`indexerWsUri` for 'indexer' service
- **Solana**: Returns `rpcEndpoint` for 'rpc' service
- **Polkadot**: Returns `rpcUrl` for 'rpc' service, `explorerUrl` for 'explorer' service
- **Midnight**: Returns `httpUrl`/`wsUrl` (from `indexerUri`/`indexerWsUri`) for 'indexer' service
