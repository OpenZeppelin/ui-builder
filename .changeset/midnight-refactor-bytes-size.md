---
'@openzeppelin/ui-builder-adapter-midnight': patch
---

Refactor to use shared `getBytesSize` function from `@openzeppelin/ui-builder-utils` instead of local implementation. This ensures consistent bytes size parsing across all adapters and reduces code duplication.
