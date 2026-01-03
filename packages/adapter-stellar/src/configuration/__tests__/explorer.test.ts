import { describe, expect, it } from 'vitest';

import { UserExplorerConfig } from '@openzeppelin/ui-types';

import { validateStellarExplorerConfig } from '../../configuration/explorer';

describe('validateStellarExplorerConfig', () => {
  it('should return true for valid configuration with all fields', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiUrl: 'https://api.stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(true);
  });

  it('should return false for invalid explorerUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'invalid-url',
      apiUrl: 'https://api.stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(false);
  });

  it('should return false for invalid apiUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiUrl: 'invalid-url',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(false);
  });

  it('should return true for configuration without apiKey', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiUrl: 'https://api.stellarchain.io',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(true);
  });

  it('should return true for configuration without apiUrl', () => {
    const config: UserExplorerConfig = {
      explorerUrl: 'https://stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    };
    expect(validateStellarExplorerConfig(config)).toBe(true);
  });

  it('should return false for configuration without explorerUrl', () => {
    const config = {
      apiUrl: 'https://api.stellarchain.io',
      apiKey: 'valid-key',
      name: 'Test',
      isCustom: true,
    } as UserExplorerConfig;
    expect(validateStellarExplorerConfig(config)).toBe(false);
  });
});

/*
 * NOTE: Connection testing removed for Stellar explorers.
 *
 * Unlike EVM, Stellar explorers are only used for generating display URLs,
 * not for critical functionality. Testing website availability provides
 * no functional value since contract loading uses Soroban RPC directly.
 *
 * See configuration/explorer.ts for detailed explanation.
 */
