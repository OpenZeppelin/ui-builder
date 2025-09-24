# Data Model: Stellar SAC Support

## Entities

- SAC Contract
  - contractId: string (C...)
  - network: { id: 'stellar-public' | 'stellar-testnet', rpcUrl: string }
- SAC Specification
  - entries: ScSpecEntry[] (derived)
  - source: { repo: string, path: string, file: string }
- Cache Entry
  - key: string (derived from source)
  - value: string[] (base64 XDR entries)

## Relationships

- SAC Contract → uses → SAC Specification
- SAC Specification ↔ Cache Entry (lookup by key)

## Constraints

- Supported networks: public/testnet only (this iteration)
- Spec source: official Stellar repository (no overrides in this iteration)
