import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from './useTranslation';
import { useFileManager } from './useFileManager';
import { usePresetManager } from './usePresetManager';
import { useConversionSettings } from './useConversionSettings';
import { useImageConversion } from './useImageConversion';
import { cropImage } from '../utils/cropImage';

export const useImageConverter = () => {
  const [liveRegionMessage, setLiveRegionMessage] = useState('');

  const { t } = useTranslation();

  // Use decomposed hooks
  const {
    files,
    appStatus,
    error,
    setAppStatus,
    setError,
    handleFilesSelect,
    updateFileStatus,
    updateFileCrop,
    updateFileConversion,
    handleFileNameChange,
    handleRemoveFile,
    resetState: resetFileState
  } = useFileManager();

  const {
    targetFormat,
    quality,
    resizeConfig,
    cropConfig,
    setTargetFormat,
    setQuality,
    setResizeConfig,
    setCropConfig,
    resetResizeConfig,
    resetCropConfig
  } = useConversionSettings();

  const {
    presets,
    activePresetId,
    handleSavePreset: savePreset,
    handleApplyPreset,
    handleDeletePreset
  } = usePresetManager({
    targetFormat,
    quality,
    resizeConfig,
    cropConfig,
    files,
    setTargetFormat,
    setQuality,
    setResizeConfig,
    setCropConfig,
    setLiveRegionMessage
  });

  const {
    convertedCount,
    handleConvert,
    getConvertedFileName,
    handleDownloadZip,
    handleDownloadSingle
  } = useImageConversion({
    files,
    targetFormat,
    quality,
    resizeConfig,
    cropConfig,
    setAppStatus,
    setError,
    updateFileStatus,
    updateFileConversion,
    setLiveRegionMessage,
    t
  });


  const isBatchMode = useMemo(() => files.length > 1, [files]);

  const resetState = useCallback(() => {
    resetFileState();
    setLiveRegionMessage('');
    resetResizeConfig();
    resetCropConfig();
  }, [resetFileState, resetResizeConfig, resetCropConfig]);

  const handleSavePreset = useCallback((name: string): boolean => {
      setError(null);
      if (!name.trim()) {
          setError({ key: 'errorPresetNameEmpty' });
          return false;
      }
      if (presets.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
          setError({ key: 'errorPresetNameExists' });
          return false;
      }

      savePreset(name);
      return true;
  }, [presets, savePreset, setError]);

  const isDownloadReady = useMemo(() => files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error'), [files]);
  const isConverting = useMemo(() => appStatus === 'converting', [appStatus]);

  const handleApplyCrop = useCallback(async () => {
    if (!files[0] || !cropConfig.enabled || cropConfig.width === 0 || cropConfig.height === 0) return;

    const fileToProcess = files[0];
    setAppStatus('loading');

    try {
      const sourceSrc = fileToProcess.croppedSrc || fileToProcess.originalSrc;
      const result = await cropImage(sourceSrc, cropConfig);

      updateFileCrop(
        fileToProcess.id,
        result.croppedSrc,
        result.croppedWidth,
        result.croppedHeight
      );

      setAppStatus('idle');
    } catch (error) {
      console.error('Crop error:', error);
      setError({ key: 'errorCrop' });
      setAppStatus('error');
    }
  }, [files, cropConfig, setAppStatus, updateFileCrop, setError]);

  return {
    files,
    targetFormat,
    quality,
    appStatus,
    error,
    convertedCount,
    liveRegionMessage,
    isBatchMode,
    isDownloadReady,
    isConverting,
    resizeConfig,
    cropConfig,
    presets,
    activePresetId,
    setResizeConfig,
    setCropConfig,
    handleFilesSelect,
    setTargetFormat,
    setQuality,
    handleConvert,
    resetState,
    handleDownloadZip,
    handleDownloadSingle,
    getConvertedFileName,
    handleSavePreset,
    handleApplyPreset,
    handleDeletePreset,
    handleFileNameChange,
    handleRemoveFile,
    handleApplyCrop,
  };
};