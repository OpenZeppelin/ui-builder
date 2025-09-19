# Quickstart: Contract Definition Provider Integration

## Configure Default Provider

- App Config: Set default contract definition provider per network in global service config.
- UI: Use existing settings panel to select default provider.

## Use Deep Links

- Format (EVM example): `?ecosystem=evm&address=0x...&chainId=1&service=etherscan`
- On load: network selected, identifier filled, provider precedence applied.
- Forced service: overrides order; unsupported → automatic fallback; failure → stop with message.

## Verify Provenance

- After load, UI indicates provider and offers a link to view verification.

## Notes

- Timeouts: 4s per provider, 10s overall.
- Saved session: deep link takes precedence.
