import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from './useTranslation';
import { useFileManager } from './useFileManager';
import { usePresetManager } from './usePresetManager';
import { useConversionSettings } from './useConversionSettings';
import { useImageConversion } from './useImageConversion';
import { useCropResize } from './useCropResize';

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
    updateFileConversion,
    handleFileNameChange,
    handleRemoveFile,
    resetState: resetFileState
  } = useFileManager();

  const {
    targetFormat,
    quality,
    resizeConfig,
    setTargetFormat,
    setQuality,
    setResizeConfig,
    resetResizeConfig
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
    files,
    setTargetFormat,
    setQuality,
    setResizeConfig,
    setLiveRegionMessage
  });

  const {
    convertedCount,
    handleConvert,
    getConvertedFileName,
    handleDownloadZip
  } = useImageConversion({
    files,
    targetFormat,
    quality,
    resizeConfig,
    setAppStatus,
    setError,
    updateFileStatus,
    updateFileConversion,
    setLiveRegionMessage,
    t
  });

  const {
    isCropperOpen,
    handleOpenCropper,
    handleCloseCropper,
    handleApplyCrop,
    handleResetCrop
  } = useCropResize({
    files,
    updateFileStatus,
    setResizeConfig,
    setError
  });

  const isBatchMode = useMemo(() => files.length > 1, [files]);

  const resetState = useCallback(() => {
    resetFileState();
    setLiveRegionMessage('');
    resetResizeConfig();
  }, [resetFileState, resetResizeConfig]);

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
    isCropperOpen,
    presets,
    activePresetId,
    setResizeConfig,
    handleFilesSelect,
    setTargetFormat,
    setQuality,
    handleConvert,
    resetState,
    handleDownloadZip,
    getConvertedFileName,
    handleOpenCropper,
    handleCloseCropper,
    handleApplyCrop,
    handleResetCrop,
    handleSavePreset,
    handleApplyPreset,
    handleDeletePreset,
    handleFileNameChange,
    handleRemoveFile,
  };
};