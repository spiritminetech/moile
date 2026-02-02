// Unit tests for AppNavigator role-based routing

import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../AppNavigator';
import { UserRole } from '../../types';

// Mock the navigation components
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ component: Component }: { component: React.ComponentType }) => <Component />,
  }),
}));

// Mock the screen components
jest.mock('../WorkerNavigator', () => {
  const { View, Text } = require('react-native');
  return function WorkerNavigator() {
    return <View testID="worker-navigator"><Text>Worker Navigator</Text></View>;
  };
});

jest.mock('../SupervisorNavigator', () => {
  const { View, Text } = require('react-native');
  return function SupervisorNavigator() {
    return <View testID="supervisor-navigator"><Text>Supervisor Navigator</Text></View>;
  };
});

jest.mock('../DriverNavigator', () => {
  const { View, Text } = require('react-native');
  return function DriverNavigator() {
    return <View testID="driver-navigator"><Text>Driver Navigator</Text></View>;
  };
});

jest.mock('../../screens/auth/LoginScreen', () => {
  const { View, Text } = require('react-native');
  return function LoginScreen() {
    return <View testID="login-screen"><Text>Login Screen</Text></View>;
  };
});

describe('AppNavigator', () => {
  it('should render login screen when not authenticated', () => {
    const { getByTestId } = render(
      <AppNavigator isAuthenticated={false} />
    );

    expect(getByTestId('login-screen')).toBeTruthy();
  });

  it('should render WorkerNavigator when authenticated as Worker', () => {
    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} userRole="Worker" />
    );

    expect(getByTestId('worker-navigator')).toBeTruthy();
  });

  it('should render SupervisorNavigator when authenticated as Supervisor', () => {
    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} userRole="Supervisor" />
    );

    expect(getByTestId('supervisor-navigator')).toBeTruthy();
  });

  it('should render DriverNavigator when authenticated as Driver', () => {
    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} userRole="Driver" />
    );

    expect(getByTestId('driver-navigator')).toBeTruthy();
  });

  it('should render login screen when authenticated but no role provided', () => {
    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} />
    );

    expect(getByTestId('login-screen')).toBeTruthy();
  });

  it('should handle all valid user roles', () => {
    const roles: UserRole[] = ['Worker', 'Supervisor', 'Driver'];
    
    roles.forEach(role => {
      const { getByTestId } = render(
        <AppNavigator isAuthenticated={true} userRole={role} />
      );

      const expectedTestId = `${role.toLowerCase()}-navigator`;
      expect(getByTestId(expectedTestId)).toBeTruthy();
    });
  });
});