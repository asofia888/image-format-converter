import { describe, it, expect, vi } from 'vitest';
import {
  createError,
  isNetworkError,
  isQuotaError,
  getErrorMessage,
  logError,
  safeExecute
} from '../errorUtils';

describe('Error Handling Tests', () => {
  describe('createError', () => {
    it('should create a standardized error object', () => {
      const error = createError('test_error', { param: 'value' });

      expect(error).toEqual({
        key: 'test_error',
        params: { param: 'value' },
        originalError: undefined
      });
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original');
      const error = createError('test_error', {}, originalError);

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('isNetworkError', () => {
    it('should detect NetworkError instances', () => {
      const networkError = new Error('Network failed');
      networkError.name = 'NetworkError';

      expect(isNetworkError(networkError)).toBe(true);
    });

    it('should detect network-related error messages', () => {
      const fetchError = new Error('fetch failed');
      expect(isNetworkError(fetchError)).toBe(true);

      const networkError = new Error('network timeout');
      expect(isNetworkError(networkError)).toBe(true);
    });

    it('should return false for non-network errors', () => {
      const genericError = new Error('Something went wrong');
      expect(isNetworkError(genericError)).toBe(false);

      expect(isNetworkError('string error')).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });
  });

  describe('isQuotaError', () => {
    it('should detect QuotaExceededError instances', () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';

      expect(isQuotaError(quotaError)).toBe(true);
    });

    it('should detect quota-related error messages', () => {
      const quotaError = new Error('quota exceeded');
      expect(isQuotaError(quotaError)).toBe(true);

      const storageError = new Error('storage limit reached');
      expect(isQuotaError(storageError)).toBe(true);
    });

    it('should return false for non-quota errors', () => {
      const genericError = new Error('Something went wrong');
      expect(isQuotaError(genericError)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(getErrorMessage({})).toBe('Unknown error occurred');
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
    });
  });

  describe('logError', () => {
    it('should log errors with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      logError('test-context', error, { userId: '123' });

      expect(consoleSpy).toHaveBeenCalledWith('[test-context]', {
        error: 'Test error',
        stack: expect.any(String),
        userId: '123'
      });

      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      logError('test-context', 'string error');

      expect(consoleSpy).toHaveBeenCalledWith('[test-context]', {
        error: 'string error',
        stack: undefined
      });

      consoleSpy.mockRestore();
    });
  });

  describe('safeExecute', () => {
    it('should execute function and return result on success', async () => {
      const successFn = vi.fn().mockResolvedValue('success');

      const result = await safeExecute(successFn, 'test-context');

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
    });

    it('should catch errors and return fallback', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorFn = vi.fn().mockRejectedValue(new Error('Test error'));

      const result = await safeExecute(errorFn, 'test-context', 'fallback');

      expect(result).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return undefined when no fallback provided', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorFn = vi.fn().mockRejectedValue(new Error('Test error'));

      const result = await safeExecute(errorFn, 'test-context');

      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Edge cases and complex scenarios', () => {
    it('should handle circular reference errors', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const error = new Error('Circular reference');
      (error as any).data = circularObj;

      expect(() => getErrorMessage(error)).not.toThrow();
      expect(getErrorMessage(error)).toBe('Circular reference');
    });

    it('should handle very long error messages', () => {
      const longMessage = 'x'.repeat(10000);
      const error = new Error(longMessage);

      const result = getErrorMessage(error);
      expect(result).toBe(longMessage);
    });

    it('should handle unicode characters in error messages', () => {
      const unicodeError = new Error('エラー: ファイルが見つかりません');
      expect(getErrorMessage(unicodeError)).toBe('エラー: ファイルが見つかりません');
    });

    it('should handle errors with no message', () => {
      const error = new Error();
      expect(getErrorMessage(error)).toBe('');
    });

    it('should handle async function errors in safeExecute', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const asyncErrorFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      };

      const result = await safeExecute(asyncErrorFn, 'async-context', 'async-fallback');

      expect(result).toBe('async-fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle promise rejection in safeExecute', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const rejectionFn = () => Promise.reject('Promise rejected');

      const result = await safeExecute(rejectionFn, 'rejection-context', 'rejection-fallback');

      expect(result).toBe('rejection-fallback');

      consoleSpy.mockRestore();
    });

    it('should handle errors thrown during logging', () => {
      const originalConsoleError = console.error;
      console.error = () => {
        throw new Error('Logging error');
      };

      // Should not throw even if logging fails
      expect(() => {
        logError('test-context', new Error('Original error'));
      }).not.toThrow();

      console.error = originalConsoleError;
    });
  });

  describe('Browser-specific error scenarios', () => {
    it('should handle quota exceeded errors in different browsers', () => {
      // Chrome/Safari quota error
      const chromeQuotaError = new Error();
      chromeQuotaError.name = 'QuotaExceededError';
      expect(isQuotaError(chromeQuotaError)).toBe(true);

      // Firefox quota error
      const firefoxQuotaError = new Error('persistent storage maximum size reached');
      expect(isQuotaError(firefoxQuotaError)).toBe(true);

      // Edge quota error
      const edgeQuotaError = new Error('storage quota has been exceeded');
      expect(isQuotaError(edgeQuotaError)).toBe(true);
    });

    it('should handle network errors in different browsers', () => {
      // Chrome network error
      const chromeNetworkError = new Error('Failed to fetch');
      expect(isNetworkError(chromeNetworkError)).toBe(true);

      // Firefox network error
      const firefoxNetworkError = new Error('NetworkError when attempting to fetch resource');
      expect(isNetworkError(firefoxNetworkError)).toBe(true);

      // Safari network error
      const safariNetworkError = new Error('The network connection was lost');
      expect(isNetworkError(safariNetworkError)).toBe(true);
    });

    it('should handle CORS errors', () => {
      const corsError = new Error('Access to fetch has been blocked by CORS policy');
      // CORS errors might be treated as network errors
      expect(getErrorMessage(corsError)).toContain('CORS');
    });
  });
});