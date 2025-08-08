---
'@openzeppelin/contracts-ui-builder-adapter-evm': patch
---

- Stringify array args for view calls before parsing to prevent runtime failures
- Stringify array inputs for write path to align with the parser
- Guard relayer value precision (avoid Number overflow) and warn on default gasLimit
- Honor RPC overrides in proxy detection and remove variable shadowingNo breaking changes; behavior is more robust and config-compliant.
