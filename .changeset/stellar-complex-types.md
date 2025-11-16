---
"@openzeppelin/ui-builder-adapter-stellar": minor
"@openzeppelin/ui-builder-types": minor
"@openzeppelin/ui-builder-renderer": minor
"@openzeppelin/ui-builder-ui": minor
---

Enhance Stellar adapter to properly handle complex Soroban types including enums with payloads, nested structs, tuples, and maps. Improvements include: enum metadata extraction and propagation through transaction pipeline, proper tuple payload serialization with ScVec wrapping, integer-only enum support (e.g., RoyalCard), XDR-based map/struct field sorting for canonical ordering, browser-compatible XDR comparison utilities, enhanced enum detection using spec entries, and improved validation bounds preservation in nested object fields. Fixes transaction execution errors for complex_struct and other functions with complex type parameters.
