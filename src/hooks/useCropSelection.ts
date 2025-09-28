/**
 * Custom hook for managing crop selection state and interactions
 */

import { useState, useCallback } from 'react';
import { convertScreenToImageCoordinates, constrainCropToImageBounds } from '../utils/cropCoordinateUtils';
import { constrainToAspectRatio, AspectRatioConstraint } from '../utils/cropConstraints';
import type { CropConfig } from '../types';

interface CropSelection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isDragging: boolean;
}

interface UseCropSelectionProps {
  cropConfig: CropConfig;
  setCropConfig: React.Dispatch<React.SetStateAction<CropConfig>>;
  originalDimensions: { width: number; height: number } | null;
  imageRef: React.RefObject<HTMLImageElement>;
}

export const useCropSelection = ({
  cropConfig,
  setCropConfig,
  originalDimensions,
  imageRef
}: UseCropSelectionProps) => {
  const [selection, setSelection] = useState<CropSelection>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isDragging: false,
  });

  const aspectRatioConstraint: AspectRatioConstraint = {
    enabled: cropConfig.constrainAspectRatio,
    ratio: cropConfig.aspectRatio
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!cropConfig.enabled || !imageRef.current) return;

    const coords = convertScreenToImageCoordinates(e.clientX, e.clientY, imageRef.current);
    setSelection({
      startX: coords.x,
      startY: coords.y,
      endX: coords.x,
      endY: coords.y,
      isDragging: true,
    });
  }, [cropConfig.enabled, imageRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selection.isDragging || !imageRef.current || !originalDimensions) return;

    const coords = convertScreenToImageCoordinates(e.clientX, e.clientY, imageRef.current);
    const { endX, endY } = constrainToAspectRatio(
      selection.startX,
      selection.startY,
      coords.x,
      coords.y,
      aspectRatioConstraint,
      originalDimensions
    );

    setSelection(prev => ({
      ...prev,
      endX,
      endY,
    }));
  }, [selection.isDragging, selection.startX, selection.startY, aspectRatioConstraint, originalDimensions, imageRef]);

  const handleMouseUp = useCallback(() => {
    if (!selection.isDragging || !originalDimensions) return;

    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);

    if (width > 10 && height > 10) { // Minimum size threshold
      const constrainedCrop = constrainCropToImageBounds(
        { x, y, width, height },
        originalDimensions
      );

      setCropConfig(prev => ({
        ...prev,
        ...constrainedCrop,
      }));
    }

    setSelection(prev => ({ ...prev, isDragging: false }));
  }, [selection, setCropConfig, originalDimensions]);

  const resetSelection = useCallback(() => {
    setSelection({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      isDragging: false,
    });
  }, []);

  return {
    selection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetSelection,
  };
};