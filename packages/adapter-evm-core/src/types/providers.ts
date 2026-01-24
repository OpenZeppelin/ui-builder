/**
 * EVM Contract Definition Provider keys and ordering
 * Avoid magic strings by using typed constants and a union type.
 */

export const EvmProviderKeys = {
  Etherscan: 'etherscan',
  Sourcify: 'sourcify',
} as const;

export type EvmContractDefinitionProviderKey =
  (typeof EvmProviderKeys)[keyof typeof EvmProviderKeys];

export const EVM_PROVIDER_ORDER_DEFAULT: readonly EvmContractDefinitionProviderKey[] = [
  EvmProviderKeys.Etherscan,
  EvmProviderKeys.Sourcify,
] as const;

export function isEvmProviderKey(value: unknown): value is EvmContractDefinitionProviderKey {
  return value === EvmProviderKeys.Etherscan || value === EvmProviderKeys.Sourcify;
}
