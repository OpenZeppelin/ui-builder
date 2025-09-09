---
'@openzeppelin/contracts-ui-builder-types': patch
---

Enhance base wallet connection status interface

- Enhance `WalletConnectionStatus` interface with additional universal properties (isConnecting, isDisconnected, isReconnecting, status, connector)
- Remove chain-specific properties (addresses, chain) from base interface to maintain chain-agnostic design
- Support inheritance pattern for chain-specific extensions while preserving structural typing compatibility
- Enable richer wallet UX data across all adapters without sacrificing architectural principles
