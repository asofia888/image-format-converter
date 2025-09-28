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
  coords: ImageCoordinates,
  imageDimensions: ImageDimensions
): ImageCoordinates => {
  return {
    x: Math.max(0, Math.min(coords.x, imageDimensions.width)),
    y: Math.max(0, Math.min(coords.y, imageDimensions.height))
  };
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