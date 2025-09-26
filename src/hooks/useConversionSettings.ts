import { useState, useEffect } from 'react';
import type { TargetFormat, ResizeConfig } from '../types';

const SETTINGS_KEY = 'imageConverterSettings';

// Helper to get default quality based on format
const getDefaultQuality = (format: TargetFormat): number => {
  switch (format) {
    case 'avif':
      return 0.5;
    default:
      return 0.9;
  }
};

// Helper to get initial state from localStorage or set defaults
const getInitialSettings = () => {
  const defaults = {
    targetFormat: 'webp' as TargetFormat,
    quality: 0.9,
    resizeConfig: {
      enabled: false,
      width: '',
      height: '',
      unit: 'px' as 'px' | '%',
      maintainAspectRatio: true,
    },
  };

  try {
    const item = window.localStorage.getItem(SETTINGS_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      const resizeConfig = { ...defaults.resizeConfig, ...parsed.resizeConfig };
      return {
        targetFormat: ['webp', 'jpeg', 'png', 'avif'].includes(parsed.targetFormat) ? parsed.targetFormat : defaults.targetFormat,
        quality: (typeof parsed.quality === 'number' && parsed.quality >= 0.5 && parsed.quality <= 0.99) ? parsed.quality : defaults.quality,
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
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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

  const setTargetFormatWithQuality = (format: TargetFormat) => {
    setTargetFormat(format);
    setQuality(getDefaultQuality(format));
  };

  return {
    targetFormat,
    quality,
    resizeConfig,
    setTargetFormat: setTargetFormatWithQuality,
    setQuality,
    setResizeConfig,
    resetResizeConfig,
  };
};