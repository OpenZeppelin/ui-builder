import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { Toaster } from '@/components/ui/toaster';

import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>
);
