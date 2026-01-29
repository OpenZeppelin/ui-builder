# Phase 0 Research

## Router Selection

- Decision: Use React Router v7+ (Data Router APIs)
- Rationale: Most widely adopted, robust docs, stable navigation/data APIs, ecosystem tooling; aligns with Vite + React 19.
- Alternatives: TanStack Router (modern, strong features) — rejected for now due to lower adoption; internal URL utils only — rejected (reinventing the wheel).
- Future‑proofing: Wrap with RouterService abstraction in `@openzeppelin/ui-builder-utils` to allow swapping without app rewrites.

## Provider Precedence

- Decision: Adapter‑declared contract definition provider list with primary→fallback order.
- Forced Service: URL `service` overrides precedence; if unsupported, fall back automatically to adapter default; if forced provider fails, stop with clear message (no fallback).
- Timeouts: Per‑provider hard timeout 4,000 ms; overall attempt budget 10,000 ms.

## Deep‑Link Schema

- Decision: Adapter‑declared schema for parameters: required network+identifier; optional `service`.
- Parsing: Chain‑agnostic parser delegates interpretation to adapter; invalid inputs blocked with clear errors.
- Precedence: Deep link takes precedence over saved session; unknown params ignored gracefully.

## Constitution Alignment

- Chain‑agnostic core; adapter‑owned specifics.
- Types in `packages/types`; RouterService + helpers in `packages/utils`.
- Update `.eslint/rules/no-extra-adapter-methods.cjs` when extending `ContractAdapter`.

## Risks & Mitigations

- Provider outages → fallback and clear messaging.
- Fragmented params across adapters → standardized base schema + adapter extension.
- Router lock‑in → RouterService abstraction.
