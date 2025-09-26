import { useState, useEffect } from 'react';
import type { TargetFormat, ResizeConfig } from '../types';
import { APP_CONSTANTS, FORMAT_CONSTANTS } from '../constants';


// Helper to get initial state from localStorage or set defaults
const getInitialSettings = () => {
  const defaults = {
    targetFormat: 'webp' as TargetFormat,
    quality: APP_CONSTANTS.DEFAULT_QUALITY,
    resizeConfig: {
      enabled: false,
      width: '',
      height: '',
      unit: 'px' as 'px' | '%',
      maintainAspectRatio: true,
    },
  };

  try {
    const item = window.localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.CONVERSION_SETTINGS);
    if (item) {
      const parsed = JSON.parse(item);
      const resizeConfig = { ...defaults.resizeConfig, ...parsed.resizeConfig };
      return {
        targetFormat: FORMAT_CONSTANTS.SUPPORTED_FORMATS.includes(parsed.targetFormat) ? parsed.targetFormat : defaults.targetFormat,
        quality: (typeof parsed.quality === 'number' && parsed.quality >= APP_CONSTANTS.MIN_QUALITY && parsed.quality <= APP_CONSTANTS.MAX_QUALITY) ? parsed.quality : defaults.quality,
        resizeConfig,
      };
    }
  } catch (error) {
    console.error("Error reading settings from localStorage", error);
  }
  return defaults;
};

export const useConversionSettings = () => {
  const [initialSettings] = useState(getInitialSettings);

  const [targetFormat, setTargetFormat] = useState<TargetFormat>(initialSettings.targetFormat);
  const [quality, setQuality] = useState(initialSettings.quality);
  const [resizeConfig, setResizeConfig] = useState<ResizeConfig>(initialSettings.resizeConfig);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settings = {
        targetFormat,
        quality,
        resizeConfig,
      };
      window.localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.CONVERSION_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings to localStorage", error);
    }
  }, [targetFormat, quality, resizeConfig]);

  const resetResizeConfig = () => {
    setResizeConfig(prev => ({
      ...prev,
      enabled: false,
      width: '',
      height: '',
    }));
  };

  return {
    targetFormat,
    quality,
    resizeConfig,
    setTargetFormat,
    setQuality,
    setResizeConfig,
    resetResizeConfig,
  };
};