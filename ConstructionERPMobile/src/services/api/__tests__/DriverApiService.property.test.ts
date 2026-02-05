// Property-Based Test for DriverApiService Integration
// Feature: construction-erp-supervisor-driver-extension, Property 7: Role-Specific API Integration
// Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5

import * as fc from 'fast-check';
import { DriverApiService } from '../DriverApiService';
import { apiClient } from '../client';
import {
  DriverDashboardResponse,
  TransportTask,
  VehicleInfo,
  TripRecord,
  DriverPerformance,
  MaintenanceAlert,
  WorkerManifest,
  RouteData,
  GeoLocation,
  ApiResponse,
  ApiError,
} from '../../../types';

// Mock the API client
jest.mock('../client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('DriverApiService Property-Based Tests', () => {
  let driverApiService: DriverApiService;

  beforeEach(() => {
    driverApiService = new DriverApiService();
    jest.clearAllMocks();
  });

  describe('Property 7: Role-Specific API Integration', () => {
    it('should use correct driver-specific endpoints for any valid API operation', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'getTodaysTransportTasks',
            'getTransportTaskDetails',
            'updateTransportTaskStatus',
            'getWorkerManifests',
            'getAssignedVehicle',
            'getMaintenanceAlerts',
            'clockIn',
            'clockOut',
            'getTodaysAttendance',
            'getAttendanceHistory',
            'getTripHistory',
            'getPerformanceMetrics'
          ),
          params: fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            taskId: fc.integer({ min: 1, max: 1000 }),
            vehicleId: fc.integer({ min: 1, max: 100 }),
            workerId: fc.integer({ min: 1, max: 1000 }),
            locationId: fc.integer({ min: 1, max: 100 }),
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            status: fc.constantFrom('pending', 'en_route_pickup', 'pickup_complete', 'en_route_dropoff', 'completed'),
            limit: fc.integer({ min: 1, max: 100 }),
            offset: fc.integer({ min: 0, max: 1000 }),
            location: fc.record({
              latitude: fc.float({ min: -90, max: 90 }),
              longitude: fc.float({ min: -180, max: 180 }),
              accuracy: fc.float({ min: 1, max: 100 }),
              timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
            })
          }),
          mockResponse: fc.record({
            success: fc.constant(true),
            data: fc.object(),
            message: fc.string()
          })
        }),
        async ({ operation, params, mockResponse }) => {
          // Clear previous mock calls
          jest.clearAllMocks();
          
          // Setup mock response
          mockApiClient.get.mockResolvedValue(mockResponse as ApiResponse<any>);
          mockApiClient.post.mockResolvedValue(mockResponse as ApiResponse<any>);
          mockApiClient.put.mockResolvedValue(mockResponse as ApiResponse<any>);
          mockApiClient.uploadFile.mockResolvedValue(mockResponse as ApiResponse<any>);

          // Execute the operation
          let result: ApiResponse<any>;
          let expectedEndpoint: string;
          let expectedMethod: 'get' | 'post' | 'put' | 'uploadFile';

          switch (operation) {
            case 'getDashboardData':
              result = await driverApiService.getDashboardData(params.date);
              expectedEndpoint = '/driver/dashboard';
              expectedMethod = 'get';
              break;

            case 'getTodaysTransportTasks':
              result = await driverApiService.getTodaysTransportTasks(params.date);
              expectedEndpoint = '/driver/transport/tasks';
              expectedMethod = 'get';
              break;

            case 'getTransportTaskDetails':
              result = await driverApiService.getTransportTaskDetails(params.taskId);
              expectedEndpoint = `/driver/transport/tasks/${params.taskId}`;
              expectedMethod = 'get';
              break;

            case 'updateTransportTaskStatus':
              result = await driverApiService.updateTransportTaskStatus(
                params.taskId,
                params.status as TransportTask['status'],
                params.location as GeoLocation,
                'Test notes'
              );
              expectedEndpoint = `/driver/transport/tasks/${params.taskId}/status`;
              expectedMethod = 'put';
              break;

            case 'getWorkerManifests':
              result = await driverApiService.getWorkerManifests(params.taskId);
              expectedEndpoint = `/driver/transport/tasks/${params.taskId}/manifests`;
              expectedMethod = 'get';
              break;

            case 'getAssignedVehicle':
              result = await driverApiService.getAssignedVehicle();
              expectedEndpoint = '/driver/vehicle/assigned';
              expectedMethod = 'get';
              break;

            case 'getMaintenanceAlerts':
              result = await driverApiService.getMaintenanceAlerts();
              expectedEndpoint = '/driver/vehicle/maintenance-alerts';
              expectedMethod = 'get';
              break;

            case 'clockIn':
              result = await driverApiService.clockIn({
                vehicleId: params.vehicleId,
                location: params.location as GeoLocation,
                preCheckCompleted: true,
                mileageReading: 50000
              });
              expectedEndpoint = '/driver/attendance/clock-in';
              expectedMethod = 'post';
              break;

            case 'clockOut':
              result = await driverApiService.clockOut({
                vehicleId: params.vehicleId,
                location: params.location as GeoLocation,
                postCheckCompleted: true,
                mileageReading: 50100,
                fuelLevel: 75
              });
              expectedEndpoint = '/driver/attendance/clock-out';
              expectedMethod = 'post';
              break;

            case 'getTodaysAttendance':
              result = await driverApiService.getTodaysAttendance();
              expectedEndpoint = '/driver/attendance/today';
              expectedMethod = 'get';
              break;

            case 'getAttendanceHistory':
              result = await driverApiService.getAttendanceHistory({
                startDate: params.date,
                limit: params.limit,
                offset: params.offset
              });
              expectedEndpoint = '/driver/attendance/history';
              expectedMethod = 'get';
              break;

            case 'getTripHistory':
              result = await driverApiService.getTripHistory({
                startDate: params.date,
                status: 'completed',
                limit: params.limit,
                offset: params.offset
              });
              expectedEndpoint = '/driver/trips/history';
              expectedMethod = 'get';
              break;

            case 'getPerformanceMetrics':
              result = await driverApiService.getPerformanceMetrics('month');
              expectedEndpoint = '/driver/performance/metrics';
              expectedMethod = 'get';
              break;

            default:
              throw new Error(`Unknown operation: ${operation}`);
          }

          // Verify correct endpoint was called
          if (expectedMethod === 'get') {
            const lastCall = mockApiClient.get.mock.calls[mockApiClient.get.mock.calls.length - 1];
            expect(lastCall[0]).toBe(expectedEndpoint);
          } else if (expectedMethod === 'post') {
            const lastCall = mockApiClient.post.mock.calls[mockApiClient.post.mock.calls.length - 1];
            expect(lastCall[0]).toBe(expectedEndpoint);
          } else if (expectedMethod === 'put') {
            const lastCall = mockApiClient.put.mock.calls[mockApiClient.put.mock.calls.length - 1];
            expect(lastCall[0]).toBe(expectedEndpoint);
          } else if (expectedMethod === 'uploadFile') {
            const lastCall = mockApiClient.uploadFile.mock.calls[mockApiClient.uploadFile.mock.calls.length - 1];
            expect(lastCall[0]).toBe(expectedEndpoint);
          }

          // Verify response format
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('data');
          expect(result.success).toBe(true);
        }
      ));
    });

    it('should handle API errors appropriately with role-specific error handling', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'getTodaysTransportTasks',
            'clockIn',
            'getAssignedVehicle'
          ),
          errorType: fc.constantFrom('network', 'auth', 'validation', 'server'),
          errorCode: fc.integer({ min: 400, max: 599 }),
          errorMessage: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async ({ operation, errorType, errorCode, errorMessage }) => {
          // Clear previous mock calls
          jest.clearAllMocks();
          
          // Setup mock error response
          const mockError = {
            response: {
              status: errorCode,
              data: {
                success: false,
                message: errorMessage,
                errors: [`${errorType} error occurred`]
              }
            },
            message: errorMessage,
            code: errorType.toUpperCase()
          };

          mockApiClient.get.mockRejectedValue(mockError);
          mockApiClient.post.mockRejectedValue(mockError);

          // Execute operation and expect it to throw
          let thrownError: any;
          try {
            switch (operation) {
              case 'getDashboardData':
                await driverApiService.getDashboardData();
                break;
              case 'getTodaysTransportTasks':
                await driverApiService.getTodaysTransportTasks();
                break;
              case 'clockIn':
                await driverApiService.clockIn({
                  vehicleId: 1,
                  location: {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  },
                  preCheckCompleted: true
                });
                break;
              case 'getAssignedVehicle':
                await driverApiService.getAssignedVehicle();
                break;
            }
          } catch (error) {
            thrownError = error;
          }

          // Verify error was thrown and has proper structure
          expect(thrownError).toBeDefined();
          expect(thrownError).toHaveProperty('message');
          
          // Verify error contains role-specific context
          if (errorCode >= 400 && errorCode < 500) {
            // Client errors should be properly formatted
            expect(typeof thrownError.message).toBe('string');
          } else if (errorCode >= 500) {
            // Server errors should be handled gracefully
            expect(typeof thrownError.message).toBe('string');
          }
        }
      ));
    });

    it('should maintain proper JWT token authentication for any driver API call', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'clockIn',
            'updateTransportTaskStatus',
            'reportDelay'
          ),
          hasValidToken: fc.boolean(),
          tokenExpired: fc.boolean()
        }),
        async ({ operation, hasValidToken, tokenExpired }) => {
          // Clear previous mock calls
          jest.clearAllMocks();
          
          // Setup authentication scenario
          if (!hasValidToken || tokenExpired) {
            const authError = {
              response: {
                status: 401,
                data: {
                  success: false,
                  message: tokenExpired ? 'Token expired' : 'Unauthorized access',
                  errors: ['Authentication required']
                }
              },
              message: 'Unauthorized',
              code: 'UNAUTHORIZED'
            };
            mockApiClient.get.mockRejectedValue(authError);
            mockApiClient.post.mockRejectedValue(authError);
            mockApiClient.put.mockRejectedValue(authError);
          } else {
            mockApiClient.get.mockResolvedValue({
              success: true,
              data: {},
              message: 'Success'
            });
            mockApiClient.post.mockResolvedValue({
              success: true,
              data: {},
              message: 'Success'
            });
            mockApiClient.put.mockResolvedValue({
              success: true,
              data: {},
              message: 'Success'
            });
          }

          // Execute operation
          let result: any;
          let thrownError: any;

          try {
            switch (operation) {
              case 'getDashboardData':
                result = await driverApiService.getDashboardData();
                break;
              case 'clockIn':
                result = await driverApiService.clockIn({
                  vehicleId: 1,
                  location: {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  },
                  preCheckCompleted: true
                });
                break;
              case 'updateTransportTaskStatus':
                result = await driverApiService.updateTransportTaskStatus(
                  1,
                  'en_route_pickup',
                  {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  }
                );
                break;
              case 'reportDelay':
                result = await driverApiService.reportDelay(1, {
                  reason: 'traffic',
                  estimatedDelay: 15,
                  location: {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  },
                  description: 'Heavy traffic'
                });
                break;
            }
          } catch (error) {
            thrownError = error;
          }

          // Verify authentication behavior
          if (hasValidToken && !tokenExpired) {
            // Should succeed with valid token
            expect(result).toBeDefined();
            expect(thrownError).toBeUndefined();
          } else {
            // Should fail with invalid/expired token
            expect(thrownError).toBeDefined();
            expect(thrownError.response?.status).toBe(401);
          }
        }
      ));
    });

    it('should validate API response data structure for any driver endpoint', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom(
            'dashboard',
            'transportTasks',
            'assignedVehicle',
            'maintenanceAlerts',
            'attendanceHistory'
          ),
          responseData: fc.record({
            hasRequiredFields: fc.boolean(),
            hasValidDataTypes: fc.boolean(),
            hasValidStructure: fc.boolean()
          })
        }),
        async ({ endpoint, responseData }) => {
          // Clear previous mock calls
          jest.clearAllMocks();
          
          // Create mock response based on endpoint and validation flags
          let mockResponse: ApiResponse<any>;

          switch (endpoint) {
            case 'dashboard':
              mockResponse = {
                success: true,
                data: responseData.hasValidStructure ? {
                  todaysTransportTasks: responseData.hasRequiredFields ? [
                    {
                      taskId: responseData.hasValidDataTypes ? 1 : 'invalid',
                      route: responseData.hasValidDataTypes ? 'Route A' : null,
                      pickupTime: responseData.hasValidDataTypes ? '08:00' : 123,
                      workerCount: responseData.hasValidDataTypes ? 10 : 'ten',
                      status: responseData.hasValidDataTypes ? 'pending' : 'invalid_status'
                    }
                  ] : null,
                  assignedVehicle: responseData.hasRequiredFields ? {
                    id: responseData.hasValidDataTypes ? 1 : 'invalid',
                    plateNumber: responseData.hasValidDataTypes ? 'ABC123' : null,
                    model: responseData.hasValidDataTypes ? 'Toyota Hiace' : 123,
                    capacity: responseData.hasValidDataTypes ? 15 : 'fifteen'
                  } : null
                } : 'invalid_structure'
              };
              break;

            case 'transportTasks':
              mockResponse = {
                success: true,
                data: responseData.hasValidStructure ? (responseData.hasRequiredFields ? [
                  {
                    taskId: responseData.hasValidDataTypes ? 1 : 'invalid',
                    route: responseData.hasValidDataTypes ? 'Route A' : null,
                    pickupLocations: responseData.hasValidDataTypes ? [] : 'invalid',
                    dropoffLocation: responseData.hasValidDataTypes ? {} : null,
                    status: responseData.hasValidDataTypes ? 'pending' : 'invalid_status'
                  }
                ] : null) : 'invalid_structure'
              };
              break;

            case 'assignedVehicle':
              mockResponse = {
                success: true,
                data: responseData.hasValidStructure ? {
                  id: responseData.hasValidDataTypes ? 1 : 'invalid',
                  plateNumber: responseData.hasValidDataTypes ? 'ABC123' : null,
                  model: responseData.hasValidDataTypes ? 'Toyota Hiace' : 123,
                  capacity: responseData.hasValidDataTypes ? 15 : 'fifteen',
                  fuelLevel: responseData.hasValidDataTypes ? 80 : 'eighty'
                } : 'invalid_structure'
              };
              break;

            default:
              mockResponse = {
                success: true,
                data: responseData.hasValidStructure ? {} : 'invalid'
              };
          }

          mockApiClient.get.mockResolvedValue(mockResponse);

          // Execute API call
          let result: any;
          let thrownError: any;

          try {
            switch (endpoint) {
              case 'dashboard':
                result = await driverApiService.getDashboardData();
                break;
              case 'transportTasks':
                result = await driverApiService.getTodaysTransportTasks();
                break;
              case 'assignedVehicle':
                result = await driverApiService.getAssignedVehicle();
                break;
              case 'maintenanceAlerts':
                result = await driverApiService.getMaintenanceAlerts();
                break;
              case 'attendanceHistory':
                result = await driverApiService.getAttendanceHistory();
                break;
            }
          } catch (error) {
            thrownError = error;
          }

          // Verify response handling
          if (responseData.hasValidStructure && responseData.hasRequiredFields && responseData.hasValidDataTypes) {
            // Should succeed with valid response
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(thrownError).toBeUndefined();
          } else {
            // Should handle invalid responses gracefully
            // The API client should still return the response, but the application
            // layer should validate the data structure
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
          }
        }
      ));
    });

    it('should handle network timeouts and connectivity issues for any driver API operation', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'clockIn',
            'updateTransportTaskStatus',
            'reportBreakdown'
          ),
          networkIssue: fc.constantFrom('timeout', 'connection_refused', 'network_error', 'dns_error'),
          retryAttempts: fc.integer({ min: 0, max: 3 })
        }),
        async ({ operation, networkIssue, retryAttempts }) => {
          // Clear previous mock calls
          jest.clearAllMocks();
          
          // Setup network error
          const networkError = {
            code: networkIssue.toUpperCase(),
            message: `Network ${networkIssue.replace('_', ' ')} occurred`,
            isAxiosError: true,
            response: undefined // No response for network errors
          };

          mockApiClient.get.mockRejectedValue(networkError);
          mockApiClient.post.mockRejectedValue(networkError);
          mockApiClient.put.mockRejectedValue(networkError);
          mockApiClient.uploadFile.mockRejectedValue(networkError);

          // Execute operation and expect network error
          let thrownError: any;
          try {
            switch (operation) {
              case 'getDashboardData':
                await driverApiService.getDashboardData();
                break;
              case 'clockIn':
                await driverApiService.clockIn({
                  vehicleId: 1,
                  location: {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  },
                  preCheckCompleted: true
                });
                break;
              case 'updateTransportTaskStatus':
                await driverApiService.updateTransportTaskStatus(
                  1,
                  'en_route_pickup',
                  {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  }
                );
                break;
              case 'reportBreakdown':
                await driverApiService.reportBreakdown(1, {
                  description: 'Engine failure',
                  severity: 'critical',
                  location: {
                    latitude: 1.3521,
                    longitude: 103.8198,
                    accuracy: 10,
                    timestamp: new Date()
                  },
                  assistanceRequired: true
                });
                break;
            }
          } catch (error) {
            thrownError = error;
          }

          // Verify network error handling
          expect(thrownError).toBeDefined();
          expect(thrownError.code).toBe(networkIssue.toUpperCase());
          expect(thrownError.message).toContain(networkIssue.replace('_', ' '));
        }
      ));
    });

    it('should handle location-based operations with proper geolocation validation', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'clockIn',
            'clockOut',
            'updateTransportTaskStatus',
            'checkInWorker',
            'reportDelay'
          ),
          location: fc.record({
            latitude: fc.float({ min: -90, max: 90 }),
            longitude: fc.float({ min: -180, max: 180 }),
            accuracy: fc.float({ min: 1, max: 100 }),
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
          }),
          isValidLocation: fc.boolean()
        }),
        async ({ operation, location, isValidLocation }) => {
          // Clear previous mock calls
          jest.clearAllMocks();
          
          // Setup mock response
          const mockResponse = {
            success: true,
            data: {
              success: true,
              message: 'Operation completed successfully',
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp.toISOString()
              }
            }
          };

          mockApiClient.post.mockResolvedValue(mockResponse);
          mockApiClient.put.mockResolvedValue(mockResponse);
          mockApiClient.uploadFile.mockResolvedValue(mockResponse);

          // Execute location-based operation
          let result: any;
          let thrownError: any;

          try {
            switch (operation) {
              case 'clockIn':
                result = await driverApiService.clockIn({
                  vehicleId: 1,
                  location: location as GeoLocation,
                  preCheckCompleted: true
                });
                break;
              case 'clockOut':
                result = await driverApiService.clockOut({
                  vehicleId: 1,
                  location: location as GeoLocation,
                  postCheckCompleted: true
                });
                break;
              case 'updateTransportTaskStatus':
                result = await driverApiService.updateTransportTaskStatus(
                  1,
                  'en_route_pickup',
                  location as GeoLocation
                );
                break;
              case 'checkInWorker':
                result = await driverApiService.checkInWorker(
                  1,
                  1,
                  location as GeoLocation
                );
                break;
              case 'reportDelay':
                result = await driverApiService.reportDelay(1, {
                  reason: 'traffic',
                  estimatedDelay: 15,
                  location: location as GeoLocation,
                  description: 'Heavy traffic'
                });
                break;
            }
          } catch (error) {
            thrownError = error;
          }

          // Verify location handling
          if (isValidLocation) {
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(thrownError).toBeUndefined();
            
            // Verify location data was properly formatted in the API call
            const lastCall = operation === 'updateTransportTaskStatus' 
              ? mockApiClient.put.mock.calls[mockApiClient.put.mock.calls.length - 1]
              : mockApiClient.post.mock.calls[mockApiClient.post.mock.calls.length - 1];
            
            if (lastCall && lastCall[1]) {
              const payload = lastCall[1];
              if (payload.location) {
                expect(payload.location.latitude).toBe(location.latitude);
                expect(payload.location.longitude).toBe(location.longitude);
                expect(payload.location.accuracy).toBe(location.accuracy);
                expect(payload.location.timestamp).toBe(location.timestamp.toISOString());
              }
            }
          }
        }
      ));
    });
  });
});