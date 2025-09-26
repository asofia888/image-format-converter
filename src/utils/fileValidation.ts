/**
 * Enhanced file validation utilities for security
 */

import { APP_CONSTANTS, FORMAT_CONSTANTS } from '../constants';

// Allowed image formats
export const ALLOWED_IMAGE_TYPES = FORMAT_CONSTANTS.SUPPORTED_MIME_TYPES;

// File size limits
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILES_COUNT = APP_CONSTANTS.MAX_FILES_COUNT;

// File signature validation (magic numbers)
const FILE_SIGNATURES = {
  jpeg: [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  png: [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF (first 4 bytes of WebP)
  ],
} as const;

/**
 * Validates file signature by reading the first bytes
 */
export const validateFileSignature = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      // Check JPEG signatures
      for (const signature of FILE_SIGNATURES.jpeg) {
        if (uint8Array.length >= signature.length) {
          const matches = signature.every((byte, index) => uint8Array[index] === byte);
          if (matches) {
            resolve(true);
            return;
          }
        }
      }

      // Check PNG signature
      for (const signature of FILE_SIGNATURES.png) {
        if (uint8Array.length >= signature.length) {
          const matches = signature.every((byte, index) => uint8Array[index] === byte);
          if (matches) {
            resolve(true);
            return;
          }
        }
      }

      // Check WebP signature (RIFF header + WebP identifier)
      if (uint8Array.length >= 12) {
        const riffMatches = FILE_SIGNATURES.webp[0].every((byte, index) => uint8Array[index] === byte);
        const webpMatches = uint8Array[8] === 0x57 && uint8Array[9] === 0x45 &&
                           uint8Array[10] === 0x42 && uint8Array[11] === 0x50; // "WEBP"
        if (riffMatches && webpMatches) {
          resolve(true);
          return;
        }
      }


      resolve(false);
    };

    reader.onerror = () => resolve(false);

    // Read first 16 bytes for signature validation
    reader.readAsArrayBuffer(file.slice(0, 16));
  });
};

/**
 * Sanitizes filename to prevent path traversal attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[/\\:*?"<>|]/g, '_') // Replace dangerous characters
    .replace(/\.\./g, '_') // Prevent directory traversal
    .replace(/^\./, '_') // Prevent hidden files
    .substring(0, 255); // Limit length
};

/**
 * Validates file extension against allowed types
 */
export const validateFileExtension = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().split('.').pop();
  const allowedExtensions = FORMAT_CONSTANTS.SUPPORTED_EXTENSIONS;
  return allowedExtensions.includes(extension as any);
};

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

export const validateImageFile = async (file: File): Promise<FileValidationResult> => {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
    };
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  // Check file extension
  if (!validateFileExtension(file.name)) {
    return {
      isValid: false,
      error: 'Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed.',
    };
  }

  // Check file signature
  const hasValidSignature = await validateFileSignature(file);
  if (!hasValidSignature) {
    return {
      isValid: false,
      error: 'File content does not match the declared type (potential security risk).',
    };
  }

  // Sanitize filename
  const sanitizedName = sanitizeFileName(file.name);

  return {
    isValid: true,
    sanitizedName,
  };
};

/**
 * Validates multiple files
 */
export const validateFiles = async (files: File[]): Promise<{
  validFiles: File[];
  errors: string[];
}> => {
  if (files.length > MAX_FILES_COUNT) {
    return {
      validFiles: [],
      errors: [`Too many files. Maximum ${MAX_FILES_COUNT} files allowed.`],
    };
  }

  const validFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await validateImageFile(file);
    if (result.isValid) {
      // Create a new file with sanitized name if needed
      if (result.sanitizedName && result.sanitizedName !== file.name) {
        const sanitizedFile = new File([file], result.sanitizedName, {
          type: file.type,
          lastModified: file.lastModified,
        });
        validFiles.push(sanitizedFile);
      } else {
        validFiles.push(file);
      }
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  return { validFiles, errors };
};