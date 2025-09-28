import React, { useMemo, useCallback } from 'react';
import type { FileStatus } from '../types';
import FileUploader from './FileUploader';
import ImageComparator from './ImageComparator';
import ConversionControls from './ConversionControls';
import EditableFileName from './EditableFileName';
import Icon from './Icon';
import ProgressBar from './ui/ProgressBar';
import { useTranslation } from '../hooks/useTranslation';
import { useImageConverter } from '../hooks/useImageConverter';
import { formatBytes } from '../utils/formatBytes';
import { calculateCompressionRatio } from '../utils/percentage';

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
    cropConfig,
    presets,
    activePresetId,
    setResizeConfig,
    setCropConfig,
    handleFilesSelect,
    setTargetFormat,
    setQuality,
    handleConvert,
    resetState,
    handleDownloadZip,
    getConvertedFileName,
    handleSavePreset,
    handleApplyPreset,
    handleDeletePreset,
    handleFileNameChange,
    handleRemoveFile,
    handleApplyCrop,
  } = useImageConverter();

  const statusIconMap = useMemo(() => ({
    pending: { text: t('fileStatusPending'), icon: 'pending', class: 'text-slate-400 dark:text-slate-500' },
    converting: { text: t('fileStatusConverting'), icon: 'spinner', class: 'text-purple-500 dark:text-purple-400 animate-spin' },
    success: { text: t('fileStatusSuccess'), icon: 'success', class: 'text-green-500 dark:text-green-400' },
    error: { text: t('fileStatusError'), icon: 'error', class: 'text-red-500 dark:text-red-400' },
  }), [t]);

  const renderStatusIcon = useCallback((status: FileStatus) => {
    const currentStatus = statusIconMap[status];

    return (
      <div className="flex items-center justify-center" title={currentStatus.text}>
        <Icon name={currentStatus.icon} className={`w-5 h-5 ${currentStatus.class}`} />
        <span className="sr-only">{currentStatus.text}</span>
      </div>
    );
  }, [statusIconMap]);


  return (
    <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 w-full">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{liveRegionMessage}</div>
      {files.length === 0 ? (
        <FileUploader onFilesSelect={handleFilesSelect} status={appStatus} error={error ? t(error.key, error.params) : null} />
      ) : (
        <div>
          {/* Single File View */}
          {!isBatchMode && files[0] && (
             <ImageComparator
                beforeSrc={files[0].croppedSrc || files[0].originalSrc}
                afterSrc={files[0].convertedSrc}
                beforeLabel={t('originalLabel')}
                afterLabel={t('convertedLabel')}
                beforeFileName={files[0].file.name}
                afterFileName={files[0].convertedSrc ? getConvertedFileName(files[0].file, files[0].customName) : undefined}
                beforeFileSize={files[0].originalSize}
                afterFileSize={files[0].convertedSize}
                dimensions={{ width: files[0].trueOriginalWidth, height: files[0].trueOriginalHeight }}
                isLoading={files[0].status === 'converting'}
                error={files[0].error ? t(files[0].error.key, files[0].error.params) : null}
                customFileName={files[0].customName}
                onFileNameChange={(newName) => handleFileNameChange(files[0].id, newName)}
                onRemoveFile={() => handleRemoveFile(files[0].id)}
            />
          )}

          {/* Batch View */}
          {isBatchMode && (
            <div>
              {isConverting && (
                <div className="mb-4">
                  <div id="progress-label" className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {t('progressText', { convertedCount: convertedCount, totalFiles: files.length })}
                    </span>
                  </div>
                  <ProgressBar
                    value={convertedCount}
                    max={files.length}
                    size="md"
                    color="purple"
                  />
                </div>
              )}
              <div className="max-h-80 overflow-y-auto pr-2">
                  <ul className="space-y-3">
                      {files.map(file => (
                          <li key={file.id} className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg flex items-center gap-4 border border-slate-200 dark:border-slate-700">
                              {file.originalSrc ? (
                                <img src={file.originalSrc} alt={file.file.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-md flex-shrink-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <Icon name="error" className="w-6 h-6 text-red-500 dark:text-red-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                  <EditableFileName
                                    originalName={file.file.name}
                                    customName={file.customName}
                                    onNameChange={(newName) => handleFileNameChange(file.id, newName)}
                                    className="mb-1"
                                  />
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">{formatBytes(file.originalSize)}{file.trueOriginalWidth > 0 && ` (${file.trueOriginalWidth}x${file.trueOriginalHeight})`}</span>
                                    {file.status === 'success' && file.convertedSize != null && (
                                        <>
                                            <Icon name="arrowRightSmall" className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500"/>
                                            <span className="text-slate-600 dark:text-slate-300 font-medium">{formatBytes(file.convertedSize)}</span>
                                            {file.convertedSize < file.originalSize && (
                                                <span className="text-green-500 dark:text-green-400 font-semibold">
                                                    ({calculateCompressionRatio(file.originalSize, file.convertedSize)}% smaller)
                                                </span>
                                            )}
                                        </>
                                    )}
                                  </div>
                                  {file.error && (
                                    <p className="text-xs text-red-500 dark:text-red-400 truncate" title={t(file.error.key, file.error.params)}>{t(file.error.key, file.error.params)}</p>
                                  )}
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-2">
                                  {renderStatusIcon(file.status)}
                                  <button
                                    onClick={() => handleRemoveFile(file.id)}
                                    className="p-1 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title={t('removeFile')}
                                  >
                                    <Icon name="trash" className="w-4 h-4" />
                                  </button>
                              </div>
                          </li>
                      ))}
                  </ul>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
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
                convertedFileName={!isBatchMode && files[0] ? getConvertedFileName(files[0].file, files[0].customName) : ''}
                originalImageSrc={!isBatchMode && files[0] ? files[0].originalSrc : null}
                resizeConfig={resizeConfig}
                setResizeConfig={setResizeConfig}
                cropConfig={cropConfig}
                setCropConfig={setCropConfig}
                originalDimensions={!isBatchMode && files[0] ? { width: files[0].trueOriginalWidth, height: files[0].trueOriginalHeight } : null}
                onApplyCrop={handleApplyCrop}
                presets={presets}
                activePresetId={activePresetId}
                onSavePreset={handleSavePreset}
                onApplyPreset={handleApplyPreset}
                onDeletePreset={handleDeletePreset}
            />
          </div>
          {appStatus === 'error' && error && (
            <div className="mt-4 text-center bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center justify-center">
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
