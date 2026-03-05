---
'@openzeppelin/ui-builder-adapter-evm': patch
'@openzeppelin/ui-builder-adapter-stellar': patch
'@openzeppelin/ui-builder-adapter-polkadot': patch
---

Use public SubQuery access control endpoints in network definitions. Normalize EVM and Stellar adapter `accessControlIndexerUrl` (no trailing slash), fix Stellar testnet typo (openzepplin → openzeppelin), and add SubQuery indexer URLs to Polkadot adapter networks (polkadot-hub, moonbeam, moonriver, moonbase-alpha).
