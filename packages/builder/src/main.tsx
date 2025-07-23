import React from 'react';
import ReactDOM from 'react-dom/client';

import { appConfigService } from '@openzeppelin/contracts-ui-builder-utils';

import App from './App';

import './index.css';

async function main() {
  // Initialize the AppConfigService before rendering the application
  // For the builder app, we primarily rely on Vite environment variables.
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
