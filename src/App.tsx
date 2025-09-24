

import React, { useState, useCallback } from 'react';
import ImageConverter from './components/ImageConverter';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorTestComponent from './components/ErrorTestComponent';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './hooks/useTranslation';
import ThemeSwitcher from './components/ThemeSwitcher';
import InfoModal from './components/InfoModal';
import { SafeHTML } from './utils/sanitizeHtml';

type ModalContentKey = 'terms' | 'disclaimer' | 'howTo';

const App: React.FC = () => {
  const { t } = useTranslation();
  const [modalContent, setModalContent] = useState<ModalContentKey | null>(null);

  const handleOpenModal = useCallback((contentKey: ModalContentKey) => {
    setModalContent(contentKey);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalContent(null);
  }, []);

  const handleOpenTerms = useCallback(() => handleOpenModal('terms'), [handleOpenModal]);
  const handleOpenDisclaimer = useCallback(() => handleOpenModal('disclaimer'), [handleOpenModal]);
  const handleOpenHowTo = useCallback(() => handleOpenModal('howTo'), [handleOpenModal]);

  return (
    <ErrorBoundary level="app">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center p-4 font-sans relative transition-colors duration-300">
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <ErrorBoundary level="component">
            <ThemeSwitcher />
          </ErrorBoundary>
          <ErrorBoundary level="component">
            <LanguageSwitcher />
          </ErrorBoundary>
        </div>
        <div className="w-full flex flex-col items-center flex-grow">
          <header className="text-center my-8 flex flex-col items-center gap-4">
              <img src="/logo.png" alt={t('appTitle')} className="w-16 h-16" />
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
              {t('appTitle')}
              </h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              {t('appDescription')}
              </p>
          </header>
          <main className="w-full max-w-5xl">
              <ErrorBoundary level="feature">
                <ImageConverter />
              </ErrorBoundary>
          </main>
        </div>
        <footer className="w-full mt-8 text-center text-sm text-slate-500 dark:text-slate-500">
          <SafeHTML
            html={t('footerText', { year: new Date().getFullYear() })}
            tag="p"
          />
          <div className="mt-2 flex justify-center gap-4">
              <button onClick={handleOpenTerms} className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors">{t('footerTerms')}</button>
              <button onClick={handleOpenDisclaimer} className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors">{t('footerDisclaimer')}</button>
              <button onClick={handleOpenHowTo} className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors">{t('footerHowTo')}</button>
          </div>
        </footer>
         {modalContent && (
          <ErrorBoundary level="component">
            <InfoModal
                contentKey={modalContent}
                onClose={handleCloseModal}
            />
          </ErrorBoundary>
        )}

        {/* Development Error Testing Component */}
        <ErrorTestComponent />
      </div>
    </ErrorBoundary>
  );
};

export default App;