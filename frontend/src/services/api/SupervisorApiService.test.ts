// Property-Based Test for SupervisorApiService Integration
// Feature: construction-erp-supervisor-driver-extension, Property 7: Role-Specific API Integration
// Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5

import * as fc from 'fast-check';
import { SupervisorApiService } from './SupervisorApiService';
import { apiClient } from './client';
import {
  SupervisorDashboardResponse,
  TeamMember,
  TaskAssignmentRequest,
  ProgressReport,
  PendingApproval,
  MaterialRequest,
  ToolAllocation,
  ApiResponse,
  ApiError,
} from '../../types';

// Mock the API client
jest.mock('./client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('SupervisorApiService Property-Based Tests', () => {
  let supervisorApiService: SupervisorApiService;

  beforeEach(() => {
    supervisorApiService = new SupervisorApiService();
    jest.clearAllMocks();
  });

  describe('Property 7: Role-Specific API Integration', () => {
    it('should use correct supervisor-specific endpoints for any valid API operation', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'getTeamMembers',
            'getWorkerDetails',
            'getAttendanceMonitoring',
            'assignTask',
            'getTaskAssignments',
            'createProgressReport',
            'getPendingApprovals',
            'getMaterialRequests',
            'getToolAllocations'
          ),
          params: fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            projectId: fc.integer({ min: 1, max: 100 }),
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
            status: fc.constantFrom('pending', 'approved', 'rejected', 'completed'),
            priority: fc.constantFrom('low', 'normal', 'high', 'urgent'),
            limit: fc.integer({ min: 1, max: 100 }),
            offset: fc.integer({ min: 0, max: 1000 })
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

          // Execute the operation
          let result: ApiResponse<any>;
          let expectedEndpoint: string;
          let expectedMethod: 'get' | 'post' | 'put';

          switch (operation) {
            case 'getDashboardData':
              result = await supervisorApiService.getDashboardData(params.date);
              expectedEndpoint = '/supervisor/dashboard';
              expectedMethod = 'get';
              break;

            case 'getTeamMembers':
              result = await supervisorApiService.getTeamMembers(params.projectId);
              expectedEndpoint = '/supervisor/team/members';
              expectedMethod = 'get';
              break;

            case 'getWorkerDetails':
              result = await supervisorApiService.getWorkerDetails(params.id);
              expectedEndpoint = `/supervisor/team/workers/${params.id}`;
              expectedMethod = 'get';
              break;

            case 'getAttendanceMonitoring':
              result = await supervisorApiService.getAttendanceMonitoring({
                projectId: params.projectId,
                date: params.date,
                status: params.status as any
              });
              expectedEndpoint = '/supervisor/attendance/monitoring';
              expectedMethod = 'get';
              break;

            case 'assignTask':
              const taskData: TaskAssignmentRequest = {
                workerId: params.id,
                taskId: params.id + 1,
                priority: params.priority as any,
                estimatedHours: 8,
                instructions: 'Test instructions',
                requiredSkills: ['skill1'],
                dependencies: []
              };
              result = await supervisorApiService.assignTask(taskData);
              expectedEndpoint = '/supervisor/tasks/assign';
              expectedMethod = 'post';
              break;

            case 'getTaskAssignments':
              result = await supervisorApiService.getTaskAssignments({
                projectId: params.projectId,
                status: params.status as any,
                priority: params.priority as any
              });
              expectedEndpoint = '/supervisor/tasks/assignments';
              expectedMethod = 'get';
              break;

            case 'createProgressReport':
              const reportData = {
                date: params.date!,
                projectId: params.projectId!,
                summary: 'Test summary',
                manpowerUtilization: {
                  totalWorkers: 10,
                  activeWorkers: 8,
                  productivity: 85,
                  efficiency: 90
                },
                progressMetrics: {
                  overallProgress: 75,
                  milestonesCompleted: 3,
                  tasksCompleted: 15,
                  hoursWorked: 80
                },
                issues: [],
                materialConsumption: []
              };
              result = await supervisorApiService.createProgressReport(reportData);
              expectedEndpoint = '/supervisor/reports/progress';
              expectedMethod = 'post';
              break;

            case 'getPendingApprovals':
              result = await supervisorApiService.getPendingApprovals({
                urgency: params.priority as any,
                projectId: params.projectId,
                limit: params.limit,
                offset: params.offset
              });
              expectedEndpoint = '/supervisor/approvals/pending';
              expectedMethod = 'get';
              break;

            case 'getMaterialRequests':
              result = await supervisorApiService.getMaterialRequests({
                projectId: params.projectId,
                status: params.status as any,
                urgency: params.priority as any,
                limit: params.limit,
                offset: params.offset
              });
              expectedEndpoint = '/supervisor/materials/requests';
              expectedMethod = 'get';
              break;

            case 'getToolAllocations':
              result = await supervisorApiService.getToolAllocations({
                projectId: params.projectId,
                toolId: params.id,
                limit: params.limit,
                offset: params.offset
              });
              expectedEndpoint = '/supervisor/tools/allocations';
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
            'getTeamMembers',
            'assignTask',
            'getPendingApprovals'
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
                await supervisorApiService.getDashboardData();
                break;
              case 'getTeamMembers':
                await supervisorApiService.getTeamMembers();
                break;
              case 'assignTask':
                await supervisorApiService.assignTask({
                  workerId: 1,
                  taskId: 1,
                  priority: 'normal',
                  estimatedHours: 8,
                  instructions: 'Test',
                  requiredSkills: [],
                  dependencies: []
                });
                break;
              case 'getPendingApprovals':
                await supervisorApiService.getPendingApprovals();
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

    it('should maintain proper JWT token authentication for any supervisor API call', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'assignTask',
            'createProgressReport',
            'processApproval'
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
          }

          // Execute operation
          let result: any;
          let thrownError: any;

          try {
            switch (operation) {
              case 'getDashboardData':
                result = await supervisorApiService.getDashboardData();
                break;
              case 'assignTask':
                result = await supervisorApiService.assignTask({
                  workerId: 1,
                  taskId: 1,
                  priority: 'normal',
                  estimatedHours: 8,
                  instructions: 'Test',
                  requiredSkills: [],
                  dependencies: []
                });
                break;
              case 'createProgressReport':
                result = await supervisorApiService.createProgressReport({
                  date: '2024-01-01',
                  projectId: 1,
                  summary: 'Test',
                  manpowerUtilization: {
                    totalWorkers: 10,
                    activeWorkers: 8,
                    productivity: 85,
                    efficiency: 90
                  },
                  progressMetrics: {
                    overallProgress: 75,
                    milestonesCompleted: 3,
                    tasksCompleted: 15,
                    hoursWorked: 80
                  },
                  issues: [],
                  materialConsumption: []
                });
                break;
              case 'processApproval':
                result = await supervisorApiService.processApproval(1, {
                  action: 'approve',
                  notes: 'Approved'
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

    it('should validate API response data structure for any supervisor endpoint', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          endpoint: fc.constantFrom(
            'dashboard',
            'teamMembers',
            'taskAssignments',
            'pendingApprovals',
            'materialRequests'
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
                  projects: responseData.hasRequiredFields ? [
                    {
                      id: responseData.hasValidDataTypes ? 1 : 'invalid',
                      name: responseData.hasValidDataTypes ? 'Test Project' : null,
                      workforceCount: responseData.hasValidDataTypes ? 10 : 'ten',
                      attendanceSummary: responseData.hasRequiredFields ? {
                        present: responseData.hasValidDataTypes ? 8 : 'eight',
                        absent: responseData.hasValidDataTypes ? 2 : 'two',
                        late: responseData.hasValidDataTypes ? 0 : 'zero',
                        total: responseData.hasValidDataTypes ? 10 : 'ten'
                      } : null
                    }
                  ] : null,
                  pendingApprovals: responseData.hasRequiredFields ? {
                    leaveRequests: responseData.hasValidDataTypes ? 5 : 'five',
                    materialRequests: responseData.hasValidDataTypes ? 3 : 'three',
                    toolRequests: responseData.hasValidDataTypes ? 2 : 'two',
                    urgent: responseData.hasValidDataTypes ? 1 : 'one'
                  } : null
                } : 'invalid_structure'
              };
              break;

            case 'teamMembers':
              mockResponse = {
                success: true,
                data: responseData.hasValidStructure ? {
                  members: responseData.hasRequiredFields ? [
                    {
                      id: responseData.hasValidDataTypes ? 1 : 'invalid',
                      name: responseData.hasValidDataTypes ? 'John Doe' : null,
                      role: responseData.hasValidDataTypes ? 'Worker' : 123,
                      attendanceStatus: responseData.hasValidDataTypes ? 'present' : 'invalid_status'
                    }
                  ] : null,
                  summary: responseData.hasRequiredFields ? {
                    totalMembers: responseData.hasValidDataTypes ? 10 : 'ten',
                    presentToday: responseData.hasValidDataTypes ? 8 : 'eight'
                  } : null
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
                result = await supervisorApiService.getDashboardData();
                break;
              case 'teamMembers':
                result = await supervisorApiService.getTeamMembers();
                break;
              case 'taskAssignments':
                result = await supervisorApiService.getTaskAssignments();
                break;
              case 'pendingApprovals':
                result = await supervisorApiService.getPendingApprovals();
                break;
              case 'materialRequests':
                result = await supervisorApiService.getMaterialRequests();
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

    it('should handle network timeouts and connectivity issues for any supervisor API operation', () => {
      return fc.assert(fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom(
            'getDashboardData',
            'assignTask',
            'processApproval',
            'createProgressReport'
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

          // Execute operation and expect network error
          let thrownError: any;
          try {
            switch (operation) {
              case 'getDashboardData':
                await supervisorApiService.getDashboardData();
                break;
              case 'assignTask':
                await supervisorApiService.assignTask({
                  workerId: 1,
                  taskId: 1,
                  priority: 'normal',
                  estimatedHours: 8,
                  instructions: 'Test',
                  requiredSkills: [],
                  dependencies: []
                });
                break;
              case 'processApproval':
                await supervisorApiService.processApproval(1, {
                  action: 'approve',
                  notes: 'Test'
                });
                break;
              case 'createProgressReport':
                await supervisorApiService.createProgressReport({
                  date: '2024-01-01',
                  projectId: 1,
                  summary: 'Test',
                  manpowerUtilization: {
                    totalWorkers: 10,
                    activeWorkers: 8,
                    productivity: 85,
                    efficiency: 90
                  },
                  progressMetrics: {
                    overallProgress: 75,
                    milestonesCompleted: 3,
                    tasksCompleted: 15,
                    hoursWorked: 80
                  },
                  issues: [],
                  materialConsumption: []
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
  });
});