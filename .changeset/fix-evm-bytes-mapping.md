---
"@openzeppelin/ui-builder-adapter-evm-core": patch
---

Fix EVM bytes type mapping to use BytesField with proper validation. bytes32 and other fixed-size bytes types now use the 'bytes' field type with exactBytes metadata for proper hex validation.
