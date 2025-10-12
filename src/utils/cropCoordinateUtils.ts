/**
 * Utility functions for crop coordinate calculations and conversions
 */

export interface ImageCoordinates {
  x: number;
  y: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface DisplayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Convert screen coordinates to image coordinates
 */
export const convertScreenToImageCoordinates = (
  clientX: number,
  clientY: number,
  imageElement: HTMLImageElement
): ImageCoordinates => {
  const imageRect = imageElement.getBoundingClientRect();

  const x = clientX - imageRect.left;
  const y = clientY - imageRect.top;

  // Convert to actual image coordinates
  const scaleX = imageElement.naturalWidth / imageRect.width;
  const scaleY = imageElement.naturalHeight / imageRect.height;

  return {
    x: Math.max(0, Math.min(x * scaleX, imageElement.naturalWidth)),
    y: Math.max(0, Math.min(y * scaleY, imageElement.naturalHeight))
  };
};

/**
 * Convert image coordinates to display coordinates for overlay rendering
 */
export const convertImageToDisplayCoordinates = (
  imageCoords: { x: number; y: number; width: number; height: number },
  imageElement: HTMLImageElement
): DisplayRect => {
  const imageRect = imageElement.getBoundingClientRect();

  const scaleX = imageRect.width / imageElement.naturalWidth;
  const scaleY = imageRect.height / imageElement.naturalHeight;

  return {
    left: imageCoords.x * scaleX,
    top: imageCoords.y * scaleY,
    width: imageCoords.width * scaleX,
    height: imageCoords.height * scaleY,
  };
};

/**
 * Constrain coordinates to stay within image bounds
 */
export const constrainToImageBounds = (
  coords: { x: number; y: number; width: number; height: number },
  imageDimensions: ImageDimensions
): { x: number; y: number; width: number; height: number } => {
  const x = Math.max(0, coords.x);
  const y = Math.max(0, coords.y);
  const width = Math.min(coords.width, imageDimensions.width - x);
  const height = Math.min(coords.height, imageDimensions.height - y);

  return { x, y, width, height };
};

/**
 * Constrain crop area to stay within image bounds
 */
export const constrainCropToImageBounds = (
  crop: { x: number; y: number; width: number; height: number },
  imageDimensions: ImageDimensions
): { x: number; y: number; width: number; height: number } => {
  const maxX = Math.min(crop.x, imageDimensions.width - crop.width);
  const maxY = Math.min(crop.y, imageDimensions.height - crop.height);

  return {
    x: Math.max(0, maxX),
    y: Math.max(0, maxY),
    width: Math.min(crop.width, imageDimensions.width),
    height: Math.min(crop.height, imageDimensions.height)
  };
};

/**
 * Calculate selection box from start and end coordinates
 */
export const calculateSelectionBox = (
  start: ImageCoordinates,
  end: ImageCoordinates
): { x: number; y: number; width: number; height: number } => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { x, y, width, height };
};

/**
 * Apply aspect ratio constraint to selection
 */
export const applyAspectRatioConstraint = (
  selection: { x: number; y: number; width: number; height: number },
  aspectRatio: number,
  imageDimensions: ImageDimensions
): { x: number; y: number; width: number; height: number } => {
  const currentRatio = selection.width / selection.height;

  let { x, y, width, height } = selection;

  if (Math.abs(currentRatio - aspectRatio) > 0.01) {
    // Adjust dimensions to match aspect ratio
    if (currentRatio > aspectRatio) {
      // Width is too large
      width = height * aspectRatio;
    } else {
      // Height is too large
      height = width / aspectRatio;
    }
  }

  // Constrain to image bounds
  if (x + width > imageDimensions.width) {
    width = imageDimensions.width - x;
    height = width / aspectRatio;
  }

  if (y + height > imageDimensions.height) {
    height = imageDimensions.height - y;
    width = height * aspectRatio;
  }

  return { x, y, width, height };
};

/**
 * Normalize selection to ensure minimum dimensions and bounds
 */
export const normalizeSelection = (
  selection: { x: number; y: number; width: number; height: number },
  imageDimensions: ImageDimensions,
  minDimension: number = 50
): { x: number; y: number; width: number; height: number } => {
  let { x, y, width, height } = selection;

  // Enforce minimum dimensions
  width = Math.max(width, minDimension);
  height = Math.max(height, minDimension);

  // Constrain to image bounds
  width = Math.min(width, imageDimensions.width);
  height = Math.min(height, imageDimensions.height);

  // Adjust position if dimensions push beyond bounds
  x = Math.min(x, imageDimensions.width - width);
  y = Math.min(y, imageDimensions.height - height);

  x = Math.max(0, x);
  y = Math.max(0, y);

  return { x, y, width, height };
};