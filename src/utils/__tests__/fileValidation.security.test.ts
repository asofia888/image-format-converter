import { describe, it, expect, vi } from 'vitest';
import {
  validateFileSignature,
  sanitizeFileName,
  validateImageFile,
  validateFiles
} from '../fileValidation';

describe('File Validation Security Tests', () => {
  describe('validateFileSignature', () => {
    it('should detect valid JPEG signatures', async () => {
      // Create a mock file with JPEG signature
      const jpegSignature = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      const file = new File([jpegSignature], 'test.jpg', { type: 'image/jpeg' });

      const result = await validateFileSignature(file);
      expect(result).toBe(true);
    });

    it('should detect valid PNG signatures', async () => {
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const file = new File([pngSignature], 'test.png', { type: 'image/png' });

      const result = await validateFileSignature(file);
      expect(result).toBe(true);
    });

    it('should detect valid WebP signatures', async () => {
      const webpSignature = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size (placeholder)
        0x57, 0x45, 0x42, 0x50  // WEBP
      ]);
      const file = new File([webpSignature], 'test.webp', { type: 'image/webp' });

      const result = await validateFileSignature(file);
      expect(result).toBe(true);
    });

    it('should reject files with invalid signatures', async () => {
      const invalidSignature = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const file = new File([invalidSignature], 'test.jpg', { type: 'image/jpeg' });

      const result = await validateFileSignature(file);
      expect(result).toBe(false);
    });

    it('should reject executable files disguised as images', async () => {
      // MZ header (executable)
      const executableSignature = new Uint8Array([0x4D, 0x5A]);
      const file = new File([executableSignature], 'malware.jpg', { type: 'image/jpeg' });

      const result = await validateFileSignature(file);
      expect(result).toBe(false);
    });

    it('should handle empty files gracefully', async () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });

      const result = await validateFileSignature(emptyFile);
      expect(result).toBe(false);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path traversal sequences', () => {
      const maliciousName = '../../../etc/passwd';
      const sanitized = sanitizeFileName(maliciousName);
      expect(sanitized).not.toContain('..');
      expect(sanitized).toBe('___etc_passwd');
    });

    it('should remove dangerous characters', () => {
      const dangerousName = 'file<>:|?*"\\/.txt';
      const sanitized = sanitizeFileName(dangerousName);
      expect(sanitized).toBe('file_________.txt');
    });

    it('should prevent hidden files', () => {
      const hiddenFile = '.hidden';
      const sanitized = sanitizeFileName(hiddenFile);
      expect(sanitized).toBe('_hidden');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300);
      const sanitized = sanitizeFileName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it('should handle Unicode characters safely', () => {
      const unicodeName = 'файл.jpg';
      const sanitized = sanitizeFileName(unicodeName);
      expect(sanitized).toBe('файл.jpg');
    });

    it('should handle null bytes', () => {
      const nullByteName = 'file\0.jpg';
      const sanitized = sanitizeFileName(nullByteName);
      expect(sanitized).not.toContain('\0');
    });
  });

  describe('validateImageFile', () => {
    beforeEach(() => {
      // Mock FileReader for consistent testing
      global.FileReader = class {
        result: any = null;
        onload: any = null;
        onerror: any = null;

        readAsArrayBuffer() {
          setTimeout(() => {
            // Mock valid JPEG signature
            const mockArrayBuffer = new ArrayBuffer(16);
            const mockUint8Array = new Uint8Array(mockArrayBuffer);
            mockUint8Array[0] = 0xFF;
            mockUint8Array[1] = 0xD8;
            mockUint8Array[2] = 0xFF;

            this.result = mockArrayBuffer;
            if (this.onload) this.onload({ target: this } as any);
          }, 10);
        }
      };
    });

    it('should reject files exceeding size limit', async () => {
      const largeFile = new File(['x'.repeat(60 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg'
      });

      const result = await validateImageFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject files with mismatched MIME types', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'text/plain' });

      const result = await validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject files with dangerous extensions', async () => {
      const file = new File(['content'], 'test.exe', { type: 'image/jpeg' });

      const result = await validateImageFile(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });

    it('should sanitize filenames during validation', async () => {
      const file = new File(['content'], '../malicious.jpg', { type: 'image/jpeg' });

      const result = await validateImageFile(file);
      if (result.isValid && result.sanitizedName) {
        expect(result.sanitizedName).not.toContain('..');
      }
    });
  });

  describe('validateFiles batch processing', () => {
    it('should reject when too many files are provided', async () => {
      const files = Array.from({ length: 101 }, (_, i) =>
        new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      const result = await validateFiles(files);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toContain('Too many files. Maximum 100 files allowed.');
    });

    it('should handle mixed valid and invalid files', async () => {
      const validFile = new File(['content'], 'valid.jpg', { type: 'image/jpeg' });
      const invalidFile = new File(['content'], 'invalid.txt', { type: 'text/plain' });

      const result = await validateFiles([validFile, invalidFile]);
      expect(result.validFiles.length).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should prevent memory exhaustion with many large files', async () => {
      const largeFiles = Array.from({ length: 5 }, (_, i) =>
        new File(['x'.repeat(60 * 1024 * 1024)], `large${i}.jpg`, { type: 'image/jpeg' })
      );

      const result = await validateFiles(largeFiles);
      expect(result.validFiles).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases and attack vectors', () => {
    it('should handle files with misleading extensions', async () => {
      // File claiming to be JPEG but with PNG content
      const file = new File(['content'], 'fake.jpg.png', { type: 'image/jpeg' });

      const result = await validateImageFile(file);
      // Should be rejected due to extension mismatch
      expect(result.isValid).toBe(false);
    });

    it('should handle polyglot files (files valid in multiple formats)', async () => {
      // This is a simplified test - real polyglot files are more complex
      const polyglotData = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
        ...Array(100).fill(0x00), // padding
        0x89, 0x50, 0x4E, 0x47   // PNG header buried inside
      ]);

      const file = new File([polyglotData], 'polyglot.jpg', { type: 'image/jpeg' });

      // Should pass validation as it has valid JPEG signature at start
      const result = await validateFileSignature(file);
      expect(result).toBe(true);
    });

    it('should reject files with script injection in filenames', async () => {
      const scriptName = '<script>alert("xss")</script>.jpg';
      const sanitized = sanitizeFileName(scriptName);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should handle international domain names and filenames', async () => {
      const internationalName = 'тест.jpg';
      const sanitized = sanitizeFileName(internationalName);

      // Should preserve valid international characters
      expect(sanitized).toBe('тест.jpg');
    });
  });
});