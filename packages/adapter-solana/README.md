# Solana Adapter (`@openzeppelin/transaction-form-adapter-solana`)

This package provides the `ContractAdapter` implementation for the Solana blockchain within the Transaction Form Builder ecosystem.

**Note:** This adapter is currently a placeholder implementation. Functionality will be added in future development phases.

It _will_ handle:

- Loading Solana program IDLs.
- Mapping Solana types to form fields.
- Parsing user input for transaction instructions.
- Formatting query results from Solana accounts/programs.
- Interacting with Solana wallets (e.g., via Wallet-Adapter).
- Providing Solana-specific configuration.

## Internal Structure

This adapter will follow the standard domain-driven module structure outlined in the main [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md).
