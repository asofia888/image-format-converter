import React, { useCallback } from 'react';
import type { ResizeConfig } from '../types';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface ResizeControlsProps {
  resizeConfig: ResizeConfig;
  setResizeConfig: React.Dispatch<React.SetStateAction<ResizeConfig>>;
  originalDimensions: { width: number; height: number } | null;
}

const ResizeControls: React.FC<ResizeControlsProps> = ({
  resizeConfig,
  setResizeConfig,
  originalDimensions,
}) => {
  const { t } = useTranslation();

  const handleResizeChange = useCallback((field: 'width' | 'height', value: string) => {
    // Allow empty input for better UX
    if (value === '') {
      setResizeConfig(prev => ({ ...prev, [field]: '' }));
      return;
    }

    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0) return;

    setResizeConfig(prev => {
      const newConfig = { ...prev, [field]: String(numericValue) };
      if (prev.maintainAspectRatio && originalDimensions) {
        const aspectRatio = originalDimensions.width / originalDimensions.height;
        if (!isNaN(aspectRatio) && aspectRatio > 0) {
          if (field === 'width') {
            newConfig.height = String(Math.round(numericValue / aspectRatio));
          } else {
            newConfig.width = String(Math.round(numericValue * aspectRatio));
          }
        }
      }
      return newConfig;
    });
  }, [setResizeConfig, originalDimensions]);

  const handleToggleResize = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setResizeConfig(prev => ({ ...prev, enabled: e.target.checked }));
  }, [setResizeConfig]);

  const handleToggleAspectRatio = useCallback(() => {
    setResizeConfig(p => ({ ...p, maintainAspectRatio: !p.maintainAspectRatio }));
  }, [setResizeConfig]);

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Icon name="resize" className="w-5 h-5" />
          {t('resizeOptionsTitle')}
        </h3>
        <label htmlFor="enable-resize" className="flex items-center cursor-pointer">
          <span className="text-sm text-slate-600 dark:text-slate-400 mr-3">{t('enableResizeLabel')}</span>
          <div className="relative">
            <input
              type="checkbox"
              id="enable-resize"
              className="sr-only"
              checked={resizeConfig.enabled}
              onChange={handleToggleResize}
            />
            <div className="block bg-slate-300 dark:bg-slate-600 w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white dark:bg-slate-900 w-6 h-6 rounded-full transition-transform ${resizeConfig.enabled ? 'translate-x-6 bg-purple-500 dark:bg-purple-400' : ''}`}></div>
          </div>
        </label>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end transition-opacity ${resizeConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div>
          <label htmlFor="width-input" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('widthLabel')}</label>
          <div className="flex">
            <input
              type="number"
              id="width-input"
              value={resizeConfig.width}
              placeholder={originalDimensions ? String(originalDimensions.width) : ''}
              onChange={(e) => handleResizeChange('width', e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-l-md pl-3 py-2 sm:text-sm text-slate-900 dark:text-white border-y border-l focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
              disabled={!resizeConfig.enabled}
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              {resizeConfig.unit}
            </span>
          </div>
        </div>
        <div>
          <label htmlFor="height-input" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('heightLabel')}</label>
          <div className="flex">
            <input
              type="number"
              id="height-input"
              value={resizeConfig.height}
              placeholder={originalDimensions ? String(originalDimensions.height) : ''}
              onChange={(e) => handleResizeChange('height', e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-l-md pl-3 py-2 sm:text-sm text-slate-900 dark:text-white border-y border-l focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
              disabled={!resizeConfig.enabled}
            />
            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              {resizeConfig.unit}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAspectRatio}
            disabled={!resizeConfig.enabled}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-purple-500
              ${resizeConfig.maintainAspectRatio
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600'
              }
              ${!resizeConfig.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={t('maintainAspectRatioLabel')}
          >
            <Icon
              name={resizeConfig.maintainAspectRatio ? 'lockClosed' : 'lockOpen'}
              className="w-4 h-4"
            />
            <span className="hidden sm:inline">
              {resizeConfig.maintainAspectRatio ? t('aspectRatioLocked') : t('aspectRatioFree')}
            </span>
            <div className="flex items-center">
              <div className={`
                w-4 h-3 border rounded-sm mr-1 flex items-center justify-center
                ${resizeConfig.maintainAspectRatio
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/50'
                  : 'border-slate-400 bg-white dark:bg-slate-600'
                }
              `}>
                <div className="w-2 h-1.5 bg-slate-300 dark:bg-slate-500 rounded-xs"></div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">:</span>
              <div className={`
                w-3 h-4 border rounded-sm ml-1 flex items-center justify-center
                ${resizeConfig.maintainAspectRatio
                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/50'
                  : 'border-slate-400 bg-white dark:bg-slate-600'
                }
              `}>
                <div className="w-1.5 h-2 bg-slate-300 dark:bg-slate-500 rounded-xs"></div>
              </div>
            </div>
          </button>
        </div>
        {originalDimensions && (
          <p className="text-xs text-slate-500 sm:col-span-2">{t('originalDimensionsLabel', { width: originalDimensions.width, height: originalDimensions.height })}</p>
        )}
      </div>
    </div>
  );
};

export default ResizeControls;