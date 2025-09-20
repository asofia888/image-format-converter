import React from 'react';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface ImagePreviewProps {
  src: string | null;
  label: string;
  fileName?: string;
  fileSize?: number | null;
  originalSize?: number | null;
  dimensions?: { width: number; height: number; } | null;
  isLoading?: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, label, fileName, fileSize, originalSize, dimensions, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center space-y-3">
      <h3 className="text-lg font-semibold text-slate-300">{label}</h3>
      <div className="w-full h-64 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center text-slate-400">
            <Icon name="spinner" className="w-10 h-10 animate-spin text-purple-400" />
            <p className="mt-2">{t('convertingLabel')}</p>
          </div>
        ) : src ? (
          <img src={src} alt={label} className="object-contain w-full h-full" />
        ) : (
          <div className="text-slate-500 flex flex-col items-center">
             <Icon name="image" className="w-12 h-12" />
             <span className="mt-2 text-sm">{t('previewLabel')}</span>
          </div>
        )}
      </div>
       {fileName && 
        <div className="text-sm text-slate-400 w-full text-center space-y-1">
          <p className="truncate" title={fileName}>{fileName}</p>
          {fileSize != null && (
            <div className="flex items-center justify-center gap-2 text-xs">
                <span className="font-semibold">{formatBytes(fileSize)}</span>
                {dimensions && <span>{`(${dimensions.width}x${dimensions.height})`}</span>}
                {originalSize != null && fileSize < originalSize && (
                    <span className="text-green-400 font-semibold">
                        ({(((originalSize - fileSize) / originalSize) * 100).toFixed(0)}% smaller)
                    </span>
                )}
            </div>
          )}
        </div>
       }
    </div>
  );
};

export default ImagePreview;