/**
 * Custom hook for managing crop frame positioning via double-click and drag
 */

import { useState, useCallback } from 'react';
import { convertScreenToImageCoordinates, constrainCropToImageBounds } from '../utils/cropCoordinateUtils';
import type { CropConfig } from '../types';

interface PositionDrag {
  isPositionDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
  originalCropX: number;
  originalCropY: number;
}

interface UseCropPositioningProps {
  cropConfig: CropConfig;
  setCropConfig: React.Dispatch<React.SetStateAction<CropConfig>>;
  originalDimensions: { width: number; height: number } | null;
  imageRef: React.RefObject<HTMLImageElement>;
  hasCropData: boolean;
}

export const useCropPositioning = ({
  cropConfig,
  setCropConfig,
  originalDimensions,
  imageRef,
  hasCropData
}: UseCropPositioningProps) => {
  const [positionDrag, setPositionDrag] = useState<PositionDrag>({
    isPositionDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    originalCropX: 0,
    originalCropY: 0,
  });

  const handleCropDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasCropData || !imageRef.current) return;

    const coords = convertScreenToImageCoordinates(e.clientX, e.clientY, imageRef.current);

    setPositionDrag({
      isPositionDragging: true,
      lastMouseX: coords.x,
      lastMouseY: coords.y,
      originalCropX: cropConfig.x,
      originalCropY: cropConfig.y,
    });
  }, [hasCropData, imageRef, cropConfig.x, cropConfig.y]);

  const handlePositionDrag = useCallback((e: React.MouseEvent) => {
    if (!positionDrag.isPositionDragging || !imageRef.current || !originalDimensions) return;

    const coords = convertScreenToImageCoordinates(e.clientX, e.clientY, imageRef.current);
    const deltaX = coords.x - positionDrag.lastMouseX;
    const deltaY = coords.y - positionDrag.lastMouseY;

    const newX = positionDrag.originalCropX + deltaX;
    const newY = positionDrag.originalCropY + deltaY;

    const constrainedCrop = constrainCropToImageBounds(
      { x: newX, y: newY, width: cropConfig.width, height: cropConfig.height },
      originalDimensions
    );

    setCropConfig(prev => ({
      ...prev,
      x: constrainedCrop.x,
      y: constrainedCrop.y,
    }));
  }, [positionDrag, imageRef, originalDimensions, cropConfig.width, cropConfig.height, setCropConfig]);

  const handlePositionDragEnd = useCallback(() => {
    setPositionDrag(prev => ({ ...prev, isPositionDragging: false }));
  }, []);

  const resetPositioning = useCallback(() => {
    setPositionDrag({
      isPositionDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      originalCropX: 0,
      originalCropY: 0,
    });
  }, []);

  return {
    positionDrag,
    handleCropDoubleClick,
    handlePositionDrag,
    handlePositionDragEnd,
    resetPositioning,
  };
};