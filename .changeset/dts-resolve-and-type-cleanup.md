---
'@openzeppelin/ui-builder-adapter-evm': patch
'@openzeppelin/ui-builder-adapter-polkadot': patch
---

fix(adapter): resolve type declarations for internal evm-core package

Add `dts.resolve` for `adapter-evm-core` in tsup configs so type declarations
are bundled alongside runtime JS. This fixes exported apps failing to compile
because `.d.ts` files referenced the unpublished `adapter-evm-core` package.

Also cleans up the type hierarchy: `TypedPolkadotNetworkConfig` now extends
`PolkadotNetworkConfig` from `@openzeppelin/ui-types` directly (with narrowed
`viemChain` typing), eliminating its type-level dependency on `adapter-evm-core`.
`TypedEvmNetworkConfig` similarly extends `EvmNetworkConfig` directly.
