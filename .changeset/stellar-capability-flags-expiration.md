---
'@openzeppelin/ui-builder-adapter-stellar': minor
---

Add chain-agnostic capability flags and expiration metadata

- Report `hasRenounceOwnership` from ABI detection, set `hasRenounceRole`, `hasCancelAdminTransfer`, `hasAdminDelayManagement` to false
- Implement `getExpirationMetadata()` returning `mode: 'required'` with label "Expiration Ledger" and unit "ledger number"
