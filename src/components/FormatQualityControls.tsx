import React, { useMemo, useCallback } from 'react';
import type { TargetFormat } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { APP_CONSTANTS } from '../constants';

interface FormatQualityControlsProps {
  targetFormat: TargetFormat;
  setTargetFormat: (format: TargetFormat) => void;
  quality: number;
  setQuality: (quality: number) => void;
}

const FormatQualityControls: React.FC<FormatQualityControlsProps> = ({
  targetFormat,
  setTargetFormat,
  quality,
  setQuality,
}) => {
  const { t } = useTranslation();

  const allFormatOptions: { value: TargetFormat; label: string }[] = useMemo(() => [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
  ], []);

  const formatOptions = useMemo(() => {
    return allFormatOptions;
  }, [allFormatOptions]);

  const showQualitySlider = useMemo(() => targetFormat === 'jpeg' || targetFormat === 'webp', [targetFormat]);

  const handleFormatChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetFormat(e.target.value as TargetFormat);
  }, [setTargetFormat]);

  const handleQualityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuality(parseFloat(e.target.value));
  }, [setQuality]);

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-4">
      {/* Format Selector */}
      <div className="flex-1">
        <label htmlFor="format-select" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
          {t('targetFormatLabel')}
        </label>
        <select
          id="format-select"
          value={targetFormat}
          onChange={handleFormatChange}
          className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-900 dark:text-white"
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
          <div className="mb-2">
            <label htmlFor="quality-slider" className="block text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('qualityLabel')} <span className="text-xs text-slate-500">({Math.round(quality * APP_CONSTANTS.PERCENTAGE_MULTIPLIER)}%)</span>
            </label>
            <p className="text-xs text-slate-500">{t('qualityDescription')}</p>
          </div>
          <input
            id="quality-slider"
            type="range"
            min="0.5"
            max="0.99"
            step="0.01"
            value={quality}
            onChange={handleQualityChange}
            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
          />
        </div>
      )}
    </div>
  );
};

export default FormatQualityControls;