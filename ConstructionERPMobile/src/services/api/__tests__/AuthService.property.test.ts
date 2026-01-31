// Property-based tests for Authentication Service
// Feature: construction-erp-mobile, Property 1: Authentication Token Management

import * as fc from 'fast-check';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../AuthService';
import { apiClient } from '../client';
import { STORAGE_KEYS } from '../../../utils/constants';

// Mock the API client
jest.mock('../client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Authentication Token Management Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage mock
    mockAsyncStorage.multiSet.mockResolvedValue();
    mockAsyncStorage.multiGet.mockResolvedValue([]);
    mockAsyncStorage.multiRemove.mockResolvedValue();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  /**
   * Property 1: Authentication Token Management
   * **Validates: Requirements 1.1, 1.2, 10.4**
   * 
   * For any valid user credentials, successful authentication should result in 
   * secure JWT token storage and automatic token attachment to all subsequent 
   * authenticated API requests
   */
  it('should store and attach JWT tokens for any valid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid login credentials
        fc.record({
          username: fc.string({ minLength: 1, maxLength: 50 }),
          password: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        // Generate valid login response
        fc.record({
          user: fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            employeeId: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            phone: fc.string({ minLength: 10, maxLength: 15 }),
            role: fc.constantFrom('worker', 'supervisor', 'driver'),
            certifications: fc.array(fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              issuer: fc.string({ minLength: 1, maxLength: 50 }),
              issueDate: fc.date(),
              expiryDate: fc.date(),
              certificateNumber: fc.string({ minLength: 1, maxLength: 20 }),
              status: fc.constantFrom('active', 'expired', 'expiring_soon'),
            }), { maxLength: 5 }),
            workPass: fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              passNumber: fc.string({ minLength: 1, maxLength: 20 }),
              issueDate: fc.date(),
              expiryDate: fc.date(),
              status: fc.constantFrom('active', 'expired', 'suspended'),
            }),
          }),
          token: fc.string({ minLength: 100, maxLength: 500 }).filter(s => 
            // Generate JWT-like tokens with 3 parts separated by dots
            s.includes('.') && s.split('.').length >= 3
          ),
          refreshToken: fc.string({ minLength: 50, maxLength: 200 }),
          expiresIn: fc.integer({ min: 300, max: 86400 }), // 5 minutes to 24 hours
        }),
        async (credentials, mockResponse) => {
          // Mock successful API response
          mockApiClient.post.mockResolvedValueOnce({
            success: true,
            data: mockResponse,
            message: 'Login successful',
          });

          // Execute login
          const result = await authService.login(credentials);

          // Verify API was called with correct credentials
          expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);

          // Verify response structure
          expect(result).toEqual(mockResponse);

          // Verify secure token storage - should store all auth data
          expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
            [STORAGE_KEYS.AUTH_TOKEN, mockResponse.token],
            [STORAGE_KEYS.REFRESH_TOKEN, mockResponse.refreshToken],
            [STORAGE_KEYS.USER_DATA, JSON.stringify(mockResponse.user)],
            [STORAGE_KEYS.TOKEN_EXPIRY, expect.any(String)],
          ]);

          // Verify token expiry calculation is correct
          const storedData = mockAsyncStorage.multiSet.mock.calls[0][0];
          const tokenExpiryCall = storedData.find(([key]) => key === STORAGE_KEYS.TOKEN_EXPIRY);
          expect(tokenExpiryCall).toBeDefined();
          
          const storedExpiry = new Date(tokenExpiryCall![1]);
          const expectedExpiry = new Date(Date.now() + mockResponse.expiresIn * 1000);
          const timeDifference = Math.abs(storedExpiry.getTime() - expectedExpiry.getTime());
          
          // Allow 1 second tolerance for execution time
          expect(timeDifference).toBeLessThan(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle token refresh correctly for any valid refresh token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          refreshToken: fc.string({ minLength: 50, maxLength: 200 }),
          newToken: fc.string({ minLength: 100, maxLength: 500 }).filter(s => 
            s.includes('.') && s.split('.').length >= 3
          ),
          expiresIn: fc.integer({ min: 300, max: 86400 }),
        }),
        async ({ refreshToken, newToken, expiresIn }) => {
          // Mock stored refresh token
          mockAsyncStorage.getItem.mockImplementation((key) => {
            if (key === STORAGE_KEYS.REFRESH_TOKEN) {
              return Promise.resolve(refreshToken);
            }
            return Promise.resolve(null);
          });

          // Mock successful refresh response
          mockApiClient.post.mockResolvedValueOnce({
            success: true,
            data: { token: newToken, expiresIn },
            message: 'Token refreshed',
          });

          // Execute token refresh
          const result = await authService.refreshToken();

          // Verify API was called with refresh token
          expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
            refreshToken,
          });

          // Verify response structure
          expect(result).toEqual({ token: newToken, expiresIn });

          // Verify token and expiry were updated in storage
          expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
            [STORAGE_KEYS.AUTH_TOKEN, newToken],
            [STORAGE_KEYS.TOKEN_EXPIRY, expect.any(String)],
          ]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear all authentication data on logout for any user state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          shouldBackendSucceed: fc.boolean(),
          hasStoredData: fc.boolean(),
        }),
        async ({ shouldBackendSucceed, hasStoredData }) => {
          // Mock backend logout response
          if (shouldBackendSucceed) {
            mockApiClient.post.mockResolvedValueOnce({
              success: true,
              data: null,
              message: 'Logged out successfully',
            });
          } else {
            mockApiClient.post.mockRejectedValueOnce(new Error('Backend logout failed'));
          }

          // Execute logout
          await authService.logout();

          // Verify backend logout was attempted
          expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');

          // Verify local storage was cleared regardless of backend response
          expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.TOKEN_EXPIRY,
          ]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly validate authentication state for any stored token data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasToken: fc.boolean(),
          hasExpiry: fc.boolean(),
          isExpired: fc.boolean(),
          shouldRefreshSucceed: fc.boolean(),
        }),
        async ({ hasToken, hasExpiry, isExpired, shouldRefreshSucceed }) => {
          const now = new Date();
          const futureDate = new Date(now.getTime() + 3600000); // 1 hour from now
          const pastDate = new Date(now.getTime() - 3600000); // 1 hour ago
          const expiry = isExpired ? pastDate : futureDate;

          // Mock stored data
          mockAsyncStorage.getItem.mockImplementation((key) => {
            switch (key) {
              case STORAGE_KEYS.AUTH_TOKEN:
                return Promise.resolve(hasToken ? 'valid.jwt.token' : null);
              case STORAGE_KEYS.TOKEN_EXPIRY:
                return Promise.resolve(hasExpiry ? expiry.toISOString() : null);
              case STORAGE_KEYS.REFRESH_TOKEN:
                return Promise.resolve('refresh-token');
              default:
                return Promise.resolve(null);
            }
          });

          // Mock refresh token response if needed
          if (isExpired && shouldRefreshSucceed) {
            mockApiClient.post.mockResolvedValueOnce({
              success: true,
              data: { token: 'new.jwt.token', expiresIn: 3600 },
            });
          } else if (isExpired && !shouldRefreshSucceed) {
            mockApiClient.post.mockRejectedValueOnce(new Error('Refresh failed'));
          }

          // Execute authentication check
          const isAuthenticated = await authService.isAuthenticated();

          // Verify expected behavior
          if (!hasToken || !hasExpiry) {
            expect(isAuthenticated).toBe(false);
          } else if (!isExpired) {
            expect(isAuthenticated).toBe(true);
          } else if (isExpired && shouldRefreshSucceed) {
            expect(isAuthenticated).toBe(true);
            expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
              refreshToken: 'refresh-token',
            });
          } else {
            expect(isAuthenticated).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle authentication errors correctly for any invalid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string(),
          password: fc.string(),
          errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
          errorCode: fc.integer({ min: 400, max: 500 }),
        }),
        async ({ username, password, errorMessage, errorCode }) => {
          // Mock API error response
          const apiError = {
            response: {
              status: errorCode,
              data: { message: errorMessage },
            },
          };
          mockApiClient.post.mockRejectedValueOnce(apiError);

          // Execute login and expect it to throw
          await expect(authService.login({ username, password })).rejects.toThrow();

          // Verify API was called
          expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', { username, password });

          // Verify no data was stored on error
          expect(mockAsyncStorage.multiSet).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});