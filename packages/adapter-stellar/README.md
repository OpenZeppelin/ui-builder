# Stellar Adapter (`@openzeppelin/transaction-form-adapter-stellar`)

This package provides the `ContractAdapter` implementation for the Stellar network within the Transaction Form Builder ecosystem.

**Note:** This adapter is currently a placeholder implementation. Functionality will be added in future development phases.

It _will_ handle:

- Loading Stellar contract metadata (e.g., from XDR).
- Mapping Stellar types (e.g., Soroban types) to form fields.
- Parsing user input for Stellar operations/transactions.
- Formatting query results.
- Interacting with Stellar wallets (e.g., via Freighter, Albedo).
- Providing Stellar-specific configuration.

## Internal Structure

This adapter will follow the standard domain-driven module structure outlined in the main [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md).
