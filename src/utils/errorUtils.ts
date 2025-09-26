/**
 * Error handling utilities
 */

export interface ErrorInfo {
  key: string;
  params?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Create standardized error object
 */
export const createError = (key: string, params?: Record<string, unknown>, originalError?: Error): ErrorInfo => ({
  key,
  params,
  originalError,
});

/**
 * Check if error is network related
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.name === 'NetworkError' ||
           error.message.includes('network') ||
           error.message.includes('fetch');
  }
  return false;
};

/**
 * Check if error is quota/storage related
 */
export const isQuotaError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.name === 'QuotaExceededError' ||
           error.message.includes('quota') ||
           error.message.includes('storage');
  }
  return false;
};

/**
 * Extract meaningful error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
};

/**
 * Log error with context
 */
export const logError = (context: string, error: unknown, additionalInfo?: Record<string, unknown>): void => {
  console.error(`[${context}]`, {
    error: getErrorMessage(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalInfo,
  });
};

/**
 * Safe error handling wrapper
 */
export const safeExecute = async <T>(
  fn: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    logError(context, error);
    return fallback;
  }
};