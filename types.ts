export type TargetFormat = 'webp' | 'jpeg' | 'png';

export type AppStatus = 'idle' | 'loading' | 'success' | 'error' | 'converting';

export type FileStatus = 'pending' | 'converting' | 'success' | 'error';

export interface ProcessedFile {
  id: string;
  file: File;
  status: FileStatus;
  originalSrc: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  convertedSrc: string | null;
  convertedBlob: Blob | null;
  convertedSize: number | null;
  error: { key: string; params?: Record<string, string | number> } | null;
}
