// Enhanced Main App Navigator with role-based routing logic
// Requirements: 1.1, 1.2, 1.3, 14.3

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert, AppState, AppStateStatus, View, Text } from 'react-native';
import { UserRole } from '../types';
import { useAuth } from '../store/context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import WorkerNavigator from './WorkerNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import DriverNavigator from './DriverNavigator';

const Stack = createStackNavigator();

interface AppNavigatorProps {
  isAuthenticated: boolean;
  userRole?: UserRole;
}

// Navigation state persistence key
const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE';

// Role transition detection and handling
const useRoleTransitionHandler = () => {
  const { state: authState, clearRoleSpecificData, restoreAuthState } = useAuth();
  const [previousRole, setPreviousRole] = useState<UserRole | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleRoleTransition = useCallback(async (newRole: UserRole | null) => {
    if (previousRole && newRole && previousRole !== newRole) {
      console.log('Role transition detected:', { from: previousRole, to: newRole });
      
      setIsTransitioning(true);
      
      // Clear previous role contexts to prevent data leakage
      try {
        await clearRoleSpecificData();
      } catch (error) {
        console.warn('Failed to clear role-specific data during transition:', error);
      }
      
      // Show transition alert to user
      Alert.alert(
        'Role Changed',
        `Your role has been updated from ${previousRole} to ${newRole}. The app will refresh to load your new interface.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Allow time for user to read the message
              setTimeout(() => {
                setIsTransitioning(false);
              }, 1000);
            }
          }
        ]
      );
    }
    
    setPreviousRole(newRole);
  }, [previousRole, clearRoleSpecificData]);

  useEffect(() => {
    handleRoleTransition(authState.user?.role || null);
  }, [authState.user?.role, handleRoleTransition]);

  return { isTransitioning };
};

// Enhanced role detection with validation
const useRoleDetection = () => {
  const { state: authState } = useAuth();

  const detectUserRole = useCallback((): UserRole | null => {
    // Primary role source: user object
    if (authState.user?.role) {
      return authState.user.role;
    }
    
    // Fallback role source: company object (for backward compatibility)
    if (authState.company?.role) {
      return authState.company.role;
    }
    
    return null;
  }, [authState.user?.role, authState.company?.role]);

  const validateRoleAccess = useCallback((role: UserRole): boolean => {
    // Validate that the user has the necessary permissions for the role
    const rolePermissions: Record<UserRole, string[]> = {
      Worker: ['attendance', 'tasks', 'reports'],
      Supervisor: ['team_management', 'approvals', 'progress_reports'],
      Driver: ['transport_tasks', 'vehicle_info', 'trip_updates'],
    };

    const requiredPermissions = rolePermissions[role] || [];
    const userPermissions = authState.permissions || [];

    // Check if user has at least one required permission for the role
    // If user has wildcard permission (*), grant access
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    ) || userPermissions.length === 0; // Allow access if no permissions are set (for development)
  }, [authState.permissions]);

  const currentRole = detectUserRole();
  const hasValidAccess = currentRole ? validateRoleAccess(currentRole) : false;

  return { currentRole, hasValidAccess };
};

// App state management for background/foreground transitions
const useAppStateHandler = () => {
  const { restoreAuthState } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app comes to foreground, restore auth state to catch any changes
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground, restoring auth state');
        try {
          await restoreAuthState();
        } catch (error) {
          console.warn('Failed to restore auth state on app foreground:', error);
        }
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [restoreAuthState]);
};

// Enhanced navigation component with role-based routing
const RoleBasedNavigationContent: React.FC<{ 
  isAuthenticated: boolean; 
  userRole: UserRole | null;
  hasValidAccess: boolean;
  isTransitioning: boolean;
}> = ({ isAuthenticated, userRole, hasValidAccess, isTransitioning }) => {
  
  // Show loading during role transitions
  if (isTransitioning) {
    return (
      <Stack.Screen 
        name="Transitioning" 
        component={() => (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <Text style={{ fontSize: 18, color: '#666', marginBottom: 10 }}>Updating interface...</Text>
            <Text style={{ fontSize: 14, color: '#999' }}>Please wait while we load your role-specific features</Text>
          </View>
        )} 
        options={{ headerShown: false }}
      />
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <Stack.Screen 
        name="Auth" 
        component={LoginScreen} 
        options={{ 
          headerShown: false,
          // Add test ID for testing
          ...(process.env.NODE_ENV === 'test' && { testID: 'login-screen' })
        }} 
      />
    );
  }

  // Authenticated but no role or invalid access - show login with error
  if (!userRole || !hasValidAccess) {
    console.warn('User authenticated but missing valid role or access:', { userRole, hasValidAccess });
    return (
      <Stack.Screen 
        name="Auth" 
        component={LoginScreen} 
        options={{ 
          headerShown: false,
          // Add test ID for testing
          ...(process.env.NODE_ENV === 'test' && { testID: 'login-screen' })
        }}
        initialParams={{ 
          error: userRole 
            ? 'You do not have permission to access this application. Please contact your administrator.'
            : 'Your account role could not be determined. Please contact your administrator.'
        }}
      />
    );
  }

  // Role-based navigation with enhanced error handling
  switch (userRole) {
    case 'Worker':
      return (
        <Stack.Screen 
          name="WorkerApp" 
          component={WorkerNavigator} 
          options={{ 
            headerShown: false,
            // Add test ID for testing
            ...(process.env.NODE_ENV === 'test' && { testID: 'worker-navigator' })
          }}
        />
      );
    
    case 'Supervisor':
      return (
        <Stack.Screen 
          name="SupervisorApp" 
          component={SupervisorNavigator} 
          options={{ 
            headerShown: false,
            // Add test ID for testing
            ...(process.env.NODE_ENV === 'test' && { testID: 'supervisor-navigator' })
          }}
        />
      );
    
    case 'Driver':
      return (
        <Stack.Screen 
          name="DriverApp" 
          component={DriverNavigator} 
          options={{ 
            headerShown: false,
            // Add test ID for testing
            ...(process.env.NODE_ENV === 'test' && { testID: 'driver-navigator' })
          }}
        />
      );
    
    default:
      console.error('Unknown user role:', userRole);
      return (
        <Stack.Screen 
          name="Auth" 
          component={LoginScreen} 
          options={{ 
            headerShown: false,
            // Add test ID for testing
            ...(process.env.NODE_ENV === 'test' && { testID: 'login-screen' })
          }}
          initialParams={{ 
            error: `Unknown user role: ${userRole}. Please contact your administrator.`
          }}
        />
      );
  }
};

const AppNavigator: React.FC<AppNavigatorProps> = ({ isAuthenticated, userRole }) => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const { currentRole, hasValidAccess } = useRoleDetection();
  const { isTransitioning } = useRoleTransitionHandler();
  
  // Use app state handler for background/foreground transitions
  useAppStateHandler();

  // Use detected role with fallback to prop
  const effectiveRole = currentRole || userRole;

  // Enhanced logging for debugging
  useEffect(() => {
    console.log('AppNavigator state:', {
      isAuthenticated,
      propRole: userRole,
      detectedRole: currentRole,
      effectiveRole,
      hasValidAccess,
      isTransitioning,
    });
  }, [isAuthenticated, userRole, currentRole, effectiveRole, hasValidAccess, isTransitioning]);

  // Navigation state persistence (optional - can be enabled for better UX)
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      try {
        // Only restore navigation state if user is authenticated and has a valid role
        // This prevents restoring state from a different user session or role
        if (isAuthenticated && effectiveRole && hasValidAccess) {
          // Navigation state restoration can be implemented here if needed
          // const savedStateString = await AsyncStorage.getItem(`${NAVIGATION_PERSISTENCE_KEY}_${effectiveRole}`);
          // const state = savedStateString ? JSON.parse(savedStateString) : undefined;
          // setInitialState(state);
          
          console.log('Navigation ready for role:', effectiveRole);
        }
      } catch (error) {
        console.warn('Failed to restore navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, [isAuthenticated, effectiveRole, hasValidAccess]);

  // Don't render until ready
  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={initialState}
      onStateChange={(state) => {
        // Optionally persist navigation state per role to prevent cross-role state leakage
        if (effectiveRole && hasValidAccess) {
          // AsyncStorage.setItem(`${NAVIGATION_PERSISTENCE_KEY}_${effectiveRole}`, JSON.stringify(state));
        }
      }}
      onReady={() => {
        // Navigation container is ready
        console.log('Navigation container ready for role:', effectiveRole);
        
        // Set up role-specific deep linking if needed
        if (effectiveRole) {
          console.log(`Navigation ready for ${effectiveRole} role with access:`, hasValidAccess);
        }
      }}
      fallback={
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Loading navigation...</Text>
        </View>
      }
    >
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          // Enhanced screen options for better UX
          gestureEnabled: false, // Disable swipe back to prevent accidental navigation
          // Screen transition animations based on role changes
          cardStyleInterpolator: isTransitioning 
            ? ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              })
            : undefined,
          // Add role-specific styling
          cardStyle: {
            backgroundColor: effectiveRole === 'Supervisor' ? '#FFF3E0' : 
                           effectiveRole === 'Driver' ? '#E8F5E8' : '#F5F5F5'
          },
        }}
      >
        <RoleBasedNavigationContent
          isAuthenticated={isAuthenticated}
          userRole={effectiveRole || null}
          hasValidAccess={hasValidAccess}
          isTransitioning={isTransitioning}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;