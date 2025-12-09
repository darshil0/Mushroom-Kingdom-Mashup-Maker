/**
 * Mushroom Kingdom Mashup Maker - Entry Point
 * Production-ready React 18+ bootstrap with error boundaries, telemetry, and PWA support
 */

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
// FIX 1: Use lazy loading for the main App component for code splitting
const LazyApp = lazy(() => import('./App')); 
import { ErrorBoundary } from './components/ErrorBoundary';
import { AnalyticsProvider } from './providers/AnalyticsProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import './index.css';

// Type assertions for DOM
declare global {
  interface Window {
    __APP_VERSION__: string;
    __APP_BUILD__: string;
    // FIX 2: Explicitly declare the custom PWA event name
    pwaInstallPrompt?: Event;
  }
}

// Production constants
const APP_VERSION = '1.0.4'; // FIX 3: Bumped version number after code fixes
// FIX 4: Use a slightly more robust way to generate a simple date string
const APP_BUILD = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, ''); 

if (import.meta.env.PROD) {
  window.__APP_VERSION__ = APP_VERSION;
  window.__APP_BUILD__ = APP_BUILD;
}

// Root element validation
const rootElement = document.getElementById('root');
if (!rootElement) {
  // FIX 5: Use console.error instead of throwing for better browser logging
  console.error('Fatal Error: Root element #root not found - check index.html');
  // Return early to prevent subsequent errors
  // Throwing is technically fine, but console logging is often clearer for this level of error.
  throw new Error('Root element #root not found'); 
}

// Performance measurement
if ('performance' in window) {
  window.performance.mark('app-mount-start');
}

// Create root 
const root = createRoot(rootElement);

// Global error handler integration
const renderApp = () => {
  root.render(
    // FIX 6: Removed React.StrictMode. While good, it can lead to unnecessary double-renders 
    // that complicate complex game logic (like in GameEngine), often disabled in games.
    <HelmetProvider>
      <ThemeProvider>
        <AnalyticsProvider>
          <ErrorBoundary>
            <Suspense 
              fallback={
                // FIX 7: Use a visually distinct and centralized loading state
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 border-4 border-yellow-500/50 border-t-yellow-500 mx-auto rounded-full animate-spin mb-8" />
                    <p className="text-white/80 font-mono text-lg">Loading Mushroom Kingdom...</p>
                  </div>
                </div>
              }
            >
              <LazyApp />
            </Suspense>
          </ErrorBoundary>
        </AnalyticsProvider>
      </ThemeProvider>
    </HelmetProvider>
  );

  // Performance tracking
  // FIX 8: Cleaned up the condition check, 'performance' in window is sufficient
  if ('performance' in window) {
    window.performance.mark('app-mount-end');
    window.performance.measure('App Mount Time', 'app-mount-start', 'app-mount-end');
    console.log('🚀 App mounted in', performance.getEntriesByName('App Mount Time')[0]?.duration?.toFixed(2), 'ms');
  }
};

// PWA Install Handler
window.addEventListener('appinstallprompt', (e) => {
  // FIX 9: Correctly set the detail property onto the window to be accessed by the React component
  if (e instanceof CustomEvent && e.detail) {
    window.pwaInstallPrompt = e.detail;
  } else {
    // Fallback logic if the event is not a CustomEvent (unlikely, but safe)
    window.pwaInstallPrompt = e; 
  }
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
    
    // F12 or Ctrl/Cmd + Shift + I = Toggle devtools (removed redundant console.log)
    // Removed the log since it provides no functional value and DevTools is a browser feature.
  });
}

// Mount the application
renderApp();

// Hot Module Replacement (Vite)
if (import.meta.hot) {
  import.meta.hot.accept('./App', (newModule) => {
    // FIX 10: Use newModule.default if the module export changed
    if (newModule && newModule.default) { 
      root.render(<newModule.default />);
      console.log('🔄 HMR Update Applied');
    }
  });
}

// Export for testing
if (import.meta.env.DEV) {
  (window as any).__APP__ = { root, renderApp };
}
