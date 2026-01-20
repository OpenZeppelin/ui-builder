import { describe, expect, it, vi } from 'vitest';

import type { FormValues, NetworkConfig, UiKitName } from '@openzeppelin/ui-types';

import type { BuilderFormConfig } from '../../../core/types/FormTypes';
import type { TemplateProcessor } from '../../generators/TemplateProcessor';
import { generateAndAddAppConfig } from '../generateAndAddAppConfig';

// Mock logger to avoid console output during tests
vi.mock('@openzeppelin/ui-utils', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('generateAndAddAppConfig', () => {
  const mockTemplateProcessor: TemplateProcessor = {
    formatJson: vi.fn().mockImplementation(async (json: string) => json),
  } as unknown as TemplateProcessor;

  const createNetworkConfig = (
    ecosystem: 'evm' | 'solana' | 'stellar' | 'midnight',
    id: string
  ): NetworkConfig =>
    ({
      id,
      name: `${ecosystem} Testnet`,
      ecosystem,
      exportConstName: `${ecosystem}TestnetConfig`,
      type: 'testnet',
      isTestnet: true,
      primaryExplorerApiIdentifier: `${ecosystem}explorer`,
      rpcUrl: `https://${ecosystem}-testnet-rpc.example.com`,
    }) as NetworkConfig;

  const createFormConfig = (kitName?: UiKitName, kitConfig?: FormValues): BuilderFormConfig => ({
    fields: [],
    layout: {
      columns: 1,
      spacing: 'normal',
      labelPosition: 'top',
    },
    validation: {
      mode: 'onChange',
      showErrors: 'inline',
    },
    functionId: 'testFunction',
    contractAddress: '0x0000000000000000000000000000000000000000',
    uiKitConfig: kitName
      ? {
          kitName,
          kitConfig: kitConfig || {},
        }
      : undefined,
  });

  describe('app.config.json.example generation', () => {
    it('should generate example config with ecosystem-namespaced wallet UI structure', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-testnet');
      const formConfig = createFormConfig();

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      expect(projectFiles['public/app.config.json.example']).toBeDefined();
      const exampleConfig = JSON.parse(projectFiles['public/app.config.json.example']);

      // Check the globalServiceConfigs.walletui structure
      expect(exampleConfig.globalServiceConfigs.walletui).toMatchObject({
        _comment: expect.stringContaining('Wallet UI configuration is ecosystem-specific'),
        stellar: {
          kitName: 'stellar-wallets-kit',
          kitConfig: {},
        },
        evm: {
          kitName: 'rainbowkit',
          kitConfig: {},
        },
        default: {
          kitName: 'custom',
          kitConfig: {},
        },
      });
    });

    it('should include proper RPC endpoint configuration', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('evm', 'ethereum-sepolia');
      const formConfig = createFormConfig();

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      const exampleConfig = JSON.parse(projectFiles['public/app.config.json.example']);

      expect(exampleConfig.rpcEndpoints).toHaveProperty('ethereum-sepolia');
      expect(exampleConfig.rpcEndpoints['ethereum-sepolia']).toBe(
        'YOUR_ETHEREUM_SEPOLIA_RPC_URL_HERE_IF_NEEDED'
      );
      expect(exampleConfig.rpcEndpoints['_comment_for_ethereum-sepolia']).toContain(
        'Optional: Provide a custom RPC URL'
      );
    });

    it('should include explorer API configuration', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-mainnet');
      const formConfig = createFormConfig();

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      const exampleConfig = JSON.parse(projectFiles['public/app.config.json.example']);

      expect(exampleConfig.networkServiceConfigs).toHaveProperty('stellarexplorer');
      expect(exampleConfig.networkServiceConfigs.stellarexplorer).toMatchObject({
        apiKey: 'YOUR_STELLAREXPLORER_API_KEY_HERE',
        _comment: expect.stringContaining('API key for the stellarexplorer block explorer'),
      });
    });

    it('should handle networks without primaryExplorerApiIdentifier', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('midnight', 'custom-network');
      // Remove primaryExplorerApiIdentifier
      const mutableConfig = networkConfig as { primaryExplorerApiIdentifier?: string };
      delete mutableConfig.primaryExplorerApiIdentifier;
      const formConfig = createFormConfig();

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      const exampleConfig = JSON.parse(projectFiles['public/app.config.json.example']);

      expect(exampleConfig.networkServiceConfigs).toHaveProperty(
        'CONFIGURE_EXPLORER_API_KEY_FOR_CUSTOM_NETWORK'
      );
    });
  });

  describe('app.config.json generation for specific UI kits', () => {
    it('should generate app.config.json for stellar-wallets-kit on Stellar', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-testnet');
      const formConfig = createFormConfig('stellar-wallets-kit', { someOption: true });

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      expect(projectFiles['public/app.config.json']).toBeDefined();
      const activeConfig = JSON.parse(projectFiles['public/app.config.json']);

      expect(activeConfig).toMatchObject({
        globalServiceConfigs: {
          walletui: {
            stellar: {
              kitName: 'stellar-wallets-kit',
              kitConfig: { someOption: true },
            },
          },
        },
      });
    });

    it('should generate app.config.json for rainbowkit on EVM', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('evm', 'ethereum-mainnet');
      const formConfig = createFormConfig('rainbowkit', {
        showInjectedConnector: false,
        chains: ['ethereum', 'polygon'],
      });

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      const activeConfig = JSON.parse(projectFiles['public/app.config.json']);

      expect(activeConfig).toMatchObject({
        globalServiceConfigs: {
          walletui: {
            evm: {
              kitName: 'rainbowkit',
              kitConfig: {
                showInjectedConnector: false,
                chains: ['ethereum', 'polygon'],
              },
            },
          },
        },
      });
    });

    it('should not generate app.config.json for custom kit', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('solana', 'solana-devnet');
      const formConfig = createFormConfig('custom');

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      expect(projectFiles['public/app.config.json']).toBeUndefined();
      expect(projectFiles['public/app.config.json.example']).toBeDefined();
    });

    it('should not generate app.config.json for none kit', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('midnight', 'midnight-testnet');
      const formConfig = createFormConfig('none');

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      expect(projectFiles['public/app.config.json']).toBeUndefined();
      expect(projectFiles['public/app.config.json.example']).toBeDefined();
    });

    it('should not generate app.config.json when no UI kit is configured', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-testnet');
      const formConfig = createFormConfig(); // No UI kit

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      expect(projectFiles['public/app.config.json']).toBeUndefined();
      expect(projectFiles['public/app.config.json.example']).toBeDefined();
    });
  });

  describe('content structure validation', () => {
    it('should include all required sections in app.config.json.example', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-testnet');
      const formConfig = createFormConfig();

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      const exampleConfig = JSON.parse(projectFiles['public/app.config.json.example']);

      // Check all main sections exist
      expect(exampleConfig).toHaveProperty('_readme');
      expect(exampleConfig).toHaveProperty('networkServiceConfigs');
      expect(exampleConfig).toHaveProperty('globalServiceConfigs');
      expect(exampleConfig).toHaveProperty('rpcEndpoints');
      expect(exampleConfig).toHaveProperty('featureFlags');
      expect(exampleConfig).toHaveProperty('defaultLanguage');

      // Check _readme is an array with helpful information
      expect(Array.isArray(exampleConfig._readme)).toBe(true);
      expect(exampleConfig._readme.length).toBeGreaterThan(0);
      expect(exampleConfig._readme[0]).toContain('example configuration file');

      // Check WalletConnect configuration
      expect(exampleConfig.globalServiceConfigs.walletconnect).toMatchObject({
        projectId: 'YOUR_WALLETCONNECT_PROJECT_ID_HERE',
        _comment: expect.stringContaining('WalletConnect Project ID'),
      });
    });

    it('should handle different ecosystem naming in generated configs', async () => {
      const ecosystemTests: Array<{
        ecosystem: 'stellar' | 'evm' | 'solana' | 'midnight';
        kitName: UiKitName;
      }> = [
        { ecosystem: 'stellar', kitName: 'custom' },
        { ecosystem: 'evm', kitName: 'rainbowkit' },
        { ecosystem: 'solana', kitName: 'custom' },
        { ecosystem: 'midnight', kitName: 'custom' },
      ];

      for (const { ecosystem, kitName } of ecosystemTests) {
        const projectFiles: Record<string, string> = {};
        const networkConfig = createNetworkConfig(ecosystem, `${ecosystem}-testnet`);
        const formConfig = createFormConfig(kitName, { testOption: true });

        await generateAndAddAppConfig(
          projectFiles,
          networkConfig,
          mockTemplateProcessor,
          formConfig
        );

        if (projectFiles['public/app.config.json']) {
          const activeConfig = JSON.parse(projectFiles['public/app.config.json']);
          expect(activeConfig.globalServiceConfigs.walletui).toHaveProperty(ecosystem);
          expect(activeConfig.globalServiceConfigs.walletui[ecosystem]).toMatchObject({
            kitName,
            kitConfig: { testOption: true },
          });
        }
      }
    });
  });

  describe('error handling', () => {
    it('should handle JSON formatting errors gracefully', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-testnet');
      const formConfig = createFormConfig();

      // Mock formatJson to throw an error
      const errorProcessor = {
        formatJson: vi.fn().mockRejectedValue(new Error('Formatting failed')),
      } as unknown as TemplateProcessor;

      await generateAndAddAppConfig(projectFiles, networkConfig, errorProcessor, formConfig);

      // Should still generate the file, just unformatted
      expect(projectFiles['public/app.config.json.example']).toBeDefined();
      const exampleConfig = JSON.parse(projectFiles['public/app.config.json.example']);
      expect(exampleConfig).toHaveProperty('globalServiceConfigs');
    });
  });

  describe('integration with TemplateProcessor', () => {
    it('should call formatJson for generated files', async () => {
      const projectFiles: Record<string, string> = {};
      const networkConfig = createNetworkConfig('stellar', 'stellar-testnet');
      const formConfig = createFormConfig('stellar-wallets-kit');

      const formatJsonSpy = vi.spyOn(mockTemplateProcessor, 'formatJson');

      await generateAndAddAppConfig(projectFiles, networkConfig, mockTemplateProcessor, formConfig);

      // Should be called twice: once for example, once for active config
      expect(formatJsonSpy).toHaveBeenCalledTimes(2);
      expect(formatJsonSpy).toHaveBeenCalledWith(expect.stringContaining('_readme'));
      expect(formatJsonSpy).toHaveBeenCalledWith(expect.stringContaining('stellar-wallets-kit'));
    });
  });
});
