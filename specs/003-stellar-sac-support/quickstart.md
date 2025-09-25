# Quickstart: Stellar SAC Support

1. Open the Builder and select Stellar public or testnet.
2. Enter a SAC contract ID (C...).
3. Click "Load contract".
4. Verify the app detects SAC and shows methods.
5. Call a view method to confirm query works.
6. (Optional) Execute a write method using configured execution strategy.

Validation

- On cache hit, method discovery should be instant.
- On network failure, a clear error should be shown.
- Non-SAC contracts continue to load via normal flow.
