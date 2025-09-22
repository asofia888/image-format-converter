import { useState, useCallback, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import type { Area } from 'react-easy-crop';
import type { TargetFormat, AppStatus, ProcessedFile, ResizeConfig, Preset } from '../types';
import { useTranslation, type TranslationKeys } from './useTranslation';
import { getCroppedImg } from '../utils/cropImage';
import { formatBytes } from '../utils/formatBytes';
import { validateFiles, MAX_FILE_SIZE_MB } from '../utils/fileValidation';

const SETTINGS_KEY = 'imageConverterSettings';
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
            quality: 0.9, // Not applicable for PNG, but required by type
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
        targetFormat: ['webp', 'jpeg', 'png'].includes(parsed.targetFormat) ? parsed.targetFormat : defaults.targetFormat,
        quality: (typeof parsed.quality === 'number' && parsed.quality >= 0.5 && parsed.quality <= 0.99) ? parsed.quality : defaults.quality,
        resizeConfig,
      };
    }
  } catch (error) {
    console.error("Error reading settings from localStorage", error);
  }
  return defaults;
};

export const useImageConverter = () => {
  const [initialSettings] = useState(getInitialSettings);

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(initialSettings.targetFormat);
  const [quality, setQuality] = useState(initialSettings.quality);
  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<{ key: TranslationKeys; params?: Record<string, string | number> } | null>(null);
  const [convertedCount, setConvertedCount] = useState(0);
  const [liveRegionMessage, setLiveRegionMessage] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [resizeConfig, setResizeConfig] = useState<ResizeConfig>(initialSettings.resizeConfig);
  
  // Preset State
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('');
  
  const { t } = useTranslation();

  // Load presets from localStorage on initial mount, or set defaults.
  useEffect(() => {
    try {
      const savedPresets = window.localStorage.getItem(PRESETS_KEY);
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets));
      } else {
        // If no presets in storage, load defaults and save them so they persist
        setPresets(defaultPresets);
        window.localStorage.setItem(PRESETS_KEY, JSON.stringify(defaultPresets));
      }
    } catch (e) {
      console.error("Failed to load presets from localStorage, using defaults.", e);
      setPresets(defaultPresets);
    }
  }, []);

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
  
  // Effect to automatically select a preset if current settings match one
  useEffect(() => {
    const currentSettings = { targetFormat, quality, resizeConfig };
    const matchingPreset = presets.find(p => JSON.stringify(p.settings) === JSON.stringify(currentSettings));
    setActivePresetId(matchingPreset ? matchingPreset.id : '');
  }, [targetFormat, quality, resizeConfig, presets]);

  // Effect to clean up object URLs to prevent memory leaks
  useEffect(() => {
    const objectUrls = files.flatMap(f => [f.originalSrc, f.convertedSrc]).filter((url): url is string => !!(url && url.startsWith('blob:')));
    
    // Cleanup function runs when component unmounts or `files` state changes
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);


  const isBatchMode = useMemo(() => files.length > 1, [files]);

  const resetState = useCallback(() => {
    setFiles([]);
    setAppStatus('idle');
    setError(null);
    setConvertedCount(0);
    setLiveRegionMessage('');
    setIsCropperOpen(false);
    setResizeConfig(prev => ({ ...prev, 
        enabled: false, 
        width: '',
        height: '',
    }));
  }, []);

  const processSelectedFile = async (file: File): Promise<ProcessedFile> => {
      const baseInfo = {
          id: `${file.name}-${file.lastModified}`,
          file,
          originalSrc: '',
          originalSize: file.size,
          originalWidth: 0,
          originalHeight: 0,
          trueOriginalWidth: 0,
          trueOriginalHeight: 0,
          convertedSrc: null,
          convertedBlob: null,
          convertedSize: null,
      };

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          return {
              ...baseInfo,
              status: 'error',
              error: {
                  key: 'errorFileTooLarge',
                  params: { fileName: file.name, fileSize: formatBytes(file.size), maxSize: MAX_FILE_SIZE_MB }
              },
          };
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
          // This case is filtered out, but as a safeguard:
          return { ...baseInfo, status: 'error', error: { key: 'errorNoValidFiles' } };
      }

      const originalSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => { console.error(`Failed to read file: ${file.name}`); resolve(''); };
          reader.readAsDataURL(file);
      });

      if (!originalSrc) {
          return { ...baseInfo, status: 'error', error: { key: 'errorLoadImage' } };
      }
      
      const img = new Image();
      img.src = originalSrc;
      await new Promise(resolve => { img.onload = resolve; });

      return {
          ...baseInfo,
          status: 'pending',
          error: null,
          originalSrc,
          originalWidth: img.width,
          originalHeight: img.height,
          trueOriginalWidth: img.width,
          trueOriginalHeight: img.height,
      };
  };

  const handleFilesSelect = useCallback(async (selectedFiles: File[]) => {
    resetState();
    setError(null);

    // Enhanced file validation
    const validationResult = await validateFiles(selectedFiles);

    if (validationResult.errors.length > 0) {
      setError({
        key: 'errorFileValidation' as TranslationKeys,
        params: { errors: validationResult.errors.join(', ') }
      });
      setLiveRegionMessage(`Validation errors: ${validationResult.errors.join(', ')}`);
      setAppStatus('error');
      return;
    }

    if (validationResult.validFiles.length === 0) {
      setError({ key: 'errorNoValidFiles' });
      setLiveRegionMessage(t('errorNoValidFiles'));
      setAppStatus('error');
      return;
    }

    setAppStatus('loading');

    const processedFiles = await Promise.all(validationResult.validFiles.map(processSelectedFile));
    setFiles(processedFiles);
    
    const firstValidFile = processedFiles.find(f => f.status !== 'error');
    if (firstValidFile) {
        if (activePresetId === '') {
            if (firstValidFile.file.type === 'image/webp') setTargetFormat('png');
            else if (firstValidFile.file.type === 'image/png') setTargetFormat('webp');
            else setTargetFormat('webp');
        }

        setResizeConfig(prev => ({
            ...prev,
            width: String(firstValidFile.originalWidth),
            height: String(firstValidFile.originalHeight),
        }));
    }

    setAppStatus('idle');
  }, [resetState, t, activePresetId]);

  const updateFileStatus = useCallback((id: string, updates: Partial<ProcessedFile>) => {
      setFiles(prevFiles => 
          prevFiles.map(f => f.id === id ? { ...f, ...updates } : f)
      );
  }, []);

  const convertFile = useCallback(async (fileToProcess: ProcessedFile): Promise<Partial<ProcessedFile>> => {
    return new Promise(async (resolve) => {
      const { id, file } = fileToProcess;
      updateFileStatus(id, { status: 'converting', error: null });

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
        updateFileStatus(file.id, result);
        setConvertedCount(prev => prev + 1);
    });

    await Promise.all(conversionPromises);
    setAppStatus('success');
    setLiveRegionMessage(t('liveRegionConversionComplete', { count: files.length }));

  }, [files, convertFile, updateFileStatus, t]);
  
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
  }, [files, getConvertedFileName, t]);

  const handleOpenCropper = () => setIsCropperOpen(true);
  const handleCloseCropper = () => setIsCropperOpen(false);
  const handleApplyCrop = useCallback(async (croppedAreaPixels: Area) => {
    if (!files[0]) return;
    try {
        const { url, blob, width, height } = await getCroppedImg(files[0].originalSrc, croppedAreaPixels);
        const croppedFile = new File([blob], files[0].file.name, { type: blob.type });

        updateFileStatus(files[0].id, {
            file: croppedFile,
            originalSrc: url,
            originalSize: blob.size,
            originalWidth: width,
            originalHeight: height,
            convertedSrc: null,
            convertedBlob: null,
            convertedSize: null,
            status: 'pending'
        });

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
  }, [files, updateFileStatus]);

  const handleResetCrop = useCallback(async () => {
    if(!files[0]) return;
    
    const originalFile = files[0].file;
     const originalSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(originalFile);
      });

    updateFileStatus(files[0].id, {
        originalSrc: originalSrc,
        originalSize: originalFile.size,
        originalWidth: files[0].trueOriginalWidth,
        originalHeight: files[0].trueOriginalHeight,
        convertedSrc: null,
        convertedBlob: null,
        convertedSize: null,
        status: 'pending'
    });

    setResizeConfig(prev => ({
        ...prev,
        width: String(files[0].trueOriginalWidth),
        height: String(files[0].trueOriginalHeight)
    }));

  }, [files, updateFileStatus]);

  // Preset Handlers
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

      const newPreset: Preset = {
          id: `preset_${Date.now()}`,
          name: name.trim(),
          settings: {
              targetFormat,
              quality,
              resizeConfig
          }
      };

      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      setActivePresetId(newPreset.id);
      try {
        window.localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
        setLiveRegionMessage(t('presetSaveSuccess', { presetName: newPreset.name }));
      } catch (e) {
        console.error("Failed to save presets to localStorage", e);
      }
      return true;

  }, [presets, quality, resizeConfig, targetFormat, t]);

  const handleApplyPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
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
    }
  }, [presets, files]);

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
  }, [presets, activePresetId, t]);

  const handleFileNameChange = useCallback((fileId: string, newName: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? { ...file, customName: newName }
          : file
      )
    );
  }, []);

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
  };
};