import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../../services/api/AuthService';
import { UserRole, SupervisorContextData, DriverContextData } from '../../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock authService
jest.mock('../../../services/api/AuthService', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
    getStoredUser: jest.fn(),
    getStoredCompany: jest.fn(),
    getStoredTokens: jest.fn(),
    getStoredPermissions: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Test component to access context
const TestComponent: React.FC<{ onContextReady?: (context: any) => void }> = ({ onContextReady }) => {
  const context = useAuth();
  
  React.useEffect(() => {
    if (onContextReady) {
      onContextReady(context);
    }
  }, [context, onContextReady]);

  return null;
};

describe('Enhanced AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    mockAsyncStorage.multiGet.mockResolvedValue([]);
    mockAsyncStorage.multiSet.mockResolvedValue();
    mockAsyncStorage.multiRemove.mockResolvedValue();
    mockAuthService.isAuthenticated.mockResolvedValue(false);
  });

  describe('Role-based permission methods', () => {
    it('should correctly identify user roles', async () => {
      let contextValue: any;

      const mockUser = {
        id: 1,
        email: 'supervisor@test.com',
        name: 'Test Supervisor',
        role: 'Supervisor' as UserRole,
      };

      const mockCompany = {
        id: 1,
        name: 'Test Company',
        role: 'Supervisor' as UserRole,
      };

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      await act(async () => {
        contextValue.dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: mockUser,
            company: mockCompany,
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            tokenExpiry: new Date(Date.now() + 3600000),
            permissions: ['supervisor.team_management', 'supervisor.approvals'],
          },
        });
      });

      expect(contextValue.hasRole('Supervisor')).toBe(true);
      expect(contextValue.hasRole('Worker')).toBe(false);
      expect(contextValue.hasRole('Driver')).toBe(false);
    });

    it('should correctly check permissions', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      await act(async () => {
        contextValue.dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: { id: 1, email: 'test@test.com', name: 'Test User', role: 'Supervisor' as UserRole },
            company: { id: 1, name: 'Test Company', role: 'Supervisor' as UserRole },
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            tokenExpiry: new Date(Date.now() + 3600000),
            permissions: ['supervisor.team_management', 'supervisor.approvals'],
          },
        });
      });

      expect(contextValue.hasPermission('supervisor.team_management')).toBe(true);
      expect(contextValue.hasPermission('supervisor.approvals')).toBe(true);
      expect(contextValue.hasPermission('worker.tasks')).toBe(false);
    });

    it('should correctly check feature access for different roles', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      // Test Supervisor access
      await act(async () => {
        contextValue.dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: { id: 1, email: 'supervisor@test.com', name: 'Supervisor', role: 'Supervisor' as UserRole },
            company: { id: 1, name: 'Test Company', role: 'Supervisor' as UserRole },
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            tokenExpiry: new Date(Date.now() + 3600000),
            permissions: [],
          },
        });
      });

      expect(contextValue.canAccessFeature('team_management')).toBe(true);
      expect(contextValue.canAccessFeature('approvals')).toBe(true);
      expect(contextValue.canAccessFeature('transport_tasks')).toBe(false);

      // Test Driver access
      await act(async () => {
        contextValue.dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: { id: 2, email: 'driver@test.com', name: 'Driver', role: 'Driver' as UserRole },
            company: { id: 1, name: 'Test Company', role: 'Driver' as UserRole },
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            tokenExpiry: new Date(Date.now() + 3600000),
            permissions: [],
          },
        });
      });

      expect(contextValue.canAccessFeature('transport_tasks')).toBe(true);
      expect(contextValue.canAccessFeature('vehicle_info')).toBe(true);
      expect(contextValue.canAccessFeature('team_management')).toBe(false);

      // Test Worker access
      await act(async () => {
        contextValue.dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: { id: 3, email: 'worker@test.com', name: 'Worker', role: 'Worker' as UserRole },
            company: { id: 1, name: 'Test Company', role: 'Worker' as UserRole },
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            tokenExpiry: new Date(Date.now() + 3600000),
            permissions: [],
          },
        });
      });

      expect(contextValue.canAccessFeature('tasks')).toBe(true);
      expect(contextValue.canAccessFeature('attendance')).toBe(true);
      expect(contextValue.canAccessFeature('team_management')).toBe(false);
      expect(contextValue.canAccessFeature('transport_tasks')).toBe(false);
    });
  });

  describe('Supervisor context management', () => {
    it('should set and update supervisor context', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      const mockSupervisorContext: SupervisorContextData = {
        assignedProjects: [],
        teamMembers: [
          {
            id: 1,
            name: 'John Doe',
            role: 'Worker',
            attendanceStatus: 'present',
            currentTask: { id: 1, name: 'Test Task', progress: 50 },
            location: {
              latitude: 1.0,
              longitude: 1.0,
              insideGeofence: true,
              lastUpdated: new Date().toISOString(),
            },
            certifications: [],
          },
        ],
        pendingApprovals: [],
        dailyReports: [],
        materialRequests: [],
        toolAllocations: [],
      };

      await act(async () => {
        contextValue.setSupervisorContext(mockSupervisorContext);
      });

      expect(contextValue.state.supervisorContext).toEqual(mockSupervisorContext);

      // Test updating context
      await act(async () => {
        contextValue.updateSupervisorContext({
          pendingApprovals: [
            {
              id: 1,
              requestType: 'leave',
              requesterId: 1,
              requesterName: 'John Doe',
              requestDate: new Date(),
              urgency: 'normal',
              details: {},
            },
          ],
        });
      });

      expect(contextValue.state.supervisorContext.pendingApprovals).toHaveLength(1);
      expect(contextValue.state.supervisorContext.teamMembers).toHaveLength(1);
    });

    it('should clear supervisor context', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      const mockSupervisorContext: SupervisorContextData = {
        assignedProjects: [],
        teamMembers: [],
        pendingApprovals: [],
        dailyReports: [],
        materialRequests: [],
        toolAllocations: [],
      };

      await act(async () => {
        contextValue.setSupervisorContext(mockSupervisorContext);
      });

      expect(contextValue.state.supervisorContext).toBeDefined();

      await act(async () => {
        contextValue.clearSupervisorContext();
      });

      expect(contextValue.state.supervisorContext).toBeUndefined();
    });
  });

  describe('Driver context management', () => {
    it('should set and update driver context', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      const mockDriverContext: DriverContextData = {
        assignedVehicle: {
          id: 1,
          plateNumber: 'ABC123',
          model: 'Toyota Hiace',
          year: 2020,
          capacity: 15,
          currentMileage: 50000,
          fuelLevel: 80,
          maintenanceSchedule: [],
          fuelLog: [],
        },
        todaysRoutes: [],
        tripHistory: [],
        performanceMetrics: {
          onTimePerformance: 95,
          totalTripsCompleted: 100,
          totalDistance: 5000,
          averageFuelEfficiency: 12,
          safetyScore: 98,
          customerRating: 4.5,
          incidentCount: 0,
        },
        maintenanceAlerts: [],
      };

      await act(async () => {
        contextValue.setDriverContext(mockDriverContext);
      });

      expect(contextValue.state.driverContext).toEqual(mockDriverContext);

      // Test updating context
      await act(async () => {
        contextValue.updateDriverContext({
          maintenanceAlerts: [
            {
              id: 1,
              vehicleId: 1,
              type: 'scheduled',
              description: 'Oil change due',
              dueDate: new Date(),
              priority: 'medium',
            },
          ],
        });
      });

      expect(contextValue.state.driverContext.maintenanceAlerts).toHaveLength(1);
      expect(contextValue.state.driverContext.assignedVehicle.plateNumber).toBe('ABC123');
    });

    it('should clear driver context', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      const mockDriverContext: DriverContextData = {
        assignedVehicle: {
          id: 1,
          plateNumber: 'ABC123',
          model: 'Toyota Hiace',
          year: 2020,
          capacity: 15,
          currentMileage: 50000,
          fuelLevel: 80,
          maintenanceSchedule: [],
          fuelLog: [],
        },
        todaysRoutes: [],
        tripHistory: [],
        performanceMetrics: {
          onTimePerformance: 95,
          totalTripsCompleted: 100,
          totalDistance: 5000,
          averageFuelEfficiency: 12,
          safetyScore: 98,
          customerRating: 4.5,
          incidentCount: 0,
        },
        maintenanceAlerts: [],
      };

      await act(async () => {
        contextValue.setDriverContext(mockDriverContext);
      });

      expect(contextValue.state.driverContext).toBeDefined();

      await act(async () => {
        contextValue.clearDriverContext();
      });

      expect(contextValue.state.driverContext).toBeUndefined();
    });
  });

  describe('Data persistence', () => {
    it('should save and load supervisor data', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      const mockSupervisorContext: SupervisorContextData = {
        assignedProjects: [],
        teamMembers: [],
        pendingApprovals: [],
        dailyReports: [],
        materialRequests: [],
        toolAllocations: [],
      };

      await act(async () => {
        contextValue.setSupervisorContext(mockSupervisorContext);
      });

      await act(async () => {
        await contextValue.saveSupervisorData();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@construction_erp:supervisor_team_members',
        JSON.stringify([])
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@construction_erp:supervisor_pending_approvals',
        JSON.stringify([])
      );
    });

    it('should save and load driver data', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      const mockDriverContext: DriverContextData = {
        assignedVehicle: {
          id: 1,
          plateNumber: 'ABC123',
          model: 'Toyota Hiace',
          year: 2020,
          capacity: 15,
          currentMileage: 50000,
          fuelLevel: 80,
          maintenanceSchedule: [],
          fuelLog: [],
        },
        todaysRoutes: [],
        tripHistory: [],
        performanceMetrics: {
          onTimePerformance: 95,
          totalTripsCompleted: 100,
          totalDistance: 5000,
          averageFuelEfficiency: 12,
          safetyScore: 98,
          customerRating: 4.5,
          incidentCount: 0,
        },
        maintenanceAlerts: [],
      };

      await act(async () => {
        contextValue.setDriverContext(mockDriverContext);
      });

      await act(async () => {
        await contextValue.saveDriverData();
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@construction_erp:driver_transport_tasks',
        JSON.stringify([])
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@construction_erp:driver_vehicle_info',
        JSON.stringify(mockDriverContext.assignedVehicle)
      );
    });

    it('should clear all role-specific data', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      await act(async () => {
        await contextValue.clearRoleSpecificData();
      });

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@construction_erp:supervisor_team_members');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@construction_erp:driver_transport_tasks');
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain existing Worker authentication flow', async () => {
      let contextValue: any;

      const mockLoginResponse = {
        success: true,
        user: { id: 1, email: 'worker@test.com', name: 'Worker', role: 'Worker' as UserRole },
        company: { id: 1, name: 'Test Company', role: 'Worker' as UserRole },
        token: 'test-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        permissions: ['worker.tasks', 'worker.attendance'],
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      await act(async () => {
        await contextValue.login({ email: 'worker@test.com', password: 'password' });
      });

      expect(contextValue.state.isAuthenticated).toBe(true);
      expect(contextValue.state.user?.role).toBe('Worker');
      expect(contextValue.hasRole('Worker')).toBe(true);
      expect(contextValue.canAccessFeature('tasks')).toBe(true);
      expect(contextValue.canAccessFeature('attendance')).toBe(true);
    });

    it('should not affect existing Worker functionality when role-specific contexts are used', async () => {
      let contextValue: any;

      render(
        <AuthProvider>
          <TestComponent onContextReady={(context) => { contextValue = context; }} />
        </AuthProvider>
      );

      // Login as Worker
      await act(async () => {
        contextValue.dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: { id: 1, email: 'worker@test.com', name: 'Worker', role: 'Worker' as UserRole },
            company: { id: 1, name: 'Test Company', role: 'Worker' as UserRole },
            token: 'test-token',
            refreshToken: 'test-refresh-token',
            tokenExpiry: new Date(Date.now() + 3600000),
            permissions: ['worker.tasks'],
          },
        });
      });

      // Worker should not have supervisor or driver contexts
      expect(contextValue.state.supervisorContext).toBeUndefined();
      expect(contextValue.state.driverContext).toBeUndefined();

      // Worker should still have access to worker features
      expect(contextValue.canAccessFeature('tasks')).toBe(true);
      expect(contextValue.canAccessFeature('attendance')).toBe(true);
      expect(contextValue.hasRole('Worker')).toBe(true);
    });
  });
});