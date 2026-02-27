---
'@openzeppelin/ui-builder-adapter-stellar': patch
---

Fix state mutability detection for Stellar contracts falsely classifying all functions as state-modifying. Filters out infrastructure state changes (contract instance and WASM code TTL bumps) that occur on every invocation, so read-only functions like `owner()`, `paused()`, and `get_settings()` are correctly identified as view functions.
