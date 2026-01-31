// Main App Navigator with role-based routing

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserRole } from '../types';
import LoginScreenSimple from '../screens/auth/LoginScreenSimple';
import WorkerDashboard from '../screens/worker/WorkerDashboard';
import SupervisorDashboard from '../screens/supervisor/SupervisorDashboard';
import DriverDashboard from '../screens/driver/DriverDashboard';

const Stack = createStackNavigator();

interface AppNavigatorProps {
  isAuthenticated: boolean;
  userRole?: UserRole;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ isAuthenticated, userRole }) => {
  console.log('AppNavigator props:', { isAuthenticated, userRole });
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginScreenSimple} />
        ) : (
          <>
            {userRole === 'Worker' && (
              <Stack.Screen name="WorkerApp" component={WorkerDashboard} />
            )}
            {userRole === 'Supervisor' && (
              <Stack.Screen name="SupervisorApp" component={SupervisorDashboard} />
            )}
            {userRole === 'Driver' && (
              <Stack.Screen name="DriverApp" component={DriverDashboard} />
            )}
            {!userRole && (
              <Stack.Screen name="Auth" component={LoginScreenSimple} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;