import { useState, useCallback } from 'react';
import type { Area } from 'react-easy-crop';
import type { ProcessedFile, ResizeConfig } from '../types';
import type { TranslationKeys } from './useTranslation';
import { getCroppedImg } from '../utils/cropImage';

interface UseCropResizeProps {
  files: ProcessedFile[];
  updateFileStatus: (fileId: string, status: ProcessedFile['status'], error?: { key: TranslationKeys; params?: Record<string, string | number> }) => void;
  setResizeConfig: (config: ResizeConfig | ((prev: ResizeConfig) => ResizeConfig)) => void;
  setError: (error: { key: TranslationKeys; params?: Record<string, string | number> } | null) => void;
}

export const useCropResize = ({
  files,
  updateFileStatus,
  setResizeConfig,
  setError
}: UseCropResizeProps) => {
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handleOpenCropper = useCallback(() => {
    console.log('DEBUG: handleOpenCropper called, setting isCropperOpen to true');
    setIsCropperOpen(true);
  }, []);

  const handleCloseCropper = useCallback(() => {
    setIsCropperOpen(false);
  }, []);

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

  return {
    isCropperOpen,
    handleOpenCropper,
    handleCloseCropper,
    handleApplyCrop,
    handleResetCrop
  };
};