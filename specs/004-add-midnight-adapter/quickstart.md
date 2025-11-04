# Quickstart: Add Midnight Adapter (v1)

## Phased Delivery

1. Wallet (verify + tests)

- Ensure adapter returns UI provider, hooks, and components.
- Add unit tests for connect/disconnect status plumbing.

2. Contract Ingestion

- Persist `getContractDefinitionInputs()` values using builder storage.
- Implement `loadContract` conversion to `ContractSchema` with validation.

3. Auto Simple Views

- Confirm `ContractStateWidget` displays parameter-less views.
- Handle errors gracefully; no param-input UI in v1.

4. Write Flow + Export

- Customize form for write functions; execute via wallet-only.
- Ensure export includes Midnight adapter packages/config and runs end-to-end.

## Developer Checklist

- Mirror EVM/Stellar directory naming and patterns.
- Keep chain-specific code in `packages/adapter-midnight` only.
- Use `logger` (no console) and Vitest tests for business logic.
- Follow form and design system standards in UI surfaces.
