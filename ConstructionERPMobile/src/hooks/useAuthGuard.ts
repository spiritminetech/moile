// Custom hook for authentication guard logic

import { useEffect, useState } from 'react';
import { useAuth } from '../store/context/AuthContext';
import { UserRole } from '../types';

interface UseAuthGuardOptions {
  requiredRole?: UserRole;
  redirectOnFailure?: boolean;
}

interface AuthGuardState {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  user: any;
  error: string | null;
}

/**
 * Custom hook that provides authentication guard functionality
 * 
 * @param options - Configuration options for the auth guard
 * @returns Authentication and authorization state
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}): AuthGuardState => {
  const { requiredRole, redirectOnFailure = false } = options;
  const { state, restoreAuthState } = useAuth();
  const [hasRestoredAuth, setHasRestoredAuth] = useState(false);

  useEffect(() => {
    // Restore authentication state on first load
    if (!state.isAuthenticated && !state.isLoading && !hasRestoredAuth) {
      restoreAuthState().finally(() => {
        setHasRestoredAuth(true);
      });
    }
  }, [state.isAuthenticated, state.isLoading, hasRestoredAuth, restoreAuthState]);

  // Calculate authorization status
  const isAuthorized = !requiredRole || (state.company?.role === requiredRole);

  // Handle redirect on failure (if navigation is available)
  useEffect(() => {
    if (redirectOnFailure && hasRestoredAuth && !state.isLoading) {
      if (!state.isAuthenticated) {
        // Could trigger navigation to login screen here
        console.log('Redirect to login required');
      } else if (!isAuthorized) {
        // Could trigger navigation to unauthorized screen here
        console.log('Redirect to unauthorized screen required');
      }
    }
  }, [redirectOnFailure, hasRestoredAuth, state.isAuthenticated, state.isLoading, isAuthorized]);

  return {
    isAuthenticated: state.isAuthenticated,
    isAuthorized,
    isLoading: state.isLoading || !hasRestoredAuth,
    user: state.user,
    error: state.error || null,
  };
};

/**
 * Hook to check if current user has specific role
 */
export const useHasRole = (role: UserRole): boolean => {
  const { state } = useAuth();
  return state.company?.role === role;
};

/**
 * Hook to check if current user has any of the specified roles
 */
export const useHasAnyRole = (roles: UserRole[]): boolean => {
  const { state } = useAuth();
  return roles.includes(state.company?.role as UserRole);
};

/**
 * Hook to get current user's permissions based on role
 */
export const useUserPermissions = () => {
  const { state } = useAuth();
  const userRole = state.company?.role;

  const permissions = {
    canViewDashboard: true,
    canManageAttendance: true,
    canViewTasks: true,
    canSubmitReports: true,
    canMakeRequests: true,
    canViewProfile: true,
    
    // Supervisor permissions
    canManageTeam: userRole === 'Supervisor',
    canApproveRequests: userRole === 'Supervisor',
    canAssignTasks: userRole === 'Supervisor',
    
    // Driver permissions
    canManageTransport: userRole === 'Driver',
    canViewRoutes: userRole === 'Driver',
  };

  return permissions;
};

export default useAuthGuard;