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

  const [showGrid, setShowGrid] = useState(true);

  const hasCropData = cropConfig.width > 0 && cropConfig.height > 0;

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

  // Aspect ratio preset handlers
  const handleAspectRatioPreset = useCallback((ratio: number | null) => {
    if (ratio === null) {
      // Free aspect ratio
      setCropConfig(prev => ({
        ...prev,
        constrainAspectRatio: false,
        aspectRatio: undefined,
      }));
    } else {
      setCropConfig(prev => ({
        ...prev,
        constrainAspectRatio: true,
        aspectRatio: ratio,
      }));

      // Adjust existing crop to match new ratio if crop exists
      if (cropConfig.width > 0 && cropConfig.height > 0 && originalDimensions) {
        const currentWidth = cropConfig.width;
        const newHeight = currentWidth / ratio;

        // Ensure new dimensions fit within image bounds
        if (newHeight <= originalDimensions.height - cropConfig.y) {
          setCropConfig(prev => ({
            ...prev,
            height: newHeight,
          }));
        } else {
          // Adjust width to fit
          const maxHeight = originalDimensions.height - cropConfig.y;
          const newWidth = maxHeight * ratio;
          setCropConfig(prev => ({
            ...prev,
            width: newWidth,
            height: maxHeight,
          }));
        }
      }
    }
  }, [setCropConfig, cropConfig, originalDimensions]);

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

  // Handle single click on crop frame to enable position adjustment (changed from double-click)
  const handleCropClick = useCallback((e: React.MouseEvent) => {
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
            {/* Aspect Ratio Presets */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">アスペクト比</h4>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  {showGrid ? 'グリッド非表示' : 'グリッド表示'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAspectRatioPreset(null)}
                  disabled={!cropConfig.enabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !cropConfig.constrainAspectRatio
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  自由
                </button>
                <button
                  onClick={() => handleAspectRatioPreset(1)}
                  disabled={!cropConfig.enabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cropConfig.constrainAspectRatio && cropConfig.aspectRatio === 1
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  1:1 正方形
                </button>
                <button
                  onClick={() => handleAspectRatioPreset(16 / 9)}
                  disabled={!cropConfig.enabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cropConfig.constrainAspectRatio && Math.abs((cropConfig.aspectRatio || 0) - 16/9) < 0.01
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  16:9 ワイド
                </button>
                <button
                  onClick={() => handleAspectRatioPreset(4 / 3)}
                  disabled={!cropConfig.enabled}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cropConfig.constrainAspectRatio && Math.abs((cropConfig.aspectRatio || 0) - 4/3) < 0.01
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  4:3 標準
                </button>
              </div>
            </div>

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
                        Math.abs(cropConfig.aspectRatio - 16/9) < 0.01 ? '16:9 (ワイド)' :
                        Math.abs(cropConfig.aspectRatio - 4/3) < 0.01 ? '4:3 (標準)' :
                        cropConfig.aspectRatio > 1 ? `${cropConfig.aspectRatio.toFixed(2)}:1` :
                        `1:${(1/cropConfig.aspectRatio).toFixed(2)}`}
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
                          className={`group absolute border-3 transition-all duration-200 ${
                            positionDrag.isPositionDragging
                              ? 'border-blue-500 bg-blue-200/30 dark:bg-blue-400/30 cursor-move'
                              : 'border-purple-500 bg-purple-200/20 dark:bg-purple-400/20 cursor-move hover:bg-purple-300/30 dark:hover:bg-purple-500/30'
                          }`}
                          style={{
                            left: `${left}px`,
                            top: `${top}px`,
                            width: `${width}px`,
                            height: `${height}px`,
                            pointerEvents: 'auto',
                            borderWidth: '3px',
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                          }}
                          onMouseDown={handleCropClick}
                          onMouseMove={positionDrag.isPositionDragging ? handlePositionDrag : undefined}
                          onMouseUp={positionDrag.isPositionDragging ? handlePositionDragEnd : undefined}
                        >
                          {/* Grid Overlay (Rule of Thirds) */}
                          {showGrid && (
                            <>
                              {/* Vertical lines */}
                              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/50"></div>
                              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/50"></div>
                              {/* Horizontal lines */}
                              <div className="absolute left-0 right-0 top-1/3 h-px bg-white/50"></div>
                              <div className="absolute left-0 right-0 top-2/3 h-px bg-white/50"></div>
                            </>
                          )}

                          {/* Corner handles - larger and more visible */}
                          <div className={`absolute -top-2 -left-2 w-4 h-4 rounded-sm border-2 border-white ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } shadow-lg`}></div>
                          <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-sm border-2 border-white ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } shadow-lg`}></div>
                          <div className={`absolute -bottom-2 -left-2 w-4 h-4 rounded-sm border-2 border-white ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } shadow-lg`}></div>
                          <div className={`absolute -bottom-2 -right-2 w-4 h-4 rounded-sm border-2 border-white ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } shadow-lg`}></div>

                          {/* Edge handles - for resizing */}
                          <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-sm ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } opacity-75`}></div>
                          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-sm ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } opacity-75`}></div>
                          <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 rounded-sm ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } opacity-75`}></div>
                          <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 rounded-sm ${
                            positionDrag.isPositionDragging ? 'bg-blue-500' : 'bg-purple-500'
                          } opacity-75`}></div>

                          {/* Dimension display tooltip */}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
                            {Math.round(displayWidth)} × {Math.round(displayHeight)} px
                          </div>

                          {/* Position adjustment hint */}
                          {!positionDrag.isPositionDragging && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-purple-600/90 dark:bg-purple-500/90 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                クリック＆ドラッグで移動
                              </div>
                            </div>
                          )}

                          {/* Position dragging indicator */}
                          {positionDrag.isPositionDragging && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-blue-600/90 dark:bg-blue-500/90 text-white text-xs px-3 py-1.5 rounded-lg pointer-events-none shadow-lg">
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
                <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">位置:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      X: {Math.round(cropConfig.x)}px, Y: {Math.round(cropConfig.y)}px
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">サイズ:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {Math.round(cropConfig.width)} × {Math.round(cropConfig.height)}px
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-purple-600 dark:text-purple-400 flex items-start gap-2">
                      <Icon name="info" className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>枠内をクリック＆ドラッグで好きな位置に移動できます</span>
                    </div>
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