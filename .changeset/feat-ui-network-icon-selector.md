---
'@openzeppelin/ui-builder-ui': minor
---

Add `NetworkIcon` and `NetworkSelector` components to the UI package for reuse across applications.

- `NetworkIcon`: Reusable component for rendering network icons based on ecosystem and iconComponent
- `NetworkSelector`: Generic dropdown selector component with search, ecosystem grouping, and network type badges
- Refactor `NetworkStatusBadge` and `NetworkRow` to use `NetworkIcon` for consistency
