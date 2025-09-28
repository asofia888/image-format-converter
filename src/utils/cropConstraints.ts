/**
 * Utility functions for crop aspect ratio constraints and validation
 */

export interface AspectRatioConstraint {
  enabled: boolean;
  ratio?: number;
}

export interface CropDimensions {
  width: number;
  height: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Apply aspect ratio constraints to crop selection
 */
export const constrainToAspectRatio = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  constraint: AspectRatioConstraint,
  imageDimensions: { width: number; height: number }
): { endX: number; endY: number } => {
  if (!constraint.enabled || !constraint.ratio) {
    return { endX, endY };
  }

  const targetAspectRatio = constraint.ratio;
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
  const clampedEndX = Math.max(0, Math.min(newEndX, imageDimensions.width));
  const clampedEndY = Math.max(0, Math.min(newEndY, imageDimensions.height));

  return { endX: clampedEndX, endY: clampedEndY };
};

/**
 * Calculate new height based on width and aspect ratio constraint
 */
export const calculateConstrainedHeight = (
  width: number,
  constraint: AspectRatioConstraint
): number => {
  if (!constraint.enabled || !constraint.ratio) {
    return width; // Return original if no constraint
  }
  return width / constraint.ratio;
};

/**
 * Calculate new width based on height and aspect ratio constraint
 */
export const calculateConstrainedWidth = (
  height: number,
  constraint: AspectRatioConstraint
): number => {
  if (!constraint.enabled || !constraint.ratio) {
    return height; // Return original if no constraint
  }
  return height * constraint.ratio;
};

/**
 * Validate if crop dimensions meet minimum requirements
 */
export const validateCropDimensions = (
  dimensions: CropDimensions,
  minSize: number = 50
): boolean => {
  return dimensions.width >= minSize && dimensions.height >= minSize;
};

/**
 * Get aspect ratio description for UI display
 */
export const getAspectRatioDescription = (ratio?: number): string => {
  if (!ratio) return '';

  if (ratio === 1.0) return '1:1 (正方形)';
  if (ratio > 1) return `${ratio.toFixed(2)}:1 (横長)`;
  return `1:${(1/ratio).toFixed(2)} (縦長)`;
};