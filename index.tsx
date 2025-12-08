/**
 * Mushroom Kingdom Mashup Maker - Entry Point
 * Production-ready React 18+ bootstrap with error boundaries, telemetry, and PWA support
 */

import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnalyticsProvider } from './providers/AnalyticsProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import './index.css';

// Type assertions for DOM
declare global {
  interface Window {
    __APP_VERSION__: string;
    __APP_BUILD__: string;
  }
}

// Production constants
const APP_VERSION = '1.0.3';
const APP_BUILD = new Date().toISOString().split('T')[0];

if (import.meta.env.PROD) {
  window.__APP_VERSION__ = APP_VERSION;
  window.__APP_BUILD__ = APP_BUILD;
}

// Root element validation
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found - check index.html');
}

// Performance measurement
if ('performance' in window) {
  window.performance.mark('app-mount-start');
}

// Create root with hydration support
const root = createRoot(rootElement);

// Global error handler integration
const renderApp = () => {
  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <ThemeProvider>
          <AnalyticsProvider>
            <ErrorBoundary>
              <Suspense 
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 mx-auto rounded-full animate-spin mb-8" />
                      <p className="text-white/80 font-mono text-lg">Loading Mushroom Kingdom...</p>
                    </div>
                  </div>
                }
              >
                <App />
              </Suspense>
            </ErrorBoundary>
          </AnalyticsProvider>
        </ThemeProvider>
      </HelmetProvider>
    </React.StrictMode>
  );

  // Performance tracking
  if ('performance' in window && 'performance' in window.performance) {
    window.performance.mark('app-mount-end');
    window.performance.measure('App Mount Time', 'app-mount-start', 'app-mount-end');
    console.log('🚀 App mounted in', performance.getEntriesByName('App Mount Time')[0]?.duration?.toFixed(2), 'ms');
  }
};

// PWA Install Handler
window.addEventListener('appinstallprompt', () => {
  // Dispatch to app for install UI
  document.dispatchEvent(new CustomEvent('pwa-install-available'));
});

// Service Worker Registration (PWA)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker registration failed:', error);
      });
  });
}

// Keyboard shortcuts (Dev only)
if (import.meta.env.DEV) {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R = Hard reload
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      window.location.reload();
    }
    
    // F12 or Ctrl/Cmd + Shift + I = Toggle devtools
    if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
      console.log('💻 DevTools already open or toggle manually');
    }
  });
}

// Mount the application
renderApp();

// Hot Module Replacement (Vite)
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    const newApp = import('./App');
    console.log('🔄 HMR Update');
  });
}

// Export for testing
if (import.meta.env.DEV) {
  (window as any).__APP__ = { root, renderApp };
}
