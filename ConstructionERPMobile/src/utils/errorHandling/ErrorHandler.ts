// Comprehensive Error Handling Utility
// Requirements: 12.4

import { Alert } from 'react-native';

export interface ErrorInfo {
  message: string;
  code?: string | number;
  details?: any;
  timestamp: Date;
  context?: string;
  recoverable: boolean;
  retryAction?: () => Promise<void>;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export class ConstructionError extends Error {
  public readonly code?: string | number;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly context?: string;
  public readonly recoverable: boolean;
  public readonly severity: ErrorSeverity;
  public readonly retryAction?: () => Promise<void>;

  constructor(
    message: string,
    options: {
      code?: string | number;
      details?: any;
      context?: string;
      recoverable?: boolean;
      severity?: ErrorSeverity;
      retryAction?: () => Promise<void>;
    } = {}
  ) {
    super(message);
    this.name = 'ConstructionError';
    this.code = options.code;
    this.details = options.details;
    this.timestamp = new Date();
    this.context = options.context;
    this.recoverable = options.recoverable ?? true;
    this.severity = options.severity ?? 'medium';
    this.retryAction = options.retryAction;
  }

  toErrorInfo(): ErrorInfo {
    return {
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      context: this.context,
      recoverable: this.recoverable,
      retryAction: this.retryAction,
    };
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle different types of errors
  handleError(error: Error | ConstructionError, context?: string): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (error instanceof ConstructionError) {
      errorInfo = error.toErrorInfo();
    } else {
      errorInfo = {
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date(),
        context: context || 'Unknown',
        recoverable: true,
      };
    }

    // Log the error
    this.logError(errorInfo);

    return errorInfo;
  }

  // Handle API errors specifically
  handleApiError(error: any, context: string = 'API'): ErrorInfo {
    let message = 'Network error occurred';
    let code: string | number | undefined;
    let recoverable = true;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      code = status;
      
      if (data?.message) {
        message = data.message;
      } else {
        switch (status) {
          case 400:
            message = 'Invalid request. Please check your input.';
            break;
          case 401:
            message = 'Authentication required. Please log in again.';
            recoverable = false;
            break;
          case 403:
            message = 'Access denied. You don\'t have permission for this action.';
            recoverable = false;
            break;
          case 404:
            message = 'Requested resource not found.';
            break;
          case 422:
            message = 'Validation failed. Please check your input.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          case 503:
            message = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            message = `Server error (${status}). Please try again.`;
        }
      }
    } else if (error.request) {
      // Network error
      message = 'Unable to connect to server. Please check your internet connection.';
      code = 'NETWORK_ERROR';
    } else {
      // Other error
      message = error.message || 'An unexpected error occurred';
      code = 'UNKNOWN_ERROR';
    }

    const constructionError = new ConstructionError(message, {
      code,
      details: error.response?.data || error,
      context,
      recoverable,
      severity: code === 401 || code === 403 ? 'high' : 'medium',
    });

    return this.handleError(constructionError, context);
  }

  // Handle location/GPS errors
  handleLocationError(error: any): ErrorInfo {
    let message = 'Location error occurred';
    let recoverable = true;

    switch (error.code) {
      case 1: // PERMISSION_DENIED
        message = 'Location permission denied. Please enable location access in settings.';
        recoverable = false;
        break;
      case 2: // POSITION_UNAVAILABLE
        message = 'Location unavailable. Please ensure GPS is enabled and try again.';
        break;
      case 3: // TIMEOUT
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = error.message || 'Unable to get your location. Please try again.';
    }

    const constructionError = new ConstructionError(message, {
      code: error.code || 'LOCATION_ERROR',
      details: error,
      context: 'Location Service',
      recoverable,
      severity: error.code === 1 ? 'high' : 'medium',
    });

    return this.handleError(constructionError);
  }

  // Handle camera/photo errors
  handleCameraError(error: any): ErrorInfo {
    let message = 'Camera error occurred';
    let recoverable = true;

    if (error.errorCode) {
      switch (error.errorCode) {
        case 'camera_unavailable':
          message = 'Camera is not available on this device.';
          recoverable = false;
          break;
        case 'permission':
          message = 'Camera permission denied. Please enable camera access in settings.';
          recoverable = false;
          break;
        case 'others':
          message = error.errorMessage || 'Camera error occurred. Please try again.';
          break;
        default:
          message = 'Unable to access camera. Please try again.';
      }
    } else {
      message = error.message || 'Camera error occurred. Please try again.';
    }

    const constructionError = new ConstructionError(message, {
      code: error.errorCode || 'CAMERA_ERROR',
      details: error,
      context: 'Camera Service',
      recoverable,
      severity: 'medium',
    });

    return this.handleError(constructionError);
  }

  // Display user-friendly error messages
  showErrorAlert(errorInfo: ErrorInfo, options: {
    title?: string;
    showRetry?: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
  } = {}) {
    const {
      title = 'Error',
      showRetry = errorInfo.recoverable,
      onRetry,
      onDismiss,
    } = options;

    const buttons: any[] = [];

    if (showRetry && (onRetry || errorInfo.retryAction)) {
      buttons.push({
        text: 'Retry',
        onPress: async () => {
          try {
            if (onRetry) {
              await onRetry();
            } else if (errorInfo.retryAction) {
              await errorInfo.retryAction();
            }
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        },
      });
    }

    buttons.push({
      text: 'OK',
      onPress: onDismiss,
      style: 'cancel',
    });

    Alert.alert(title, errorInfo.message, buttons);
  }

  // Log error for debugging
  private logError(errorInfo: ErrorInfo) {
    console.error('Error logged:', {
      message: errorInfo.message,
      code: errorInfo.code,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp,
      details: errorInfo.details,
    });

    // Add to error log
    this.errorLog.unshift(errorInfo);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(count: number = 10): ErrorInfo[] {
    return this.errorLog.slice(0, count);
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
  }

  // Get error statistics
  getErrorStats() {
    const total = this.errorLog.length;
    const byContext = this.errorLog.reduce((acc, error) => {
      const context = error.context || 'Unknown';
      acc[context] = (acc[context] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recoverable = this.errorLog.filter(e => e.recoverable).length;
    const nonRecoverable = total - recoverable;

    return {
      total,
      recoverable,
      nonRecoverable,
      byContext,
    };
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance();

export const handleError = (error: Error | ConstructionError, context?: string) => {
  return errorHandler.handleError(error, context);
};

export const handleApiError = (error: any, context?: string) => {
  return errorHandler.handleApiError(error, context);
};

export const handleLocationError = (error: any) => {
  return errorHandler.handleLocationError(error);
};

export const handleCameraError = (error: any) => {
  return errorHandler.handleCameraError(error);
};

export const showErrorAlert = (errorInfo: ErrorInfo, options?: any) => {
  return errorHandler.showErrorAlert(errorInfo, options);
};