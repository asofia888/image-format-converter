import React, { useState, useCallback, useEffect } from 'react';
import type { CropConfig } from '../types';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Declare react-easy-crop types
declare global {
  interface Window {
    Cropper: any;
  }
}

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  originalDimensions: { width: number; height: number };
  cropConfig: CropConfig;
  onCropChange: (newCrop: CropConfig) => void;
}

const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  cropConfig,
  onCropChange,
}) => {
  const { t } = useTranslation();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [Cropper, setCropper] = useState<any>(null);

  const modalRef = useFocusTrap(onClose);

  // Load react-easy-crop dynamically
  useEffect(() => {
    if (isOpen && !Cropper && window.Cropper) {
      setCropper(window.Cropper);
    }
  }, [isOpen, Cropper]);

  // Initialize crop from config
  useEffect(() => {
    if (isOpen && cropConfig.width > 0 && cropConfig.height > 0) {
      setCrop({ x: cropConfig.x, y: cropConfig.y });
    }
  }, [isOpen, cropConfig]);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = useCallback(() => {
    if (croppedAreaPixels) {
      onCropChange({
        enabled: true,
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
        constrainAspectRatio: false,
      });
    }
    onClose();
  }, [croppedAreaPixels, onCropChange, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="crop" className="w-6 h-6" />
            {t('cropModalTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex-1 relative bg-slate-900 min-h-[400px]">
          {Cropper ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={undefined} // Free aspect ratio
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-white text-center">
                <Icon name="spinner" className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Loading crop tool...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Zoom:
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[3rem]">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {t('cancelButton')}
            </button>
            <button
              onClick={handleApplyCrop}
              disabled={!croppedAreaPixels}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {t('applyCropButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropModal;