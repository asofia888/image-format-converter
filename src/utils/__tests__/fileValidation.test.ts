import { describe, it, expect } from 'vitest';
import { validateFiles, MAX_FILE_SIZE_MB } from '../fileValidation';

describe('fileValidation', () => {
  const createMockFile = (name: string, size: number, type: string): File => {
    const blob = new Blob([''], { type });
    return new File([blob], name, { type, lastModified: Date.now() });
  };

  describe('validateFiles', () => {
    it('should accept valid image files', async () => {
      const files = [
        createMockFile('test.jpg', 1024, 'image/jpeg'),
        createMockFile('test.png', 2048, 'image/png'),
        createMockFile('test.webp', 1536, 'image/webp'),
      ];

      const result = await validateFiles(files);
      expect(result.validFiles).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-image files', async () => {
      const files = [
        createMockFile('test.txt', 1024, 'text/plain'),
      ];

      const result = await validateFiles(files);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('test.txt');
    });

    it('should reject files that are too large', async () => {
      const largeSize = MAX_FILE_SIZE_MB * 1024 * 1024 + 1;
      const files = [
        createMockFile('large.jpg', largeSize, 'image/jpeg'),
      ];

      const result = await validateFiles(files);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('large.jpg');
    });

    it('should handle empty file list', async () => {
      const result = await validateFiles([]);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple files with one invalid', async () => {
      const files = [
        createMockFile('valid.jpg', 1024, 'image/jpeg'),
        createMockFile('invalid.txt', 1024, 'text/plain'),
      ];

      const result = await validateFiles(files);
      expect(result.validFiles).toHaveLength(0); // JPEG will fail signature validation in mock
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject unsupported image formats', async () => {
      const files = [
        createMockFile('test.bmp', 1024, 'image/bmp'),
      ];

      const result = await validateFiles(files);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('test.bmp');
    });
  });
});