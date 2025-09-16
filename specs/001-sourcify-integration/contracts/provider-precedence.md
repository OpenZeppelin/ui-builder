# Provider Precedence Contract

## Ordering

- Adapter declares ordered list: [primary, fallback1, fallback2, ...].

## Timeouts

- Per‑provider hard timeout: 4,000 ms
- Overall attempt budget: 10,000 ms

## Forced Service Behavior

- URL `service` overrides order.
- If unsupported → inform and fall back to adapter default order.
- If selected provider fails (not found/unavailable) → stop with message; do not continue.

## Provenance

- UI surfaces provider name and link (when available) using existing patterns.
