import React from 'react';
import type { TargetFormat } from '../types';
import type { ResizeConfig } from '../hooks/useImageConverter';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface ConversionControlsProps {
  originalFileType: string;
  targetFormat: TargetFormat;
  setTargetFormat: (format: TargetFormat) => void;
  quality: number;
  setQuality: (quality: number) => void;
  onConvert: () => void;
  onClear: () => void;
  isConverting: boolean;
  isDownloadReady: boolean;
  isBatchMode: boolean;
  onDownloadZip: () => void;
  convertedImageSrc: string | null;
  convertedFileName: string;
  resizeConfig: ResizeConfig;
  setResizeConfig: React.Dispatch<React.SetStateAction<ResizeConfig>>;
  originalDimensions: { width: number; height: number } | null;
}

const ConversionControls: React.FC<ConversionControlsProps> = ({
  originalFileType,
  targetFormat,
  setTargetFormat,
  quality,
  setQuality,
  onConvert,
  onClear,
  isConverting,
  isDownloadReady,
  isBatchMode,
  onDownloadZip,
  convertedImageSrc,
  convertedFileName,
  resizeConfig,
  setResizeConfig,
  originalDimensions,
}) => {
  const { t } = useTranslation();
  const allFormatOptions: { value: TargetFormat; label: string }[] = [
    { value: 'webp', label: 'WebP' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
  ];
  // Ensure that in batch mode, all options are available, but in single file mode, the original format is excluded.
  const formatOptions = isBatchMode ? allFormatOptions : allFormatOptions.filter(opt => `image/${opt.value}` !== originalFileType);
  
  const showQualitySlider = targetFormat === 'jpeg' || targetFormat === 'webp';

  const hasBeenConverted = convertedImageSrc !== null || isDownloadReady;

  const handleResizeChange = (field: 'width' | 'height', value: string) => {
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
};

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          {/* Format Selector */}
          <div className="flex-1">
            <label htmlFor="format-select" className="block text-sm font-medium text-slate-400 mb-2">
              {t('targetFormatLabel')}
            </label>
            <select
              id="format-select"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as TargetFormat)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quality Slider */}
          {showQualitySlider && (
            <div className="flex-1">
              <label htmlFor="quality-slider" className="block text-sm font-medium text-slate-400 mb-2">
                {t('qualityLabel', { quality: Math.round(quality * 100) })}
              </label>
              <input
                id="quality-slider"
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Resize Controls */}
      <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-slate-300 flex items-center gap-2">
                <Icon name="resize" className="w-5 h-5" />
                {t('resizeOptionsTitle')}
              </h3>
              <label htmlFor="enable-resize" className="flex items-center cursor-pointer">
                  <span className="text-sm text-slate-400 mr-3">{t('enableResizeLabel')}</span>
                  <div className="relative">
                      <input 
                        type="checkbox" 
                        id="enable-resize" 
                        className="sr-only" 
                        checked={resizeConfig.enabled}
                        onChange={(e) => setResizeConfig(prev => ({...prev, enabled: e.target.checked}))}
                      />
                      <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${resizeConfig.enabled ? 'translate-x-6 bg-purple-400' : ''}`}></div>
                  </div>
              </label>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-4 items-end transition-opacity ${resizeConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div>
                  <label htmlFor="width-input" className="block text-sm font-medium text-slate-400 mb-1">{t('widthLabel')}</label>
                  <div className="flex">
                      <input 
                        type="number" 
                        id="width-input"
                        value={resizeConfig.width}
                        onChange={(e) => handleResizeChange('width', e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 rounded-l-md pl-3 py-2 sm:text-sm text-white border-y border-l focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                        disabled={!resizeConfig.enabled}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-600 bg-slate-800 text-slate-400 text-sm">
                          {resizeConfig.unit}
                      </span>
                  </div>
              </div>
              <div>
                  <label htmlFor="height-input" className="block text-sm font-medium text-slate-400 mb-1">{t('heightLabel')}</label>
                   <div className="flex">
                      <input 
                        type="number" 
                        id="height-input"
                        value={resizeConfig.height}
                        onChange={(e) => handleResizeChange('height', e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 rounded-l-md pl-3 py-2 sm:text-sm text-white border-y border-l focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                        disabled={!resizeConfig.enabled}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-600 bg-slate-800 text-slate-400 text-sm">
                          {resizeConfig.unit}
                      </span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  title={t('maintainAspectRatioLabel')}
                  onClick={() => setResizeConfig(p => ({...p, maintainAspectRatio: !p.maintainAspectRatio}))}
                  disabled={!resizeConfig.enabled}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <Icon name={resizeConfig.maintainAspectRatio ? 'lockClosed' : 'lockOpen'} className="w-5 h-5 text-slate-300" />
                </button>
              </div>
              {originalDimensions && (
                <p className="text-xs text-slate-500 sm:col-span-2">{t('originalDimensionsLabel', { width: originalDimensions.width, height: originalDimensions.height })}</p>
              )}
          </div>
      </div>

      <div className="mt-6 flex items-center justify-center md:justify-end gap-3 pt-6 border-t border-slate-700">
        <button
          onClick={onClear}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
        >
          <Icon name="reset" className="w-5 h-5 mr-2"/>
          {t('clearAllButton')}
        </button>

        {!hasBeenConverted ? (
            <button
            onClick={onConvert}
            disabled={isConverting}
            className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500"
            >
            {isConverting ? <Icon name="spinner" className="w-5 h-5 mr-2 animate-spin" /> : <Icon name="convert" className="w-5 h-5 mr-2" />}
            {isBatchMode ? t('convertAllButton') : t('convertButton')}
            </button>
        ) : isBatchMode ? (
            <button
            onClick={onDownloadZip}
            className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500"
            >
                <Icon name="zip" className="w-5 h-5 mr-2"/>
                {t('downloadAllButton')}
            </button>
        ) : (
            <a
            href={convertedImageSrc || ''}
            download={convertedFileName}
            className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500"
            >
            <Icon name="download" className="w-5 h-5 mr-2"/>
            {t('downloadButton')}
            </a>
        )}
      </div>
    </div>
  );
};

export default ConversionControls;