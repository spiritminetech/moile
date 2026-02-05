// Driver API Service Tests
// Requirements: 8.1, 9.1, 10.1, 11.1, 12.1

import { driverApiService } from '../DriverApiService';
import { apiClient } from '../client';

// Mock the API client
jest.mock('../client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('DriverApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard APIs', () => {
    it('should get dashboard data successfully', async () => {
      const mockDashboardData = {
        todaysTransportTasks: [
          {
            taskId: 1,
            route: 'Route A',
            pickupTime: '08:00',
            pickupLocation: {
              name: 'Dormitory A',
              address: '123 Main St',
              coordinates: { latitude: 1.3521, longitude: 103.8198 }
            },
            dropoffLocation: {
              name: 'Construction Site',
              address: '456 Work St',
              coordinates: { latitude: 1.3621, longitude: 103.8298 }
            },
            workerCount: 10,
            status: 'pending' as const
          }
        ],
        assignedVehicle: {
          id: 1,
          plateNumber: 'ABC123',
          model: 'Toyota Hiace',
          capacity: 15,
          fuelLevel: 80,
          maintenanceStatus: 'good' as const
        },
        performanceMetrics: {
          onTimePerformance: 95,
          completedTrips: 50,
          totalDistance: 1000,
          fuelEfficiency: 12.5
        }
      };

      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: mockDashboardData
      });

      const result = await driverApiService.getDashboardData();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/driver/dashboard', { params: {} });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDashboardData);
    });

    it('should get dashboard data with date parameter', async () => {
      const testDate = '2024-01-15';
      
      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: { todaysTransportTasks: [], assignedVehicle: null, performanceMetrics: {} }
      });

      await driverApiService.getDashboardData(testDate);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/driver/dashboard', { 
        params: { date: testDate } 
      });
    });
  });

  describe('Transport Task APIs', () => {
    it('should get todays transport tasks successfully', async () => {
      const mockTasks = [
        {
          taskId: 1,
          route: 'Route A',
          pickupLocations: [
            {
              locationId: 1,
              name: 'Dormitory A',
              address: '123 Main St',
              coordinates: { latitude: 1.3521, longitude: 103.8198 },
              workerManifest: [
                {
                  workerId: 1,
                  name: 'John Doe',
                  phone: '+65 9123 4567',
                  checkedIn: false
                }
              ],
              estimatedPickupTime: '08:00'
            }
          ],
          dropoffLocation: {
            name: 'Construction Site',
            address: '456 Work St',
            coordinates: { latitude: 1.3621, longitude: 103.8298 },
            estimatedArrival: '08:30'
          },
          status: 'pending' as const,
          totalWorkers: 10,
          checkedInWorkers: 0
        }
      ];

      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: mockTasks
      });

      const result = await driverApiService.getTodaysTransportTasks();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/driver/transport/tasks', { params: {} });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
    });

    it('should handle empty transport tasks response', async () => {
      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: []
      });

      const result = await driverApiService.getTodaysTransportTasks();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.message).toBe('No transport tasks found');
    });

    it('should update transport task status', async () => {
      const taskId = 1;
      const status = 'en_route_pickup';
      const location = {
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10,
        timestamp: new Date('2024-01-15T08:00:00Z')
      };

      const mockResponse = {
        taskId: 1,
        status: 'en_route_pickup',
        updatedAt: '2024-01-15T08:00:00Z',
        location: {
          latitude: 1.3521,
          longitude: 103.8198,
          timestamp: '2024-01-15T08:00:00Z'
        }
      };

      mockedApiClient.put.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await driverApiService.updateTransportTaskStatus(taskId, status, location);

      expect(mockedApiClient.put).toHaveBeenCalledWith(`/driver/transport/tasks/${taskId}/status`, {
        status,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp.toISOString()
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('Vehicle Management APIs', () => {
    it('should get assigned vehicle successfully', async () => {
      const mockVehicle = {
        id: 1,
        plateNumber: 'ABC123',
        model: 'Toyota Hiace',
        year: 2020,
        capacity: 15,
        currentMileage: 50000,
        fuelLevel: 80,
        maintenanceSchedule: [
          {
            type: 'oil_change' as const,
            dueDate: '2024-02-01',
            dueMileage: 55000,
            status: 'upcoming' as const
          }
        ],
        fuelLog: [
          {
            date: '2024-01-15',
            amount: 50,
            cost: 75,
            mileage: 50000,
            location: 'Shell Station'
          }
        ]
      };

      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: mockVehicle
      });

      const result = await driverApiService.getAssignedVehicle();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/driver/vehicle/assigned');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVehicle);
    });

    it('should handle no assigned vehicle', async () => {
      mockedApiClient.get.mockResolvedValue({
        success: false,
        data: null
      });

      const result = await driverApiService.getAssignedVehicle();

      expect(result.success).toBe(false);
      expect(result.message).toBe('No vehicle assigned');
    });

    it('should get maintenance alerts', async () => {
      const mockAlerts = [
        {
          id: 1,
          vehicleId: 1,
          type: 'scheduled' as const,
          description: 'Oil change due',
          dueDate: new Date('2024-02-01'),
          priority: 'medium' as const
        }
      ];

      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: mockAlerts
      });

      const result = await driverApiService.getMaintenanceAlerts();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/driver/vehicle/maintenance-alerts');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAlerts);
    });
  });

  describe('Driver Attendance APIs', () => {
    it('should clock in successfully', async () => {
      const clockInData = {
        vehicleId: 1,
        location: {
          latitude: 1.3521,
          longitude: 103.8198,
          accuracy: 10,
          timestamp: new Date('2024-01-15T08:00:00Z')
        },
        preCheckCompleted: true,
        mileageReading: 50000
      };

      const mockResponse = {
        success: true,
        message: 'Clocked in successfully',
        checkInTime: '2024-01-15T08:00:00Z',
        session: 'CHECKED_IN' as const,
        vehicleAssigned: {
          id: 1,
          plateNumber: 'ABC123',
          model: 'Toyota Hiace'
        }
      };

      mockedApiClient.post.mockResolvedValue({
        success: true,
        data: mockResponse
      });

      const result = await driverApiService.clockIn(clockInData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/driver/attendance/clock-in', {
        vehicleId: clockInData.vehicleId,
        preCheckCompleted: clockInData.preCheckCompleted,
        mileageReading: clockInData.mileageReading,
        location: {
          latitude: clockInData.location.latitude,
          longitude: clockInData.location.longitude,
          accuracy: clockInData.location.accuracy,
          timestamp: clockInData.location.timestamp.toISOString()
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should get todays attendance', async () => {
      const mockAttendance = {
        session: 'CHECKED_IN' as const,
        checkInTime: '2024-01-15T08:00:00Z',
        checkOutTime: null,
        assignedVehicle: {
          id: 1,
          plateNumber: 'ABC123',
          model: 'Toyota Hiace'
        },
        totalHours: 0,
        totalDistance: 0,
        date: '2024-01-15'
      };

      mockedApiClient.get.mockResolvedValue({
        success: true,
        data: mockAttendance
      });

      const result = await driverApiService.getTodaysAttendance();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/driver/attendance/today');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAttendance);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      mockedApiClient.get.mockRejectedValue(networkError);

      await expect(driverApiService.getTodaysTransportTasks()).rejects.toThrow('Network connection failed. Please check your internet connection.');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('401 Unauthorized');
      mockedApiClient.get.mockRejectedValue(authError);

      await expect(driverApiService.getTodaysTransportTasks()).rejects.toThrow('Authentication failed. Please log in again.');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockedApiClient.get.mockRejectedValue(genericError);

      await expect(driverApiService.getTodaysTransportTasks()).rejects.toThrow('Something went wrong');
    });
  });
});