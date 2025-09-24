# Contracts (APIs) Affected by Stellar SAC Support

- Contract Loading API
  - Behavior: When contract is identified as SAC on public/testnet, load methods from official spec instead of RPC Wasm metadata.
- Query API (view)
  - Unchanged. Uses discovered function definitions for argument parsing and result formatting.
- Transaction Execution API (write)
  - Unchanged. Uses discovered function definitions to build and submit transactions.

Notes

- No new external endpoints added.
- No breaking changes expected for consumers.
