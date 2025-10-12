import { useState, useCallback } from 'react';
import type { TargetFormat, AppStatus, ProcessedFile, ResizeConfig, CropConfig } from '../types';
import type { TranslationKeys } from './useTranslation';

interface UseImageConversionProps {
  files: ProcessedFile[];
  targetFormat: TargetFormat;
  quality: number;
  resizeConfig: ResizeConfig;
  cropConfig: CropConfig;
  setAppStatus: (status: AppStatus) => void;
  setError: (error: { key: TranslationKeys; params?: Record<string, string | number> } | null) => void;
  updateFileStatus: (fileId: string, status: ProcessedFile['status'], error?: { key: TranslationKeys; params?: Record<string, string | number> }) => void;
  updateFileConversion: (fileId: string, convertedSrc: string, convertedBlob: Blob, convertedSize: number) => void;
  setLiveRegionMessage: (message: string) => void;
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
}

export const useImageConversion = ({
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
}: UseImageConversionProps) => {
  const [convertedCount, setConvertedCount] = useState(0);

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
        let imageBitmap: ImageBitmap;

        // Use cropped image if available, otherwise use original file
        if (fileToProcess.croppedSrc) {
          // For cropped images, fetch the blob from the cropped source
          const response = await fetch(fileToProcess.croppedSrc);
          const blob = await response.blob();
          imageBitmap = await createImageBitmap(blob);
        } else {
          // Use original file
          imageBitmap = await createImageBitmap(file);
        }

        worker.postMessage(
          {
            imageData: imageBitmap,
            targetFormat: targetFormat,
            quality: quality,
            fileType: file.type,
            resizeConfig: resizeConfig,
            cropConfig: { ...cropConfig, enabled: false }, // Disable crop since we're using pre-cropped image
            originalWidth: fileToProcess.croppedWidth || fileToProcess.originalWidth,
            originalHeight: fileToProcess.croppedHeight || fileToProcess.originalHeight,
          },
          [imageBitmap]
        );
      } catch (e) {
        console.error('Error creating ImageBitmap:', e);
        resolve({ status: 'error', error: { key: 'errorLoadImage' } });
        worker.terminate();
      }
    });
  }, [targetFormat, quality, updateFileStatus, resizeConfig, cropConfig]);

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
        updateFileStatus(file.id, result.status!, result.error ?? undefined);
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

  const handleDownloadSingle = useCallback(async () => {
    const file = files[0];
    if (!file || file.status !== 'success' || !file.convertedBlob) {
      return;
    }

    const fileName = getConvertedFileName(file.file, file.customName);
    const mimeType = `image/${targetFormat}`;

    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Image files',
            accept: { [mimeType]: [`.${targetFormat}`] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(file.convertedBlob);
        await writable.close();
        return;
      } catch (e) {
        // User cancelled or API failed, fall back to traditional download
        if ((e as Error).name !== 'AbortError') {
          console.warn('File System Access API failed:', e);
        }
      }
    }

    // Fallback to traditional download
    const link = document.createElement('a');
    link.href = file.convertedSrc!;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [files, getConvertedFileName, targetFormat]);

  const handleDownloadZip = useCallback(async () => {
    try {
        // Dynamically import JSZip only when needed
        const { default: JSZip } = await import('jszip');

        const zip = new JSZip();
        files.forEach(file => {
            if (file.status === 'success' && file.convertedBlob) {
                zip.file(getConvertedFileName(file.file, file.customName), file.convertedBlob);
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const fileName = `converted_images_${Date.now()}.zip`;

        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
            try {
                const fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'ZIP files',
                        accept: { 'application/zip': ['.zip'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                return;
            } catch (e) {
                // User cancelled or API failed, fall back to traditional download
                if ((e as Error).name !== 'AbortError') {
                    console.warn('File System Access API failed:', e);
                }
            }
        }

        // Fallback to traditional download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        setError({ key: 'errorCreateZip' });
        setLiveRegionMessage(t('errorCreateZip'));
        console.error('Error creating ZIP or loading JSZip:', e);
    }
  }, [files, getConvertedFileName, setError, t]);

  return {
    convertedCount,
    handleConvert,
    getConvertedFileName,
    handleDownloadZip,
    handleDownloadSingle
  };
};