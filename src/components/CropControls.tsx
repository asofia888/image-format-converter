import React, { useCallback } from 'react';
import type { CropConfig } from '../types';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface CropControlsProps {
  cropConfig: CropConfig;
  setCropConfig: React.Dispatch<React.SetStateAction<CropConfig>>;
  originalDimensions: { width: number; height: number } | null;
  imageSrc: string | null;
  onCropModalOpen?: () => void;
}

const CropControls: React.FC<CropControlsProps> = ({
  cropConfig,
  setCropConfig,
  originalDimensions,
  imageSrc,
  onCropModalOpen,
}) => {
  const { t } = useTranslation();

  const handleToggleCrop = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCropConfig(prev => ({ ...prev, enabled: e.target.checked }));
  }, [setCropConfig]);

  const handleResetCrop = useCallback(() => {
    setCropConfig(prev => ({
      ...prev,
      enabled: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }));
  }, [setCropConfig]);

  const hasCropData = cropConfig.width > 0 && cropConfig.height > 0;

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Icon name="crop" className="w-5 h-5" />
          {t('cropOptionsTitle')}
        </h3>
        <label htmlFor="enable-crop" className="flex items-center cursor-pointer">
          <span className="text-sm text-slate-600 dark:text-slate-400 mr-3">{t('enableCropLabel')}</span>
          <div className="relative">
            <input
              type="checkbox"
              id="enable-crop"
              className="sr-only"
              checked={cropConfig.enabled}
              onChange={handleToggleCrop}
            />
            <div className="block bg-slate-300 dark:bg-slate-600 w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white dark:bg-slate-900 w-6 h-6 rounded-full transition-transform ${cropConfig.enabled ? 'translate-x-6 bg-purple-500 dark:bg-purple-400' : ''}`}></div>
          </div>
        </label>
      </div>

      <div className={`transition-opacity ${cropConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {imageSrc && originalDimensions ? (
          <div className="space-y-4">
            {hasCropData ? (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('cropPreviewLabel')}
                  </span>
                  <button
                    onClick={handleResetCrop}
                    disabled={!cropConfig.enabled}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {t('resetCropButton')}
                  </button>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Position: ({Math.round(cropConfig.x)}, {Math.round(cropConfig.y)})</div>
                  <div>Size: {Math.round(cropConfig.width)} × {Math.round(cropConfig.height)}px</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-2">
                {t('cropInstructionLabel')}
              </div>
            )}

            <button
              onClick={onCropModalOpen}
              disabled={!cropConfig.enabled}
              className={`
                w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-500
                ${cropConfig.enabled
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 cursor-not-allowed'
                }
              `}
            >
              <Icon name="crop" className="w-4 h-4" />
              {hasCropData ? t('editCropButton') : t('cropButton')}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            {t('cropNoImageLabel')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropControls;