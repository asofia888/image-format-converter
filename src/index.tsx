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
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
                if (confirm('New version available! Refresh to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}
