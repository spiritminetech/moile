// Main App Navigator with role-based routing

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { UserRole } from '../types';
import LoginScreen from '../screens/auth/LoginScreen';
import WorkerNavigator from './WorkerNavigator';
import SupervisorNavigator from './SupervisorNavigator';
import DriverNavigator from './DriverNavigator';

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
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <>
            {userRole === 'Worker' && (
              <Stack.Screen name="WorkerApp" component={WorkerNavigator} />
            )}
            {userRole === 'Supervisor' && (
              <Stack.Screen name="SupervisorApp" component={SupervisorNavigator} />
            )}
            {userRole === 'Driver' && (
              <Stack.Screen name="DriverApp" component={DriverNavigator} />
            )}
            {!userRole && (
              <Stack.Screen name="Auth" component={LoginScreen} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;