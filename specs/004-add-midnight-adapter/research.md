# Research: Add Midnight Adapter

## Goals

- Mirror EVM/Stellar adapter structure, naming, and logic patterns.
- Use Midnight Deploy CLI as a template for contract loading, interactions, serialization, transaction building, and execution (excluding deployment in v1).
- Deliver v1 with wallet-only execution, contract ingestion (persist + load), auto simple views, write form customization + execute, and export parity.

## Unknowns Resolved

- Execution methods v1: Direct wallet signing only (relayer deferred).
- Required contract inputs: Use `getContractDefinitionInputs()` from adapter (`contractAddress`, `privateStateId`, `.d.ts` schema, `.cjs` module, optional `witnessCode`).
- Post-submission status: Show transaction identifier + indexing check summary (no public explorer dependency).

## Best Practices (Referenced Adapters)

- EVM/Stellar organize code by `networks/`, `mapping/`, `transaction/`, `configuration/`, `wallet/` and implement `ContractAdapter`; Midnight mirrors this.
- Transaction execution strategies exist; v1 uses wallet-only. Scaffold for future methods if needed.
- Renderer auto-renders simple views; parameterized view inputs are out of scope for v1.

## Patterns from Midnight Deploy CLI to Adapt

- Contract discovery/serialization: Use parsing/validation utils analogous to CLI flows; keep logic inside adapter `utils`.
- Transaction building/execution: Adapt CLI patterns (balance/prove/submit sequencing abstracted behind wallet APIs) to the adapter’s `signAndBroadcast` with wallet-only method; surface identifier and indexing summary.
- Indexing/confirmation heuristics: Translate into friendly UI summaries; surface identifier and “indexing may take time”, avoid long blocking waits.
- Wallet lifecycle: Wallet module is complete; add unit tests mirroring CLI expectations (sync, address confirmation) where applicable.

## Decisions

- Mirror folder structure and naming from EVM/Stellar.
- Persist contract artifacts via builder storage and reload on revisit.
- Export manifest must include Midnight adapter package, required peers, and configuration hooks; match EVM/Stellar export.

## Alternatives Considered

- Implementing relayer in v1: Rejected for scope; defer to v2 to match parity.
- Manual view call UI for parameters: Rejected for v1 to align with current Builder behavior and deliver minimal viable value sooner.
