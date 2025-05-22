import { type CreateConfigParameters } from '@wagmi/core';

/**
 * Represents the specific array/tuple type that wagmi's `createConfig` and
 * RainbowKit's `getDefaultConfig` expect for their `chains` parameter.
 *
 * This is typically `readonly [Chain, ...Chain[]]` where `Chain` is viem's Chain type.
 * We derive it from `CreateConfigParameters['chains']` to ensure it stays in sync
 * with the exact type required by wagmi/core.
 */
export type WagmiConfigChains = CreateConfigParameters['chains'];
