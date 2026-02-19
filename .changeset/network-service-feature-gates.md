---
"@openzeppelin/ui-builder-adapter-evm": patch
"@openzeppelin/ui-builder-adapter-polkadot": patch
---

Gate access-control-indexer service form behind feature flag

- Tag access-control-indexer network service forms with `requiredFeature: 'access_control_indexer'`
- Apply `filterEnabledServiceForms` in health check hook to skip disabled services
