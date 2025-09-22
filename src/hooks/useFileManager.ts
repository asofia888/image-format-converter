import { useState, useCallback, useEffect } from 'react';
import type { ProcessedFile, AppStatus } from '../types';
import { type TranslationKeys } from './useTranslation';
import { validateFiles, MAX_FILE_SIZE_MB } from '../utils/fileValidation';
import { formatBytes } from '../utils/formatBytes';
import { useErrorHandler } from './useErrorHandler';

export const useFileManager = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const { error, setError, handleError, clearError } = useErrorHandler();

  // Effect to clean up object URLs to prevent memory leaks
  useEffect(() => {
    const objectUrls = files.flatMap(f => [f.originalSrc, f.convertedSrc]).filter((url): url is string => !!(url && url.startsWith('blob:')));

    // Cleanup function runs when component unmounts or `files` state changes
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

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
        status: 'error' as const,
        error: {
          key: 'errorFileTooLarge',
          params: { fileName: file.name, fileSize: formatBytes(file.size), maxSize: MAX_FILE_SIZE_MB }
        },
      };
    }

    try {
      const originalSrc = URL.createObjectURL(file);
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          resolve({
            ...baseInfo,
            status: 'pending' as const,
            originalSrc,
            originalWidth: img.width,
            originalHeight: img.height,
            trueOriginalWidth: img.width,
            trueOriginalHeight: img.height,
            error: null,
          });
        };

        img.onerror = () => {
          resolve({
            ...baseInfo,
            status: 'error' as const,
            error: { key: 'errorLoadImage' },
          });
        };

        img.src = originalSrc;
      });
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
    updateFileConversion,
    handleFileNameChange,
    handleRemoveFile,
    resetState,
  };
};