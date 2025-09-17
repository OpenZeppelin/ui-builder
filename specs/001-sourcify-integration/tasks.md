# Phase 2 Tasks

1. Types: Add base types for Provider, ProviderPreference, DeepLinkParameters, AdapterDeepLinkSchema
2. Utils: Add RouterService abstraction with minimal API (getParam, navigate)
3. Utils: Add deep link parsing/serialization helpers (chain‑agnostic)
4. Builder: Integrate RouterService; replace direct URL usage
5. Adapter Base: Extend ContractAdapter with deep‑link schema + provider precedence getters
6. Lint: Update `.eslint/rules/no-extra-adapter-methods.cjs` with new methods
7. EVM Adapter: Implement provider precedence (Etherscan → Sourcify)
8. EVM Adapter: Implement deep‑link schema (address, chainId, service)
9. EVM Adapter: Implement provider selection logic (respect forced service, precedence, timeouts)
10. EVM Adapter: Wire provenance reporting (name + link) via existing UI patterns
11. UI Builder: Expose provider default selection in existing settings UI
12. App Config: Support default provider per network via AppConfigService
13. Tests (types/utils): TDD for deep link parsing/precedence/validation
14. Tests (adapter): TDD for provider order, forced service behaviors
15. Tests (timeouts): Ensure 4s per provider, 10s overall budgeting
16. Tests (UI): Verify deep link precedence over saved session
17. Docs: Update README/architecture for provider integration
18. Quickstart: Validate and refine with real examples
19. Feature Flag: Wire `verificationProviderIntegration` and confirm defaults
20. CI: Ensure lint/rules pass; run `pnpm -r format:check` and tests
