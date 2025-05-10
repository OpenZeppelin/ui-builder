/*------------TEMPLATE COMMENT START------------*/
/**
 * Main Entry Point Template
 *
 * Uses a template syntax that's compatible with TypeScript and Prettier:
 * - "@@param-name@@" - Template variable markers (consistent across all templates)
 */
/*------------TEMPLATE COMMENT END------------*/
// @ts-expect-error - This is a placeholder for the correct adapter import
import { AdapterPlaceholder, NetworkConfigPlaceholder } from '@@adapter-package-name@@';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { appConfigService } from '@openzeppelin/transaction-form-renderer';

// @ts-expect-error - this is a template file, so we don't have to worry about this import
import { App } from './App';
import './styles.css';

const networkConfig = NetworkConfigPlaceholder;
// Create adapter instance at the root level to ensure consistent connection state
const adapter = new AdapterPlaceholder(networkConfig);

async function startApp() {
  // Initialize AppConfigService, attempting to load from app.config.json first,
  // then potentially from Vite env vars if the exported app is built with Vite and sets them.
  // For typical exported apps, app.config.json will be the primary configuration source.
  await appConfigService.initialize([
    { type: 'json', path: '/app.config.json' },
    // In a Vite project generated from this template, import.meta.env will be properly typed by Vite's client types.
    // For the template file itself, we avoid strict typing on `env` here.
    { type: 'viteEnv', env: import.meta.env },
  ]);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App adapter={adapter} />
    </React.StrictMode>
  );
}

void startApp();
