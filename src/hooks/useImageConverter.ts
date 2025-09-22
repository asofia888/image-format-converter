import { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import type { Area } from 'react-easy-crop';
import type { TargetFormat, AppStatus, ProcessedFile } from '../types';
import { useTranslation, type TranslationKeys } from './useTranslation';
import { getCroppedImg } from '../utils/cropImage';
import { useFileManager } from './useFileManager';
import { usePresetManager } from './usePresetManager';
import { useConversionSettings } from './useConversionSettings';

export const useImageConverter = () => {
  const [convertedCount, setConvertedCount] = useState(0);
  const [liveRegionMessage, setLiveRegionMessage] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);

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

  const isBatchMode = useMemo(() => files.length > 1, [files]);

  const resetState = useCallback(() => {
    resetFileState();
    setConvertedCount(0);
    setLiveRegionMessage('');
    setIsCropperOpen(false);
    resetResizeConfig();
  }, [resetFileState, resetResizeConfig]);

  const convertFile = useCallback(async (fileToProcess: ProcessedFile): Promise<Partial<ProcessedFile>> => {
    return new Promise(async (resolve) => {
      const { id, file } = fileToProcess;
      updateFileStatus(id, 'converting');

      if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || !window.createImageBitmap) {
        resolve({ status: 'error', error: { key: 'errorBrowserSupport' } });
        return;
      }

      const worker = new Worker(new URL('../workers/converter.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e: MessageEvent) => {
        const { success, blob, error } = e.data;
        if (success && blob) {
          const dataUrl = URL.createObjectURL(blob);
          resolve({ status: 'success', convertedSrc: dataUrl, convertedBlob: blob, convertedSize: blob.size });
        } else {
          console.error('Worker processing error:', error);
          if (error && typeof error === 'object' && 'key' in error) {
            resolve({ status: 'error', error: error as { key: TranslationKeys, params?: any } });
          } else {
            resolve({ status: 'error', error: { key: 'errorWorkerGeneric', params: { message: String(error) } } });
          }
        }
        worker.terminate();
      };

      worker.onerror = (e: ErrorEvent) => {
        console.error('Worker error:', e.message);
        resolve({ status: 'error', error: { key: 'errorWorkerGeneric', params: { message: e.message } } });
        worker.terminate();
      };

      try {
        const imageBitmap = await createImageBitmap(file);
        worker.postMessage(
          {
            imageData: imageBitmap,
            targetFormat: targetFormat,
            quality: quality,
            fileType: file.type,
            resizeConfig: resizeConfig,
            originalWidth: fileToProcess.originalWidth,
            originalHeight: fileToProcess.originalHeight,
          },
          [imageBitmap]
        );
      } catch (e) {
        console.error('Error creating ImageBitmap:', e);
        resolve({ status: 'error', error: { key: 'errorLoadImage' } });
        worker.terminate();
      }
    });
  }, [targetFormat, quality, updateFileStatus, resizeConfig]);

  const handleConvert = useCallback(async () => {
    const filesToProcess = files.filter(f => f.status === 'pending');
    if (filesToProcess.length === 0) return;

    setAppStatus('converting');
    setError(null);
    const alreadyConvertedCount = files.length - filesToProcess.length;
    setConvertedCount(alreadyConvertedCount);

    setLiveRegionMessage(t('liveRegionConversionStarted', { count: filesToProcess.length }));

    const conversionPromises = filesToProcess.map(async file => {
        const result = await convertFile(file);
        updateFileStatus(file.id, result.status!, result.error);
        if (result.status === 'success' && result.convertedSrc && result.convertedBlob && result.convertedSize) {
          updateFileConversion(file.id, result.convertedSrc, result.convertedBlob, result.convertedSize);
        }
        setConvertedCount(prev => prev + 1);
    });

    await Promise.all(conversionPromises);
    setAppStatus('success');
    setLiveRegionMessage(t('liveRegionConversionComplete', { count: files.length }));

  }, [files, convertFile, updateFileStatus, updateFileConversion, setAppStatus, setError, t]);

  const getConvertedFileName = useCallback((originalFile: File, customName?: string): string => {
    if (!originalFile) return 'download';
    const baseName = customName || originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
    return `${baseName}.${targetFormat}`;
  }, [targetFormat]);

  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();
    files.forEach(file => {
        if (file.status === 'success' && file.convertedBlob) {
            zip.file(getConvertedFileName(file.file, file.customName), file.convertedBlob);
        }
    });

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `converted_images_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        setError({ key: 'errorCreateZip' });
        setLiveRegionMessage(t('errorCreateZip'));
        console.error(e);
    }
  }, [files, getConvertedFileName, setError, t]);

  const handleOpenCropper = () => setIsCropperOpen(true);
  const handleCloseCropper = () => setIsCropperOpen(false);
  const handleApplyCrop = useCallback(async (croppedAreaPixels: Area) => {
    if (!files[0]) return;
    try {
        const { url, blob, width, height } = await getCroppedImg(files[0].originalSrc, croppedAreaPixels);
        const croppedFile = new File([blob], files[0].file.name, { type: blob.type });

        updateFileStatus(files[0].id, 'pending');
        // Reset conversion data when cropping
        const updatedFile = {
          file: croppedFile,
          originalSrc: url,
          originalSize: blob.size,
          originalWidth: width,
          originalHeight: height,
          convertedSrc: null,
          convertedBlob: null,
          convertedSize: null,
          status: 'pending' as const
        };

        // Update the file with new crop data
        files[0] = { ...files[0], ...updatedFile };

        setResizeConfig(prev => ({
            ...prev,
            width: String(width),
            height: String(height)
        }));

    } catch (e) {
        console.error(e);
        setError({ key: 'errorCrop' });
    }
    setIsCropperOpen(false);
  }, [files, updateFileStatus, setResizeConfig, setError]);

  const handleResetCrop = useCallback(async () => {
    if(!files[0]) return;

    const originalFile = files[0].file;
     const originalSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(originalFile);
      });

    updateFileStatus(files[0].id, 'pending');
    // Reset to original dimensions
    const resetData = {
        originalSrc: originalSrc,
        originalSize: originalFile.size,
        originalWidth: files[0].trueOriginalWidth,
        originalHeight: files[0].trueOriginalHeight,
        convertedSrc: null,
        convertedBlob: null,
        convertedSize: null,
        status: 'pending' as const
    };

    files[0] = { ...files[0], ...resetData };

    setResizeConfig(prev => ({
        ...prev,
        width: String(files[0].trueOriginalWidth),
        height: String(files[0].trueOriginalHeight)
    }));

  }, [files, updateFileStatus, setResizeConfig]);

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

      return savePreset(name);
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