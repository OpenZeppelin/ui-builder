---
"@openzeppelin/ui-builder-adapter-evm": minor
"@openzeppelin/ui-builder-adapter-stellar": minor
"@openzeppelin/ui-builder-adapter-solana": minor
"@openzeppelin/ui-builder-adapter-midnight": minor
---

Implement `getTypeMappingInfo()` method across all adapters

Each adapter now returns complete type mapping information including:
- Primitive types with their default field type mappings
- Dynamic type patterns (arrays, generics, tuples, etc.) with descriptions

This enables consuming applications to programmatically discover all adapter type capabilities at runtime.
