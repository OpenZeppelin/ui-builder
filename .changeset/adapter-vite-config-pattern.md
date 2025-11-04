---
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-solana': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
---

Standardize adapter Vite configuration pattern

- Add vite-config.ts export to all adapters for build-time configuration isolation
- Export getEvmViteConfig(), getSolanaViteConfig(), and getStellarViteConfig() functions
- Include module deduplication configurations for adapter-specific dependencies
- Update package.json exports and tsup.config.ts to include vite-config builds
- Ensures each adapter's build requirements are isolated and don't interfere with others

