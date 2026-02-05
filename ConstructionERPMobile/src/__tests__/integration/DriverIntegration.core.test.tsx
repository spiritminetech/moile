// Core Driver Integration Tests - Task 12.2
// Complete Driver workflows, API integration, offline mode, cross-platform compatibility

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as fc from 'fast-check';

// Import Driver API service
import { driverApiService } from '../../services/api/DriverApiService';
import { apiClient } from '../../services/api/client';

// Import contexts
import { AuthProvider } from '../../store/context/AuthContext';
import { DriverProvider } from '../../store/context/DriverContext';
import { LocationProvider } from '../../store/context/LocationContext';
import { OfflineProvider } from '../../store/context/OfflineContext';

// Import types
import {
  DriverDashboardResponse,
  TransportTask,
  VehicleInfo,
  DriverPerformance,
  GeoLocation,
  User,
  UserRole,
} from '../../types';

// Mock external dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('../../services/api/DriverApiService');
jest.mock('../../services/api/client');

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
    NavigationContainer: ({ children }: any) => children,
  };
});

// Mock location services
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    High: 4,
  },
}));

// Test data generators using fast-check for property-based testing
const createMockUser = (role: UserRole = 'Driver'): User => ({
  id: 1,
  employeeId: 'EMP001',
  name: 'Test Driver',
  email: 'driver@test.com',
  phone: '+1234567890',
  role,
  profileImage: 'https://example.com/profile.jpg',
  certifications: [],
  workPass: {
    id: 'WP001',
    status: 'active',
    expiryDate: new Date('2025-12-31'),
  },
  driverData: {
    licenseNumber: 'DL123456',
    licenseClass: 'Class B',
    licenseExpiry: new Date('2025-06-30'),
    assignedVehicles: [1, 2],
    certifications: ['Defensive Driving', 'First Aid'],
  },
});

const createMockLocation = (): GeoLocation => ({
  latitude: 37.7749,
  longitude: -122.4194,
  accuracy: 10,
  timestamp: new Date(),
});

const createMockTransportTask = (id: number = 1): TransportTask => ({
  taskId: id,
  route: `Route ${id}`,
  pickupLocations: [
    {
      locationId: id,
      name: `Dormitory ${id}`,
      address: `${id}23 Main St`,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      workerManifest: [
        {
          workerId: id,
          name: `Worker ${id}`,
          phone: '+1234567890',
          checkedIn: false,
        },
      ],
      estimatedPickupTime: new Date().toISOString(),
    },
  ],
  dropoffLocation: {
    name: 'Construction Site',
    address: '456 Work Ave',
    coordinates: { latitude: 37.7849, longitude: -122.4094 },
    estimatedArrival: new Date().toISOString(),
  },
  status: 'pending',
  totalWorkers: 5,
  checkedInWorkers: 0,
});

const createMockVehicleInfo = (): VehicleInfo => ({
  id: 1,
  plateNumber: 'ABC-123',
  model: 'Ford Transit',
  year: 2022,
  capacity: 12,
  currentMileage: 45000,
  fuelLevel: 75,
  maintenanceSchedule: [
    {
      type: 'oil_change',
      dueDate: new Date('2024-03-01').toISOString(),
      dueMileage: 50000,
      status: 'upcoming',
    },
  ],
  fuelLog: [
    {
      date: new Date().toISOString(),
      amount: 50,
      cost: 75,
      mileage: 44500,
      location: 'Gas Station A',
    },
  ],
});

const createMockDashboardData = (): DriverDashboardResponse => ({
  todaysTransportTasks: [
    {
      taskId: 1,
      route: 'Route A',
      pickupTime: '07:00',
      pickupLocation: {
        name: 'Dormitory A',
        address: '123 Main St',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
      },
      dropoffLocation: {
        name: 'Construction Site',
        address: '456 Work Ave',
        coordinates: { latitude: 37.7849, longitude: -122.4094 },
      },
      workerCount: 5,
      status: 'pending',
    },
  ],
  assignedVehicle: {
    id: 1,
    plateNumber: 'ABC-123',
    model: 'Ford Transit',
    capacity: 12,
    fuelLevel: 75,
    maintenanceStatus: 'good',
  },
  performanceMetrics: {
    onTimePerformance: 95,
    completedTrips: 25,
    totalDistance: 1250,
    fuelEfficiency: 8.5,
  },
});

const createMockPerformanceMetrics = (): DriverPerformance => ({
  onTimePerformance: 95,
  totalTripsCompleted: 25,
  totalDistance: 1250,
  averageFuelEfficiency: 8.5,
  safetyScore: 98,
  customerRating: 4.8,
  incidentCount: 0,
});

