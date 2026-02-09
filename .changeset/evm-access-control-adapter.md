---
"@openzeppelin/ui-builder-adapter-evm": minor
---

Add access control service integration and indexer URL configuration

- Implement `getAccessControlService()` with lazy initialization on EvmAdapter
- Add `accessControlIndexerUrl` endpoints for all EVM mainnet networks (Ethereum, Polygon, Arbitrum, Optimism, Base, Avalanche, BSC, Gnosis, Celo, Scroll, ZKsync, Linea, Blast, Mantle, Mode)
- Add `accessControlIndexerUrl` endpoints for all EVM testnet networks (Sepolia, Amoy, Arbitrum Sepolia, Optimism Sepolia, Base Sepolia, Fuji, BSC Testnet, Chiado, Alfajores, Scroll Sepolia, ZKsync Sepolia, Linea Sepolia, Blast Sepolia, Mantle Sepolia, Mode Sepolia)
