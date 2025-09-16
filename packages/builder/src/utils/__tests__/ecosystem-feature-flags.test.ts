import { beforeEach, describe, expect, it, vi } from 'vitest';

import { appConfigService } from '@openzeppelin/contracts-ui-builder-utils';

import {
  getEcosystemFeatureConfig,
  getEnabledEcosystems,
  getVisibleEcosystems,
  isEcosystemEnabled,
  shouldShowEcosystemInUI,
} from '../ecosystem-feature-flags';

// Mock the appConfigService
vi.mock('@openzeppelin/contracts-ui-builder-utils', () => ({
  appConfigService: {
    isFeatureEnabled: vi.fn().mockReturnValue(false),
  },
}));

describe('ecosystem-feature-flags', () => {
  beforeEach(() => {
    // Reset the mock to return false by default
    vi.mocked(appConfigService.isFeatureEnabled).mockReturnValue(false);
  });

  describe('getEcosystemFeatureConfig', () => {
    it('should return default config for EVM (enabled)', () => {
      const config = getEcosystemFeatureConfig('evm');
      expect(config).toEqual({
        enabled: true,
        showInUI: true,
        disabledLabel: undefined,
        disabledDescription: undefined,
      });
    });

    it('should return default config for Stellar (enabled)', () => {
      const config = getEcosystemFeatureConfig('stellar');
      expect(config).toEqual({
        enabled: true,
        showInUI: true,
        disabledLabel: undefined,
        disabledDescription: undefined,
      });
    });

    it('should return default config for Solana (disabled)', () => {
      const config = getEcosystemFeatureConfig('solana');
      expect(config).toEqual({
        enabled: false,
        showInUI: false,
        disabledLabel: 'Coming Soon',
        disabledDescription: undefined,
      });
    });

    it('should override with feature flags', () => {
      vi.mocked(appConfigService.isFeatureEnabled).mockImplementation((flag) => {
        if (flag === 'ecosystem_solana_enabled') return true;
        return false;
      });

      const config = getEcosystemFeatureConfig('solana');
      expect(config.enabled).toBe(true);
    });
  });

  describe('isEcosystemEnabled', () => {
    it('should return true for EVM by default', () => {
      expect(isEcosystemEnabled('evm')).toBe(true);
    });

    it('should return true for Stellar by default', () => {
      expect(isEcosystemEnabled('stellar')).toBe(true);
    });

    it('should return false for Solana by default', () => {
      expect(isEcosystemEnabled('solana')).toBe(false);
    });

    it('should respect feature flag overrides', () => {
      vi.mocked(appConfigService.isFeatureEnabled).mockImplementation((flag) => {
        if (flag === 'ecosystem_solana_enabled') return true;
        return false;
      });

      expect(isEcosystemEnabled('solana')).toBe(true);
    });
  });

  describe('shouldShowEcosystemInUI', () => {
    it('should return true for visible ecosystems by default', () => {
      expect(shouldShowEcosystemInUI('evm')).toBe(true);
      expect(shouldShowEcosystemInUI('solana')).toBe(false);
      expect(shouldShowEcosystemInUI('stellar')).toBe(true);
      expect(shouldShowEcosystemInUI('midnight')).toBe(true);
    });

    it('should respect feature flag overrides', () => {
      vi.mocked(appConfigService.isFeatureEnabled).mockImplementation((flag) => {
        if (flag === 'ecosystem_solana_hide_in_ui') return true;
        return false;
      });

      expect(shouldShowEcosystemInUI('solana')).toBe(false);
    });
  });

  describe('getVisibleEcosystems', () => {
    it('should return visible ecosystems by default', () => {
      const visible = getVisibleEcosystems();
      expect(visible).toEqual(['evm', 'stellar', 'midnight']);
    });

    it('should filter out hidden ecosystems', () => {
      vi.mocked(appConfigService.isFeatureEnabled).mockImplementation((flag) => {
        if (flag === 'ecosystem_solana_hide_in_ui') return true;
        if (flag === 'ecosystem_stellar_hide_in_ui') return true;
        return false;
      });

      const visible = getVisibleEcosystems();
      expect(visible).toEqual(['evm', 'midnight']);
    });
  });

  describe('getEnabledEcosystems', () => {
    it('should return EVM and Stellar by default', () => {
      const enabled = getEnabledEcosystems();
      expect(enabled).toEqual(['evm', 'stellar']);
    });

    it('should include ecosystems enabled by feature flags', () => {
      vi.mocked(appConfigService.isFeatureEnabled).mockImplementation((flag) => {
        if (flag === 'ecosystem_solana_enabled') return true;
        if (flag === 'ecosystem_stellar_enabled') return true;
        return false;
      });

      const enabled = getEnabledEcosystems();
      expect(enabled).toEqual(['evm', 'stellar', 'solana']);
    });
  });
});
