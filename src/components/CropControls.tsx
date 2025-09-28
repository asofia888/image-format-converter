import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { CropConfig } from '../types';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface CropControlsProps {
  cropConfig: CropConfig;
  setCropConfig: React.Dispatch<React.SetStateAction<CropConfig>>;
  originalDimensions: { width: number; height: number } | null;
  imageSrc: string | null;
  onApplyCrop?: () => void;
  applyCropDisabled?: boolean;
}

interface CropSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDragging: boolean;
}

interface PositionDrag {
  isPositionDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
  originalCropX: number;
  originalCropY: number;
}

const CropControls: React.FC<CropControlsProps> = ({
  cropConfig,
  setCropConfig,
  originalDimensions,
  imageSrc,
  onApplyCrop,
  applyCropDisabled = false,
}) => {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<CropSelection>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isDragging: false,
  });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [positionDrag, setPositionDrag] = useState<PositionDrag>({
    isPositionDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    originalCropX: 0,
    originalCropY: 0,
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleCrop = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setCropConfig(prev => ({ ...prev, enabled }));
    if (!enabled) {
      // Reset crop selection when disabled
      setCropConfig(prev => ({
        ...prev,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }));
      setSelection({
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        isDragging: false,
      });
    }
  }, [setCropConfig]);

  const handleResetCrop = useCallback(() => {
    setCropConfig(prev => ({
      ...prev,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }));
    setSelection({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      isDragging: false,
    });
  }, [setCropConfig]);

  const hasCropData = cropConfig.width > 0 && cropConfig.height > 0;

  // Helper function to constrain selection to aspect ratio
  const constrainToAspectRatio = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    if (!cropConfig.constrainAspectRatio || !cropConfig.aspectRatio || !imageRef.current) {
      return { endX, endY };
    }

    const targetAspectRatio = cropConfig.aspectRatio;
    let width = Math.abs(endX - startX);
    let height = Math.abs(endY - startY);

    // Calculate constrained dimensions based on aspect ratio
    const currentAspectRatio = width / height;

    if (currentAspectRatio > targetAspectRatio) {
      // Too wide, constrain width
      width = height * targetAspectRatio;
    } else {
      // Too tall, constrain height
      height = width / targetAspectRatio;
    }

    // Calculate new end coordinates while maintaining direction
    const newEndX = startX + (endX >= startX ? width : -width);
    const newEndY = startY + (endY >= startY ? height : -height);

    // Ensure we don't go outside image bounds
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;

    const clampedEndX = Math.max(0, Math.min(newEndX, imageWidth));
    const clampedEndY = Math.max(0, Math.min(newEndY, imageHeight));

    return { endX: clampedEndX, endY: clampedEndY };
  }, [cropConfig.constrainAspectRatio, cropConfig.aspectRatio]);

  // Handle width slider change
  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!originalDimensions) return;

    const newWidth = Number(e.target.value);
    let newHeight = cropConfig.height;

    // If aspect ratio is constrained, calculate new height
    if (cropConfig.constrainAspectRatio && cropConfig.aspectRatio) {
      newHeight = newWidth / cropConfig.aspectRatio;
    }

    // Ensure the crop area doesn't exceed image bounds
    const maxX = Math.min(cropConfig.x, originalDimensions.width - newWidth);
    const maxY = Math.min(cropConfig.y, originalDimensions.height - newHeight);

    setCropConfig(prev => ({
      ...prev,
      width: newWidth,
      height: newHeight,
      x: Math.max(0, maxX),
      y: Math.max(0, maxY),
    }));
  }, [cropConfig, originalDimensions, setCropConfig]);

  // Handle height slider change
  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!originalDimensions || cropConfig.constrainAspectRatio) return;

    const newHeight = Number(e.target.value);

    // Ensure the crop area doesn't exceed image bounds
    const maxY = Math.min(cropConfig.y, originalDimensions.height - newHeight);

    setCropConfig(prev => ({
      ...prev,
      height: newHeight,
      y: Math.max(0, maxY),
    }));
  }, [cropConfig, originalDimensions, setCropConfig]);

  // Convert screen coordinates to image coordinates
  const getImageCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!imageRef.current || !containerRef.current) return { x: 0, y: 0 };

    const imageRect = imageRef.current.getBoundingClientRect();

    const x = clientX - imageRect.left;
    const y = clientY - imageRect.top;

    // Convert to actual image coordinates
    const scaleX = imageRef.current.naturalWidth / imageRect.width;
    const scaleY = imageRef.current.naturalHeight / imageRect.height;

    return {
      x: Math.max(0, Math.min(x * scaleX, imageRef.current.naturalWidth)),
      y: Math.max(0, Math.min(y * scaleY, imageRef.current.naturalHeight))
    };
  }, []);

  // Handle double-click on crop frame to enable position adjustment
  const handleCropDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasCropData || !imageRef.current) return;

    const coords = getImageCoordinates(e.clientX, e.clientY);

    setPositionDrag({
      isPositionDragging: true,
      lastMouseX: coords.x,
      lastMouseY: coords.y,
      originalCropX: cropConfig.x,
      originalCropY: cropConfig.y,
    });
  }, [hasCropData, getImageCoordinates, cropConfig.x, cropConfig.y]);

  // Handle position dragging
  const handlePositionDrag = useCallback((e: React.MouseEvent) => {
    if (!positionDrag.isPositionDragging || !imageRef.current || !originalDimensions) return;

    const coords = getImageCoordinates(e.clientX, e.clientY);
    const deltaX = coords.x - positionDrag.lastMouseX;
    const deltaY = coords.y - positionDrag.lastMouseY;

    const newX = positionDrag.originalCropX + deltaX;
    const newY = positionDrag.originalCropY + deltaY;

    // Ensure crop stays within image bounds
    const constrainedX = Math.max(0, Math.min(newX, originalDimensions.width - cropConfig.width));
    const constrainedY = Math.max(0, Math.min(newY, originalDimensions.height - cropConfig.height));

    setCropConfig(prev => ({
      ...prev,
      x: constrainedX,
      y: constrainedY,
    }));
  }, [positionDrag, getImageCoordinates, originalDimensions, cropConfig.width, cropConfig.height, setCropConfig]);

  // Handle position drag end
  const handlePositionDragEnd = useCallback(() => {
    setPositionDrag(prev => ({ ...prev, isPositionDragging: false }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!cropConfig.enabled || !imageRef.current) return;

    const coords = getImageCoordinates(e.clientX, e.clientY);
    setSelection({
      startX: coords.x,
      startY: coords.y,
      endX: coords.x,
      endY: coords.y,
      isDragging: true,
    });
  }, [cropConfig.enabled, getImageCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selection.isDragging || !imageRef.current) return;

    const coords = getImageCoordinates(e.clientX, e.clientY);
    const { endX, endY } = constrainToAspectRatio(selection.startX, selection.startY, coords.x, coords.y);

    setSelection(prev => ({
      ...prev,
      endX,
      endY,
    }));
  }, [selection.isDragging, selection.startX, selection.startY, getImageCoordinates, constrainToAspectRatio]);

  const handleMouseUp = useCallback(() => {
    if (!selection.isDragging) return;

    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    if (width > 10 && height > 10) { // Minimum size threshold
      setCropConfig(prev => ({
        ...prev,
        x,
        y,
        width,
        height,
      }));
    }

    setSelection(prev => ({ ...prev, isDragging: false }));
  }, [selection, setCropConfig]);

  // Effect to handle global mouse events
  useEffect(() => {
    if (!selection.isDragging && !positionDrag.isPositionDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!imageRef.current || !containerRef.current) return;

      if (selection.isDragging) {
        // Handle crop selection dragging
        const coords = getImageCoordinates(e.clientX, e.clientY);
        const { endX, endY } = constrainToAspectRatio(selection.startX, selection.startY, coords.x, coords.y);
        setSelection(prev => ({
          ...prev,
          endX,
          endY,
        }));
      } else if (positionDrag.isPositionDragging) {
        // Handle position dragging
        handlePositionDrag(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      if (selection.isDragging) {
        setSelection(prev => ({ ...prev, isDragging: false }));
      } else if (positionDrag.isPositionDragging) {
        handlePositionDragEnd();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    selection.isDragging,
    selection.startX,
    selection.startY,
    positionDrag.isPositionDragging,
    getImageCoordinates,
    constrainToAspectRatio,
    handlePositionDrag,
    handlePositionDragEnd
  ]);

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Icon name="crop" className="w-5 h-5" />
          {t('cropOptionsTitle')}
        </h3>
        <label htmlFor="enable-crop" className="flex items-center cursor-pointer">
          <span className="text-sm text-slate-600 dark:text-slate-400 mr-3">{t('enableCropLabel')}</span>
          <div className="relative">
            <input
              type="checkbox"
              id="enable-crop"
              className="sr-only"
              checked={cropConfig.enabled}
              onChange={handleToggleCrop}
            />
            <div className="block bg-slate-300 dark:bg-slate-600 w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white dark:bg-slate-900 w-6 h-6 rounded-full transition-transform ${cropConfig.enabled ? 'translate-x-6 bg-purple-500 dark:bg-purple-400' : ''}`}></div>
          </div>
        </label>
      </div>

      <div className={`transition-opacity ${cropConfig.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {imageSrc && originalDimensions ? (
          <div className="space-y-4">
            {/* Interactive Image Crop Area */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('cropInstructionLabel')}
                  </span>
                  {cropConfig.constrainAspectRatio && cropConfig.aspectRatio && (
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      アスペクト比: {cropConfig.aspectRatio === 1.0 ? '1:1 (正方形)' :
                        cropConfig.aspectRatio > 1 ? `${cropConfig.aspectRatio.toFixed(2)}:1 (横長)` :
                        `1:${(1/cropConfig.aspectRatio).toFixed(2)} (縦長)`}
                    </div>
                  )}
                </div>
                {hasCropData && (
                  <button
                    onClick={handleResetCrop}
                    disabled={!cropConfig.enabled}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {t('resetCropButton')}
                  </button>
                )}
              </div>

              {/* Image Container with Crop Selection */}
              <div
                ref={containerRef}
                className="relative bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden"
                style={{ aspectRatio: `${originalDimensions.width} / ${originalDimensions.height}`, maxHeight: '400px' }}
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop selection"
                  className={`w-full h-full object-contain ${cropConfig.enabled ? 'cursor-crosshair' : ''}`}
                  onLoad={() => setImageLoaded(true)}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  draggable={false}
                />

                {/* Crop Selection Overlay */}
                {cropConfig.enabled && imageLoaded && imageRef.current && (hasCropData || selection.isDragging) && (
                  <>
                    {(() => {
                      const imageRect = imageRef.current?.getBoundingClientRect();
                      const containerRect = containerRef.current?.getBoundingClientRect();

                      if (!imageRect || !containerRect) return null;

                      // Use crop config if available, otherwise use current selection
                      const displayX = hasCropData ? cropConfig.x : Math.min(selection.startX, selection.endX);
                      const displayY = hasCropData ? cropConfig.y : Math.min(selection.startY, selection.endY);
                      const displayWidth = hasCropData ? cropConfig.width : Math.abs(selection.endX - selection.startX);
                      const displayHeight = hasCropData ? cropConfig.height : Math.abs(selection.endY - selection.startY);

                      // Convert image coordinates to display coordinates
                      const scaleX = imageRect.width / imageRef.current.naturalWidth;
                      const scaleY = imageRect.height / imageRef.current.naturalHeight;

                      const left = displayX * scaleX;
                      const top = displayY * scaleY;
                      const width = displayWidth * scaleX;
                      const height = displayHeight * scaleY;

                      return (
                        <div
                          className={`absolute border-2 transition-all duration-200 ${
                            positionDrag.isPositionDragging
                              ? 'border-blue-500 bg-blue-200/30 dark:bg-blue-400/30 cursor-move'
                              : 'border-purple-500 bg-purple-200/20 dark:bg-purple-400/20 cursor-pointer'
                          }`}
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            pointerEvents: 'auto',
                          }}
                          onDoubleClick={handleCropDoubleClick}
                          onMouseMove={positionDrag.isPositionDragging ? handlePositionDrag : undefined}
                          onMouseUp={positionDrag.isPositionDragging ? handlePositionDragEnd : undefined}
                        >
                          {/* Corner indicators */}
                          <div className={`absolute -top-1 -left-1 w-2 h-2 rounded-full ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div className={`absolute -bottom-1 -left-1 w-2 h-2 rounded-full ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>

                          {/* Position adjustment hint */}
                          {!positionDrag.isPositionDragging && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                ダブルクリックで移動
                              </div>
                            </div>
                          )}

                          {/* Position dragging indicator */}
                          {positionDrag.isPositionDragging && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                位置調整中...
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Crop Information */}
              {hasCropData && (
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Position: ({Math.round(cropConfig.x)}, {Math.round(cropConfig.y)})</div>
                  <div>Size: {Math.round(cropConfig.width)} × {Math.round(cropConfig.height)}px</div>
                  <div className="text-purple-600 dark:text-purple-400">
                    ヒント: 枠をダブルクリック＆ドラッグで位置調整
                  </div>
                </div>
              )}
            </div>

            {/* Crop Size Adjustment Sliders */}
            {hasCropData && originalDimensions && (
              <div className="mt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">枠のサイズ調整</h4>

                {/* Width Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">横幅</label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round(cropConfig.width)}px</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={originalDimensions.width}
                    value={cropConfig.width}
                    onChange={handleWidthChange}
                    disabled={!cropConfig.enabled}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>

                {/* Height Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-600 dark:text-slate-400">縦幅</label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{Math.round(cropConfig.height)}px</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={originalDimensions.height}
                    value={cropConfig.height}
                    onChange={handleHeightChange}
                    disabled={!cropConfig.enabled || cropConfig.constrainAspectRatio}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                  />
                  {cropConfig.constrainAspectRatio && (
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      アスペクト比固定のため、横幅に連動します
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Apply Crop Button */}
            {hasCropData && onApplyCrop && (
              <button
                onClick={onApplyCrop}
                disabled={applyCropDisabled || !cropConfig.enabled}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-purple-500
                  ${!applyCropDisabled && cropConfig.enabled
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                <Icon name="crop" className="w-4 h-4" />
                {applyCropDisabled ? 'Processing...' : t('applyCropButton')}
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            {t('cropNoImageLabel')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CropControls;