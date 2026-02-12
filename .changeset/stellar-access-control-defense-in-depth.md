---
'@openzeppelin/ui-builder-adapter-stellar': patch
---

Add defense-in-depth capability checks to Stellar access control service

- `getOwnership()` now validates `hasOwnable` capability before calling `get_owner()` when contract is registered
- `getAdminInfo()` now validates `hasTwoStepAdmin` capability before calling `get_admin()` when contract is registered
- `getAdminAccount()` now validates `hasTwoStepAdmin` capability before calling `get_admin()` when contract is registered
- Checks are soft — skipped when contract is not registered to preserve backward compatibility
- Throws descriptive `OperationFailed` errors instead of confusing on-chain failures
- Mirrors the defense-in-depth pattern added to the EVM adapter
