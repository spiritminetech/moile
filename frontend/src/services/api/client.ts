// API Client configuration with Axios

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import { ApiResponse, ApiError } from '../../types';
import { networkLogger } from '../../utils/networkLogger';
import { handleApiError } from '../../utils/errorHandling/ErrorHandler';

// Extend Axios config to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        // 🔧 CACHE PREVENTION: Force fresh data on every request
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add JWT token and log requests
    this.instance.interceptors.request.use(
      async (config) => {
        const startTime = Date.now();
        config.metadata = { startTime }; // Store start time for duration calculation

        try {
          const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to retrieve auth token:', error);
        }

        // 🔍 DEBUG: Log outgoing requests
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          headers: config.headers,
          data: config.data,
          params: config.params,
        });

        // Network logger
        networkLogger.log({
          method: config.method?.toUpperCase() || 'GET',
          url: `${config.baseURL}${config.url}`,
          requestHeaders: config.headers,
          requestData: config.data,
        });

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        networkLogger.log({
          method: 'UNKNOWN',
          url: 'UNKNOWN',
          error: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = response.config.metadata?.startTime 
          ? Date.now() - response.config.metadata.startTime 
          : undefined;

        // 🔍 DEBUG: Log successful responses
        console.log('✅ API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data,
          headers: response.headers,
          duration: duration ? `${duration}ms` : 'unknown',
        });

        // Network logger
        networkLogger.log({
          method: response.config.method?.toUpperCase() || 'GET',
          url: `${response.config.baseURL}${response.config.url}`,
          responseStatus: response.status,
          responseData: response.data,
          responseHeaders: response.headers,
          duration,
        });

        return response;
      },
      async (error) => {
        const duration = error.config?.metadata?.startTime 
          ? Date.now() - error.config.metadata.startTime 
          : undefined;

        // Check if this is a "NO_TASKS_ASSIGNED" case - this is a valid empty state, not an error
        const isNoTasksAssigned = error.response?.data?.error === 'NO_TASKS_ASSIGNED';
        
        // Check if this is an "ANOTHER_TASK_ACTIVE" case - this is a confirmation prompt, not an error
        const isAnotherTaskActive = error.response?.data?.error === 'ANOTHER_TASK_ACTIVE';
        
        // Check if this is an "ATTENDANCE_REQUIRED" case - this is a validation message, not an error
        const isAttendanceRequired = error.response?.data?.error === 'ATTENDANCE_REQUIRED';
        
        // Check if this is a "ROUTE_START_LOCATION_NOT_APPROVED" case - this is a validation message
        const isLocationValidation = error.response?.data?.error === 'ROUTE_START_LOCATION_NOT_APPROVED';
        
        // Check if this is an "INVALID_STATUS_TRANSITION" case - this is a validation message
        const isStatusValidation = error.response?.data?.error === 'INVALID_STATUS_TRANSITION';

        // 🔍 DEBUG: Log error responses (but use info level for expected business logic responses)
        if (isNoTasksAssigned) {
          console.log('ℹ️ API Info:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
            message: 'No tasks assigned for today (valid empty state)',
            duration: duration ? `${duration}ms` : 'unknown',
          });
        } else if (isAnotherTaskActive) {
          console.log('ℹ️ API Info:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
            message: 'Another task is active - requires user confirmation',
            duration: duration ? `${duration}ms` : 'unknown',
          });
        } else if (isAttendanceRequired || isLocationValidation || isStatusValidation) {
          console.log('ℹ️ API Validation:', {
            status: error.response?.status,
            url: error.config?.url,
            validation: error.response?.data?.error,
            message: error.response?.data?.message,
            duration: duration ? `${duration}ms` : 'unknown',
          });
        } else {
          console.error('❌ API Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            data: error.response?.data,
            message: error.message,
            duration: duration ? `${duration}ms` : 'unknown',
          });
        }

        // Network logger (don't log expected business logic responses as errors)
        if (!isNoTasksAssigned && !isAnotherTaskActive && !isAttendanceRequired && !isLocationValidation && !isStatusValidation) {
          networkLogger.log({
            method: error.config?.method?.toUpperCase() || 'GET',
            url: error.config ? `${error.config.baseURL}${error.config.url}` : 'UNKNOWN',
            responseStatus: error.response?.status,
            responseData: error.response?.data,
            error: error.message,
            duration,
          });
        }

        if (error.response?.status === 401) {
          // Token expired or invalid
          await this.handleTokenExpiry();
        }
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async handleTokenExpiry(): Promise<void> {
    try {
      // Clear stored tokens
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.COMPANY_DATA,
        STORAGE_KEYS.PERMISSIONS,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);
      
      // Note: In a real app, you might want to trigger a navigation to login screen
      // or attempt token refresh here. The AuthService handles token refresh logic.
    } catch (error) {
      console.error('Failed to handle token expiry:', error);
    }
  }

  private formatError(error: any): ApiError {
    // Use the comprehensive error handler
    const errorInfo = handleApiError(error, 'API Client');
    
    // Provide more user-friendly error messages
    let userMessage = errorInfo.message;
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      userMessage = 'Network connection error. Please check your internet connection and try again.';
    } else if (error.response?.status === 401) {
      userMessage = 'Your session has expired. Please log in again.';
    } else if (error.response?.status === 403) {
      // Check if there's a specific error message from the API
      const apiMessage = error.response?.data?.message;
      const apiDetails = error.response?.data?.details?.message;
      
      // Use the API's specific message if available, otherwise use generic message
      if (apiDetails) {
        userMessage = apiDetails;
      } else if (apiMessage && apiMessage !== 'Forbidden') {
        userMessage = apiMessage;
      } else {
        userMessage = 'Access denied. Please contact your supervisor.';
      }
    } else if (error.response?.status === 404) {
      // Check if this is a "NO_TASKS_ASSIGNED" case - this is a valid empty state, not an error
      const errorCode = error.response?.data?.error;
      if (errorCode === 'NO_TASKS_ASSIGNED') {
        // Pass through the original error message so the hook can handle it properly
        userMessage = error.response?.data?.message || 'No tasks assigned for today';
      } else {
        userMessage = 'The requested information was not found. Please contact support.';
      }
    } else if (error.response?.status >= 500) {
      userMessage = 'Server error. Please try again later or contact support if the problem persists.';
    } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      userMessage = 'Request timed out. Please check your connection and try again.';
    }
    
    return {
      message: userMessage,
      code: errorInfo.code?.toString() || 'UNKNOWN_ERROR',
      details: errorInfo.details,
    };
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get(url, config);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        // Already wrapped in ApiResponse format
        return response.data as ApiResponse<T>;
      } else {
        // Direct data response - wrap it
        return {
          success: true,
          data: response.data as T,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post(url, data, config);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        // Already wrapped in ApiResponse format
        return response.data as ApiResponse<T>;
      } else {
        // Direct data response - wrap it
        return {
          success: true,
          data: response.data as T,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put(url, data, config);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        // Already wrapped in ApiResponse format
        return response.data as ApiResponse<T>;
      } else {
        // Direct data response - wrap it
        return {
          success: true,
          data: response.data as T,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete(url, config);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        // Already wrapped in ApiResponse format
        return response.data as ApiResponse<T>;
      } else {
        // Direct data response - wrap it
        return {
          success: true,
          data: response.data as T,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // File upload method with extended timeout
  async uploadFile<T>(url: string, file: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      console.log('📤 Starting file upload to:', url);
      const uploadStartTime = Date.now();
      
      const response = await this.instance.post(url, file, {
        ...config,
        timeout: API_CONFIG.UPLOAD_TIMEOUT, // Use extended timeout for uploads
        headers: {
          ...config?.headers,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}% (${progressEvent.loaded}/${progressEvent.total} bytes)`);
          }
        },
      });
      
      const uploadDuration = Date.now() - uploadStartTime;
      console.log(`✅ File upload completed in ${uploadDuration}ms`);
      
      // Handle both wrapped and unwrapped responses
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        // Already wrapped in ApiResponse format
        return response.data as ApiResponse<T>;
      } else {
        // Direct data response - wrap it
        return {
          success: true,
          data: response.data as T,
        };
      }
    } catch (error: any) {
      console.error('❌ File upload failed:', error.message);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('⏱️ Upload timeout - file may be too large or connection too slow');
      }
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;