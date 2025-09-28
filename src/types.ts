// FIX: Import TranslationKeys to use for error messages.
import type { TranslationKeys } from './hooks/useTranslation';

export type TargetFormat = 'webp' | 'jpeg' | 'png';

export type AppStatus = 'idle' | 'loading' | 'success' | 'error' | 'converting';

export type FileStatus = 'pending' | 'converting' | 'success' | 'error';

export interface ResizeConfig {
  enabled: boolean;
  width: string;
  height: string;
  unit: 'px' | '%';
  maintainAspectRatio: boolean;
}

export interface CropConfig {
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number; // Fixed aspect ratio (width/height) when set
  constrainAspectRatio: boolean; // Whether to maintain aspect ratio during selection
}

export interface Preset {
  id: string;
  name: string;
  settings: {
    targetFormat: TargetFormat;
    quality: number;
    resizeConfig: ResizeConfig;
    cropConfig: CropConfig;
  };
}

export interface ProcessedFile {
  id: string;
  file: File;
  status: FileStatus;
  originalSrc: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  trueOriginalWidth: number;
  trueOriginalHeight: number;
  croppedSrc: string | null; // Source after cropping but before conversion
  croppedWidth: number;
  croppedHeight: number;
  convertedSrc: string | null;
  convertedBlob: Blob | null;
  convertedSize: number | null;
  customName?: string; // User-editable file name (without extension)
  // FIX: Use TranslationKeys for the error key to ensure it's a valid translation key.
  error: { key: TranslationKeys; params?: Record<string, string | number> } | null;
}
