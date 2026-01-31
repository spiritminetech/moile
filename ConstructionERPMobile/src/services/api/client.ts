// API Client configuration with Axios

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, STORAGE_KEYS } from '../../utils/constants';
import { ApiResponse, ApiError } from '../../types';
import { networkLogger } from '../../utils/networkLogger';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
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

        // 🔍 DEBUG: Log error responses
        console.error('❌ API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
          message: error.message,
          duration: duration ? `${duration}ms` : 'unknown',
        });

        // Network logger
        networkLogger.log({
          method: error.config?.method?.toUpperCase() || 'GET',
          url: error.config ? `${error.config.baseURL}${error.config.url}` : 'UNKNOWN',
          responseStatus: error.response?.status,
          responseData: error.response?.data,
          error: error.message,
          duration,
        });

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
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || `Server error: ${error.response.status} ${error.response.statusText}`,
        code: error.response.status.toString(),
        details: error.response.data,
      };
    } else if (error.request) {
      // Network error - no response received
      return {
        message: `Cannot connect to server. Please check:\n• Backend server is running\n• Network connection\n• Firewall settings\n• API URL: ${error.config?.baseURL || 'Unknown'}`,
        code: 'NETWORK_ERROR',
        details: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        },
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: error,
      };
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // File upload method
  async uploadFile<T>(url: string, file: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, file, {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;