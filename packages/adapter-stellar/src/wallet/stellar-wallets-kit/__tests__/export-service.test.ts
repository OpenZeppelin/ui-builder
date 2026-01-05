import { describe, expect, it } from 'vitest';

import type { UiKitConfiguration } from '@openzeppelin/ui-types';

import { generateStellarWalletsKitExportables } from '../export-service';

describe('generateStellarWalletsKitExportables', () => {
  it('should generate default config when no customCode is provided', () => {
    const uiKitConfig: UiKitConfiguration = {
      kitName: 'stellar-wallets-kit',
      kitConfig: {
        appName: 'My Stellar DApp',
        allowTestnet: true,
      },
    };

    const result = generateStellarWalletsKitExportables(uiKitConfig);

    expect(Object.keys(result)).toEqual(['src/config/wallet/stellar-wallets-kit.config.ts']);

    const content = result['src/config/wallet/stellar-wallets-kit.config.ts'];
    expect(content).toContain('// Stellar Wallets Kit configuration for your exported application');
    expect(content).toContain("appName: 'My Stellar DApp'");
    expect(content).toContain('network: WalletNetwork.TESTNET');
  });

  it('should use customCode when provided', () => {
    const customCode = `// Custom Stellar Wallets Kit config
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

const config = {
  custom: true,
  appName: 'Custom App',
};

export default config;`;

    const uiKitConfig: UiKitConfiguration = {
      kitName: 'stellar-wallets-kit',
      kitConfig: {
        appName: 'My Stellar DApp',
      },
      customCode,
    };

    const result = generateStellarWalletsKitExportables(uiKitConfig);

    expect(Object.keys(result)).toEqual(['src/config/wallet/stellar-wallets-kit.config.ts']);
    expect(result['src/config/wallet/stellar-wallets-kit.config.ts']).toBe(customCode);
  });

  it('should handle empty kitConfig', () => {
    const uiKitConfig: UiKitConfiguration = {
      kitName: 'stellar-wallets-kit',
      kitConfig: {},
    };

    const result = generateStellarWalletsKitExportables(uiKitConfig);

    const content = result['src/config/wallet/stellar-wallets-kit.config.ts'];
    expect(content).toContain("appName: 'My Stellar App'"); // default value
    expect(content).toContain('network: WalletNetwork.TESTNET'); // default value
  });

  it('should handle WalletConnect project ID when provided', () => {
    const uiKitConfig: UiKitConfiguration = {
      kitName: 'stellar-wallets-kit',
      kitConfig: {
        walletConnectProjectId: 'my-project-id-123',
      },
    };

    const result = generateStellarWalletsKitExportables(uiKitConfig);

    const content = result['src/config/wallet/stellar-wallets-kit.config.ts'];
    expect(content).toContain("walletConnectProjectId: 'my-project-id-123'");
    expect(content).not.toContain('// walletConnectProjectId:');
  });

  it('should respect network mainnet', () => {
    const uiKitConfig: UiKitConfiguration = {
      kitName: 'stellar-wallets-kit',
      kitConfig: {
        network: 'MAINNET',
      },
    };

    const result = generateStellarWalletsKitExportables(uiKitConfig);

    const content = result['src/config/wallet/stellar-wallets-kit.config.ts'];
    expect(content).toContain('network: WalletNetwork.PUBLIC');
  });
});
