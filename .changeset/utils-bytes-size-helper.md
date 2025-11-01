---
'@openzeppelin/ui-builder-utils': minor
---

Add `getBytesSize` utility function to extract size from `Bytes<N>` type strings. This function parses type strings like "Bytes<32>" and returns the size as a number, or undefined for dynamic types like "Uint8Array". Useful for validating fixed-size byte arrays in adapters.
