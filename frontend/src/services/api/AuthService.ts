// Authentication Service with JWT token management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { MockApiService } from './mockApi';
import { STORAGE_KEYS, API_CONFIG } from '../../utils/constants';
import { ApiResponse, User, Company, ApiError } from '../../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  autoSelected: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  employeeId?: number;
  user?: User;
  company?: Company;
  permissions?: string[];
  // Multi-company response
  companies?: Company[];
  userId?: number;
}

export interface CompanySelectionRequest {
  userId: number;
  companyId: number;
}

export interface TokenRefreshResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  company: Company;
  permissions: string[];
}

class AuthService {
  /**
   * Authenticate user with credentials and store JWT tokens securely
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // 🔍 DEBUG: Log login attempt
      console.log('🔐 Login attempt:', {
        email: credentials.email,
        passwordLength: credentials.password.length,
        timestamp: new Date().toISOString(),
        mockMode: API_CONFIG.MOCK_MODE,
      });

      let response: ApiResponse<LoginResponse>;

      // Use mock API if in mock mode
      if (API_CONFIG.MOCK_MODE) {
        console.log('🎭 Using Mock API for login');
        response = await MockApiService.login(credentials);
      } else {
        console.log('🌐 Using Real API for login');
        try {
          response = await apiClient.post<LoginResponse>('/auth/login', credentials);
          
          // 🔍 DEBUG: Log the raw API response
          console.log('🌐 Raw API Response:', {
            fullResponse: response,
            responseData: response?.data,
            responseSuccess: response?.success,
            responseMessage: response?.message,
          });
          
        } catch (apiError: any) {
          console.error('🌐 API Call Failed:', {
            message: apiError.message,
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            url: apiError.config?.url,
          });

          // Provide more specific error messages
          if (apiError.code === 'NETWORK_ERROR' || apiError.message?.includes('Network Error')) {
            throw new Error(`Cannot connect to server at ${API_CONFIG.BASE_URL}. Please check:\n\n1. Backend server is running\n2. Network connection\n3. Firewall settings\n4. Correct IP address`);
          } else if (apiError.response?.status === 404) {
            throw new Error(`Login endpoint not found. Expected: ${API_CONFIG.BASE_URL}/auth/login`);
          } else if (apiError.response?.status === 401) {
            throw new Error(apiError.response?.data?.message || 'Invalid email or password');
          } else if (apiError.response?.status >= 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(apiError.response?.data?.message || apiError.message || 'Login failed');
          }
        }
      }
      
      // 🔍 DEBUG: Log login response
      console.log('🔐 Login response:', {
        success: response?.success,
        hasData: !!response?.data,
        autoSelected: response?.data?.autoSelected,
        hasToken: !!response?.data?.token,
        hasUser: !!response?.data?.user,
        hasCompany: !!response?.data?.company,
        companiesCount: response?.data?.companies?.length || 0,
      });

      // Validate response structure - handle different API response formats
      if (!response) {
        throw new Error('No response received from server');
      }

      // 🔍 DEBUG: Detailed response analysis
      console.log('🔍 Response Analysis:', {
        hasResponse: !!response,
        responseType: typeof response,
        responseKeys: response ? Object.keys(response) : [],
        hasData: !!response?.data,
        dataType: typeof response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        hasSuccess: 'success' in (response || {}),
        successValue: response?.success,
      });

      // Handle different response formats
      let loginData: LoginResponse;
      let isSuccess: boolean;

      // 🔍 DEBUG: Log the exact response structure
      console.log('🔍 Exact Response Structure:', {
        response,
        responseData: response?.data,
        responseDataKeys: response?.data ? Object.keys(response.data) : [],
        hasAutoSelected: response?.data?.autoSelected,
        hasToken: response?.data?.token,
        hasUser: response?.data?.user,
      });

      // Your API format: { data: { autoSelected, token, user, company, ... } }
      if (response.data && typeof response.data === 'object') {
        isSuccess = response.data.success !== false; // Assume success unless explicitly false
        loginData = response.data;
        
        console.log('🔍 Using API format: data wrapper');
      }
      // Fallback formats
      else if (response.success !== undefined && response.data) {
        isSuccess = response.success;
        loginData = response.data;
        console.log('🔍 Using API format: success + data');
      }
      else if ((response as any).token || (response as any).user) {
        isSuccess = true;
        loginData = response as any;
        console.log('🔍 Using API format: direct response');
      }
      else {
        console.error('🔍 Unrecognized response format:', response);
        throw new Error('Invalid response format from server');
      }

      if (!isSuccess) {
        throw new Error((response as any).message || (loginData as any).message || 'Login failed');
      }

      // 🔍 DEBUG: Log processed login data
      console.log('🔐 Processed login data:', {
        hasToken: !!loginData.token,
        hasUser: !!loginData.user,
        hasCompany: !!loginData.company,
        autoSelected: loginData.autoSelected,
        userEmail: loginData.user?.email,
        userRole: loginData.user?.role,
        companyRole: loginData.company?.role,
        tokenLength: loginData.token?.length,
      });

      // Handle successful login - your API has all required fields
      if (loginData.token && loginData.user) {
        const {
          user,
          company,
          token,
          refreshToken,
          expiresIn,
          permissions,
        } = loginData;

        // Create user object with role from company if not in user
        const normalizeRole = (role: string): 'Worker' | 'Supervisor' | 'Driver' => {
          const roleUpper = role?.toUpperCase();
          switch (roleUpper) {
            case 'WORKER':
              return 'Worker';
            case 'SUPERVISOR':
            case 'MANAGER':
              return 'Supervisor';
            case 'DRIVER':
              return 'Driver';
            default:
              return 'Worker'; // Default fallback
          }
        };

        const userRole = normalizeRole(user.role || company?.role || 'WORKER');
        const companyRole = normalizeRole(company?.role || 'WORKER');

        const finalUser = {
          id: user.id,
          email: user.email,
          name: user.name || user.email?.split('@')[0] || 'User', // Extract name from email if not provided
          role: userRole,
        };

        // Create company object
        const finalCompany = company ? {
          ...company,
          role: companyRole,
        } : {
          id: 1,
          name: 'Default Company',
          role: userRole
        };

        if (!user || !token) {
          console.error('🔐 Missing required fields:', {
            hasUser: !!user,
            hasToken: !!token,
            userKeys: user ? Object.keys(user) : [],
          });
          throw new Error('Invalid login response: missing user or token');
        }

        // Calculate token expiry date
        const tokenExpiry = new Date(Date.now() + (expiresIn || 3600) * 1000);

        console.log('🔐 Storing auth data:', {
          user: finalUser,
          company: finalCompany,
          tokenExpiry,
          permissionsCount: permissions?.length || 0,
        });

        // Store tokens and user data securely
        await this.storeAuthData(
          finalUser,
          finalCompany,
          token,
          refreshToken || token, // Use token as fallback
          tokenExpiry,
          permissions || []
        );

        console.log('✅ Login successful - tokens stored');

        // Return in expected format
        return {
          success: true,
          autoSelected: loginData.autoSelected || true,
          token,
          refreshToken: refreshToken || token,
          expiresIn: expiresIn || 3600,
          user: finalUser,
          company: finalCompany,
          permissions: permissions || [],
        };
      } else {
        console.error('🔐 Login data missing required fields:', {
          hasToken: !!loginData.token,
          hasUser: !!loginData.user,
          loginDataKeys: loginData ? Object.keys(loginData) : [],
        });
        throw new Error('Invalid login response: missing required authentication data');
      }
    } catch (error) {
      // 🔍 DEBUG: Log login error
      console.error('❌ Login failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        credentials: {
          email: credentials.email,
          passwordLength: credentials.password.length,
        },
        mockMode: API_CONFIG.MOCK_MODE,
      });

      // Re-throw API errors with exact backend messages
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  }

  /**
   * Select company for multi-company users
   */
  async selectCompany(userId: number, companyId: number): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/select-company', {
        userId,
        companyId,
      });
      
      if (!response.success || !response.data.token) {
        throw new Error(response.message || 'Company selection failed');
      }

      const { user, company, token, refreshToken, expiresIn, permissions } = response.data;
      
      if (!user || !company || !token || !refreshToken || !expiresIn) {
        throw new Error('Invalid company selection response data');
      }

      // Calculate token expiry date
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      // Store tokens and user data securely
      await this.storeAuthData(user, company, token, refreshToken, tokenExpiry, permissions || []);
      
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Company selection failed');
    }
  }

  /**
   * Logout user and clear all stored authentication data
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        // Call backend logout endpoint to invalidate tokens
        if (API_CONFIG.MOCK_MODE) {
          await MockApiService.logout();
        } else {
          await apiClient.post('/auth/logout', { refreshToken });
        }
      }
    } catch (error) {
      // Continue with local logout even if backend call fails
      console.warn('Backend logout failed:', error);
    } finally {
      // Always clear local storage
      await this.clearAuthData();
    }
  }

  /**
   * Refresh JWT token using stored refresh token
   */
  async refreshToken(): Promise<TokenRefreshResponse> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<TokenRefreshResponse>('/auth/refresh', {
        refreshToken,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token refresh failed');
      }

      const { token, refreshToken: newRefreshToken, expiresIn, user, company, permissions } = response.data;
      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      // Update stored auth data
      await this.storeAuthData(user, company, token, newRefreshToken, tokenExpiry, permissions);

      return response.data;
    } catch (error) {
      // If refresh fails, clear all auth data
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated with valid token
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const expiryString = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      
      if (!token || !expiryString) {
        return false;
      }

      const expiry = new Date(expiryString);
      const now = new Date();
      
      // Check if token is expired (with 5 minute buffer)
      const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (expiry.getTime() - now.getTime() < bufferTime) {
        // Try to refresh token
        try {
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Get stored company data
   */
  async getStoredCompany(): Promise<Company | null> {
    try {
      const companyData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANY_DATA);
      return companyData ? JSON.parse(companyData) : null;
    } catch (error) {
      console.error('Failed to retrieve company data:', error);
      return null;
    }
  }

  /**
   * Get stored permissions
   */
  async getStoredPermissions(): Promise<string[]> {
    try {
      const permissionsData = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      return permissionsData ? JSON.parse(permissionsData) : [];
    } catch (error) {
      console.error('Failed to retrieve permissions:', error);
      return [];
    }
  }

  /**
   * Get stored authentication tokens
   */
  async getStoredTokens(): Promise<{
    token: string | null;
    refreshToken: string | null;
    tokenExpiry: Date | null;
  }> {
    try {
      const [token, refreshToken, expiryString] = await AsyncStorage.multiGet([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);

      return {
        token: token[1],
        refreshToken: refreshToken[1],
        tokenExpiry: expiryString[1] ? new Date(expiryString[1]) : null,
      };
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return {
        token: null,
        refreshToken: null,
        tokenExpiry: null,
      };
    }
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(
    user: User,
    company: Company,
    token: string,
    refreshToken: string,
    tokenExpiry: Date,
    permissions: string[]
  ): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
        [STORAGE_KEYS.COMPANY_DATA, JSON.stringify(company)],
        [STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions)],
        [STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toISOString()],
      ]);
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Clear all stored authentication data
   */
  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.COMPANY_DATA,
        STORAGE_KEYS.PERMISSIONS,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Validate token format (basic JWT structure check)
   */
  private isValidJWTFormat(token: string): boolean {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtRegex.test(token);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;