// Unit tests for AppNavigator role-based routing

import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../AppNavigator';
import { UserRole } from '../../types';

// Mock the AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../store/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the navigation components
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => (
    <div testID="navigation-container">{children}</div>
  ),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => (
      <div testID="stack-navigator">{children}</div>
    ),
    Screen: ({ component: Component, name }: { component: React.ComponentType; name: string }) => {
      // Create a wrapper with testID based on the screen name
      const getTestId = (screenName: string) => {
        switch (screenName) {
          case 'Auth': return 'login-screen';
          case 'WorkerApp': return 'worker-navigator';
          case 'SupervisorApp': return 'supervisor-navigator';
          case 'DriverApp': return 'driver-navigator';
          case 'Transitioning': return 'transitioning-screen';
          default: return screenName.toLowerCase();
        }
      };
      
      return <div testID={getTestId(name)}><Component /></div>;
    },
  }),
}));

// Mock React Native components
jest.mock('react-native', () => ({
  View: ({ children, testID, ...props }: any) => (
    <div testID={testID} {...props}>{children}</div>
  ),
  Text: ({ children, testID, ...props }: any) => (
    <span testID={testID} {...props}>{children}</span>
  ),
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock the screen components
jest.mock('../WorkerNavigator', () => {
  return function WorkerNavigator() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'worker-content' }, 'Worker Navigator');
  };
});

jest.mock('../SupervisorNavigator', () => {
  return function SupervisorNavigator() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'supervisor-content' }, 'Supervisor Navigator');
  };
});

jest.mock('../DriverNavigator', () => {
  return function DriverNavigator() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'driver-content' }, 'Driver Navigator');
  };
});

jest.mock('../../screens/auth/LoginScreen', () => {
  return function LoginScreen() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'login-content' }, 'Login Screen');
  };
});

describe('AppNavigator', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: false,
        user: null,
        company: null,
        permissions: ['*'], // Grant all permissions for testing
      },
      clearRoleContexts: jest.fn(),
      restoreAuthState: jest.fn(),
    });
  });

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

  it('should handle role transitions gracefully', () => {
    // Test that the component can handle role changes without crashing
    const { rerender, getByTestId } = render(
      <AppNavigator isAuthenticated={true} userRole="Worker" />
    );

    expect(getByTestId('worker-navigator')).toBeTruthy();

    // Change role to Supervisor
    rerender(
      <AppNavigator isAuthenticated={true} userRole="Supervisor" />
    );

    expect(getByTestId('supervisor-navigator')).toBeTruthy();
  });

  it('should render login screen for invalid authentication state', () => {
    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} userRole={undefined} />
    );

    expect(getByTestId('login-screen')).toBeTruthy();
  });

  it('should use role detection from AuthContext when available', () => {
    // Mock AuthContext to return a user with a role
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: true,
        user: { role: 'Supervisor' },
        company: null,
        permissions: ['team_management'], // Supervisor permission
      },
      clearRoleContexts: jest.fn(),
      restoreAuthState: jest.fn(),
    });

    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} />
    );

    // Should render supervisor navigator based on detected role
    expect(getByTestId('supervisor-navigator')).toBeTruthy();
  });

  it('should validate role permissions correctly', () => {
    // Mock AuthContext with insufficient permissions
    mockUseAuth.mockReturnValue({
      state: {
        isAuthenticated: true,
        user: { role: 'Supervisor' },
        company: null,
        permissions: [], // No permissions
      },
      clearRoleContexts: jest.fn(),
      restoreAuthState: jest.fn(),
    });

    const { getByTestId } = render(
      <AppNavigator isAuthenticated={true} userRole="Supervisor" />
    );

    // Should render login screen due to insufficient permissions
    expect(getByTestId('login-screen')).toBeTruthy();
  });
});