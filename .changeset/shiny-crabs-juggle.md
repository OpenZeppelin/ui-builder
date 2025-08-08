---
'@openzeppelin/contracts-ui-builder-adapter-midnight': patch
'@openzeppelin/contracts-ui-builder-adapter-stellar': patch
'@openzeppelin/contracts-ui-builder-adapter-solana': patch
'@openzeppelin/contracts-ui-builder-adapter-evm': patch
'@openzeppelin/contracts-ui-builder-react-core': patch
'@openzeppelin/contracts-ui-builder-renderer': patch
'@openzeppelin/contracts-ui-builder-app': patch
'@openzeppelin/contracts-ui-builder-ui': patch
---

Route all console.\* logs through centralized logger from utils, add system tags, update tests to spy on logger, restore missing createAbiFunctionItem in EVM adapter, and apply lint/prettier fixes. No public API changes.
