---
'@openzeppelin/ui-builder-adapter-stellar': patch
'@openzeppelin/ui-builder-types': patch
---

Fix BytesN parameter handling in Stellar forms so base64 inputs reuse the bytes field, propagate max byte hints, and convert to ScVal correctly.

