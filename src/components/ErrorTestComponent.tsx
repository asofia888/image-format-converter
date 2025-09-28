import React, { useState } from 'react';

/**
 * Development-only component to test Error Boundary functionality
 * This component intentionally throws errors to test error handling
 */
const ErrorTestComponent: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [asyncError, setAsyncError] = useState(false);

  if (shouldThrow) {
    throw new Error('Test Error: This is an intentional error for testing Error Boundary');
  }

  const handleSyncError = () => {
    setShouldThrow(true);
  };

  const handleAsyncError = async () => {
    setAsyncError(true);
    // Simulate async operation that fails
    await new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Test Async Error: This is an intentional async error'));
      }, 100);
    });
  };

  const handleUnhandledPromiseRejection = () => {
    // This will be caught by the global error handler
    Promise.reject(new Error('Test Unhandled Promise Rejection'));
  };

  const handleGlobalError = () => {
    // This will be caught by the global error handler
    throw new Error('Test Global Error: This error should be caught globally');
  };

  const handleWorkerError = () => {
    // Test worker error (if workers are available)
    try {
      const worker = new Worker('/nonexistent-worker.js');
      worker.onerror = (error) => {
        console.log('Worker error caught:', error);
      };
    } catch (error) {
      console.log('Worker creation error:', error);
    }
  };

  if (!import.meta.env.DEV) {
    return null; // Don't render in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 max-w-sm">
      <h2 className="font-bold text-red-800 dark:text-red-200 mb-2">
        🧪 Error Testing (Dev Only)
      </h2>
      <div className="space-y-2">
        <button
          onClick={handleSyncError}
          className="block w-full px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Test Sync Error (Error Boundary)
        </button>

        <button
          onClick={handleAsyncError}
          disabled={asyncError}
          className="block w-full px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded disabled:opacity-50"
        >
          Test Async Error
        </button>

        <button
          onClick={handleUnhandledPromiseRejection}
          className="block w-full px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded"
        >
          Test Promise Rejection
        </button>

        <button
          onClick={handleGlobalError}
          className="block w-full px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
        >
          Test Global Error
        </button>

        <button
          onClick={handleWorkerError}
          className="block w-full px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Test Worker Error
        </button>
      </div>
      <p className="text-xs text-red-700 dark:text-red-300 mt-2">
        These buttons test different error scenarios. Check console for logs.
      </p>
    </div>
  );
};

export default ErrorTestComponent;