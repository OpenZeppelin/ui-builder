/*------------TEMPLATE COMMENT START------------*/
/**
 * Main Entry Point Template for Exported Applications
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
import { ecosystemDefinition, NetworkConfigPlaceholder } from '@@adapter-package-name@@';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { NetworkErrorNotificationProvider, Toaster } from '@openzeppelin/ui-components';
import { RuntimeProvider, WalletStateProvider } from '@openzeppelin/ui-react';
import type { EcosystemRuntime, NativeConfigLoader, NetworkConfig } from '@openzeppelin/ui-types';
import { appConfigService, logger } from '@openzeppelin/ui-utils';

// @ts-expect-error - this is a template file, so we don't have to worry about this import
import { App } from './App';

import './styles.css';

/*@@ADAPTER_BOOTSTRAP_IMPORTS_INJECTION_POINT@@*/

/*------------TEMPLATE COMMENT START------------*/
/**
 * The Generator will replace NetworkConfigPlaceholder with the actual config object or an import to it.
 */
/*------------TEMPLATE COMMENT END------------*/
// The specific NetworkConfig for this exported form.
const exportedNetworkConfig = NetworkConfigPlaceholder;

/*------------TEMPLATE COMMENT START------------*/
/**
 * `ecosystemDefinition` comes from the selected adapter package.
 */
/*------------TEMPLATE COMMENT END------------*/
// Function to resolve the single runtime for the exported app.
const resolveRuntime = async (nc: NetworkConfig): Promise<EcosystemRuntime> => {
  if (nc.id === exportedNetworkConfig.id) {
    if (typeof ecosystemDefinition.createRuntime !== 'function') {
      throw new Error(
        `Adapter package ${exportedNetworkConfig.ecosystem} does not expose createRuntime().`
      );
    }

    const runtime = ecosystemDefinition.createRuntime(
      'composer',
      nc as typeof exportedNetworkConfig
    );
    /*@@ADAPTER_BOOTSTRAP_CODE_INJECTION_POINT@@*/
    return runtime;
  }
  logger.error(
    'ExportedApp',
    `Runtime resolution failed: NetworkConfig ID mismatch. Expected ${exportedNetworkConfig.id}, got ${nc.id}`
  );
  throw new Error(`Runtime resolution failed for network ID: ${nc.id}`);
};

// Function to get the network config by ID, specific to this exported app.
const getNetworkConfigById = (id: string) => {
  if (id === exportedNetworkConfig.id) {
    return exportedNetworkConfig;
  }
  logger.warn(
    '[ExportedApp:getNetworkConfigById]',
    `getNetworkConfigById called with unexpected ID: ${id}. This app is configured for ${exportedNetworkConfig.id}.`
  );
  return null;
};

// Use Vite's import.meta.glob to find all potential kit config files.
// Expecting them to be .ts files as per convention.
const kitConfigImporters = import.meta.glob('./config/wallet/*.config.ts');

/**
 * Dynamically loads kit-specific native configuration files from the exported
 * application's `src/config/wallet/` directory using Vite's import.meta.glob.
 * @param relativePath - The conventional relative path (e.g., './config/wallet/rainbowkit.config.ts').
 * @returns A Promise resolving to the configuration object or null if not found/error.
 */
const loadAppConfigModule: NativeConfigLoader = async (relativePath: string) => {
  const importerToCall = kitConfigImporters[relativePath];

  if (importerToCall) {
    try {
      const module = (await importerToCall()) as { default?: Record<string, unknown> } & Record<
        string,
        unknown
      >;
      return module.default || module;
    } catch {
      return null;
    }
  } else {
    return null;
  }
};

async function startApp() {
  // Initialize AppConfigService, attempting to load from app.config.json first,
  // then potentially from Vite env vars if the exported app is built with Vite and sets them.
  // For typical exported apps, app.config.json will be the primary configuration source.
  await appConfigService.initialize([
    { type: 'json', path: '/app.config.json' }, // Primary config source for exported apps
    { type: 'viteEnv', env: import.meta.env }, // Secondary, if any vite env vars are set during a build of the exported app
  ]);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <NetworkErrorNotificationProvider>
        <RuntimeProvider resolveRuntime={resolveRuntime}>
          <WalletStateProvider
            initialNetworkId={exportedNetworkConfig.id}
            getNetworkConfigById={getNetworkConfigById}
            loadConfigModule={loadAppConfigModule}
          >
            <App />
          </WalletStateProvider>
        </RuntimeProvider>
        <Toaster position="top-right" />
      </NetworkErrorNotificationProvider>
    </React.StrictMode>
  );
}

void startApp();
