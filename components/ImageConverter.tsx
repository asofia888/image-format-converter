import React from 'react';
import type { FileStatus } from '../types';
import FileUploader from './FileUploader';
import ImagePreview from './ImagePreview';
import ConversionControls from './ConversionControls';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';
import { useImageConverter } from '../hooks/useImageConverter';

const ImageConverter: React.FC = () => {
  const { t } = useTranslation();
  const {
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
  } = useImageConverter();

  const formatBytes = (bytes: number, decimals = 2) => {
      if (!+bytes) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const renderStatusIcon = (status: FileStatus) => {
    const statusMap = {
      pending: { text: t('fileStatusPending'), icon: 'pending', class: 'text-slate-500' },
      converting: { text: t('fileStatusConverting'), icon: 'spinner', class: 'text-purple-400 animate-spin' },
      success: { text: t('fileStatusSuccess'), icon: 'success', class: 'text-green-400' },
      error: { text: t('fileStatusError'), icon: 'error', class: 'text-red-400' },
    };
    const currentStatus = statusMap[status];

    return (
      <div className="flex items-center justify-center" title={currentStatus.text}>
        <Icon name={currentStatus.icon} className={`w-5 h-5 ${currentStatus.class}`} />
        <span className="sr-only">{currentStatus.text}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 w-full">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{liveRegionMessage}</div>
      {files.length === 0 ? (
        <FileUploader onFilesSelect={handleFilesSelect} status={appStatus} error={error ? t(error.key, error.params) : null} />
      ) : (
        <div>
          {/* Single File View */}
          {!isBatchMode && files[0] && (
            <div className="grid md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
              <ImagePreview 
                src={files[0].originalSrc} 
                label={t('originalLabel')} 
                fileName={files[0].file.name}
                fileSize={files[0].originalSize}
                dimensions={{ width: files[0].originalWidth, height: files[0].originalHeight }}
              />
              
              <div className="flex flex-col items-center justify-center text-slate-400 my-4 md:my-0">
                  <Icon name="arrowRight" className="w-12 h-12 text-purple-400 hidden lg:block" />
                  <Icon name="arrowDown" className="w-12 h-12 text-purple-400 lg:hidden" />
              </div>

              <ImagePreview 
                  src={files[0].convertedSrc} 
                  label={t('convertedLabel')}
                  isLoading={files[0].status === 'converting'}
                  fileName={files[0].convertedSrc ? getConvertedFileName(files[0].file) : undefined}
                  fileSize={files[0].convertedSize}
                  originalSize={files[0].originalSize}
              />
            </div>
          )}

          {/* Batch View */}
          {isBatchMode && (
            <div>
              {isConverting && (
                <div className="mb-4">
                  <div id="progress-label" className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-300">
                      {t('progressText', { convertedCount: convertedCount, totalFiles: files.length })}
                    </span>
                  </div>
                  <div 
                    className="w-full bg-slate-700 rounded-full h-2.5"
                    role="progressbar"
                    aria-labelledby="progress-label"
                    aria-valuenow={files.length > 0 ? Math.round((convertedCount / files.length) * 100) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div 
                      className="bg-purple-500 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${files.length > 0 ? (convertedCount / files.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="max-h-80 overflow-y-auto pr-2">
                  <ul className="space-y-3">
                      {files.map(file => (
                          <li key={file.id} className="bg-slate-900/50 p-3 rounded-lg flex items-center gap-4 border border-slate-700">
                              <img src={file.originalSrc} alt={file.file.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-200 truncate" title={file.file.name}>{file.file.name}</p>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="text-slate-400">{formatBytes(file.originalSize)}</span>
                                    {file.status === 'success' && file.convertedSize != null && (
                                        <>
                                            <Icon name="arrowRight" className="w-2.5 h-2.5 text-slate-500"/>
                                            <span className="text-slate-300 font-medium">{formatBytes(file.convertedSize)}</span>
                                            {file.convertedSize < file.originalSize && (
                                                <span className="text-green-400 font-semibold">
                                                    ({(((file.originalSize - file.convertedSize) / file.originalSize) * 100).toFixed(0)}% smaller)
                                                </span>
                                            )}
                                        </>
                                    )}
                                  </div>
                                  <p className="text-xs text-red-400 truncate">{file.error ? t(file.error.key, file.error.params) : ''}</p>
                              </div>
                              <div className="flex-shrink-0">
                                  {renderStatusIcon(file.status)}
                              </div>
                          </li>
                      ))}
                  </ul>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-slate-700 pt-6">
            <ConversionControls
                originalFileType={files.length > 0 ? files[0].file.type : ''}
                targetFormat={targetFormat}
                setTargetFormat={setTargetFormat}
                quality={quality}
                setQuality={setQuality}
                onConvert={handleConvert}
                onClear={resetState}
                isConverting={isConverting}
                isDownloadReady={isDownloadReady}
                isBatchMode={isBatchMode}
                onDownloadZip={handleDownloadZip}
                convertedImageSrc={!isBatchMode && files[0] ? files[0].convertedSrc : null}
                convertedFileName={!isBatchMode && files[0] ? getConvertedFileName(files[0].file) : ''}
                resizeConfig={resizeConfig}
                setResizeConfig={setResizeConfig}
                originalDimensions={!isBatchMode && files[0] ? { width: files[0].originalWidth, height: files[0].originalHeight } : null}
            />
          </div>
          {appStatus === 'error' && error && (
            <div className="mt-4 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center justify-center">
                <Icon name="error" className="w-5 h-5 mr-2" />
                <span>{t(error.key, error.params)}</span>
            </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ImageConverter;