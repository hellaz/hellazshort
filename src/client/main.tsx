import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Register PWA Service Worker for offline support and installation
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined') {
  registerSW({
    onNeedRefresh() {
      console.log('[PWA] New content available, please refresh.');
    },
    onOfflineReady() {
      console.log('[PWA] App ready for offline use.');
    },
  });
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
