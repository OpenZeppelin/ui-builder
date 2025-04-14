import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './styles.css';

/**
 * Main entry point for the application
 *
 * This renders the App component into the root element.
 * During export, this file will remain mostly unchanged, but might be updated
 * to include any necessary provider components or configuration.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