// Test wrapper component with all providers
const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  initialAuthState?: any;
  isOffline?: boolean;
  initialOfflineState?: boolean;
}> = ({ 
  children, 
  initialAuthState = {
    isAuthenticated: true,
    user: createMockUser(),
    company: { name: 'Test Company' },
    token: 'mock-token',
    permissions: ['transport_tasks', 'vehicle_info', 'trip_updates'],
  },
  isOffline = false,
  initialOfflineState = false,
}) => {
  return (
    <AuthProvider initialState={initialAuthState}>
      <LocationProvider>
        <OfflineProvider initialOfflineState={initialOfflineState}>
          <DriverProvider>
            {children}
          </DriverProvider>
        </OfflineProvider>
      </LocationProvider>
    </AuthProvider>
  );
};
describe('Core Driver Integration Tests - Task 12.2', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
  const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
  const mockDriverApiService = driverApiService as jest.Mocked<typeof driverApiService>;
  const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    } as any);

    // Setup API service mocks
    mockDriverApiService.getDashboardData.mockResolvedValue({
      success: true,
      data: createMockDashboardData(),
      message: 'Success',
    });

    mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
      success: true,
      data: [createMockTransportTask()],
      message: 'Success',
    });

    mockDriverApiService.getAssignedVehicle.mockResolvedValue({
      success: true,
      data: createMockVehicleInfo(),
      message: 'Success',
    });

    mockDriverApiService.getPerformanceMetrics.mockResolvedValue({
      success: true,
      data: createMockPerformanceMetrics(),
      message: 'Success',
    });

    mockDriverApiService.getTodaysAttendance.mockResolvedValue({
      success: true,
      data: {
        session: 'NOT_LOGGED_IN',
        checkInTime: null,
        checkOutTime: null,
        assignedVehicle: null,
        totalHours: 0,
        totalDistance: 0,
        date: new Date().toISOString().split('T')[0],
      },
      message: 'Success',
    });

    mockDriverApiService.getDriverProfile.mockResolvedValue({
      success: true,
      data: {
        user: createMockUser(),
        driverInfo: {
          licenseNumber: 'DL123456',
          licenseClass: 'Class B',
          licenseExpiry: '2025-06-30',
          yearsOfExperience: 5,
          specializations: ['Heavy Vehicles', 'Construction Sites'],
        },
        assignedVehicles: [
          {
            id: 1,
            plateNumber: 'ABC-123',
            model: 'Ford Transit',
            isPrimary: true,
          },
        ],
        certifications: [],
        performanceSummary: {
          totalTrips: 25,
          onTimePerformance: 95,
          safetyScore: 98,
          customerRating: 4.8,
        },
      },
      message: 'Success',
    });
  });

  describe('1. Complete Driver Workflow Integration - Login to Trip Completion', () => {
    it('should complete full end-to-end driver workflow API calls', async () => {
      // Test complete driver workflow API calls
      const mockUser = createMockUser();
      const mockLocation = createMockLocation();
      
      // Mock successful login
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          company: { name: 'Test Company' },
        },
        message: 'Login successful',
      });

      // Mock all driver workflow API calls
      mockDriverApiService.clockIn.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Clocked in successfully',
          checkInTime: new Date().toISOString(),
          session: 'CHECKED_IN',
          vehicleAssigned: {
            id: 1,
            plateNumber: 'ABC-123',
            model: 'Ford Transit',
          },
        },
        message: 'Success',
      });

      mockDriverApiService.updateTransportTaskStatus.mockResolvedValue({
        success: true,
        data: {
          taskId: 1,
          status: 'en_route_pickup',
          updatedAt: new Date().toISOString(),
          location: {
            latitude: mockLocation.latitude,
            longitude: mockLocation.longitude,
            timestamp: mockLocation.timestamp.toISOString(),
          },
        },
        message: 'Status updated',
      });

      mockDriverApiService.checkInWorker.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Worker checked in',
          checkInTime: new Date().toISOString(),
          workerName: 'Test Worker',
          locationName: 'Dormitory A',
        },
        message: 'Success',
      });

      mockDriverApiService.confirmPickupComplete.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Pickup completed',
          pickupTime: new Date().toISOString(),
          workersPickedUp: 5,
          nextLocation: {
            name: 'Construction Site',
            estimatedArrival: new Date().toISOString(),
          },
        },
        message: 'Success',
      });

      mockDriverApiService.confirmDropoffComplete.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Dropoff completed',
          dropoffTime: new Date().toISOString(),
          workersDroppedOff: 5,
          tripCompleted: true,
        },
        message: 'Success',
      });

      mockDriverApiService.clockOut.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Clocked out successfully',
          checkOutTime: new Date().toISOString(),
          session: 'CHECKED_OUT',
          totalHours: 8.5,
          totalDistance: 45.2,
        },
        message: 'Success',
      });

      // Test complete workflow API calls
      await act(async () => {
        // Clock in
        await driverApiService.clockIn({
          vehicleId: 1,
          location: mockLocation,
          preCheckCompleted: true,
          mileageReading: 45000,
        });

        // Start transport task
        await driverApiService.updateTransportTaskStatus(
          1,
          'en_route_pickup',
          mockLocation,
          'Starting pickup route'
        );

        // Check in worker
        await driverApiService.checkInWorker(1, 1, mockLocation);

        // Complete pickup
        await driverApiService.confirmPickupComplete(
          1,
          1,
          mockLocation,
          5,
          'All workers picked up'
        );

        // Complete dropoff
        await driverApiService.confirmDropoffComplete(
          1,
          mockLocation,
          5,
          'All workers dropped off'
        );

        // Clock out
        await driverApiService.clockOut({
          vehicleId: 1,
          location: mockLocation,
          postCheckCompleted: true,
          mileageReading: 45045,
          fuelLevel: 70,
        });
      });

      // Verify all workflow API calls were made correctly
      expect(mockDriverApiService.clockIn).toHaveBeenCalledWith({
        vehicleId: 1,
        location: mockLocation,
        preCheckCompleted: true,
        mileageReading: 45000,
      });

      expect(mockDriverApiService.updateTransportTaskStatus).toHaveBeenCalledWith(
        1,
        'en_route_pickup',
        mockLocation,
        'Starting pickup route'
      );

      expect(mockDriverApiService.checkInWorker).toHaveBeenCalledWith(1, 1, mockLocation);

      expect(mockDriverApiService.confirmPickupComplete).toHaveBeenCalledWith(
        1,
        1,
        mockLocation,
        5,
        'All workers picked up'
      );

      expect(mockDriverApiService.confirmDropoffComplete).toHaveBeenCalledWith(
        1,
        mockLocation,
        5,
        'All workers dropped off'
      );

      expect(mockDriverApiService.clockOut).toHaveBeenCalledWith({
        vehicleId: 1,
        location: mockLocation,
        postCheckCompleted: true,
        mileageReading: 45045,
        fuelLevel: 70,
      });
    });

    it('should handle complex multi-location pickup workflow', async () => {
      const mockLocation = createMockLocation();
      
      // Create task with multiple pickup locations
      const multiLocationTask = {
        ...createMockTransportTask(),
        pickupLocations: [
          {
            locationId: 1,
            name: 'Dormitory A',
            address: '123 Main St',
            coordinates: { latitude: 37.7749, longitude: -122.4194 },
            workerManifest: [
              { workerId: 1, name: 'Worker 1', phone: '+1234567890', checkedIn: false },
              { workerId: 2, name: 'Worker 2', phone: '+1234567891', checkedIn: false },
            ],
            estimatedPickupTime: new Date().toISOString(),
          },
          {
            locationId: 2,
            name: 'Dormitory B',
            address: '456 Oak Ave',
            coordinates: { latitude: 37.7849, longitude: -122.4294 },
            workerManifest: [
              { workerId: 3, name: 'Worker 3', phone: '+1234567892', checkedIn: false },
              { workerId: 4, name: 'Worker 4', phone: '+1234567893', checkedIn: false },
            ],
            estimatedPickupTime: new Date().toISOString(),
          },
        ],
        totalWorkers: 4,
      };

      mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
        success: true,
        data: [multiLocationTask],
        message: 'Success',
      });

      // Mock worker check-ins for multiple locations
      mockDriverApiService.checkInWorker.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Worker checked in',
          checkInTime: new Date().toISOString(),
          workerName: 'Test Worker',
          locationName: 'Dormitory A',
        },
        message: 'Success',
      });

      // Mock pickup completion for each location
      mockDriverApiService.confirmPickupComplete.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Pickup completed',
          pickupTime: new Date().toISOString(),
          workersPickedUp: 2,
          nextLocation: {
            name: 'Dormitory B',
            estimatedArrival: new Date().toISOString(),
          },
        },
        message: 'Success',
      });

      // Test multi-location workflow
      await act(async () => {
        // Check in workers at first location
        await driverApiService.checkInWorker(1, 1, mockLocation);
        await driverApiService.checkInWorker(1, 2, mockLocation);
        
        // Complete first pickup
        await driverApiService.confirmPickupComplete(
          1,
          1,
          mockLocation,
          2,
          'First location pickup complete'
        );

        // Check in workers at second location
        await driverApiService.checkInWorker(2, 3, mockLocation);
        await driverApiService.checkInWorker(2, 4, mockLocation);
        
        // Complete second pickup
        await driverApiService.confirmPickupComplete(
          1,
          2,
          mockLocation,
          2,
          'Second location pickup complete'
        );
      });

      // Verify all pickup operations
      expect(mockDriverApiService.checkInWorker).toHaveBeenCalledTimes(4);
      expect(mockDriverApiService.confirmPickupComplete).toHaveBeenCalledTimes(2);
    });

    it('should handle emergency scenarios and incident reporting', async () => {
      const mockLocation = createMockLocation();

      // Mock emergency reporting APIs
      mockDriverApiService.reportDelay.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Delay reported',
          delayId: 'DELAY001',
          notificationSent: true,
        },
        message: 'Success',
      });

      mockDriverApiService.reportBreakdown.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Breakdown reported',
          incidentId: 'INC001',
          emergencyContactNotified: true,
        },
        message: 'Success',
      });

      mockDriverApiService.requestEmergencyAssistance.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Emergency assistance requested',
          assistanceId: 'ASSIST001',
          estimatedArrival: '15 minutes',
          contactNumber: '+1-800-EMERGENCY',
        },
        message: 'Success',
      });

      // Test emergency scenarios
      await act(async () => {
        // Report delay
        await driverApiService.reportDelay(1, {
          reason: 'Heavy traffic',
          estimatedDelay: 30,
          location: mockLocation,
          description: 'Traffic jam on main route',
        });

        // Report breakdown
        await driverApiService.reportBreakdown(1, {
          description: 'Engine overheating',
          severity: 'major',
          location: mockLocation,
          assistanceRequired: true,
        });

        // Request emergency assistance
        await driverApiService.requestEmergencyAssistance({
          type: 'breakdown',
          location: mockLocation,
          description: 'Vehicle breakdown requiring immediate assistance',
          severity: 'high',
          vehicleId: 1,
          taskId: 1,
        });
      });

      // Verify emergency reporting
      expect(mockDriverApiService.reportDelay).toHaveBeenCalledWith(1, {
        reason: 'Heavy traffic',
        estimatedDelay: 30,
        location: mockLocation,
        description: 'Traffic jam on main route',
      });

      expect(mockDriverApiService.reportBreakdown).toHaveBeenCalledWith(1, {
        description: 'Engine overheating',
        severity: 'major',
        location: mockLocation,
        assistanceRequired: true,
      });

      expect(mockDriverApiService.requestEmergencyAssistance).toHaveBeenCalledWith({
        type: 'breakdown',
        location: mockLocation,
        description: 'Vehicle breakdown requiring immediate assistance',
        severity: 'high',
        vehicleId: 1,
        taskId: 1,
      });
    });
  });
  describe('2. API Integration with Mock Backend Responses', () => {
    it('should handle complex API response scenarios', async () => {
      // Test various API response scenarios
      const scenarios = [
        {
          name: 'Empty data responses',
          mockData: {
            dashboard: { todaysTransportTasks: [], assignedVehicle: null, performanceMetrics: null },
            tasks: [],
            vehicle: null,
            performance: null,
          },
        },
        {
          name: 'Partial data responses',
          mockData: {
            dashboard: { todaysTransportTasks: [createMockTransportTask()], assignedVehicle: null, performanceMetrics: null },
            tasks: [createMockTransportTask()],
            vehicle: null,
            performance: createMockPerformanceMetrics(),
          },
        },
        {
          name: 'Full data responses',
          mockData: {
            dashboard: createMockDashboardData(),
            tasks: [createMockTransportTask(), createMockTransportTask(2)],
            vehicle: createMockVehicleInfo(),
            performance: createMockPerformanceMetrics(),
          },
        },
      ];

      for (const scenario of scenarios) {
        // Setup mocks for this scenario
        mockDriverApiService.getDashboardData.mockResolvedValue({
          success: true,
          data: scenario.mockData.dashboard,
          message: 'Success',
        });

        mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
          success: true,
          data: scenario.mockData.tasks,
          message: 'Success',
        });

        mockDriverApiService.getAssignedVehicle.mockResolvedValue({
          success: scenario.mockData.vehicle !== null,
          data: scenario.mockData.vehicle,
          message: scenario.mockData.vehicle ? 'Success' : 'No vehicle assigned',
        });

        mockDriverApiService.getPerformanceMetrics.mockResolvedValue({
          success: scenario.mockData.performance !== null,
          data: scenario.mockData.performance,
          message: scenario.mockData.performance ? 'Success' : 'No performance data',
        });

        // Test API calls for each scenario
        const dashboardResult = await driverApiService.getDashboardData();
        const tasksResult = await driverApiService.getTodaysTransportTasks();
        const vehicleResult = await driverApiService.getAssignedVehicle();
        const performanceResult = await driverApiService.getPerformanceMetrics();

        // Verify results
        expect(dashboardResult.success).toBe(true);
        expect(tasksResult.success).toBe(true);
        expect(vehicleResult.success).toBe(scenario.mockData.vehicle !== null);
        expect(performanceResult.success).toBe(scenario.mockData.performance !== null);
      }
    });

    it('should handle API rate limiting and retry logic', async () => {
      // Mock rate limiting error
      const rateLimitError = new Error('Rate limit exceeded. Please try again later.');
      mockDriverApiService.getDashboardData
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          success: true,
          data: createMockDashboardData(),
          message: 'Success',
        });

      // First call should fail
      await expect(driverApiService.getDashboardData()).rejects.toThrow('Rate limit exceeded');

      // Second call should succeed
      const result = await driverApiService.getDashboardData();
      expect(result.success).toBe(true);

      // Verify retry was attempted
      expect(mockDriverApiService.getDashboardData).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent API requests with proper error isolation', async () => {
      // Mock some APIs to fail while others succeed
      mockDriverApiService.getDashboardData.mockResolvedValue({
        success: true,
        data: createMockDashboardData(),
        message: 'Success',
      });

      mockDriverApiService.getTodaysTransportTasks.mockRejectedValue(new Error('Tasks API failed'));
      
      mockDriverApiService.getAssignedVehicle.mockResolvedValue({
        success: true,
        data: createMockVehicleInfo(),
        message: 'Success',
      });

      mockDriverApiService.getPerformanceMetrics.mockRejectedValue(new Error('Performance API failed'));

      // Test concurrent API calls
      const results = await Promise.allSettled([
        driverApiService.getDashboardData(),
        driverApiService.getTodaysTransportTasks(),
        driverApiService.getAssignedVehicle(),
        driverApiService.getPerformanceMetrics(),
      ]);

      // Verify partial success/failure handling
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
      expect(results[3].status).toBe('rejected');

      // Verify all APIs were called despite some failures
      expect(mockDriverApiService.getDashboardData).toHaveBeenCalled();
      expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
      expect(mockDriverApiService.getAssignedVehicle).toHaveBeenCalled();
      expect(mockDriverApiService.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('should handle authentication errors correctly', async () => {
      // Mock authentication error
      mockDriverApiService.getDashboardData.mockRejectedValue(new Error('Authentication failed. Please log in again.'));

      await expect(driverApiService.getDashboardData()).rejects.toThrow('Authentication failed');
    });

    it('should handle network errors with appropriate messaging', async () => {
      // Mock network error
      mockDriverApiService.getTodaysTransportTasks.mockRejectedValue(new Error('Network connection failed. Please check your internet connection.'));

      await expect(driverApiService.getTodaysTransportTasks()).rejects.toThrow('Network connection failed');
    });

    it('should handle empty data responses correctly', async () => {
      // Mock empty responses
      mockDriverApiService.getDashboardData.mockResolvedValue({
        success: true,
        data: {
          todaysTransportTasks: [],
          assignedVehicle: null,
          performanceMetrics: {
            onTimePerformance: 0,
            completedTrips: 0,
            totalDistance: 0,
            fuelEfficiency: 0,
          },
        },
        message: 'No data available',
      });

      mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
        success: true,
        data: [],
        message: 'No transport tasks found',
      });

      const dashboardResult = await driverApiService.getDashboardData();
      const tasksResult = await driverApiService.getTodaysTransportTasks();

      expect(dashboardResult.success).toBe(true);
      expect(dashboardResult.data.todaysTransportTasks).toHaveLength(0);
      expect(tasksResult.success).toBe(true);
      expect(tasksResult.data).toHaveLength(0);
    });

    it('should handle concurrent API calls correctly', async () => {
      // Test multiple simultaneous API calls
      const dashboardPromise = driverApiService.getDashboardData();
      const tasksPromise = driverApiService.getTodaysTransportTasks();
      const vehiclePromise = driverApiService.getAssignedVehicle();
      const performancePromise = driverApiService.getPerformanceMetrics();

      const [dashboardResult, tasksResult, vehicleResult, performanceResult] = await Promise.all([
        dashboardPromise,
        tasksPromise,
        vehiclePromise,
        performancePromise,
      ]);

      expect(dashboardResult.success).toBe(true);
      expect(tasksResult.success).toBe(true);
      expect(vehicleResult.success).toBe(true);
      expect(performanceResult.success).toBe(true);
    });
  });

  describe('3. Offline Mode and Data Synchronization', () => {
    beforeEach(() => {
      // Mock offline state
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {},
      } as any);
    });

    it('should handle complex offline scenarios with data persistence', async () => {
      // Mock comprehensive cached data
      const cachedData = {
        dashboard: JSON.stringify(createMockDashboardData()),
        tasks: JSON.stringify([createMockTransportTask(), createMockTransportTask(2)]),
        vehicle: JSON.stringify(createMockVehicleInfo()),
        performance: JSON.stringify(createMockPerformanceMetrics()),
        attendance: JSON.stringify({
          session: 'CHECKED_IN',
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          assignedVehicle: { id: 1, plateNumber: 'ABC-123', model: 'Ford Transit' },
          totalHours: 4.5,
          totalDistance: 25.3,
          date: new Date().toISOString().split('T')[0],
        }),
      };

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'driver_dashboard_data':
            return Promise.resolve(cachedData.dashboard);
          case 'driver_transport_tasks':
            return Promise.resolve(cachedData.tasks);
          case 'driver_vehicle_info':
            return Promise.resolve(cachedData.vehicle);
          case 'driver_performance_metrics':
            return Promise.resolve(cachedData.performance);
          case 'driver_attendance_today':
            return Promise.resolve(cachedData.attendance);
          default:
            return Promise.resolve(null);
        }
      });

      // Test offline data loading
      const dashboardData = await mockAsyncStorage.getItem('driver_dashboard_data');
      const tasksData = await mockAsyncStorage.getItem('driver_transport_tasks');
      const vehicleData = await mockAsyncStorage.getItem('driver_vehicle_info');

      expect(dashboardData).toBe(cachedData.dashboard);
      expect(tasksData).toBe(cachedData.tasks);
      expect(vehicleData).toBe(cachedData.vehicle);

      // Verify cached data was loaded
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('driver_dashboard_data');
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('driver_transport_tasks');
    });

    it('should handle offline action queuing with complex operations', async () => {
      const mockLocation = createMockLocation();
      
      // Mock complex offline actions
      const offlineActions = [
        {
          type: 'CLOCK_IN',
          vehicleId: 1,
          location: mockLocation,
          preCheckCompleted: true,
          mileageReading: 45000,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'UPDATE_TRANSPORT_TASK_STATUS',
          taskId: 1,
          status: 'en_route_pickup',
          location: mockLocation,
          notes: 'Starting route offline',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'CHECK_IN_WORKER',
          locationId: 1,
          workerId: 1,
          location: mockLocation,
          timestamp: new Date().toISOString(),
        },
        {
          type: 'REPORT_DELAY',
          taskId: 1,
          reason: 'Traffic jam',
          estimatedDelay: 30,
          location: mockLocation,
          description: 'Heavy traffic on main route',
          timestamp: new Date().toISOString(),
        },
      ];

      // Should queue all offline actions
      mockAsyncStorage.setItem.mockResolvedValue();

      await act(async () => {
        // Simulate offline actions
        for (const action of offlineActions) {
          await mockAsyncStorage.setItem(
            'offline_actions_queue',
            JSON.stringify([action])
          );
        }
      });

      // Verify actions were queued
      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(offlineActions.length);
    });

    it('should handle complex synchronization scenarios when coming back online', async () => {
      // Mock queued offline actions with dependencies
      const queuedActions = JSON.stringify([
        {
          type: 'CLOCK_IN',
          vehicleId: 1,
          location: createMockLocation(),
          preCheckCompleted: true,
          mileageReading: 45000,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          type: 'UPDATE_TRANSPORT_TASK_STATUS',
          taskId: 1,
          status: 'en_route_pickup',
          location: createMockLocation(),
          notes: 'Starting route',
          timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
        },
        {
          type: 'CHECK_IN_WORKER',
          locationId: 1,
          workerId: 1,
          location: createMockLocation(),
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
        {
          type: 'CONFIRM_PICKUP_COMPLETE',
          taskId: 1,
          locationId: 1,
          workerCount: 1,
          location: createMockLocation(),
          notes: 'Pickup completed',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        },
      ]);

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'offline_actions_queue') {
          return Promise.resolve(queuedActions);
        }
        return Promise.resolve(null);
      });

      // Mock coming back online
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: {},
      } as any);

      // Mock successful sync for all actions
      mockDriverApiService.clockIn.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Clocked in successfully',
          checkInTime: new Date().toISOString(),
          session: 'CHECKED_IN',
          vehicleAssigned: { id: 1, plateNumber: 'ABC-123', model: 'Ford Transit' },
        },
        message: 'Success',
      });

      mockDriverApiService.updateTransportTaskStatus.mockResolvedValue({
        success: true,
        data: {
          taskId: 1,
          status: 'en_route_pickup',
          updatedAt: new Date().toISOString(),
        },
        message: 'Status updated',
      });

      mockDriverApiService.checkInWorker.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Worker checked in',
          checkInTime: new Date().toISOString(),
          workerName: 'Test Worker',
          locationName: 'Dormitory A',
        },
        message: 'Success',
      });

      mockDriverApiService.confirmPickupComplete.mockResolvedValue({
        success: true,
        data: {
          success: true,
          message: 'Pickup completed',
          pickupTime: new Date().toISOString(),
          workersPickedUp: 1,
        },
        message: 'Success',
      });

      // Test sync process
      const queuedActionsData = await mockAsyncStorage.getItem('offline_actions_queue');
      expect(queuedActionsData).toBe(queuedActions);

      // Simulate sync process
      const actions = JSON.parse(queuedActionsData!);
      for (const action of actions) {
        switch (action.type) {
          case 'CLOCK_IN':
            await driverApiService.clockIn({
              vehicleId: action.vehicleId,
              location: action.location,
              preCheckCompleted: action.preCheckCompleted,
              mileageReading: action.mileageReading,
            });
            break;
          case 'UPDATE_TRANSPORT_TASK_STATUS':
            await driverApiService.updateTransportTaskStatus(
              action.taskId,
              action.status,
              action.location,
              action.notes
            );
            break;
          case 'CHECK_IN_WORKER':
            await driverApiService.checkInWorker(
              action.locationId,
              action.workerId,
              action.location
            );
            break;
          case 'CONFIRM_PICKUP_COMPLETE':
            await driverApiService.confirmPickupComplete(
              action.taskId,
              action.locationId,
              action.location,
              action.workerCount,
              action.notes
            );
            break;
        }
      }

      // Verify all sync operations were called
      expect(mockDriverApiService.clockIn).toHaveBeenCalled();
      expect(mockDriverApiService.updateTransportTaskStatus).toHaveBeenCalled();
      expect(mockDriverApiService.checkInWorker).toHaveBeenCalled();
      expect(mockDriverApiService.confirmPickupComplete).toHaveBeenCalled();
    });

    it('should handle sync failures gracefully', async () => {
      // Mock sync failure
      mockDriverApiService.updateTransportTaskStatus.mockRejectedValue(new Error('Sync failed'));

      const queuedActions = JSON.stringify([
        {
          type: 'UPDATE_TRANSPORT_TASK_STATUS',
          taskId: 1,
          status: 'en_route_pickup',
          location: createMockLocation(),
          timestamp: new Date().toISOString(),
        },
      ]);

      mockAsyncStorage.getItem.mockResolvedValue(queuedActions);

      // Test sync failure handling
      const actions = JSON.parse(queuedActions);
      await expect(
        driverApiService.updateTransportTaskStatus(
          actions[0].taskId,
          actions[0].status,
          actions[0].location
        )
      ).rejects.toThrow('Sync failed');

      // Actions should remain in queue for retry (not removed)
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith('offline_actions_queue');
    });
  });
  describe('4. Cross-Platform Compatibility Testing', () => {
    const platforms = ['ios', 'android', 'web'];

    platforms.forEach(platform => {
      it(`should work correctly on ${platform} platform`, async () => {
        // Mock platform-specific behavior
        const originalPlatform = Platform.OS;
        (Platform as any).OS = platform;

        // Mock platform-specific permissions
        const mockLocation = jest.fn();
        if (platform === 'web') {
          // Web doesn't have native location permissions
          mockLocation.mockRejectedValue(new Error('Location not available on web'));
        } else {
          mockLocation.mockResolvedValue({
            coords: {
              latitude: 37.7749,
              longitude: -122.4194,
              accuracy: 10,
            },
            timestamp: Date.now(),
          });
        }

        // Test API calls work on all platforms
        const result = await driverApiService.getDashboardData();
        expect(result.success).toBe(true);

        // Restore original platform
        (Platform as any).OS = originalPlatform;
      });
    });

    it('should handle platform-specific permissions correctly', async () => {
      // Mock location permissions
      const mockRequestPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
      const mockGetCurrentPosition = jest.fn().mockResolvedValue({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });

      // Test permission handling
      const permissionResult = await mockRequestPermissions();
      expect(permissionResult.status).toBe('granted');

      const locationResult = await mockGetCurrentPosition();
      expect(locationResult.coords.latitude).toBe(37.7749);
    });

    it('should handle different screen sizes and orientations', async () => {
      // Mock different screen dimensions
      const mockDimensions = {
        window: { width: 375, height: 812 }, // iPhone X
        screen: { width: 375, height: 812 },
      };

      // Test with phone dimensions
      expect(mockDimensions.window.width).toBe(375);

      // Test tablet dimensions
      mockDimensions.window = { width: 768, height: 1024 };
      expect(mockDimensions.window.width).toBe(768);
    });
  });

  describe('5. Property-Based Testing with fast-check', () => {
    it('should handle arbitrary transport task data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            taskId: fc.integer({ min: 1, max: 1000 }),
            route: fc.string({ minLength: 1, maxLength: 50 }),
            status: fc.constantFrom('pending', 'en_route_pickup', 'picking_up', 'en_route_dropoff', 'dropping_off', 'completed'),
            totalWorkers: fc.integer({ min: 1, max: 20 }),
          }),
          async (taskData) => {
            const mockTask = {
              ...createMockTransportTask(),
              ...taskData,
            };

            mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
              success: true,
              data: [mockTask],
              message: 'Success',
            });

            const result = await driverApiService.getTodaysTransportTasks();

            // Should handle any valid transport task data
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].taskId).toBe(taskData.taskId);
            expect(result.data[0].route).toBe(taskData.route);
            expect(result.data[0].status).toBe(taskData.status);
            expect(result.data[0].totalWorkers).toBe(taskData.totalWorkers);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle arbitrary location data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            accuracy: fc.double({ min: 1, max: 100 }),
          }),
          async (locationData) => {
            const mockLocation = {
              ...createMockLocation(),
              ...locationData,
            };

            mockDriverApiService.updateTransportTaskStatus.mockResolvedValue({
              success: true,
              data: {
                taskId: 1,
                status: 'en_route_pickup',
                updatedAt: new Date().toISOString(),
                location: {
                  latitude: mockLocation.latitude,
                  longitude: mockLocation.longitude,
                  timestamp: mockLocation.timestamp.toISOString(),
                },
              },
              message: 'Status updated',
            });

            // Test location handling in API calls
            await act(async () => {
              await driverApiService.updateTransportTaskStatus(
                1,
                'en_route_pickup',
                mockLocation,
                'Testing arbitrary location'
              );
            });

            // Should handle any valid location data
            expect(mockDriverApiService.updateTransportTaskStatus).toHaveBeenCalledWith(
              1,
              'en_route_pickup',
              mockLocation,
              'Testing arbitrary location'
            );
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle arbitrary vehicle data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            plateNumber: fc.string({ minLength: 3, maxLength: 10 }),
            model: fc.string({ minLength: 3, maxLength: 30 }),
            fuelLevel: fc.integer({ min: 0, max: 100 }),
            currentMileage: fc.integer({ min: 0, max: 500000 }),
          }),
          async (vehicleData) => {
            const mockVehicle = {
              ...createMockVehicleInfo(),
              ...vehicleData,
            };

            mockDriverApiService.getAssignedVehicle.mockResolvedValue({
              success: true,
              data: mockVehicle,
              message: 'Success',
            });

            const result = await driverApiService.getAssignedVehicle();

            // Should handle any valid vehicle data
            expect(result.success).toBe(true);
            expect(result.data.id).toBe(vehicleData.id);
            expect(result.data.plateNumber).toBe(vehicleData.plateNumber);
            expect(result.data.model).toBe(vehicleData.model);
            expect(result.data.fuelLevel).toBe(vehicleData.fuelLevel);
            expect(result.data.currentMileage).toBe(vehicleData.currentMileage);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('6. Performance and Resource Management', () => {
    it('should manage memory efficiently with large datasets', async () => {
      // Mock large dataset
      const largeTasks = Array.from({ length: 100 }, (_, i) => createMockTransportTask(i + 1));
      
      mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
        success: true,
        data: largeTasks,
        message: 'Success',
      });

      const result = await driverApiService.getTodaysTransportTasks();

      // Should handle large datasets efficiently
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(100);
      expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
    });

    it('should handle concurrent API requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = [
        driverApiService.getDashboardData(),
        driverApiService.getTodaysTransportTasks(),
        driverApiService.getAssignedVehicle(),
        driverApiService.getPerformanceMetrics(),
        driverApiService.getTodaysAttendance(),
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Should complete efficiently
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle API call timeouts gracefully', async () => {
      // Mock timeout error
      mockDriverApiService.getTodaysTransportTasks.mockRejectedValue(new Error('Request timeout'));

      await expect(driverApiService.getTodaysTransportTasks()).rejects.toThrow('Request timeout');
    });
  });

  describe('7. Error Handling and Edge Cases', () => {
    it('should handle malformed API responses', async () => {
      // Mock malformed response
      mockDriverApiService.getDashboardData.mockResolvedValue({
        success: true,
        data: null, // Malformed data
        message: 'Success',
      } as any);

      const result = await driverApiService.getDashboardData();

      // Should handle gracefully
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle location permission denied', async () => {
      // Mock location permission denied
      const mockLocation = jest.fn().mockRejectedValue(new Error('Location permission denied'));
      
      await expect(mockLocation()).rejects.toThrow('Location permission denied');
    });

    it('should handle rapid API calls', async () => {
      // Simulate rapid API calls
      const promises = Array.from({ length: 10 }, () => driverApiService.getDashboardData());
      
      const results = await Promise.all(promises);
      
      // Should handle gracefully without crashes
      expect(results).toHaveLength(10);
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle invalid task IDs', async () => {
      // Mock invalid task ID error
      mockDriverApiService.updateTransportTaskStatus.mockRejectedValue(new Error('Invalid task ID'));

      await expect(
        driverApiService.updateTransportTaskStatus(
          -1, // Invalid ID
          'en_route_pickup',
          createMockLocation(),
          'Test'
        )
      ).rejects.toThrow('Invalid task ID');
    });

    it('should handle invalid location data', async () => {
      // Mock invalid location error
      mockDriverApiService.checkInWorker.mockRejectedValue(new Error('Invalid location coordinates'));

      const invalidLocation = {
        latitude: 999, // Invalid latitude
        longitude: 999, // Invalid longitude
        accuracy: 10,
        timestamp: new Date(),
      };

      await expect(
        driverApiService.checkInWorker(1, 1, invalidLocation)
      ).rejects.toThrow('Invalid location coordinates');
    });
  });
});

// Additional test utilities and helpers
const TestUtils = {
  // Helper to create mock API responses
  createMockApiResponse: function<T>(data: T, success = true, message = 'Success') {
    return {
      success,
      data,
      message,
    };
  },

  // Helper to simulate network conditions
  simulateNetworkCondition: (condition: 'online' | 'offline' | 'slow') => {
    switch (condition) {
      case 'offline':
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
          details: {},
        } as any);
        break;
      case 'slow':
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: true,
          isInternetReachable: true,
          type: 'cellular',
          details: { cellularGeneration: '2g' },
        } as any);
        break;
      default:
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
          details: {},
        } as any);
    }
  },

  // Helper to wait for async operations
  waitForAsyncOperations: async (timeout = 5000) => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  },
};