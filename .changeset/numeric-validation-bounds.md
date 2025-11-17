---
"@openzeppelin/ui-builder-utils": minor
"@openzeppelin/ui-builder-adapter-evm": minor
"@openzeppelin/ui-builder-adapter-midnight": minor
"@openzeppelin/ui-builder-adapter-stellar": minor
---

Add shared numeric validation bounds utility and enhance all adapters to apply type-specific min/max validation for integer types. Numeric bounds are now automatically applied to form fields based on chain-specific type names (e.g., uint32, U32, Uint<0..255>), improving input validation and user experience.
