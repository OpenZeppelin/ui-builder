---
"@openzeppelin/ui-builder-adapter-evm": patch
"@openzeppelin/ui-builder-adapter-polkadot": patch
---

Fix EVM bytes type mapping to use BytesField with proper validation. bytes32 and other fixed-size bytes types now use the 'bytes' field type with exactBytes metadata for proper hex validation.

This fix is in the internal adapter-evm-core package which is bundled into adapter-evm and adapter-polkadot.
