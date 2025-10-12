import React from 'react';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface ActionButtonsProps {
  onClear: () => void;
  onConvert: () => void;
  isConverting: boolean;
  hasBeenConverted: boolean;
  isBatchMode: boolean;
  onDownloadZip: () => void;
  convertedImageSrc: string | null;
  convertedFileName: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onClear,
  onConvert,
  isConverting,
  hasBeenConverted,
  isBatchMode,
  onDownloadZip,
  convertedImageSrc,
  convertedFileName,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mt-6 flex items-center justify-center md:justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
      {/* Undo/Redo buttons */}
      {(onUndo || onRedo) && (
        <div className="flex gap-1 mr-auto">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title={t('undoTooltip')}
            className="inline-flex items-center justify-center p-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-slate-500"
            aria-label={t('undoButton')}
          >
            <Icon name="undo" className="w-5 h-5"/>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title={t('redoTooltip')}
            className="inline-flex items-center justify-center p-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-slate-500"
            aria-label={t('redoButton')}
          >
            <Icon name="redo" className="w-5 h-5"/>
          </button>
        </div>
      )}

      <button
        onClick={onClear}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-slate-500"
      >
        <Icon name="reset" className="w-5 h-5 mr-2"/>
        {t('clearAllButton')}
      </button>

      {!hasBeenConverted ? (
        <button
          onClick={onConvert}
          disabled={isConverting}
          className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-purple-500"
        >
          {isConverting ? <Icon name="spinner" className="w-5 h-5 mr-2 animate-spin" /> : <Icon name="convert" className="w-5 h-5 mr-2" />}
          {isBatchMode ? t('convertAllButton') : t('convertButton')}
        </button>
      ) : isBatchMode ? (
        <button
          onClick={onDownloadZip}
          className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-green-500"
        >
          <Icon name="zip" className="w-5 h-5 mr-2"/>
          {t('downloadAllButton')}
        </button>
      ) : (
        <a
          href={convertedImageSrc || ''}
          download={convertedFileName}
          className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-green-500"
        >
          <Icon name="download" className="w-5 h-5 mr-2"/>
          {t('downloadButton')}
        </a>
      )}
    </div>
  );
};

export default ActionButtons;