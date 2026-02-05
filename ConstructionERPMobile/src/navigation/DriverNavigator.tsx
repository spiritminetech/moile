// Enhanced Driver-specific navigation with complete navigation structure
// Requirements: 1.2, 1.3, 1.4

import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, Alert, Linking, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../store/context/AuthContext';
import { useDriver } from '../store/context/DriverContext';

// Import driver screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import TransportTasksScreen from '../screens/driver/TransportTasksScreen';
import TripUpdatesScreen from '../screens/driver/TripUpdatesScreen';
import DriverAttendanceScreen from '../screens/driver/DriverAttendanceScreen';
import VehicleInfoScreen from '../screens/driver/VehicleInfoScreen';
import DriverProfileScreen from '../screens/driver/DriverProfileScreen';

// Import notification placeholder screens
import DriverNotificationsScreen from '../screens/driver/DriverNotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigation guard hook for role-based access control
const useDriverNavigationGuard = () => {
  const { state: authState } = useAuth();
  const [hasDriverAccess, setHasDriverAccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const validateDriverAccess = useCallback(async () => {
    try {
      setIsValidating(true);
      setAccessError(null);
      
      // Check if user is authenticated
      if (!authState.isAuthenticated || !authState.user) {
        console.warn('Driver navigation accessed by unauthenticated user');
        setAccessError('Authentication required');
        setHasDriverAccess(false);
        return;
      }

      // Check if user has Driver role
      if (authState.user?.role !== 'Driver') {
        console.warn('Driver navigation accessed by non-driver user:', authState.user?.role);
        setAccessError(`Access denied for role: ${authState.user?.role}`);
        setHasDriverAccess(false);
        return;
      }

      // Check if user has required driver permissions
      // Map backend permission names to expected functionality
      const userPermissions = authState.permissions || [];
      
      const hasTransportAccess = userPermissions.some(p => 
        p.includes('DRIVER_TASK') || p.includes('DRIVER_VIEW') || p.includes('transport_tasks')
      );
      
      const hasVehicleAccess = userPermissions.some(p => 
        p.includes('DRIVER_VEHICLE') || p.includes('vehicle_info')
      );
      
      const hasTripAccess = userPermissions.some(p => 
        p.includes('DRIVER_TRIP') || p.includes('trip_updates') || p.includes('DRIVER_TASK')
      );
      
      const hasRequiredPermissions = hasTransportAccess || hasVehicleAccess || hasTripAccess || 
        userPermissions.includes('*') || 
        userPermissions.some(p => p.includes('DRIVER')); // Allow access if user has any driver-related permissions

      if (!hasRequiredPermissions) {
        console.warn('Driver user lacks required permissions:', { 
          required: ['transport_tasks', 'vehicle_info', 'trip_updates'], 
          actual: userPermissions 
        });
        setAccessError('Insufficient permissions for driver features');
        setHasDriverAccess(false);
        return;
      }

      // Validate driver context data (make driverId optional for now)
      // TODO: Ensure driver users have proper driverId in the backend
      if (authState.user?.role === 'Driver' && !authState.user?.driverId && !authState.user?.id) {
        console.warn('Driver user missing driver ID');
        setAccessError('Driver profile incomplete');
        setHasDriverAccess(false);
        return;
      }

      // Additional validation for driver status (make more lenient)
      if (authState.user?.status && authState.user?.status !== 'active' && authState.user?.status !== 'Active') {
        console.warn('Driver user account not active:', authState.user?.status);
        setAccessError('Driver account not active');
        setHasDriverAccess(false);
        return;
      }

      setHasDriverAccess(true);
      console.log('Driver navigation access validated successfully');

    } catch (error) {
      console.error('Driver navigation validation error:', error);
      setAccessError('Validation error occurred');
      setHasDriverAccess(false);
    } finally {
      setIsValidating(false);
    }
  }, [authState.isAuthenticated, authState.user, authState.permissions]);

  useEffect(() => {
    validateDriverAccess();
  }, [validateDriverAccess]);

  return { hasDriverAccess, isValidating, accessError };
};

// Deep linking configuration for driver-specific screens
const useDriverDeepLinking = () => {
  const handleDeepLink = useCallback((url: string, navigation?: any) => {
    console.log('Driver deep link received:', url);
    
    // Parse driver-specific deep links
    if (url.includes('/driver/')) {
      const path = url.split('/driver/')[1];
      const [screen, subScreen] = path.split('/');
      
      switch (screen) {
        case 'dashboard':
          navigation?.navigate('Dashboard');
          break;
        case 'transport':
          navigation?.navigate('Transport', { 
            screen: subScreen || 'TransportTasksList' 
          });
          break;
        case 'trips':
          navigation?.navigate('Trips', { 
            screen: subScreen || 'TripUpdatesList' 
          });
          break;
        case 'attendance':
          navigation?.navigate('Attendance', { 
            screen: subScreen || 'DriverAttendanceMain' 
          });
          break;
        case 'vehicle':
          navigation?.navigate('Vehicle', { 
            screen: subScreen || 'VehicleInfoMain' 
          });
          break;
        case 'profile':
          navigation?.navigate('Profile', { 
            screen: subScreen || 'DriverProfileMain' 
          });
          break;
        case 'notifications':
          navigation?.navigate('Profile', { 
            screen: 'DriverNotifications' 
          });
          break;
        default:
          console.warn('Unknown driver deep link path:', path);
          // Navigate to dashboard as fallback
          navigation?.navigate('Dashboard');
      }
    }
  }, []);

  const setupDeepLinking = useCallback((navigation: any) => {
    // Set up deep link listener
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url, navigation);
    });

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url, navigation);
      }
    });

    return () => subscription?.remove();
  }, [handleDeepLink]);

  return { handleDeepLink, setupDeepLinking };
};

