import React, { useMemo } from 'react';
import type { TargetFormat, Preset, ResizeConfig, CropConfig } from '../types';
import PresetControls from './PresetControls';
import FormatQualityControls from './FormatQualityControls';
import ResizeControls from './ResizeControls';
import CropControls from './CropControls';
import ActionButtons from './ActionButtons';

interface ConversionControlsProps {
  originalFileType: string;
  targetFormat: TargetFormat;
  setTargetFormat: (format: TargetFormat) => void;
  quality: number;
  setQuality: (quality: number) => void;
  onConvert: () => void;
  onClear: () => void;
  isConverting: boolean;
  isDownloadReady: boolean;
  isBatchMode: boolean;
  onDownloadZip: () => void;
  onDownloadSingle: () => void;
  originalImageSrc: string | null;
  resizeConfig: ResizeConfig;
  setResizeConfig: React.Dispatch<React.SetStateAction<ResizeConfig>>;
  cropConfig: CropConfig;
  setCropConfig: React.Dispatch<React.SetStateAction<CropConfig>>;
  originalDimensions: { width: number; height: number } | null;
  onApplyCrop: () => void;
  presets: Preset[];
  activePresetId: string;
  onSavePreset: (name: string) => boolean;
  onApplyPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
}

const ConversionControls: React.FC<ConversionControlsProps> = ({
  originalFileType: _originalFileType,
  targetFormat,
  setTargetFormat,
  quality,
  setQuality,
  onConvert,
  onClear,
  isConverting,
  isDownloadReady,
  isBatchMode,
  onDownloadZip,
  onDownloadSingle,
  originalImageSrc,
  resizeConfig,
  setResizeConfig,
  cropConfig,
  setCropConfig,
  originalDimensions,
  onApplyCrop,
  presets,
  activePresetId,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
}) => {
  const hasBeenConverted = useMemo(() => isDownloadReady, [isDownloadReady]);

  return (
    <div className="space-y-6">
      {/* Presets Section */}
      <PresetControls
        presets={presets}
        activePresetId={activePresetId}
        onSavePreset={onSavePreset}
        onApplyPreset={onApplyPreset}
        onDeletePreset={onDeletePreset}
      />

      {/* Format and Quality Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <FormatQualityControls
          targetFormat={targetFormat}
          setTargetFormat={setTargetFormat}
          quality={quality}
          setQuality={setQuality}
        />
      </div>

      {/* Resize Controls */}
      <ResizeControls
        resizeConfig={resizeConfig}
        setResizeConfig={setResizeConfig}
        originalDimensions={originalDimensions}
      />

      {/* Crop Controls */}
      <CropControls
        cropConfig={cropConfig}
        setCropConfig={setCropConfig}
        originalDimensions={originalDimensions}
        imageSrc={originalImageSrc}
        onApplyCrop={onApplyCrop}
        applyCropDisabled={isConverting}
      />

      {/* Action Buttons */}
      <ActionButtons
        onClear={onClear}
        onConvert={onConvert}
        isConverting={isConverting}
        hasBeenConverted={hasBeenConverted}
        isBatchMode={isBatchMode}
        onDownloadZip={onDownloadZip}
        onDownloadSingle={onDownloadSingle}
      />
    </div>
  );
};

export default ConversionControls;