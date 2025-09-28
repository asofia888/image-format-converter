import { describe, it, expect } from 'vitest';
import {
  constrainToImageBounds,
  calculateSelectionBox,
  applyAspectRatioConstraint,
  normalizeSelection,
} from '../cropCoordinateUtils';

describe('cropCoordinateUtils', () => {
  const imageDimensions = { width: 800, height: 600 };

  describe('constrainToImageBounds', () => {
    it('should keep coordinates within bounds', () => {
      const result = constrainToImageBounds(
        { x: 100, y: 100, width: 200, height: 150 },
        imageDimensions
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('should constrain coordinates that exceed bounds', () => {
      const result = constrainToImageBounds(
        { x: 700, y: 500, width: 200, height: 200 },
        imageDimensions
      );

      expect(result.x + result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.y + result.height).toBeLessThanOrEqual(imageDimensions.height);
    });

    it('should handle negative coordinates', () => {
      const result = constrainToImageBounds(
        { x: -50, y: -30, width: 200, height: 150 },
        imageDimensions
      );

      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
    });

    it('should handle oversized dimensions', () => {
      const result = constrainToImageBounds(
        { x: 0, y: 0, width: 1000, height: 800 },
        imageDimensions
      );

      expect(result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.height).toBeLessThanOrEqual(imageDimensions.height);
    });
  });

  describe('calculateSelectionBox', () => {
    it('should calculate selection box from mouse coordinates', () => {
      const result = calculateSelectionBox(
        { x: 100, y: 100 },
        { x: 300, y: 250 }
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('should handle reverse selection (drag from bottom-right to top-left)', () => {
      const result = calculateSelectionBox(
        { x: 300, y: 250 },
        { x: 100, y: 100 }
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('should handle single point selection', () => {
      const result = calculateSelectionBox(
        { x: 150, y: 150 },
        { x: 150, y: 150 }
      );

      expect(result.x).toBe(150);
      expect(result.y).toBe(150);
      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
    });
  });

  describe('applyAspectRatioConstraint', () => {
    it('should apply aspect ratio constraint', () => {
      const result = applyAspectRatioConstraint(
        { x: 100, y: 100, width: 200, height: 100 },
        1.5, // 3:2 aspect ratio
        imageDimensions
      );

      const ratio = result.width / result.height;
      expect(Math.abs(ratio - 1.5)).toBeLessThan(0.1);
    });

    it('should maintain position when possible', () => {
      const input = { x: 100, y: 100, width: 200, height: 100 };
      const result = applyAspectRatioConstraint(input, 2, imageDimensions);

      expect(result.x).toBe(input.x);
      expect(result.y).toBe(input.y);
    });

    it('should adjust dimensions to fit aspect ratio', () => {
      const result = applyAspectRatioConstraint(
        { x: 100, y: 100, width: 300, height: 100 },
        1, // Square aspect ratio
        imageDimensions
      );

      expect(result.width).toBe(result.height);
    });

    it('should constrain to image bounds while maintaining aspect ratio', () => {
      const result = applyAspectRatioConstraint(
        { x: 600, y: 400, width: 300, height: 300 },
        1,
        imageDimensions
      );

      expect(result.x + result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.y + result.height).toBeLessThanOrEqual(imageDimensions.height);
      expect(result.width).toBe(result.height); // Should maintain square ratio
    });
  });

  describe('normalizeSelection', () => {
    it('should normalize valid selection', () => {
      const result = normalizeSelection(
        { x: 100, y: 100, width: 200, height: 150 },
        imageDimensions
      );

      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
      expect(result.width).toBe(200);
      expect(result.height).toBe(150);
    });

    it('should enforce minimum dimensions', () => {
      const result = normalizeSelection(
        { x: 100, y: 100, width: 30, height: 20 },
        imageDimensions
      );

      expect(result.width).toBeGreaterThanOrEqual(50);
      expect(result.height).toBeGreaterThanOrEqual(50);
    });

    it('should handle zero dimensions', () => {
      const result = normalizeSelection(
        { x: 100, y: 100, width: 0, height: 0 },
        imageDimensions
      );

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should constrain oversized selections', () => {
      const result = normalizeSelection(
        { x: 0, y: 0, width: 1000, height: 800 },
        imageDimensions
      );

      expect(result.width).toBeLessThanOrEqual(imageDimensions.width);
      expect(result.height).toBeLessThanOrEqual(imageDimensions.height);
    });
  });
});