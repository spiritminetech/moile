// Higher-Order Component for Authentication Guard

import React from 'react';
import { AuthGuard } from './AuthGuard';
import { UserRole } from '../../types';

interface WithAuthGuardOptions {
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

/**
 * Higher-order component that wraps a component with authentication guard
 * 
 * Usage:
 * const ProtectedScreen = withAuthGuard(MyScreen, { requiredRole: 'worker' });
 * 
 * @param WrappedComponent - The component to protect
 * @param options - Authentication guard options
 * @returns Protected component wrapped with AuthGuard
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthGuardOptions = {}
) {
  const { requiredRole, fallback } = options;

  const AuthGuardedComponent: React.FC<P> = (props) => {
    return (
      <AuthGuard requiredRole={requiredRole} fallback={fallback}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };

  // Set display name for debugging
  AuthGuardedComponent.displayName = `withAuthGuard(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return AuthGuardedComponent;
}

export default withAuthGuard;