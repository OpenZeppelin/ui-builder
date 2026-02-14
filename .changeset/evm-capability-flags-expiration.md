---
'@openzeppelin/ui-builder-adapter-evm-core': minor
---

Add chain-agnostic capability flags, expiration metadata, and admin delay info

- Detect `hasRenounceOwnership`, `hasRenounceRole`, `hasCancelAdminTransfer`, `hasAdminDelayManagement` from ABI in feature-detection
- Implement `getExpirationMetadata()` returning `mode: 'none'` for ownership and `mode: 'contract-managed'` for admin transfers
- Populate `delayInfo` (current delay from `defaultAdminDelay()`) in `getAdminInfo()` response
