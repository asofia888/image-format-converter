import { describe, it, expect } from 'vitest';
import {
  getAspectRatioFromPreset,
  getDefaultCropSize,
  validateCropDimensions,
  calculateCropPosition,
} from '../cropConstraints';

describe('cropConstraints', () => {
  const imageDimensions = { width: 800, height: 600 };

  describe('getAspectRatioFromPreset', () => {
    it('should return correct aspect ratio for Instagram', () => {
      expect(getAspectRatioFromPreset('instagram')).toBe(1);
    });

    it('should return correct aspect ratio for Twitter', () => {
      expect(getAspectRatioFromPreset('twitter')).toBeCloseTo(16/9, 2);
    });

    it('should return correct aspect ratio for TikTok', () => {
      expect(getAspectRatioFromPreset('tiktok')).toBeCloseTo(9/16, 2);
    });

    it('should return null for custom preset', () => {
      expect(getAspectRatioFromPreset('custom')).toBeNull();
    });

    it('should return null for unknown preset', () => {
      expect(getAspectRatioFromPreset('unknown' as any)).toBeNull();
    });
  });

  describe('getDefaultCropSize', () => {
    it('should return appropriate size for Instagram preset', () => {
      const result = getDefaultCropSize('instagram', imageDimensions);

      expect(result.width).toBe(result.height); // Square
      expect(result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.height).toBeLessThanOrEqual(imageDimensions.height);
    });

    it('should return appropriate size for Twitter preset', () => {
      const result = getDefaultCropSize('twitter', imageDimensions);

      const ratio = result.width / result.height;
      expect(Math.abs(ratio - 16/9)).toBeLessThan(0.1);
      expect(result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.height).toBeLessThanOrEqual(imageDimensions.height);
    });

    it('should return appropriate size for TikTok preset', () => {
      const result = getDefaultCropSize('tiktok', imageDimensions);

      const ratio = result.width / result.height;
      expect(Math.abs(ratio - 9/16)).toBeLessThan(0.1);
      expect(result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.height).toBeLessThanOrEqual(imageDimensions.height);
    });

    it('should return default size for custom preset', () => {
      const result = getDefaultCropSize('custom', imageDimensions);

      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
    });

    it('should handle small images gracefully', () => {
      const smallImage = { width: 100, height: 100 };
      const result = getDefaultCropSize('instagram', smallImage);

      expect(result.width).toBeLessThanOrEqual(smallImage.width);
      expect(result.height).toBeLessThanOrEqual(smallImage.height);
    });
  });

  describe('validateCropDimensions', () => {
    it('should validate correct dimensions', () => {
      const result = validateCropDimensions(
        { x: 100, y: 100, width: 200, height: 150 },
        imageDimensions
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect out-of-bounds coordinates', () => {
      const result = validateCropDimensions(
        { x: 900, y: 700, width: 100, height: 100 },
        imageDimensions
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('bounds'))).toBe(true);
    });

    it('should detect dimensions that are too small', () => {
      const result = validateCropDimensions(
        { x: 100, y: 100, width: 10, height: 10 },
        imageDimensions
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('minimum'))).toBe(true);
    });

    it('should detect negative coordinates', () => {
      const result = validateCropDimensions(
        { x: -50, y: -30, width: 200, height: 150 },
        imageDimensions
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('negative'))).toBe(true);
    });

    it('should detect zero or negative dimensions', () => {
      const result = validateCropDimensions(
        { x: 100, y: 100, width: 0, height: -10 },
        imageDimensions
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCropPosition', () => {
    it('should center crop when position is "center"', () => {
      const cropSize = { width: 200, height: 150 };
      const result = calculateCropPosition('center', cropSize, imageDimensions);

      const expectedX = (imageDimensions.width - cropSize.width) / 2;
      const expectedY = (imageDimensions.height - cropSize.height) / 2;

      expect(result.x).toBe(expectedX);
      expect(result.y).toBe(expectedY);
    });

    it('should position crop at top-left when position is "top-left"', () => {
      const cropSize = { width: 200, height: 150 };
      const result = calculateCropPosition('top-left', cropSize, imageDimensions);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should position crop at top-right when position is "top-right"', () => {
      const cropSize = { width: 200, height: 150 };
      const result = calculateCropPosition('top-right', cropSize, imageDimensions);

      expect(result.x).toBe(imageDimensions.width - cropSize.width);
      expect(result.y).toBe(0);
    });

    it('should position crop at bottom-left when position is "bottom-left"', () => {
      const cropSize = { width: 200, height: 150 };
      const result = calculateCropPosition('bottom-left', cropSize, imageDimensions);

      expect(result.x).toBe(0);
      expect(result.y).toBe(imageDimensions.height - cropSize.height);
    });

    it('should position crop at bottom-right when position is "bottom-right"', () => {
      const cropSize = { width: 200, height: 150 };
      const result = calculateCropPosition('bottom-right', cropSize, imageDimensions);

      expect(result.x).toBe(imageDimensions.width - cropSize.width);
      expect(result.y).toBe(imageDimensions.height - cropSize.height);
    });

    it('should handle crop larger than image', () => {
      const largeCropSize = { width: 1000, height: 800 };
      const result = calculateCropPosition('center', largeCropSize, imageDimensions);

      // Should constrain to image bounds
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.x + largeCropSize.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.y + largeCropSize.height).toBeLessThanOrEqual(imageDimensions.height);
    });
  });
});