---
"@openzeppelin/ui-builder-types": minor
"@openzeppelin/ui-builder-adapter-evm": minor
"@openzeppelin/ui-builder-adapter-stellar": minor
"@openzeppelin/ui-builder-adapter-solana": minor
"@openzeppelin/ui-builder-ui": minor
"@openzeppelin/ui-builder-app": patch
---

Embed icon components in network configs; remove legacy icon string and dynamic icon usage.

- Build performance: dramatically reduced build time and output file count
- Runtime: no increase to runtime bundle size
- API: `iconComponent` added to BaseNetworkConfig; `icon` string removed
- Adapters: import specific `@web3icons/react` icons and set on configs
- UI: prefer `network.iconComponent` when present

