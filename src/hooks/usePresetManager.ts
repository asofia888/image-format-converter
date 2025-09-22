import { useState, useCallback, useEffect } from 'react';
import type { Preset, TargetFormat, ResizeConfig, ProcessedFile } from '../types';
import { useTranslation } from './useTranslation';

const PRESETS_KEY = 'imageConverterPresets';

const defaultPresets: Preset[] = [
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
    },
  },
];

interface UsePresetManagerProps {
  targetFormat: TargetFormat;
  quality: number;
  resizeConfig: ResizeConfig;
  files: ProcessedFile[];
  setTargetFormat: (format: TargetFormat) => void;
  setQuality: (quality: number) => void;
  setResizeConfig: (config: ResizeConfig | ((prev: ResizeConfig) => ResizeConfig)) => void;
  setLiveRegionMessage: (message: string) => void;
}

export const usePresetManager = ({
  targetFormat,
  quality,
  resizeConfig,
  files,
  setTargetFormat,
  setQuality,
  setResizeConfig,
  setLiveRegionMessage,
}: UsePresetManagerProps) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('');
  const { t } = useTranslation();

  // Load presets from localStorage on initial mount, or set defaults
  useEffect(() => {
    try {
      const savedPresets = window.localStorage.getItem(PRESETS_KEY);
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      } else {
        setPresets(defaultPresets);
        window.localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
      }
    } catch (e) {
      console.error("Failed to load presets from localStorage, using defaults.", e);
      setPresets(defaultPresets);
    }
  }, []);

  // Effect to automatically select a preset if current settings match one
  useEffect(() => {
    const currentSettings = { targetFormat, quality, resizeConfig };
    const matchingPreset = presets.find(p => JSON.stringify(p.settings) === JSON.stringify(currentSettings));
    setActivePresetId(matchingPreset ? matchingPreset.id : '');
  }, [targetFormat, quality, resizeConfig, presets]);

  const handleSavePreset = useCallback((name: string) => {
    if (!name.trim()) return;

    const newPreset: Preset = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      settings: {
        targetFormat,
        quality,
        resizeConfig: { ...resizeConfig },
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
  }, [targetFormat, quality, resizeConfig, presets, t, setLiveRegionMessage]);

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
    setActivePresetId(id);
  }, [presets, files, setTargetFormat, setQuality, setResizeConfig]);

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