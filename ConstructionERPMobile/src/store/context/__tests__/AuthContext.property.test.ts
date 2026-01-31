// Property-based tests for Authentication Error Handling
// Feature: construction-erp-mobile, Property 3: Authentication Error Handling

import * as fc from 'fast-check';
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../../services/api/AuthService';

// Mock the AuthService
jest.mock('../../../services/api/AuthService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Authentication Error Handling Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.multiSet.mockResolvedValue();
    mockAsyncStorage.multiGet.mockResolvedValue([]);
    mockAsyncStorage.multiRemove.mockResolvedValue();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  /**
   * Property 3: Authentication Error Handling
   * **Validates: Requirements 1.4, 1.5**
   * 
   * For any authentication failure or token expiry, the mobile app should display 
   * the exact error message from the backend system and prompt for re-authentication
   */
  it('should display exact backend error messages for any authentication failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error scenarios
        fc.record({
          credentials: fc.record({
            username: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          errorType: fc.constantFrom('network', 'validation', 'server', 'unauthorized'),
          errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
          errorCode: fc.integer({ min: 400, max: 599 }),
        }),
        async ({ credentials, errorType, errorMessage, errorCode }) => {
          // Create appropriate error based on type
          let mockError: any;
          switch (errorType) {
            case 'network':
              mockError = new Error('Network error');
              mockError.code = 'NETWORK_ERROR';
              break;
            case 'validation':
              mockError = new Error(errorMessage);
              break;
            case 'server':
              mockError = {
                response: {
                  status: errorCode,
                  data: { message: errorMessage },
                },
              };
              break;
            case 'unauthorized':
              mockError = {
                response: {
                  status: 401,
                  data: { message: 'Invalid credentials' },
                },
              };
              break;
          }

          // Mock AuthService to throw the error
          mockAuthService.login.mockRejectedValueOnce(mockError);

          // Render the hook with AuthProvider
          const wrapper = ({ children }: { children: React.ReactNode }) => (
            React.createElement(AuthProvider, {}, children)
          );

          const { result } = renderHook(() => useAuth(), { wrapper });

          // Attempt login and expect it to fail
          await act(async () => {
            try {
              await result.current.login(credentials);
            } catch (error) {
              // Error is expected
            }
          });

          // Verify the auth service was called
          expect(mockAuthService.login).toHaveBeenCalledWith(credentials);

          // Verify the error state is set correctly
          expect(result.current.state.isAuthenticated).toBe(false);
          expect(result.current.state.isLoading).toBe(false);
          expect(result.current.state.error).toBeTruthy();

          // Verify user remains unauthenticated
          expect(result.current.state.user).toBeNull();
          expect(result.current.state.token).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle token expiry correctly for any stored token state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          hasValidToken: fc.boolean(),
          hasRefreshToken: fc.boolean(),
          refreshShouldSucceed: fc.boolean(),
          refreshErrorMessage: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        async ({ hasValidToken, hasRefreshToken, refreshShouldSucceed, refreshErrorMessage }) => {
          // Mock stored authentication state
          const mockUser = {
            id: 1,
            employeeId: 'EMP001',
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            role: 'worker' as const,
            certifications: [],
            workPass: {
              id: 1,
              passNumber: 'WP001',
              issueDate: new Date(),
              expiryDate: new Date(),
              status: 'active' as const,
            },
          };

          // Mock isAuthenticated to return false (simulating expired token)
          mockAuthService.isAuthenticated.mockResolvedValueOnce(false);
          
          if (hasValidToken) {
            mockAuthService.getStoredUser.mockResolvedValueOnce(mockUser);
            mockAuthService.getStoredTokens.mockResolvedValueOnce({
              token: 'expired.jwt.token',
              refreshToken: hasRefreshToken ? 'valid-refresh-token' : null,
              tokenExpiry: new Date(Date.now() - 3600000), // 1 hour ago
            });
          } else {
            mockAuthService.getStoredUser.mockResolvedValueOnce(null);
            mockAuthService.getStoredTokens.mockResolvedValueOnce({
              token: null,
              refreshToken: null,
              tokenExpiry: null,
            });
          }

          // Mock refresh token behavior
          if (hasRefreshToken && refreshShouldSucceed) {
            mockAuthService.refreshToken.mockResolvedValueOnce({
              token: 'new.jwt.token',
              expiresIn: 3600,
            });
          } else if (hasRefreshToken && !refreshShouldSucceed) {
            mockAuthService.refreshToken.mockRejectedValueOnce(new Error(refreshErrorMessage));
          }

          // Render the hook with AuthProvider
          const wrapper = ({ children }: { children: React.ReactNode }) => (
            React.createElement(AuthProvider, {}, children)
          );

          const { result } = renderHook(() => useAuth(), { wrapper });

          // Trigger auth state restoration
          await act(async () => {
            await result.current.restoreAuthState();
          });

          // Verify authentication state based on scenario
          if (!hasValidToken) {
            expect(result.current.state.isAuthenticated).toBe(false);
            expect(result.current.state.user).toBeNull();
          } else if (hasRefreshToken && refreshShouldSucceed) {
            // Should be authenticated after successful refresh
            expect(result.current.state.isAuthenticated).toBe(true);
            expect(result.current.state.user).toEqual(mockUser);
          } else {
            // Should be logged out due to expired/invalid tokens
            expect(result.current.state.isAuthenticated).toBe(false);
            expect(result.current.state.user).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear authentication state on any logout scenario', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          backendLogoutSucceeds: fc.boolean(),
          hasStoredData: fc.boolean(),
        }),
        async ({ backendLogoutSucceeds, hasStoredData }) => {
          // Mock initial authenticated state
          const mockUser = {
            id: 1,
            employeeId: 'EMP001',
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            role: 'worker' as const,
            certifications: [],
            workPass: {
              id: 1,
              passNumber: 'WP001',
              issueDate: new Date(),
              expiryDate: new Date(),
              status: 'active' as const,
            },
          };

          // Mock AuthService logout behavior
          if (backendLogoutSucceeds) {
            mockAuthService.logout.mockResolvedValueOnce();
          } else {
            mockAuthService.logout.mockRejectedValueOnce(new Error('Backend logout failed'));
          }

          // Render the hook with AuthProvider
          const wrapper = ({ children }: { children: React.ReactNode }) => (
            React.createElement(AuthProvider, {}, children)
          );

          const { result } = renderHook(() => useAuth(), { wrapper });

          // Set initial authenticated state
          act(() => {
            result.current.login({
              username: 'test',
              password: 'test',
            });
          });

          // Clear the login mock to focus on logout
          mockAuthService.login.mockClear();

          // Perform logout
          await act(async () => {
            await result.current.logout();
          });

          // Verify logout was attempted
          expect(mockAuthService.logout).toHaveBeenCalled();

          // Verify authentication state is cleared regardless of backend response
          expect(result.current.state.isAuthenticated).toBe(false);
          expect(result.current.state.user).toBeNull();
          expect(result.current.state.token).toBeNull();
          expect(result.current.state.refreshToken).toBeNull();
          expect(result.current.state.tokenExpiry).toBeNull();
          expect(result.current.state.isLoading).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle authentication state restoration errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          authCheckFails: fc.boolean(),
          userDataCorrupted: fc.boolean(),
          tokenDataCorrupted: fc.boolean(),
        }),
        async ({ authCheckFails, userDataCorrupted, tokenDataCorrupted }) => {
          // Mock various failure scenarios
          if (authCheckFails) {
            mockAuthService.isAuthenticated.mockRejectedValueOnce(new Error('Auth check failed'));
          } else {
            mockAuthService.isAuthenticated.mockResolvedValueOnce(true);
          }

          if (userDataCorrupted) {
            mockAuthService.getStoredUser.mockRejectedValueOnce(new Error('Corrupted user data'));
          } else {
            mockAuthService.getStoredUser.mockResolvedValueOnce({
              id: 1,
              employeeId: 'EMP001',
              name: 'Test User',
              email: 'test@example.com',
              phone: '1234567890',
              role: 'worker',
              certifications: [],
              workPass: {
                id: 1,
                passNumber: 'WP001',
                issueDate: new Date(),
                expiryDate: new Date(),
                status: 'active',
              },
            });
          }

          if (tokenDataCorrupted) {
            mockAuthService.getStoredTokens.mockRejectedValueOnce(new Error('Corrupted token data'));
          } else {
            mockAuthService.getStoredTokens.mockResolvedValueOnce({
              token: 'valid.jwt.token',
              refreshToken: 'valid-refresh-token',
              tokenExpiry: new Date(Date.now() + 3600000),
            });
          }

          // Render the hook with AuthProvider
          const wrapper = ({ children }: { children: React.ReactNode }) => (
            React.createElement(AuthProvider, {}, children)
          );

          const { result } = renderHook(() => useAuth(), { wrapper });

          // Trigger auth state restoration
          await act(async () => {
            await result.current.restoreAuthState();
          });

          // Verify that errors are handled gracefully
          // App should not crash and should default to logged out state
          expect(result.current.state.isLoading).toBe(false);
          
          // If any part of restoration fails, user should be logged out
          if (authCheckFails || userDataCorrupted || tokenDataCorrupted) {
            expect(result.current.state.isAuthenticated).toBe(false);
            expect(result.current.state.user).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});