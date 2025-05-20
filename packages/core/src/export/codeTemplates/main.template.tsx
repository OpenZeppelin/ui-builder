/*------------TEMPLATE COMMENT START------------*/
/**
 * Main Entry Point Template for Exported Applications
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This is a placeholder for the correct adapter import
import { AdapterPlaceholder, NetworkConfigPlaceholder } from '@@adapter-package-name@@';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { AdapterProvider, WalletStateProvider } from '@openzeppelin/transaction-form-react-core';
import type { NetworkConfig } from '@openzeppelin/transaction-form-types';
import { appConfigService, logger } from '@openzeppelin/transaction-form-utils';

// @ts-expect-error - this is a template file, so we don't have to worry about this import
import { App } from './App';
import './styles.css';

/*------------TEMPLATE COMMENT START------------*/
/**
 * The Generator will replace NetworkConfigPlaceholder with the actual config object or an import to it.
 */
/*------------TEMPLATE COMMENT END------------*/
// The specific NetworkConfig for this exported form.
const exportedNetworkConfig = NetworkConfigPlaceholder;

/*------------TEMPLATE COMMENT START------------*/
/**
 * AdapterPlaceholder will be replaced by the actual adapter class (e.g., EvmAdapter).
 */
/*------------TEMPLATE COMMENT END------------*/
// Function to resolve the single adapter for the exported app.
const resolveAdapter = async (nc: NetworkConfig): Promise<AdapterPlaceholder> => {
  if (nc.id === exportedNetworkConfig.id) {
    return new AdapterPlaceholder(nc);
  }
  // This path should ideally not be reached in a single-form export context
  // if nc.id always matches exportedNetworkConfig.id.
  console.error(
    `[ExportedApp] Adapter resolution failed: NetworkConfig ID mismatch. Expected ${exportedNetworkConfig.id}, got ${nc.id}`
  );
  // Fallback or error handling: Re-throw or return a dummy/null adapter if absolutely necessary,
  // but this indicates a fundamental issue in how the exported app is configured or used.
  throw new Error(`Adapter resolution failed for network ID: ${nc.id}`);
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
      <AdapterProvider resolveAdapter={resolveAdapter}>
        <WalletStateProvider
          initialNetworkId={exportedNetworkConfig.id}
          getNetworkConfigById={getNetworkConfigById}
        >
          <App />
        </WalletStateProvider>
      </AdapterProvider>
    </React.StrictMode>
  );
}

void startApp();
