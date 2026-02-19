---
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-adapter-polkadot': minor
'@openzeppelin/ui-builder-adapter-solana': minor
'@openzeppelin/ui-builder-adapter-midnight': minor
---

Add self-describing ecosystem metadata to all adapters

- Each adapter now exports `ecosystemMetadata` with display info
  (name, icon, description, styling classes, default feature config)
- New `./metadata` subpath export for lightweight static imports
- Adapters implement the `EcosystemExport` interface from ui-types
