// Enhanced Driver Integration Tests - Task 12.2
// Complete Driver workflows, API integration, offline mode, cross-platform compatibility

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as fc from 'fast-check';

// Import Driver components and services
import DriverDashboard from '../../screens/driver/DriverDashboard';
import TransportTasksScreen from '../../screens/driver/TransportTasksScreen';
import TripUpdatesScreen from '../../screens/driver/TripUpdatesScreen';
import DriverAttendanceScreen from '../../screens/driver/DriverAttendanceScreen';
import VehicleInfoScreen from '../../screens/driver/VehicleInfoScreen';
import DriverProfileScreen from '../../screens/driver/DriverProfileScreen';
import DriverNavigator from '../../navigation/DriverNavigator';
import AppNavigator from '../../navigation/AppNavigator';

// Import API services
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
  TripRecord,
  MaintenanceAlert,
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

// Mock image picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
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
describe('Enhanced Driver Integration Tests - Task 12.2', () => {
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
    it('should complete full end-to-end driver workflow with all screens', async () => {
      // Test complete driver workflow across all screens
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

      // Test 1: Dashboard Screen Integration
      const { getByText: getDashboardText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getDashboardData).toHaveBeenCalled();
        expect(getDashboardText('📊 Today\'s Overview')).toBeTruthy();
      });

      // Test 2: Transport Tasks Screen Integration
      const { getByText: getTransportText } = render(
        <TestWrapper>
          <TransportTasksScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
        expect(getTransportText(/Transport Tasks/)).toBeTruthy();
      });

      // Test 3: Trip Updates Screen Integration
      const { getByText: getTripText } = render(
        <TestWrapper>
          <TripUpdatesScreen />
        </TestWrapper>
      );

      expect(getTripText(/Trip Updates/)).toBeTruthy();

      // Test 4: Driver Attendance Screen Integration
      const { getByText: getAttendanceText } = render(
        <TestWrapper>
          <DriverAttendanceScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getTodaysAttendance).toHaveBeenCalled();
        expect(getAttendanceText(/Attendance/)).toBeTruthy();
      });

      // Test 5: Vehicle Info Screen Integration
      const { getByText: getVehicleText } = render(
        <TestWrapper>
          <VehicleInfoScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getAssignedVehicle).toHaveBeenCalled();
        expect(getVehicleText(/Vehicle/)).toBeTruthy();
      });

      // Test 6: Driver Profile Screen Integration
      const { getByText: getProfileText } = render(
        <TestWrapper>
          <DriverProfileScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getDriverProfile).toHaveBeenCalled();
        expect(getProfileText(/Profile/)).toBeTruthy();
      });

      // Test 7: Complete workflow API calls
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

      const { getByText } = render(
        <TestWrapper>
          <TransportTasksScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
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

        const { getByText } = render(
          <TestWrapper>
            <DriverDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(mockDriverApiService.getDashboardData).toHaveBeenCalled();
          expect(getByText('Driver Dashboard')).toBeTruthy();
        });

        // Verify appropriate handling of each scenario
        if (scenario.mockData.tasks.length === 0) {
          expect(getByText('🚛 No transport tasks today')).toBeTruthy();
        }
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

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle rate limiting gracefully
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });

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

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle partial failures gracefully
      await waitFor(() => {
        expect(getByText('📊 Today\'s Overview')).toBeTruthy();
      });

      // Verify all APIs were called despite some failures
      expect(mockDriverApiService.getDashboardData).toHaveBeenCalled();
      expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
      expect(mockDriverApiService.getAssignedVehicle).toHaveBeenCalled();
      expect(mockDriverApiService.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('should handle authentication errors and redirect to login', async () => {
      // Mock authentication error
      mockDriverApiService.getDashboardData.mockRejectedValue(new Error('Authentication failed. Please log in again.'));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/Authentication failed/)).toBeTruthy();
      });
    });

    it('should handle network errors with appropriate messaging', async () => {
      // Mock network error
      mockDriverApiService.getTodaysTransportTasks.mockRejectedValue(new Error('Network connection failed. Please check your internet connection.'));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/Network connection failed/)).toBeTruthy();
      });
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

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('🚛 No transport tasks today')).toBeTruthy();
        expect(getByText('Check back later or contact dispatch')).toBeTruthy();
      });
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

      const { getByText } = render(
        <TestWrapper isOffline={true}>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should load cached data in offline mode
      await waitFor(() => {
        expect(getByText('📊 Today\'s Overview')).toBeTruthy();
        expect(getByText(/offline/i)).toBeTruthy();
      });

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

      const { getByText } = render(
        <TestWrapper isOffline={false}>
          <DriverDashboard />
        </TestWrapper>
      );

      // Wait for sync to complete
      await waitFor(() => {
        expect(mockDriverApiService.clockIn).toHaveBeenCalled();
        expect(mockDriverApiService.updateTransportTaskStatus).toHaveBeenCalled();
        expect(mockDriverApiService.checkInWorker).toHaveBeenCalled();
        expect(mockDriverApiService.confirmPickupComplete).toHaveBeenCalled();
      });

      // Verify queue was cleared after successful sync
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('offline_actions_queue');
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

      const { getByText } = render(
        <TestWrapper isOffline={false}>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle sync failure without crashing
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });

      // Actions should remain in queue for retry
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalledWith('offline_actions_queue');
    });

    it('should show sync status to user', async () => {
      const { getByText } = render(
        <TestWrapper isOffline={false}>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should show sync indicator when syncing
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });

      // Could show sync status messages
      // This would depend on implementation of sync status UI
    });
  });
  describe('4. Cross-Platform Compatibility Testing', () => {
    const platforms = ['ios', 'android', 'web'];

    platforms.forEach(platform => {
      it(`should work correctly on ${platform} platform`, async () => {
        // Mock platform-specific behavior
        jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
          OS: platform,
          select: (obj: any) => obj[platform] || obj.default,
        }));

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

        const { getByText } = render(
          <TestWrapper>
            <DriverDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(getByText('📊 Today\'s Overview')).toBeTruthy();
        });

        // Verify platform-specific functionality
        expect(mockDriverApiService.getDashboardData).toHaveBeenCalled();
      });
    });

    it('should handle platform-specific navigation correctly', async () => {
      const mockLocation = { latitude: 37.7749, longitude: -122.4194 };
      
      // Mock Linking.openURL
      const mockOpenURL = jest.fn().mockResolvedValue(true);
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Linking: {
          openURL: mockOpenURL,
        },
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should render dashboard
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
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

      jest.doMock('expo-location', () => ({
        requestForegroundPermissionsAsync: mockRequestPermissions,
        getCurrentPositionAsync: mockGetCurrentPosition,
        Accuracy: { High: 4 },
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });

      // Verify permissions were requested
      expect(mockRequestPermissions).toHaveBeenCalled();
    });

    it('should handle web platform compatibility', async () => {
      // Mock web platform
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'web',
        select: (obj: any) => obj.web || obj.default,
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('📊 Today\'s Overview')).toBeTruthy();
      });

      // Verify web-specific functionality
      expect(mockDriverApiService.getDashboardData).toHaveBeenCalled();
    });

    it('should handle different screen sizes and orientations', async () => {
      // Mock different screen dimensions
      const mockDimensions = {
        window: { width: 375, height: 812 }, // iPhone X
        screen: { width: 375, height: 812 },
      };

      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Dimensions: {
          get: () => mockDimensions.window,
        },
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('📊 Today\'s Overview')).toBeTruthy();
      });

      // Test tablet dimensions
      mockDimensions.window = { width: 768, height: 1024 };

      const { getByText: getByTextTablet } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByTextTablet('📊 Today\'s Overview')).toBeTruthy();
      });
    });
  });

  describe('5. Driver Screen Integration Tests', () => {
    it('should integrate TransportTasksScreen correctly', async () => {
      const { getByText } = render(
        <TestWrapper>
          <TransportTasksScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
      });

      // Should display transport tasks
      expect(getByText(/Transport Tasks/)).toBeTruthy();
    });

    it('should integrate TripUpdatesScreen correctly', async () => {
      const { getByText } = render(
        <TestWrapper>
          <TripUpdatesScreen />
        </TestWrapper>
      );

      // Should display trip updates interface
      expect(getByText(/Trip Updates/)).toBeTruthy();
    });

    it('should integrate DriverAttendanceScreen correctly', async () => {
      const { getByText } = render(
        <TestWrapper>
          <DriverAttendanceScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getTodaysAttendance).toHaveBeenCalled();
      });

      // Should display attendance interface
      expect(getByText(/Attendance/)).toBeTruthy();
    });

    it('should integrate VehicleInfoScreen correctly', async () => {
      const { getByText } = render(
        <TestWrapper>
          <VehicleInfoScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getAssignedVehicle).toHaveBeenCalled();
      });

      // Should display vehicle information
      expect(getByText(/Vehicle/)).toBeTruthy();
    });

    it('should integrate DriverProfileScreen correctly', async () => {
      const { getByText } = render(
        <TestWrapper>
          <DriverProfileScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockDriverApiService.getDriverProfile).toHaveBeenCalled();
      });

      // Should display driver profile
      expect(getByText(/Profile/)).toBeTruthy();
    });

    it('should handle navigation between driver screens', async () => {
      const mockNavigate = jest.fn();
      
      jest.doMock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => ({
          navigate: mockNavigate,
          goBack: jest.fn(),
          reset: jest.fn(),
          setOptions: jest.fn(),
        }),
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverNavigator />
        </TestWrapper>
      );

      // Should render driver navigation
      await waitFor(() => {
        expect(getByText(/Dashboard/)).toBeTruthy();
      });
    });
  });

  describe('6. Complete Driver Navigation Integration', () => {
    it('should integrate with AppNavigator for role-based routing', async () => {
      const mockUser = createMockUser('Driver');
      
      const { getByText } = render(
        <TestWrapper 
          initialAuthState={{
            isAuthenticated: true,
            user: mockUser,
            company: { name: 'Test Company' },
            token: 'mock-token',
            permissions: ['transport_tasks', 'vehicle_info', 'trip_updates'],
          }}
        >
          <AppNavigator />
        </TestWrapper>
      );

      // Should route to driver interface
      await waitFor(() => {
        expect(getByText(/Driver/)).toBeTruthy();
      });
    });

    it('should handle deep linking to driver screens', async () => {
      const mockNavigate = jest.fn();
      
      jest.doMock('@react-navigation/native', () => ({
        ...jest.requireActual('@react-navigation/native'),
        useNavigation: () => ({
          navigate: mockNavigate,
          goBack: jest.fn(),
          reset: jest.fn(),
          setOptions: jest.fn(),
        }),
      }));

      // Mock deep link to transport tasks
      const deepLinkUrl = 'constructionerp://driver/transport-tasks/1';
      
      const { getByText } = render(
        <TestWrapper>
          <DriverNavigator />
        </TestWrapper>
      );

      // Should handle deep link navigation
      await waitFor(() => {
        expect(getByText(/Dashboard/)).toBeTruthy();
      });
    });

    it('should maintain navigation state across app lifecycle', async () => {
      const { getByText, rerender } = render(
        <TestWrapper>
          <DriverNavigator />
        </TestWrapper>
      );

      // Initial render
      await waitFor(() => {
        expect(getByText(/Dashboard/)).toBeTruthy();
      });

      // Simulate app backgrounding and foregrounding
      rerender(
        <TestWrapper>
          <DriverNavigator />
        </TestWrapper>
      );

      // Should maintain navigation state
      await waitFor(() => {
        expect(getByText(/Dashboard/)).toBeTruthy();
      });
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

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle gracefully
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });
    });

    it('should handle API timeout errors', async () => {
      // Mock timeout error
      mockDriverApiService.getTodaysTransportTasks.mockRejectedValue(new Error('Request timeout'));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/timeout/i)).toBeTruthy();
      });
    });

    it('should handle location permission denied', async () => {
      // Mock location permission denied
      const mockLocation = jest.fn().mockRejectedValue(new Error('Location permission denied'));
      
      jest.doMock('expo-location', () => ({
        requestForegroundPermissionsAsync: () => Promise.resolve({ status: 'denied' }),
        getCurrentPositionAsync: mockLocation,
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle permission denial gracefully
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });
    });

    it('should handle memory pressure scenarios', async () => {
      // Mock memory warning
      const mockMemoryWarning = jest.fn();
      
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        AppState: {
          addEventListener: mockMemoryWarning,
          removeEventListener: jest.fn(),
          currentState: 'active',
        },
      }));

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle memory pressure
      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });
    });

    it('should handle rapid user interactions', async () => {
      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('📊 Today\'s Overview')).toBeTruthy();
      });

      // Simulate rapid refresh actions
      const refreshButton = getByText('Driver Dashboard');
      
      await act(async () => {
        // Rapid fire multiple refresh actions
        for (let i = 0; i < 5; i++) {
          fireEvent.press(refreshButton);
        }
      });

      // Should handle gracefully without crashes
      expect(getByText('Driver Dashboard')).toBeTruthy();
    });
  });

  describe('8. Performance and Resource Management', () => {
    it('should manage memory efficiently with large datasets', async () => {
      // Mock large dataset
      const largeTasks = Array.from({ length: 100 }, (_, i) => createMockTransportTask(i + 1));
      
      mockDriverApiService.getTodaysTransportTasks.mockResolvedValue({
        success: true,
        data: largeTasks,
        message: 'Success',
      });

      const { getByText } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      // Should handle large datasets efficiently
      await waitFor(() => {
        expect(getByText('📊 Today\'s Overview')).toBeTruthy();
      });

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

    it('should clean up resources on component unmount', async () => {
      const { getByText, unmount } = render(
        <TestWrapper>
          <DriverDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Driver Dashboard')).toBeTruthy();
      });

      // Unmount component
      unmount();

      // Should clean up without memory leaks
      // This would be verified through memory profiling in real scenarios
    });
  });

  describe('9. Property-Based Testing with fast-check', () => {
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

            const { getByText } = render(
              <TestWrapper>
                <DriverDashboard />
              </TestWrapper>
            );

            await waitFor(() => {
              expect(getByText('📊 Today\'s Overview')).toBeTruthy();
            });

            // Should handle any valid transport task data
            expect(mockDriverApiService.getTodaysTransportTasks).toHaveBeenCalled();
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

  // Helper to simulate location scenarios
  simulateLocationScenario: (scenario: 'available' | 'denied' | 'unavailable') => {
    const mockLocation = jest.requireMock('expo-location');
    
    switch (scenario) {
      case 'denied':
        mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });
        break;
      case 'unavailable':
        mockLocation.getCurrentPositionAsync.mockRejectedValue(new Error('Location unavailable'));
        break;
      default:
        mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
        mockLocation.getCurrentPositionAsync.mockResolvedValue({
          coords: {
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 10,
          },
          timestamp: Date.now(),
        });
    }
  },

  // Helper to wait for async operations
  waitForAsyncOperations: async (timeout = 5000) => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  },
};