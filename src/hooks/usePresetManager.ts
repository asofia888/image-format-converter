import { useState, useCallback, useEffect } from 'react';
import type { Preset, TargetFormat, ResizeConfig, CropConfig, ProcessedFile } from '../types';
import { useTranslation } from './useTranslation';

const PRESETS_KEY = 'imageConverterPresets';
const PRESETS_VERSION_KEY = 'imageConverterPresetsVersion';
const CURRENT_PRESETS_VERSION = '2.1'; // Updated to include aspect ratio constraints

const defaultPresets: Preset[] = [
  {
    id: 'instagram_post',
    name: 'Instagram投稿 (1080x1080)',
    settings: {
      targetFormat: 'jpeg',
      quality: 0.9,
      resizeConfig: {
        enabled: true,
        width: '1080',
        height: '1080',
        unit: 'px',
        maintainAspectRatio: false,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        aspectRatio: 1.0, // 1:1 aspect ratio for Instagram
        constrainAspectRatio: true,
      },
    },
  },
  {
    id: 'twitter_post',
    name: 'Twitter投稿 (1200x675)',
    settings: {
      targetFormat: 'jpeg',
      quality: 0.9,
      resizeConfig: {
        enabled: true,
        width: '1200',
        height: '675',
        unit: 'px',
        maintainAspectRatio: false,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        aspectRatio: 1200 / 675, // 16:9 aspect ratio for Twitter
        constrainAspectRatio: true,
      },
    },
  },
  {
    id: 'tiktok_post',
    name: 'TikTok投稿 (1080x1920)',
    settings: {
      targetFormat: 'jpeg',
      quality: 0.9,
      resizeConfig: {
        enabled: true,
        width: '1080',
        height: '1920',
        unit: 'px',
        maintainAspectRatio: false,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        aspectRatio: 1080 / 1920, // 9:16 aspect ratio for TikTok
        constrainAspectRatio: true,
      },
    },
  },
  {
    id: 'custom',
    name: 'カスタム',
    settings: {
      targetFormat: 'jpeg',
      quality: 0.9,
      resizeConfig: {
        enabled: false,
        width: '',
        height: '',
        unit: 'px',
        maintainAspectRatio: true,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        constrainAspectRatio: false, // Free form cropping for custom
      },
    },
  },
  {
    id: 'default_blog',
    name: 'Blog Post (1200px WebP)',
    settings: {
      targetFormat: 'webp',
      quality: 0.9,
      resizeConfig: {
        enabled: true,
        width: '1200',
        height: '',
        unit: 'px',
        maintainAspectRatio: true,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        constrainAspectRatio: false, // Free form cropping for blog posts
      },
    },
  },
  {
    id: 'default_social',
    name: 'Social Icon (400x400 PNG)',
    settings: {
      targetFormat: 'png',
      quality: 0.9,
      resizeConfig: {
        enabled: true,
        width: '400',
        height: '400',
        unit: 'px',
        maintainAspectRatio: false,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        aspectRatio: 1.0, // 1:1 aspect ratio for social icons
        constrainAspectRatio: true,
      },
    },
  },
  {
    id: 'default_jpeg_compress',
    name: 'Compressed JPEG (75%)',
    settings: {
      targetFormat: 'jpeg',
      quality: 0.75,
      resizeConfig: {
        enabled: false,
        width: '',
        height: '',
        unit: 'px',
        maintainAspectRatio: true,
      },
      cropConfig: {
        enabled: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        constrainAspectRatio: false, // Free form cropping for compression
      },
    },
  },
];

interface UsePresetManagerProps {
  targetFormat: TargetFormat;
  quality: number;
  resizeConfig: ResizeConfig;
  cropConfig: CropConfig;
  files: ProcessedFile[];
  setTargetFormat: (format: TargetFormat) => void;
  setQuality: (quality: number) => void;
  setResizeConfig: (config: ResizeConfig | ((prev: ResizeConfig) => ResizeConfig)) => void;
  setCropConfig: (config: CropConfig | ((prev: CropConfig) => CropConfig)) => void;
  setLiveRegionMessage: (message: string) => void;
}

