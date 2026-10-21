import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

// Register PWA Service Worker for offline support and installation
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined') {
  // Check if current page is a short link route served by a stale PWA service worker
  const path = window.location.pathname.toLowerCase();
  const isSpaRoute =
    path === '/' ||
    path === '' ||
    path.startsWith('/dashboard') ||
    path.startsWith('/p/') ||
    ['/login', '/register', '/signup', '/setup', '/features', '/about', '/contact', '/terms', '/privacy', '/report-abuse'].includes(path);

  if (!isSpaRoute) {
    console.warn('[PWA] Short link route loaded SPA shell from SW cache. Unregistering SW and reloading from network...');
    if (navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  } else {
    registerSW({
      onNeedRefresh() {
        console.log('[PWA] New content available, please refresh.');
      },
      onOfflineReady() {
        console.log('[PWA] App ready for offline use.');
      },
    });
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
