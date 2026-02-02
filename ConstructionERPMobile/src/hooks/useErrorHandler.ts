// Custom hook for error handling
// Requirements: 12.4

import { useState, useCallback } from 'react';
import { 
  errorHandler, 
  ErrorInfo, 
  ConstructionError,
  handleApiError,
  handleLocationError,
  handleCameraError,
  showErrorAlert
} from '../utils/errorHandling/ErrorHandler';

interface UseErrorHandlerReturn {
  error: ErrorInfo | null;
  isError: boolean;
  clearError: () => void;
  handleError: (error: Error | ConstructionError, context?: string) => ErrorInfo;
  handleApiError: (error: any, context?: string) => ErrorInfo;
  handleLocationError: (error: any) => ErrorInfo;
  handleCameraError: (error: any) => ErrorInfo;
  showError: (errorInfo: ErrorInfo, options?: any) => void;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => (...args: T) => Promise<R | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ErrorInfo | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleErrorWithState = useCallback((error: Error | ConstructionError, context?: string) => {
    const errorInfo = errorHandler.handleError(error, context);
    setError(errorInfo);
    return errorInfo;
  }, []);

  const handleApiErrorWithState = useCallback((error: any, context?: string) => {
    const errorInfo = handleApiError(error, context);
    setError(errorInfo);
    return errorInfo;
  }, []);

  const handleLocationErrorWithState = useCallback((error: any) => {
    const errorInfo = handleLocationError(error);
    setError(errorInfo);
    return errorInfo;
  }, []);

  const handleCameraErrorWithState = useCallback((error: any) => {
    const errorInfo = handleCameraError(error);
    setError(errorInfo);
    return errorInfo;
  }, []);

  const showError = useCallback((errorInfo: ErrorInfo, options?: any) => {
    showErrorAlert(errorInfo, options);
  }, []);

  // Higher-order function to wrap async functions with error handling
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        clearError();
        return await fn(...args);
      } catch (error) {
        if (error instanceof Error) {
          handleErrorWithState(error, context);
        } else {
          handleErrorWithState(new Error('Unknown error occurred'), context);
        }
        return null;
      }
    };
  }, [clearError, handleErrorWithState]);

  return {
    error,
    isError: error !== null,
    clearError,
    handleError: handleErrorWithState,
    handleApiError: handleApiErrorWithState,
    handleLocationError: handleLocationErrorWithState,
    handleCameraError: handleCameraErrorWithState,
    showError,
    withErrorHandling,
  };
};

// Specialized hooks for different error types
export const useApiErrorHandler = () => {
  const { handleApiError, error, clearError, withErrorHandling } = useErrorHandler();
  
  const withApiErrorHandling = useCallback(<T extends any[], R>(
    apiCall: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return withErrorHandling(apiCall, context || 'API');
  }, [withErrorHandling]);

  return {
    error,
    clearError,
    handleApiError,
    withApiErrorHandling,
  };
};

export const useLocationErrorHandler = () => {
  const { handleLocationError, error, clearError, withErrorHandling } = useErrorHandler();
  
  const withLocationErrorHandling = useCallback(<T extends any[], R>(
    locationCall: (...args: T) => Promise<R>
  ) => {
    return withErrorHandling(locationCall, 'Location');
  }, [withErrorHandling]);

  return {
    error,
    clearError,
    handleLocationError,
    withLocationErrorHandling,
  };
};

export const useCameraErrorHandler = () => {
  const { handleCameraError, error, clearError, withErrorHandling } = useErrorHandler();
  
  const withCameraErrorHandling = useCallback(<T extends any[], R>(
    cameraCall: (...args: T) => Promise<R>
  ) => {
    return withErrorHandling(cameraCall, 'Camera');
  }, [withErrorHandling]);

  return {
    error,
    clearError,
    handleCameraError,
    withCameraErrorHandling,
  };
};