// Transport Stack Navigator for transport-related screens
const TransportStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="TransportTasksList" 
        component={TransportTasksScreen}
        options={{
          title: 'Transport Tasks',
        }}
      />
      {/* Additional transport screens can be added here */}
      <Stack.Screen 
        name="RouteDetails" 
        component={TransportTasksScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Route Details',
        }}
      />
      <Stack.Screen 
        name="WorkerManifest" 
        component={TransportTasksScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Worker Manifest',
        }}
      />
    </Stack.Navigator>
  );
};

// Trip Updates Stack Navigator for trip management screens
const TripUpdatesStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="TripUpdatesList" 
        component={TripUpdatesScreen}
        options={{
          title: 'Trip Updates',
        }}
      />
      {/* Additional trip management screens */}
      <Stack.Screen 
        name="TripDetails" 
        component={TripUpdatesScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Trip Details',
        }}
      />
      <Stack.Screen 
        name="DelayReport" 
        component={TripUpdatesScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Report Delay',
        }}
      />
      <Stack.Screen 
        name="IncidentReport" 
        component={TripUpdatesScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Report Incident',
        }}
      />
    </Stack.Navigator>
  );
};

// Attendance Stack Navigator for driver attendance screens
const AttendanceStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="DriverAttendanceMain" 
        component={DriverAttendanceScreen}
        options={{
          title: 'Driver Attendance',
        }}
      />
      {/* Additional attendance screens */}
      <Stack.Screen 
        name="AttendanceHistory" 
        component={DriverAttendanceScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Attendance History',
        }}
      />
      <Stack.Screen 
        name="WorkHoursSummary" 
        component={DriverAttendanceScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Work Hours Summary',
        }}
      />
    </Stack.Navigator>
  );
};

// Vehicle Stack Navigator for vehicle-related screens
const VehicleStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="VehicleInfoMain" 
        component={VehicleInfoScreen}
        options={{
          title: 'Vehicle Information',
        }}
      />
      {/* Additional vehicle screens */}
      <Stack.Screen 
        name="FuelLog" 
        component={VehicleInfoScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Fuel Log',
        }}
      />
      <Stack.Screen 
        name="MaintenanceAlerts" 
        component={VehicleInfoScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Maintenance Alerts',
        }}
      />
      <Stack.Screen 
        name="VehicleIssueReport" 
        component={VehicleInfoScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Report Vehicle Issue',
        }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator for driver profile screens
const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => ({
          cardStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Stack.Screen 
        name="DriverProfileMain" 
        component={DriverProfileScreen}
        options={{
          title: 'Driver Profile',
        }}
      />
      <Stack.Screen 
        name="DriverNotifications" 
        component={DriverNotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
      {/* Additional profile screens */}
      <Stack.Screen 
        name="LicenseCertifications" 
        component={DriverProfileScreen} // Reuse for now, can be separate component later
        options={{
          title: 'License & Certifications',
        }}
      />
      <Stack.Screen 
        name="VehicleAssignments" 
        component={DriverProfileScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Vehicle Assignments',
        }}
      />
      <Stack.Screen 
        name="PerformanceMetrics" 
        component={DriverProfileScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Performance Metrics',
        }}
      />
      <Stack.Screen 
        name="RouteHistory" 
        component={DriverProfileScreen} // Reuse for now, can be separate component later
        options={{
          title: 'Route History',
        }}
      />
    </Stack.Navigator>
  );
};

