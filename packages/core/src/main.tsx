import React from 'react';
import ReactDOM from 'react-dom/client';

import { appConfigService } from '@openzeppelin/transaction-form-utils';

import App from './App';
import './index.css';

// declare global {
//   interface Window {
//     reactCoreInstance: typeof React;
//     adapterEvmRainbowKitInstance: typeof React;
//     appMainInstance: typeof React;
//   }
// }

// window.appMainInstance = React;
// console.log(
//   '[DEBUG] React instance in main app entry (core/main.tsx):',
//   React.version,
//   window.appMainInstance === React
// );

// if (window.reactCoreInstance) {
//   console.log(
//     '[DEBUG] Is main app React === react-core React?:             ',
//     window.appMainInstance === window.reactCoreInstance
//   );
// }

// if (window.adapterEvmRainbowKitInstance) {
//   console.log(
//     '[DEBUG] Is main app React === adapter-evm React?:           ',
//     window.appMainInstance === window.adapterEvmRainbowKitInstance
//   );
// }

async function main() {
  // Initialize the AppConfigService before rendering the application
  // For the core app, we primarily rely on Vite environment variables.
  // We could also add a { type: 'json', path: '/app.config.local.json' } for local dev overrides.
  await appConfigService.initialize([
    { type: 'viteEnv', env: import.meta.env },
    { type: 'json', path: '/app.config.local.json' },
  ]);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void main(); // Explicitly ignore the promise returned by main()
