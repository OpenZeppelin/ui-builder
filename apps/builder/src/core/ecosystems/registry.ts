import type { Ecosystem, EcosystemFeatureConfig } from '@openzeppelin/ui-types';

import { getEcosystemMetadata } from '../ecosystemManager';

/**
 * Ordered list of ecosystems for consistent display across the application.
 */
export const ECOSYSTEM_ORDER: Ecosystem[] = [
  'evm',
  'stellar',
  'polkadot',
  'midnight',
  'solana',
] as const;

/**
 * Sparse app-level overrides for ecosystem feature flags.
 *
 * Adapter metadata already declares sensible defaults (enabled: true,
 * showInUI: true). Only ecosystems that need app-specific overrides
 * appear here.
 */
const FEATURE_CONFIG_OVERRIDES: Partial<Record<Ecosystem, Partial<EcosystemFeatureConfig>>> = {
  solana: {
    enabled: false,
    showInUI: false,
    disabledLabel: 'Coming Soon',
  },
};

/**
 * Returns the resolved feature config for an ecosystem by merging the
 * adapter-declared defaults with any app-level overrides.
 */
export function getEcosystemDefaultFeatureConfig(ecosystem: Ecosystem): EcosystemFeatureConfig {
  const meta = getEcosystemMetadata(ecosystem);
  const adapterDefaults: EcosystemFeatureConfig = meta?.defaultFeatureConfig ?? {
    enabled: false,
    showInUI: true,
  };
  const overrides = FEATURE_CONFIG_OVERRIDES[ecosystem];
  if (!overrides) return adapterDefaults;
  return { ...adapterDefaults, ...overrides };
}

export function getAvailableEcosystems(): Ecosystem[] {
  return [...ECOSYSTEM_ORDER];
}
