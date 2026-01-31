// Authentication Guard Component for Protected Routes

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../store/context/AuthContext';
import { UserRole } from '../../types';
import { COLORS, UI_CONSTANTS } from '../../utils/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * AuthGuard component that protects routes based on authentication status and optional role requirements
 * 
 * Features:
 * - Checks authentication status on mount
 * - Restores auth state from storage if needed
 * - Supports role-based access control
 * - Shows loading state during auth restoration
 * - Renders fallback component for unauthenticated users
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <DefaultUnauthenticatedView />,
  requiredRole 
}) => {
  const { state, restoreAuthState } = useAuth();
  const { isAuthenticated, user, company, isLoading } = state;

  useEffect(() => {
    // Restore authentication state on component mount
    if (!isAuthenticated && !isLoading) {
      restoreAuthState();
    }
  }, [isAuthenticated, isLoading, restoreAuthState]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return <LoadingView />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check role-based access if required
  if (requiredRole && company?.role !== requiredRole) {
    return <UnauthorizedView userRole={company?.role || 'Unknown'} requiredRole={requiredRole} />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

/**
 * Default loading view shown during authentication check
 */
const LoadingView: React.FC = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
    <Text style={styles.loadingText}>Checking authentication...</Text>
  </View>
);

/**
 * Default view shown for unauthenticated users
 */
const DefaultUnauthenticatedView: React.FC = () => (
  <View style={styles.centerContainer}>
    <Text style={styles.messageText}>Please log in to access this feature</Text>
  </View>
);

/**
 * View shown when user doesn't have required role permissions
 */
interface UnauthorizedViewProps {
  userRole: string;
  requiredRole: string;
}

const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({ userRole, requiredRole }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>Access Denied</Text>
    <Text style={styles.messageText}>
      This feature requires {requiredRole} role. Your current role is {userRole}.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONSTANTS.SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    marginTop: UI_CONSTANTS.SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: UI_CONSTANTS.SPACING.SM,
    textAlign: 'center',
  },
});

export default AuthGuard;