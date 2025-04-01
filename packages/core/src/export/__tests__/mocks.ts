import type { AdapterConfig } from '../../core/types/AdapterTypes';

/**
 * FormRendererConfig interface mirrors the structure from form-renderer package.
 */
interface FormRendererConfig {
  coreDependencies: Record<string, string>;
  fieldDependencies: Record<
    string,
    {
      runtimeDependencies: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
}

/**
 * Mock adapter configurations that simulate what would be loaded from adapter config files.
 */
export const mockAdapterConfigs: Record<string, AdapterConfig> = {
  evm: {
    dependencies: {
      runtime: {
        ethers: '^6.7.0',
        viem: '^1.10.9',
      },
      dev: {
        '@types/ethers': '^6.7.0',
      },
    },
  },
  solana: {
    dependencies: {
      runtime: {
        '@solana/web3.js': '^1.73.0',
      },
      dev: {
        '@types/bn.js': '^5.1.1',
      },
    },
  },
};

/**
 * Mock form renderer configuration that defines dependencies for specific field types.
 */
export const mockFormRendererConfig: FormRendererConfig = {
  coreDependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
  },
  fieldDependencies: {
    text: { runtimeDependencies: {} },
    date: {
      runtimeDependencies: { 'react-datepicker': '^4.14.0' },
      devDependencies: { '@types/react-datepicker': '^4.11.2' },
    },
  },
};
