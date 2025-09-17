# Provider Precedence Contract

## Ordering

- Adapter declares ordered list: [primary, fallback1, fallback2, ...].
- EVM: [etherscan, sourcify] — etherscan uses existing loaders (`etherscan.ts`, `etherscan-v2.ts`) and `resolveExplorerConfig()` for URLs/keys. Sourcify requires no keys.
- Stellar: [stellar-sdk] — contract definition derived from official SDK via network RPC.

## Timeouts

- Per‑provider hard timeout: 4,000 ms
- Overall attempt budget: 10,000 ms

## Forced Service Behavior

- URL `service` overrides order.
- If unsupported → inform and fall back to adapter default order.
- If selected provider fails (not found/unavailable) → stop with message; do not continue.

## Provenance

- UI surfaces provider name and link (when available) using existing patterns.
- EVM provenance URLs re-use `getExplorerUrl`/`resolveExplorerConfig` outputs; Stellar uses `getStellarExplorerAddressUrl` when available or the network RPC URL.