export const usePresetManager = ({
  targetFormat,
  quality,
  resizeConfig,
  cropConfig,
  files,
  setTargetFormat,
  setQuality,
  setResizeConfig,
  setCropConfig,
  setLiveRegionMessage,
}: UsePresetManagerProps) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('');
  const { t } = useTranslation();

  // Load presets from localStorage on initial mount, or set defaults
  useEffect(() => {
    try {
      const savedVersion = window.localStorage.getItem(PRESETS_VERSION_KEY);
      const savedPresets = window.localStorage.getItem(PRESETS_KEY);

      // If version doesn't match or no presets exist, use defaults
      if (savedVersion !== CURRENT_PRESETS_VERSION || !savedPresets) {
        console.log('Updating presets to version', CURRENT_PRESETS_VERSION, 'from version', savedVersion);
        setPresets(defaultPresets);
        window.localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
        window.localStorage.setItem(PRESETS_VERSION_KEY, CURRENT_PRESETS_VERSION);
      } else {
        // Parse saved presets and merge with defaults to ensure all default presets exist
        const parsedPresets = JSON.parse(savedPresets);
        const mergedPresets = [...defaultPresets];

        // Add custom presets (user-created) from saved data
        parsedPresets.forEach((preset: Preset) => {
          if (preset.id.startsWith('custom_') && !mergedPresets.find(p => p.id === preset.id)) {
            mergedPresets.push(preset);
          }
        });

        setPresets(mergedPresets);
        // Update localStorage with merged presets
        window.localStorage.setItem(PRESETS_KEY, JSON.stringify(mergedPresets));
      }
    } catch (e) {
      console.error("Failed to load presets from localStorage, using defaults.", e);
      setPresets(defaultPresets);
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
      window.localStorage.setItem(PRESETS_VERSION_KEY, CURRENT_PRESETS_VERSION);
    }
  }, []);

  // Effect to automatically select a preset if current settings match one
  useEffect(() => {
    const currentSettings = { targetFormat, quality, resizeConfig, cropConfig };
    const matchingPreset = presets.find(p => JSON.stringify(p.settings) === JSON.stringify(currentSettings));
    setActivePresetId(matchingPreset ? matchingPreset.id : '');
  }, [targetFormat, quality, resizeConfig, cropConfig, presets]);

  const handleSavePreset = useCallback((name: string) => {
    if (!name.trim()) return;

    const newPreset: Preset = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      settings: {
        targetFormat,
        quality,
        resizeConfig: { ...resizeConfig },
        cropConfig: { ...cropConfig },
      },
    };

    const isDuplicate = presets.some(preset =>
      JSON.stringify(preset.settings) === JSON.stringify(newPreset.settings)
    );

    if (isDuplicate) {
      setLiveRegionMessage(t('presetDuplicateError'));
      return;
    }

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    setActivePresetId(newPreset.id);

    try {
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      setLiveRegionMessage(t('presetSaveSuccess', { presetName: name }));
    } catch (e) {
      console.error("Failed to save presets to localStorage", e);
    }
  }, [targetFormat, quality, resizeConfig, cropConfig, presets, t, setLiveRegionMessage]);

  const handleApplyPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    setTargetFormat(preset.settings.targetFormat);
    setQuality(preset.settings.quality);

    const newResizeConfig = { ...preset.settings.resizeConfig };
    const firstFile = files[0];

    // If aspect ratio is maintained and one dimension is missing, calculate it
    if (firstFile && newResizeConfig.enabled && newResizeConfig.maintainAspectRatio) {
      const aspectRatio = firstFile.originalWidth / firstFile.originalHeight;
      if (!isNaN(aspectRatio) && aspectRatio > 0) {
        const widthNum = parseInt(newResizeConfig.width, 10);
        const heightNum = parseInt(newResizeConfig.height, 10);

        if (!isNaN(widthNum) && newResizeConfig.height === '') {
          newResizeConfig.height = String(Math.round(widthNum / aspectRatio));
        } else if (newResizeConfig.width === '' && !isNaN(heightNum)) {
          newResizeConfig.width = String(Math.round(heightNum * aspectRatio));
        }
      }
    }

    setResizeConfig(newResizeConfig);
    setCropConfig({ ...preset.settings.cropConfig });
    setActivePresetId(id);
  }, [presets, files, setTargetFormat, setQuality, setResizeConfig, setCropConfig]);

  const handleDeletePreset = useCallback((id: string) => {
    const presetToDelete = presets.find(p => p.id === id);
    if (!presetToDelete) return;

    const updatedPresets = presets.filter(p => p.id !== id);
    setPresets(updatedPresets);
    if (activePresetId === id) {
      setActivePresetId('');
    }
    try {
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      setLiveRegionMessage(t('presetDeleteSuccess', { presetName: presetToDelete.name }));
    } catch (e) {
      console.error("Failed to save presets to localStorage", e);
    }
  }, [presets, activePresetId, t, setLiveRegionMessage]);

  return {
    presets,
    activePresetId,
    handleSavePreset,
    handleApplyPreset,
    handleDeletePreset,
  };
};