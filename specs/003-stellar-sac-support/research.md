# Research: Stellar SAC Support

## Decisions

- Use RPC-based detection of contract executable type to identify SAC on public/testnet.
- Fetch official SAC spec from Stellar’s public repository at runtime.
- Convert JSON spec to XDR entries using xdr-json; cache via TanStack Query defaults.

## Rationale

- Aligns with Stellar Laboratory approach; minimizes custom maintenance.
- Keeps adapter logic self-contained; no app-wide changes needed.

## Alternatives Considered

- Pin spec in repo → rejected for staleness risk.
- Manual spec overrides → deferred by scope decision.

## Notes

- Only public/testnet supported this iteration.
