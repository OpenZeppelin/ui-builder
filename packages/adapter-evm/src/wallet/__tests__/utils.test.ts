import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@openzeppelin/transaction-form-utils';

import { resolveAndInitializeKitConfig } from '../utils';

// Mock the logger to prevent console output during tests and allow spying
vi.mock('@openzeppelin/transaction-form-utils', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('resolveAndInitializeKitConfig', () => {
  const mockLoadConfigModule = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockLoadConfigModule.mockReset();
    vi.clearAllMocks();
  });

  it('should return null if no kitName, programmaticConfig, or loadConfigModule is provided', async () => {
    const result = await resolveAndInitializeKitConfig(undefined, undefined, undefined);
    expect(result).toBeNull();
    expect(logger.debug).toHaveBeenCalledWith(
      'resolveAndInitializeKitConfig',
      'Resolving native config for kit: none',
      { hasProgrammaticKitConfig: false, hasLoadConfigModule: false }
    );
    expect(logger.debug).toHaveBeenCalledWith(
      'resolveAndInitializeKitConfig',
      'No native or programmatic kitConfig provided for none. Returning null.'
    );
  });

  it('should return programmaticKitConfig if kitName is provided but loadConfigModule is not', async () => {
    const programmaticConfig = { settingA: 'valueA' };
    const result = await resolveAndInitializeKitConfig('rainbowkit', programmaticConfig, undefined);
    expect(result).toEqual(programmaticConfig);
    expect(mockLoadConfigModule).not.toHaveBeenCalled();
  });

  it('should return null if kitName is provided, loadConfigModule is not, and no programmaticKitConfig', async () => {
    const result = await resolveAndInitializeKitConfig('rainbowkit', undefined, undefined);
    expect(result).toBeNull();
  });

  it('should not call loadConfigModule if kitName is "custom"', async () => {
    const programmaticConfig = { settingB: 'valueB' };
    const result = await resolveAndInitializeKitConfig(
      'custom',
      programmaticConfig,
      mockLoadConfigModule
    );
    expect(result).toEqual(programmaticConfig);
    expect(mockLoadConfigModule).not.toHaveBeenCalled();
  });

  it('should not call loadConfigModule if kitName is "none"', async () => {
    const result = await resolveAndInitializeKitConfig('none', undefined, mockLoadConfigModule);
    expect(result).toBeNull();
    expect(mockLoadConfigModule).not.toHaveBeenCalled();
  });

  describe('with kitName and loadConfigModule provided', () => {
    const kitName = 'rainbowkit';
    const conventionalPath = `./config/wallet/${kitName}.config.ts`;

    it('should return userNativeConfig if loadConfigModule succeeds and no programmaticConfig', async () => {
      const nativeConfig = { nativeSetting: 'nativeValue' };
      mockLoadConfigModule.mockResolvedValue(nativeConfig);
      const result = await resolveAndInitializeKitConfig(kitName, undefined, mockLoadConfigModule);
      expect(result).toEqual(nativeConfig);
      expect(mockLoadConfigModule).toHaveBeenCalledWith(conventionalPath);
    });

    it('should merge userNativeConfig and programmaticKitConfig, with programmatic taking precedence', async () => {
      const nativeConfig = { common: 'native', nativeOnly: 'present' };
      const programmaticConfig = { common: 'programmatic', progOnly: 'here' };
      mockLoadConfigModule.mockResolvedValue(nativeConfig);
      const result = await resolveAndInitializeKitConfig(
        kitName,
        programmaticConfig,
        mockLoadConfigModule
      );
      expect(result).toEqual({
        common: 'programmatic',
        nativeOnly: 'present',
        progOnly: 'here',
      });
      expect(mockLoadConfigModule).toHaveBeenCalledWith(conventionalPath);
    });

    it('should return programmaticKitConfig if loadConfigModule returns null', async () => {
      const programmaticConfig = { settingC: 'valueC' };
      mockLoadConfigModule.mockResolvedValue(null);
      const result = await resolveAndInitializeKitConfig(
        kitName,
        programmaticConfig,
        mockLoadConfigModule
      );
      expect(result).toEqual(programmaticConfig);
      expect(mockLoadConfigModule).toHaveBeenCalledWith(conventionalPath);
    });

    it('should return null if loadConfigModule returns null and no programmaticConfig', async () => {
      mockLoadConfigModule.mockResolvedValue(null);
      const result = await resolveAndInitializeKitConfig(kitName, undefined, mockLoadConfigModule);
      expect(result).toBeNull();
    });

    it('should return programmaticKitConfig if loadConfigModule throws an error', async () => {
      const programmaticConfig = { settingD: 'valueD' };
      mockLoadConfigModule.mockImplementation(async () => {
        throw new Error('File system error');
      });

      await expect(
        resolveAndInitializeKitConfig(kitName, programmaticConfig, mockLoadConfigModule)
      ).resolves.toEqual(programmaticConfig);

      expect(mockLoadConfigModule).toHaveBeenCalledWith(conventionalPath);
    });

    it('should return null if loadConfigModule throws and no programmaticConfig', async () => {
      mockLoadConfigModule.mockImplementation(async () => {
        throw new Error('Another error');
      });

      await expect(
        resolveAndInitializeKitConfig(kitName, undefined, mockLoadConfigModule)
      ).resolves.toBeNull();

      expect(mockLoadConfigModule).toHaveBeenCalledWith(conventionalPath);
    });
  });

  it('should correctly use kitName in conventional path for loading', async () => {
    const kitName = 'anotherkit';
    const expectedPath = `./config/wallet/${kitName}.config.ts`;
    mockLoadConfigModule.mockResolvedValue({ some: 'data' });
    await resolveAndInitializeKitConfig(kitName, undefined, mockLoadConfigModule);
    expect(mockLoadConfigModule).toHaveBeenCalledWith(expectedPath);
  });
});
