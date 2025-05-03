# EVM Adapter (`@openzeppelin/transaction-form-adapter-evm`)

This package provides the `ContractAdapter` implementation for EVM-compatible blockchains (Ethereum, Polygon, BSC, etc.) within the Transaction Form Builder ecosystem.

It handles:

- Loading contract ABIs (from JSON or Etherscan).
- Mapping EVM types to form fields.
- Parsing user input (including complex types) for transaction data.
- Formatting view function results.
- Interacting with wallets via Wagmi/Viem for signing and sending transactions.
- Providing EVM-specific configuration (execution methods, explorer URLs).

## Internal Structure

This adapter follows the standard domain-driven module structure outlined in the main [Adapter Architecture Guide](../../docs/ADAPTER_ARCHITECTURE.md).
