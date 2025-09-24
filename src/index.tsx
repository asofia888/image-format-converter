import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { TranslationProvider } from './hooks/useTranslation';
import { ThemeProvider } from './hooks/useTheme';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// Global error handler for unhandled promise rejections and errors
const handleGlobalError = (error: Error, errorInfo?: any) => {
  console.error('🚨 Global Error:', error);
  if (errorInfo) {
    console.error('Error Info:', errorInfo);
  }

  // Log to error reporting service in production
  if (import.meta.env.PROD) {
    // Send to error reporting service
    try {
      const errorReport = {
        type: 'global_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      const existingErrors = JSON.parse(localStorage.getItem('globalErrors') || '[]');
      existingErrors.push(errorReport);
      localStorage.setItem('globalErrors', JSON.stringify(existingErrors.slice(-5)));
    } catch (e) {
      console.warn('Failed to log global error:', e);
    }
  }
};

// Listen for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  handleGlobalError(new Error(`Unhandled Promise Rejection: ${event.reason}`));
});

// Listen for uncaught errors
window.addEventListener('error', (event) => {
  handleGlobalError(new Error(`Uncaught Error: ${event.message}`), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

root.render(
  <React.StrictMode>
    <ErrorBoundary level="app" onError={handleGlobalError}>
      <ThemeProvider>
        <TranslationProvider>
          <App />
        </TranslationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // First, unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister().then(() => {
          console.log('Existing Service Worker unregistered');
        });
      });
    });

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // For now, we'll disable service worker to resolve caching issues
    // This ensures users always get the latest content
    console.log('Service Worker disabled to prevent caching issues');
  });
}
