import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import Icon from './Icon';

const ConnectionStatus: React.FC = () => {
  const { isOnline, updateAvailable } = usePWA();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdateMessage(true);
    }
  }, [updateAvailable]);

  const handleUpdateApp = async () => {
    setIsReloading(true);

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const dismissUpdate = () => {
    setShowUpdateMessage(false);
  };

  const dismissOffline = () => {
    setShowOfflineMessage(false);
  };

  if (!showOfflineMessage && !showUpdateMessage) {
    return null;
  }

  return (
    <>
      {/* Offline Status */}
      {showOfflineMessage && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Icon
              name={isOnline ? 'wifi' : 'wifiOff'}
              className="w-4 h-4"
            />
            <span>
              {isOnline
                ? 'Back online!'
                : 'You are offline. Some features may be limited.'}
            </span>
            <button
              onClick={dismissOffline}
              className="ml-2 p-1 hover:bg-black/10 rounded transition-colors"
              aria-label="Dismiss"
            >
              <Icon name="close" className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Update Available */}
      {showUpdateMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Icon name="download" className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Update available
              </p>
              <p className="text-xs opacity-90">
                A new version is ready to install
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateApp}
                disabled={isReloading}
                className="px-3 py-1 text-xs font-medium bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isReloading ? (
                  <Icon name="loading" className="w-3 h-3 animate-spin" />
                ) : (
                  'Update'
                )}
              </button>
              <button
                onClick={dismissUpdate}
                className="px-3 py-1 text-xs font-medium text-white/80 hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionStatus;