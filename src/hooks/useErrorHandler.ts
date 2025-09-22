import { useState, useCallback } from 'react';
import type { TranslationKeys } from './useTranslation';

export interface AppError {
  key: TranslationKeys;
  params?: Record<string, string | number>;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback((errorKey: TranslationKeys, params?: Record<string, string | number>) => {
    const errorObject: AppError = { key: errorKey };
    if (params) {
      errorObject.params = params;
    }
    setError(errorObject);
    console.error(`Error: ${errorKey}`, params);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    fallbackErrorKey: TranslationKeys = 'errorGeneric' as TranslationKeys
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      console.error('Async operation failed:', error);
      if (error && typeof error === 'object' && 'key' in error) {
        setError(error as AppError);
      } else {
        handleError(fallbackErrorKey, {
          message: error instanceof Error ? error.message : String(error)
        });
      }
      return null;
    }
  }, [handleError]);

  return {
    error,
    setError,
    handleError,
    clearError,
    handleAsyncError
  };
};