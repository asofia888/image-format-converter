import React, { useEffect } from 'react';
// FIX: Import TranslationKeys to use for type assertion.
import { useTranslation, type TranslationKeys } from '../hooks/useTranslation';
import { useFocusTrap } from '../hooks/useFocusTrap';
import Icon from './Icon';

type ModalContentKey = 'terms' | 'disclaimer' | 'howTo';

interface InfoModalProps {
  contentKey: ModalContentKey;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ contentKey, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useFocusTrap(onClose);

  const titleKey = `modalTitle${contentKey.charAt(0).toUpperCase() + contentKey.slice(1)}`;
  const contentTextKey = `modalContent${contentKey.charAt(0).toUpperCase() + contentKey.slice(1)}`;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] outline-none"
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-200">
            {/* FIX: Cast dynamic key to TranslationKeys to satisfy the 't' function's type requirement. */}
            {t(titleKey as TranslationKeys)}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={t('cancelButton')}
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 p-6 overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
          {/* FIX: Cast dynamic key to TranslationKeys to satisfy the 't' function's type requirement. */}
          <div dangerouslySetInnerHTML={{ __html: t(contentTextKey as TranslationKeys) }} />
        </div>
        
        <footer className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                {t('cancelButton')}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default InfoModal;
