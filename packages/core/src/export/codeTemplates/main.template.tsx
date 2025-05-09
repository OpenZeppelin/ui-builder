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

// @ts-expect-error - this is a template file, so we don't have to worry about this import
import { App } from './App';
import './styles.css';

const networkConfig = NetworkConfigPlaceholder;
// Create adapter instance at the root level to ensure consistent connection state
const adapter = new AdapterPlaceholder(networkConfig);

/**
 * Main entry point for the application
 *
 * This renders the App component into the root element, utilizing the adapter
 * initialized at the root level to ensure consistent wallet state.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App adapter={adapter} />
  </React.StrictMode>
);
