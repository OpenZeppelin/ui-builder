---
'@openzeppelin/ui-builder-adapter-evm': patch
'@openzeppelin/ui-builder-adapter-stellar': patch
'@openzeppelin/ui-builder-adapter-polkadot': patch
---

Re-export adapter classes (EvmAdapter, StellarAdapter, PolkadotAdapter) from package entry points. These exports were accidentally removed during the ecosystemDefinition refactor in #338, breaking exported app builds that import adapter classes directly.
