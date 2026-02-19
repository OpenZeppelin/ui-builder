---
'@openzeppelin/ui-builder-adapter-polkadot': minor
---

Add access control service integration to Polkadot adapter

- Implement `getAccessControlService()` with lazy initialization on PolkadotAdapter
- Add access control indexer network service form for Polkadot EVM networks
- Re-export access control types from the evm module
