import { useState, useCallback, useMemo } from 'react';
import type { TargetFormat, AppStatus, ProcessedFile } from '../types';
import { useTranslation } from './useTranslation';

declare var JSZip: any;

export interface ResizeConfig {
  enabled: boolean;
  width: string;
  height: string;
  unit: 'px' | '%';
  maintainAspectRatio: boolean;
}

export const useImageConverter = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('webp');
  const [quality, setQuality] = useState(0.9);
  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<{ key: string; params?: Record<string, string | number> } | null>(null);
  const [convertedCount, setConvertedCount] = useState(0);
  const [liveRegionMessage, setLiveRegionMessage] = useState('');
  const [resizeConfig, setResizeConfig] = useState<ResizeConfig>({
    enabled: false,
    width: '',
    height: '',
    unit: 'px',
    maintainAspectRatio: true,
  });
  const { t } = useTranslation();

  const isBatchMode = useMemo(() => files.length > 1, [files]);

  const resetState = useCallback(() => {
    setFiles([]);
    setAppStatus('idle');
    setError(null);
    setConvertedCount(0);
    setLiveRegionMessage('');
    setResizeConfig({
      enabled: false,
      width: '',
      height: '',
      unit: 'px',
      maintainAspectRatio: true,
    });
  }, []);

  const handleFilesSelect = useCallback(async (selectedFiles: File[]) => {
    resetState();
    setError(null);
    setAppStatus('loading');
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const processedFiles: ProcessedFile[] = [];

    for (const file of selectedFiles) {
      if (!validTypes.includes(file.type)) {
        console.warn(`Skipping invalid file type: ${file.name}`);
        continue;
      }
      
      const originalSrc = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => {
          console.error(`Failed to read file: ${file.name}`);
          resolve(''); // Handle error case gracefully
        }
        reader.readAsDataURL(file);
      });

      if (!originalSrc) continue; // Skip files that couldn't be read

      const img = new Image();
      img.src = originalSrc;
      await new Promise(resolve => { img.onload = resolve; });

      processedFiles.push({
        id: `${file.name}-${file.lastModified}`,
        file,
        status: 'pending',
        originalSrc,
        originalSize: file.size,
        originalWidth: img.width,
        originalHeight: img.height,
        convertedSrc: null,
        convertedBlob: null,
        convertedSize: null,
        error: null,
      });
    }

    if (processedFiles.length === 0 && selectedFiles.length > 0) {
      const errorMsg = { key: 'errorNoValidFiles' };
      setError(errorMsg);
      setLiveRegionMessage(t(errorMsg.key));
      setAppStatus('error');
      return;
    }
    
    if (processedFiles.length > 0) {
        if (processedFiles[0].file.type === 'image/webp') {
            setTargetFormat('png');
        } else {
            setTargetFormat('webp');
        }
        setResizeConfig(prev => ({
            ...prev,
            width: String(processedFiles[0].originalWidth),
            height: String(processedFiles[0].originalHeight),
        }));
    }

    setFiles(processedFiles);
    setAppStatus('idle');
  }, [resetState, t]);

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

      const worker = new Worker(new URL('../components/converter.worker.ts', import.meta.url), {
        type: 'module',
      });

      worker.onmessage = (e: MessageEvent) => {
        const { success, blob, error } = e.data;
        if (success && blob) {
          const dataUrl = URL.createObjectURL(blob);
          resolve({ status: 'success', convertedSrc: dataUrl, convertedBlob: blob, convertedSize: blob.size });
        } else {
          console.error('Worker processing error:', error);
          resolve({ status: 'error', error: { key: 'errorWorker', params: { message: error } } });
        }
        worker.terminate();
      };

      worker.onerror = (e: ErrorEvent) => {
        console.error('Worker error:', e.message);
        resolve({ status: 'error', error: { key: 'errorWorker', params: { message: e.message } } });
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
    if (files.length === 0) return;
    setAppStatus('converting');
    setError(null);
    setConvertedCount(0);

    const filesToProcess = files.filter(f => f.status !== 'success');
    if (filesToProcess.length > 0) {
        setLiveRegionMessage(t('liveRegionConversionStarted', { count: filesToProcess.length }));
    }
    const alreadyConvertedCount = files.length - filesToProcess.length;
    setConvertedCount(alreadyConvertedCount);

    const conversionPromises = filesToProcess.map(async file => {
        const result = await convertFile(file);
        updateFileStatus(file.id, result);
        setConvertedCount(prev => prev + 1);
    });

    await Promise.all(conversionPromises);
    setAppStatus('success');
    setLiveRegionMessage(t('liveRegionConversionComplete', { count: files.length }));

  }, [files, convertFile, updateFileStatus, t]);
  
  const getConvertedFileName = useCallback((originalFile: File): string => {
    if (!originalFile) return 'download';
    const name = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
    return `${name}.${targetFormat}`;
  }, [targetFormat]);

  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();
    files.forEach(file => {
        if (file.status === 'success' && file.convertedBlob) {
            zip.file(getConvertedFileName(file.file), file.convertedBlob);
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
    } catch (e) {
        const errorMsg = { key: "errorCreateZip" };
        setError(errorMsg);
        setLiveRegionMessage(t(errorMsg.key));
        console.error(e);
    }
  }, [files, getConvertedFileName, t]);

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
    setResizeConfig,
    handleFilesSelect,
    setTargetFormat,
    setQuality,
    handleConvert,
    resetState,
    handleDownloadZip,
    getConvertedFileName,
  };
};