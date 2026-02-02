---
"@openzeppelin/ui-builder-adapter-evm": patch
"@openzeppelin/ui-builder-adapter-polkadot": patch
---

Fix broken dependency on private package adapter-evm-core

Moves `@openzeppelin/ui-builder-adapter-evm-core` from `dependencies` to `devDependencies`. Since the core package is bundled at build time via tsup's `noExternal` config, it should not appear as a runtime dependency in published packages.