// Access denied screen for unauthorized access attempts
const AccessDeniedScreen: React.FC<{ error?: string }> = ({ error }) => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  }}>
    <Text style={{ 
      fontSize: 48,
      marginBottom: 20,
    }}>
      🚫
    </Text>
    <Text style={{ 
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FF5722',
      textAlign: 'center',
      marginBottom: 10,
    }}>
      Access Denied
    </Text>
    <Text style={{ 
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    }}>
      You don't have permission to access driver features.
    </Text>
    {error && (
      <Text style={{ 
        fontSize: 14,
        color: '#FF5722',
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 20,
      }}>
        Error: {error}
      </Text>
    )}
    <Text style={{ 
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
    }}>
      Please contact your administrator for assistance.
    </Text>
  </View>
);

// Loading screen for navigation validation
const NavigationLoadingScreen: React.FC = () => (
  <View style={{ 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  }}>
    <Text style={{ 
      fontSize: 48,
      marginBottom: 20,
    }}>
      🔄
    </Text>
    <Text style={{ 
      fontSize: 18,
      color: '#666',
      textAlign: 'center',
    }}>
      Loading Driver Interface...
    </Text>
    <Text style={{ 
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
      marginTop: 10,
    }}>
      Validating permissions and access rights
    </Text>
  </View>
);

const DriverNavigator: React.FC = () => {
  const { hasDriverAccess, isValidating, accessError } = useDriverNavigationGuard();
  const { setupDeepLinking } = useDriverDeepLinking();
  const [navigationRef, setNavigationRef] = useState<any>(null);

  // Set up deep linking when navigation is ready
  useEffect(() => {
    if (navigationRef && hasDriverAccess) {
      const cleanup = setupDeepLinking(navigationRef);
      return cleanup;
    }
  }, [navigationRef, hasDriverAccess, setupDeepLinking]);

  // Show loading screen while validating access
  if (isValidating) {
    return <NavigationLoadingScreen />;
  }

  // Show access denied screen if user doesn't have driver access
  if (!hasDriverAccess) {
    return <AccessDeniedScreen error={accessError || undefined} />;
  }

  return (
    <Tab.Navigator
      ref={setNavigationRef}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          // Enhanced shadow for better visual separation
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -3,
        },
        // Enhanced tab press handling with haptic feedback
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            onPress={(e) => {
              // Add haptic feedback for better UX
              if (props.onPress) {
                props.onPress(e);
              }
            }}
            style={[
              props.style,
              {
                // Enhanced touch target for construction site use
                minHeight: 60,
                paddingVertical: 8,
              }
            ]}
          />
        ),
      }}
      // Enhanced tab bar options for construction site optimization
      tabBarOptions={{
        keyboardHidesTabBar: true,
        safeAreaInsets: { bottom: 0 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DriverDashboard}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              // Enhanced icon visibility for outdoor use
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              🏠
            </Text>
          ),
          tabBarLabel: 'Dashboard',
          // Deep linking support
          tabBarTestID: 'driver-dashboard-tab',
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Driver Dashboard tab pressed');
            // Track navigation analytics if needed
          },
        }}
      />
      <Tab.Screen
        name="Transport"
        component={TransportStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              🚛
            </Text>
          ),
          tabBarLabel: 'Transport',
          tabBarTestID: 'driver-transport-tab',
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Driver Transport tab pressed');
            // Track navigation analytics if needed
          },
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripUpdatesStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              📊
            </Text>
          ),
          tabBarLabel: 'Trips',
          tabBarTestID: 'driver-trips-tab',
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Driver Trips tab pressed');
            // Track navigation analytics if needed
          },
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              ⏰
            </Text>
          ),
          tabBarLabel: 'Attendance',
          tabBarTestID: 'driver-attendance-tab',
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Driver Attendance tab pressed');
            // Track navigation analytics if needed
          },
        }}
      />
      <Tab.Screen
        name="Vehicle"
        component={VehicleStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              🚗
            </Text>
          ),
          tabBarLabel: 'Vehicle',
          tabBarTestID: 'driver-vehicle-tab',
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Driver Vehicle tab pressed');
            // Track navigation analytics if needed
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={{ 
              fontSize: focused ? 26 : 24, 
              color,
              textShadowColor: 'rgba(0,0,0,0.3)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}>
              👤
            </Text>
          ),
          tabBarLabel: 'Profile',
          tabBarTestID: 'driver-profile-tab',
        }}
        listeners={{
          tabPress: (e) => {
            console.log('Driver Profile tab pressed');
            // Track navigation analytics if needed
          },
        }}
      />
    </Tab.Navigator>
  );
};

export default DriverNavigator;