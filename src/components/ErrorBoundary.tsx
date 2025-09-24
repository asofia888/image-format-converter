import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation, type TranslationKeys } from '../hooks/useTranslation';
import Icon from './Icon';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'component' | 'feature';
}

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error reporting service in production
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to an error reporting service
    // like Sentry, LogRocket, Bugsnag, etc.
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component',
    };

    // For now, we'll just store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      // Keep only last 10 errors to prevent storage bloat
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('errorReports', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to log error to localStorage:', e);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return <ErrorFallbackUI
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        onRetry={this.handleRetry}
        onReload={this.handleReload}
        level={this.props.level}
      />;
    }

    return this.props.children;
  }
}

// Error Fallback UI Component
interface ErrorFallbackUIProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  onRetry: () => void;
  onReload: () => void;
  level?: 'app' | 'component' | 'feature';
}

const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReload,
  level = 'component'
}) => {
  const { t } = useTranslation();

  const isAppLevel = level === 'app';
  const isDevMode = import.meta.env.DEV;

  return (
    <div className={`
      flex flex-col items-center justify-center p-8
      ${isAppLevel
        ? 'min-h-screen bg-slate-50 dark:bg-slate-900'
        : 'min-h-96 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700'
      }
      text-slate-800 dark:text-slate-200
    `}>
      <div className="max-w-md text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Icon name="error" className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isAppLevel ? t('errorBoundaryAppTitle' as TranslationKeys) : t('errorBoundaryComponentTitle' as TranslationKeys)}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {isAppLevel ? t('errorBoundaryAppMessage' as TranslationKeys) : t('errorBoundaryComponentMessage' as TranslationKeys)}
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDevMode && error && (
          <details className="text-left bg-slate-200 dark:bg-slate-700 p-4 rounded-lg text-sm">
            <summary className="font-semibold cursor-pointer text-slate-800 dark:text-slate-200 mb-2">
              Technical Details (Dev Mode)
            </summary>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              <div>
                <strong>Error ID:</strong> {errorId}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Icon name="reset" className="w-4 h-4 mr-2" />
            {t('errorBoundaryRetry' as TranslationKeys)}
          </button>

          <button
            onClick={onReload}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            <Icon name="arrowsHorizontal" className="w-4 h-4 mr-2" />
            {t('errorBoundaryReload' as TranslationKeys)}
          </button>
        </div>

        {/* Error ID for Support */}
        <div className="text-xs text-slate-500 dark:text-slate-500">
          {t('errorBoundaryErrorId' as TranslationKeys)}: {errorId}
        </div>
      </div>
    </div>
  );
};

// Wrapper component to provide translation context
const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;
export { ErrorFallbackUI };