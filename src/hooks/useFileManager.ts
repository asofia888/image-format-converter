import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProcessedFile, AppStatus } from '../types';
import { type TranslationKeys } from './useTranslation';
import { validateFiles, MAX_FILE_SIZE_MB } from '../utils/fileValidation';
import { formatBytes } from '../utils/formatBytes';
import { useErrorHandler } from './useErrorHandler';

export const useFileManager = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const { error, setError, handleError, clearError } = useErrorHandler();

  // Track previous blob URLs to clean up only removed ones
  const prevUrlsRef = useRef<Set<string>>(new Set());

  // Effect to clean up object URLs to prevent memory leaks
  useEffect(() => {
    const currentUrls = new Set(
      files.flatMap(f => [f.originalSrc, f.croppedSrc, f.convertedSrc])
        .filter((url): url is string => !!(url && url.startsWith('blob:')))
    );

    // Revoke URLs that are no longer in use, but with a small delay
    // to ensure React has finished rendering with the new state
    const urlsToRevoke: string[] = [];
    prevUrlsRef.current.forEach(url => {
      if (!currentUrls.has(url)) {
        urlsToRevoke.push(url);
      }
    });

    // Delay revocation to next tick to avoid race conditions with React rendering
    if (urlsToRevoke.length > 0) {
      const timeoutId = setTimeout(() => {
        urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
      }, 0);

      prevUrlsRef.current = currentUrls;

      return () => {
        clearTimeout(timeoutId);
        currentUrls.forEach(url => URL.revokeObjectURL(url));
      };
    }

    prevUrlsRef.current = currentUrls;

    // Cleanup function runs when component unmounts
    return () => {
      currentUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const createBaseFileInfo = (file: File) => ({
    id: `${file.name}-${file.lastModified}`,
    file,
    originalSrc: '',
    originalSize: file.size,
    originalWidth: 0,
    originalHeight: 0,
    trueOriginalWidth: 0,
    trueOriginalHeight: 0,
    croppedSrc: null,
    croppedWidth: 0,
    croppedHeight: 0,
    convertedSrc: null,
    convertedBlob: null,
    convertedSize: null,
  });

  const validateFileSize = (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        key: 'errorFileTooLarge' as const,
        params: { fileName: file.name, fileSize: formatBytes(file.size), maxSize: MAX_FILE_SIZE_MB }
      };
    }
    return null;
  };

  const loadImageDimensions = (file: File): Promise<{ originalSrc: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const originalSrc = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        resolve({
          originalSrc,
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(originalSrc);
        reject(new Error('Failed to load image'));
      };

      img.src = originalSrc;
    });
  };

  const processSelectedFile = async (file: File): Promise<ProcessedFile> => {
    const baseInfo = createBaseFileInfo(file);

    // Validate file size
    const sizeError = validateFileSize(file);
    if (sizeError) {
      return {
        ...baseInfo,
        status: 'error' as const,
        error: sizeError,
      };
    }

    // Load image dimensions
    try {
      const { originalSrc, width, height } = await loadImageDimensions(file);
      return {
        ...baseInfo,
        status: 'pending' as const,
        originalSrc,
        originalWidth: width,
        originalHeight: height,
        trueOriginalWidth: width,
        trueOriginalHeight: height,
        croppedWidth: width,
        croppedHeight: height,
        error: null,
      };
    } catch (error) {
      return {
        ...baseInfo,
        status: 'error' as const,
        error: { key: 'errorLoadImage' },
      };
    }
  };

  const handleFilesSelect = useCallback(async (selectedFiles: File[]) => {
    clearError();
    setAppStatus('loading');

    try {
      const validationResult = await validateFiles(selectedFiles);

      if (validationResult.errors.length > 0) {
        handleError('errorFileValidation' as TranslationKeys, {
          errors: validationResult.errors.join(', ')
        });
        setAppStatus('error');
        return;
      }

      if (validationResult.validFiles.length === 0) {
        handleError('errorNoValidFiles');
        setAppStatus('error');
        return;
      }

      const processedFiles = await Promise.all(
        validationResult.validFiles.map(processSelectedFile)
      );

      setFiles(processedFiles);
      setAppStatus('idle');
    } catch (error) {
      console.error('Error processing files:', error);
      handleError('errorLoadImage');
      setAppStatus('error');
    }
  }, [clearError, handleError]);

  const updateFileStatus = useCallback((fileId: string, status: ProcessedFile['status'], error?: { key: TranslationKeys; params?: Record<string, string | number> }) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? { ...file, status, error: error || null }
          : file
      )
    );
  }, []);

  const updateFileCrop = useCallback((fileId: string, croppedSrc: string, croppedWidth: number, croppedHeight: number) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? {
              ...file,
              croppedSrc,
              croppedWidth,
              croppedHeight,
              // Reset conversion when cropping changes
              convertedSrc: null,
              convertedBlob: null,
              convertedSize: null,
              error: null
            }
          : file
      )
    );
  }, []);

  const updateFileConversion = useCallback((fileId: string, convertedSrc: string, convertedBlob: Blob, convertedSize: number) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? {
              ...file,
              status: 'success' as const,
              convertedSrc,
              convertedBlob,
              convertedSize,
              error: null
            }
          : file
      )
    );
  }, []);

  const handleFileNameChange = useCallback((fileId: string, newName: string) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? { ...file, customName: newName }
          : file
      )
    );
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.id !== fileId);

      // If no files remain, reset the app state
      if (updatedFiles.length === 0) {
        setAppStatus('idle');
        setError(null);
      }

      return updatedFiles;
    });
  }, []);

  const resetConversionState = useCallback(() => {
    setFiles(prevFiles =>
      prevFiles.map(file => ({
        ...file,
        status: 'pending' as const,
        convertedSrc: null,
        convertedBlob: null,
        convertedSize: null,
        error: null
      }))
    );
    setAppStatus('idle');
    clearError();
  }, [clearError]);

  const resetState = useCallback(() => {
    setFiles([]);
    setAppStatus('idle');
    clearError();
  }, [clearError]);

  return {
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
    resetConversionState,
    resetState,
  };
};