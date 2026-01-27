---
"@openzeppelin/ui-builder-adapter-polkadot": minor
---

feat: Add Polkadot ecosystem adapter with EVM support

Introduces the Polkadot adapter enabling building UIs for EVM-compatible smart contracts 
deployed on Polkadot ecosystem networks.

**Supported Networks:**

Hub Networks (P1 - MVP):
- Polkadot Hub (Chain ID: 420420419)
- Kusama Hub (Chain ID: 420420418)  
- Polkadot Hub TestNet (Chain ID: 420420417)

Parachain Networks (P2):
- Moonbeam (Chain ID: 1284)
- Moonriver (Chain ID: 1285)
- Moonbase Alpha (Chain ID: 1287)

**Features:**
- Full EVM contract interaction (load, query, sign & broadcast)
- Wallet integration via RainbowKit and Wagmi
- Support for both Blockscout (Hub) and Moonscan (Moonbeam) explorers
- Extensible architecture for future Substrate/Wasm support

The adapter leverages shared EVM functionality from `adapter-evm-core` for code reuse.
