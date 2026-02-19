---
"@openzeppelin/ui-builder-adapter-evm": minor
---

Add access control service integration and indexer URL configuration

- Implement `getAccessControlService()` with lazy initialization on EvmAdapter
- Add `accessControlIndexerUrl` endpoints for all EVM mainnet networks (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, Polygon zkEVM, ZKsync, Scroll, Linea)
- Add `accessControlIndexerUrl` endpoints for all EVM testnet networks (Sepolia, Amoy, Arbitrum Sepolia, Optimism Sepolia, Base Sepolia, Fuji, BSC Testnet, Polygon zkEVM Cardona, ZKsync Sepolia, Scroll Sepolia, Linea Sepolia, Monad Testnet)
