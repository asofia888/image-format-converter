import { useState, useEffect } from 'react';
import type { TargetFormat, ResizeConfig, CropConfig } from '../types';
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
    cropConfig: {
      enabled: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      constrainAspectRatio: false,
    },
  };

  try {
    const item = window.localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.CONVERSION_SETTINGS);
    if (item) {
      const parsed = JSON.parse(item);
      const resizeConfig = { ...defaults.resizeConfig, ...parsed.resizeConfig };
      const cropConfig = { ...defaults.cropConfig, ...parsed.cropConfig };
      return {
        targetFormat: FORMAT_CONSTANTS.SUPPORTED_FORMATS.includes(parsed.targetFormat) ? parsed.targetFormat : defaults.targetFormat,
        quality: (typeof parsed.quality === 'number' && parsed.quality >= APP_CONSTANTS.MIN_QUALITY && parsed.quality <= APP_CONSTANTS.MAX_QUALITY) ? parsed.quality : defaults.quality,
        resizeConfig,
        cropConfig,
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
  const [cropConfig, setCropConfig] = useState<CropConfig>(initialSettings.cropConfig);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const settings = {
        targetFormat,
        quality,
        resizeConfig,
        cropConfig,
      };
      window.localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.CONVERSION_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings to localStorage", error);
    }
  }, [targetFormat, quality, resizeConfig, cropConfig]);

  const resetResizeConfig = () => {
    setResizeConfig(prev => ({
      ...prev,
      enabled: false,
      width: '',
      height: '',
    }));
  };

  const resetCropConfig = () => {
    setCropConfig(prev => ({
      ...prev,
      enabled: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      constrainAspectRatio: false,
    }));
  };

  return {
    targetFormat,
    quality,
    resizeConfig,
    cropConfig,
    setTargetFormat,
    setQuality,
    setResizeConfig,
    setCropConfig,
    resetResizeConfig,
    resetCropConfig,
  };
};