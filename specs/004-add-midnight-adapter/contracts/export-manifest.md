# Export Manifest (Midnight v1)

## Packages to Include

- @openzeppelin/ui-builder-adapter-midnight
- @openzeppelin/ui-builder-types
- @openzeppelin/ui-builder-utils
- @openzeppelin/ui-builder-react-core
- @openzeppelin/ui-builder-ui (design system primitives)
- Tailwind + shadcn/ui configuration (workspace proxied configs)
- @midnight-ntwrk/dapp-connector-api (wallet API types/runtime where required)

## Configuration

- App runtime config via AppConfigService
- Ecosystem registration must include Midnight
- Wallet UI provider and hooks wired in exported app root

## Notes

- Ensure parity with EVM/Stellar export flows
- Validate install/build of exported app via quickstart steps
