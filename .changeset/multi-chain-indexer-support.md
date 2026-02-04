---
"@openzeppelin/ui-builder-adapter-stellar": minor
---

Update indexer client to support multi-chain indexer schema

- Use `eventType` instead of `type` in GraphQL queries
- Use `blockNumber` instead of `blockHeight`
- Add support for `previousOwner`/`newOwner` and `previousAdmin`/`newAdmin` fields
- Add `normalizeAccount()` helper for backward-compatible data extraction
- Add support for `ROLE_ADMIN_CHANGED`, `OWNERSHIP_RENOUNCED`, and `ADMIN_RENOUNCED` event types
- Maintain full backward compatibility with existing public interfaces
