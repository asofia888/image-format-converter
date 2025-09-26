import { APP_CONSTANTS } from '../constants';

/**
 * Calculate percentage from two numbers
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * APP_CONSTANTS.PERCENTAGE_MULTIPLIER);
};

/**
 * Calculate compression ratio as percentage
 */
export const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * APP_CONSTANTS.PERCENTAGE_MULTIPLIER);
};

/**
 * Format quality value as percentage string
 */
export const formatQualityPercentage = (quality: number): string => {
  return `${Math.round(quality * APP_CONSTANTS.PERCENTAGE_MULTIPLIER)}%`;
};

/**
 * Clamp percentage value between 0 and 100
 */
export const clampPercentage = (percentage: number): number => {
  return Math.max(0, Math.min(APP_CONSTANTS.PERCENTAGE_MULTIPLIER, percentage));
};