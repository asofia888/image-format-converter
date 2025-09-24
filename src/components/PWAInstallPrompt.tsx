import React, { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useTranslation } from '../hooks/useTranslation';
import Icon from './Icon';

const PWAInstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable || isInstalled || isStandalone || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await promptInstall();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const shouldShowPrompt = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return true;

    const dismissedTime = parseInt(dismissed);
    const daysPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    return daysPassed > 7;
  };

  if (!shouldShowPrompt()) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <Icon name="download" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Install Image Converter
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
            Add this app to your home screen for quick access and offline use.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isInstalling ? (
                <>
                  <Icon name="loading" className="w-3 h-3 mr-1.5 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Icon name="download" className="w-3 h-3 mr-1.5" />
                  Install
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Close install prompt"
        >
          <Icon name="close" className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Icon name="wifi" className="w-3 h-3" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="zap" className="w-3 h-3" />
            <span>Fast loading</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="smartphone" className="w-3 h-3" />
            <span>Native feel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;