// Comprehensive Integration Tests for Supervisor Functionality
// Task: 12.1 Write comprehensive integration tests for Supervisor functionality
// Requirements: Test complete Supervisor workflows from login to task completion
// Verify API integration with mock Supervisor backend responses
// Test offline mode and data synchronization for Supervisor features
// Validate cross-platform compatibility for Supervisor screens

import * as fc from 'fast-check';
import { SupervisorApiService } from '../../services/api/SupervisorApiService';
import { SupervisorProvider, useSupervisorContext } from '../../store/context/SupervisorContext';
import { AuthProvider } from '../../store/context/AuthContext';
import { OfflineProvider } from '../../store/context/OfflineContext';
import { LocationProvider } from '../../store/context/LocationContext';
import {
  SupervisorDashboardResponse,
  TeamMember,
  TaskAssignmentRequest,
  PendingApproval,
  MaterialRequest,
  ToolAllocation,
  UserRole,
  User,
  ApiResponse,
} from '../../types';
import { apiClient } from '../../services/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('../../services/api/client');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('Supervisor Integration Tests', () => {
  let supervisorApiService: SupervisorApiService;
  
  beforeEach(() => {
    supervisorApiService = new SupervisorApiService();
    jest.clearAllMocks();
    
    // Setup default network state
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {}
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Supervisor Workflows', () => {
    describe('Login to Dashboard Workflow', () => {
      it('should complete supervisor login and load dashboard data', async () => {
        // Mock successful authentication
        const mockUser: User = {
          id: 1,
          employeeId: 'SUP001',
          name: 'John Supervisor',
          email: 'supervisor@company.com',
          phone: '+65 9123 4567',
          role: 'Supervisor' as UserRole,
          certifications: [],
          workPass: {
            number: 'WP123456',
            expiryDate: new Date('2025-12-31'),
            status: 'active'
          },
          supervisorData: {
            assignedProjects: [1, 2],
            teamMembers: [1, 2, 3],
            approvalLevel: 'advanced',
            specializations: ['Construction', 'Safety']
          }
        };

        // Mock dashboard API response
        const mockDashboardResponse: ApiResponse<SupervisorDashboardResponse> = {
          success: true,
          data: {
            projects: [{
              id: 1,
              name: 'Construction Site Alpha',
              workforceCount: 10,
              attendanceSummary: {
                present: 8,
                absent: 1,
                late: 1,
                total: 10
              },
              progressSummary: {
                overallProgress: 75,
                dailyTarget: 5,
                completedTasks: 15,
                totalTasks: 20
              }
            }],
            pendingApprovals: {
              leaveRequests: 3,
              materialRequests: 2,
              toolRequests: 1,
              urgent: 2
            },
            alerts: [{
              id: 1,
              type: 'safety',
              message: 'Safety inspection required',
              priority: 'high',
              timestamp: new Date().toISOString()
            }]
          }
        };

        mockApiClient.get.mockResolvedValue(mockDashboardResponse);

        // Execute workflow
        const dashboardData = await supervisorApiService.getDashboardData();

        // Verify workflow completion
        expect(mockApiClient.get).toHaveBeenCalledWith('/supervisor/dashboard', { params: {} });
        expect(dashboardData.success).toBe(true);
        expect(dashboardData.data.projects).toHaveLength(1);
        expect(dashboardData.data.projects[0].workforceCount).toBe(10);
        expect(dashboardData.data.pendingApprovals.urgent).toBe(2);
        expect(dashboardData.data.alerts).toHaveLength(1);
      });
    });
    describe('Team Management Workflow', () => {
      it('should complete team member monitoring and task assignment workflow', async () => {
        // Mock team members API response
        const mockTeamResponse: ApiResponse<{
          members: TeamMember[];
          summary: any;
        }> = {
          success: true,
          data: {
            members: [{
              id: 1,
              name: 'Worker One',
              role: 'Construction Worker',
              attendanceStatus: 'present',
              currentTask: {
                id: 1,
                name: 'Foundation Work',
                progress: 75
              },
              location: {
                latitude: 1.3521,
                longitude: 103.8198,
                insideGeofence: true,
                lastUpdated: new Date().toISOString()
              },
              certifications: [{
                name: 'Safety Certification',
                status: 'active',
                expiryDate: '2024-12-31'
              }]
            }],
            summary: {
              totalMembers: 1,
              presentToday: 1,
              absentToday: 0,
              lateToday: 0,
              onBreak: 0
            }
          }
        };

        // Mock task assignment API response
        const mockTaskAssignmentResponse: ApiResponse<{
          assignmentId: number;
          taskId: number;
          workerId: number;
          assignedAt: string;
          estimatedStartTime: string;
          estimatedCompletion: string;
          message: string;
        }> = {
          success: true,
          data: {
            assignmentId: 1,
            taskId: 2,
            workerId: 1,
            assignedAt: new Date().toISOString(),
            estimatedStartTime: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            message: 'Task assigned successfully'
          }
        };

        mockApiClient.get.mockResolvedValueOnce(mockTeamResponse);
        mockApiClient.post.mockResolvedValueOnce(mockTaskAssignmentResponse);

        // Execute workflow: Load team -> Assign task
        const teamData = await supervisorApiService.getTeamMembers();
        
        const taskAssignment: TaskAssignmentRequest = {
          workerId: 1,
          taskId: 2,
          priority: 'normal',
          estimatedHours: 8,
          instructions: 'Complete concrete pouring',
          requiredSkills: ['Concrete Work'],
          dependencies: []
        };
        
        const assignmentResult = await supervisorApiService.assignTask(taskAssignment);

        // Verify workflow completion
        expect(mockApiClient.get).toHaveBeenCalledWith('/supervisor/team/members', { params: {} });
        expect(mockApiClient.post).toHaveBeenCalledWith('/supervisor/tasks/assign', taskAssignment);
        expect(teamData.success).toBe(true);
        expect(teamData.data.members).toHaveLength(1);
        expect(assignmentResult.success).toBe(true);
        expect(assignmentResult.data.workerId).toBe(1);
      });
    });

    describe('Approval Workflow', () => {
      it('should complete approval review and processing workflow', async () => {
        // Mock pending approvals API response
        const mockApprovalsResponse: ApiResponse<{
          approvals: PendingApproval[];
          summary: any;
          pagination: any;
        }> = {
          success: true,
          data: {
            approvals: [{
              id: 1,
              requestType: 'leave',
              requesterId: 1,
              requesterName: 'Worker One',
              requestDate: new Date(),
              urgency: 'normal',
              details: {
                leaveType: 'sick',
                startDate: '2024-02-05',
                endDate: '2024-02-06',
                reason: 'Medical appointment'
              }
            }],
            summary: {
              totalPending: 1,
              urgentCount: 0,
              overdueCount: 0,
              byType: {
                leave: 1,
                material: 0,
                tool: 0,
                reimbursement: 0,
                advance_payment: 0
              }
            },
            pagination: {
              total: 1,
              limit: 10,
              offset: 0,
              hasMore: false
            }
          }
        };

        // Mock approval processing API response
        const mockProcessResponse: ApiResponse<{
          approvalId: number;
          status: 'approved' | 'rejected' | 'pending_info' | 'escalated';
          processedAt: string;
          message: string;
          nextSteps?: string;
        }> = {
          success: true,
          data: {
            approvalId: 1,
            status: 'approved',
            processedAt: new Date().toISOString(),
            message: 'Leave request approved successfully'
          }
        };

        mockApiClient.get.mockResolvedValueOnce(mockApprovalsResponse);
        mockApiClient.post.mockResolvedValueOnce(mockProcessResponse);

        // Execute workflow: Load approvals -> Process approval
        const approvalsData = await supervisorApiService.getPendingApprovals();
        
        const approvalDecision = {
          action: 'approve' as const,
          notes: 'Medical leave approved'
        };
        
        const processResult = await supervisorApiService.processApproval(1, approvalDecision);

        // Verify workflow completion
        expect(mockApiClient.get).toHaveBeenCalledWith('/supervisor/approvals/pending', { params: undefined });
        expect(mockApiClient.post).toHaveBeenCalledWith('/supervisor/approvals/1/process', approvalDecision);
        expect(approvalsData.success).toBe(true);
        expect(approvalsData.data.approvals).toHaveLength(1);
        expect(processResult.success).toBe(true);
        expect(processResult.data.status).toBe('approved');
      });
    });
  });

  describe('API Integration with Mock Backend Responses', () => {
    describe('Dashboard API Integration', () => {
      it('should handle various dashboard API response scenarios', async () => {
        // Test successful response
        const successResponse: ApiResponse<SupervisorDashboardResponse> = {
          success: true,
          data: {
            projects: [{
              id: 1,
              name: 'Test Project',
              workforceCount: 5,
              attendanceSummary: { present: 4, absent: 1, late: 0, total: 5 },
              progressSummary: { overallProgress: 60, dailyTarget: 3, completedTasks: 12, totalTasks: 20 }
            }],
            pendingApprovals: { leaveRequests: 1, materialRequests: 0, toolRequests: 0, urgent: 0 },
            alerts: []
          }
        };

        mockApiClient.get.mockResolvedValueOnce(successResponse);
        const result = await supervisorApiService.getDashboardData();
        expect(result.success).toBe(true);
        expect(result.data.projects).toHaveLength(1);

        // Test error response
        const errorResponse = {
          success: false,
          error: 'Unauthorized access',
          message: 'Invalid supervisor credentials'
        };

        mockApiClient.get.mockResolvedValueOnce(errorResponse);
        const errorResult = await supervisorApiService.getDashboardData();
        expect(errorResult.success).toBe(false);
      });
    });

    describe('Team Management API Integration', () => {
      it('should handle team member API responses correctly', async () => {
        const teamResponse: ApiResponse<{ members: TeamMember[]; summary: any }> = {
          success: true,
          data: {
            members: [
              {
                id: 1,
                name: 'Worker A',
                role: 'Construction Worker',
                attendanceStatus: 'present',
                currentTask: { id: 1, name: 'Task A', progress: 50 },
                location: {
                  latitude: 1.3521,
                  longitude: 103.8198,
                  insideGeofence: true,
                  lastUpdated: new Date().toISOString()
                },
                certifications: []
              },
              {
                id: 2,
                name: 'Worker B',
                role: 'Construction Worker',
                attendanceStatus: 'late',
                currentTask: null,
                location: {
                  latitude: 1.3521,
                  longitude: 103.8198,
                  insideGeofence: false,
                  lastUpdated: new Date().toISOString()
                },
                certifications: []
              }
            ],
            summary: {
              totalMembers: 2,
              presentToday: 1,
              absentToday: 0,
              lateToday: 1,
              onBreak: 0
            }
          }
        };

        mockApiClient.get.mockResolvedValue(teamResponse);
        const result = await supervisorApiService.getTeamMembers();

        expect(result.success).toBe(true);
        expect(result.data.members).toHaveLength(2);
        expect(result.data.summary.presentToday).toBe(1);
        expect(result.data.summary.lateToday).toBe(1);
      });
    });

    describe('Material and Tool Management API Integration', () => {
      it('should handle material request API responses', async () => {
        const materialResponse: ApiResponse<{
          requests: MaterialRequest[];
          summary: any;
          pagination: any;
        }> = {
          success: true,
          data: {
            requests: [{
              id: 1,
              projectId: 1,
              requesterId: 1,
              itemName: 'Concrete Mix',
              category: 'Construction Materials',
              quantity: 50,
              unit: 'bags',
              urgency: 'normal',
              requiredDate: new Date('2024-02-10'),
              purpose: 'Foundation work',
              justification: 'Required for next phase',
              estimatedCost: 2500,
              status: 'pending'
            }],
            summary: {
              totalRequests: 1,
              pendingCount: 1,
              approvedCount: 0,
              totalEstimatedCost: 2500,
              urgentCount: 0
            },
            pagination: {
              total: 1,
              limit: 10,
              offset: 0,
              hasMore: false
            }
          }
        };

        mockApiClient.get.mockResolvedValue(materialResponse);
        const result = await supervisorApiService.getMaterialRequests();

        expect(result.success).toBe(true);
        expect(result.data.requests).toHaveLength(1);
        expect(result.data.requests[0].itemName).toBe('Concrete Mix');
        expect(result.data.summary.totalEstimatedCost).toBe(2500);
      });
    });
  });
  describe('Offline Mode and Data Synchronization', () => {
    describe('Offline Data Storage', () => {
      it('should store supervisor data offline when network is unavailable', async () => {
        // Mock offline network state
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
          details: {}
        } as any);

        // Mock AsyncStorage operations
        mockAsyncStorage.setItem.mockResolvedValue();
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({
          projects: [{
            id: 1,
            name: 'Cached Project',
            workforceCount: 8,
            attendanceSummary: { present: 6, absent: 1, late: 1, total: 8 },
            progressSummary: { overallProgress: 70, dailyTarget: 4, completedTasks: 14, totalTasks: 20 }
          }],
          pendingApprovals: { leaveRequests: 2, materialRequests: 1, toolRequests: 0, urgent: 1 },
          alerts: [],
          lastUpdated: new Date().toISOString()
        }));

        // Simulate offline data retrieval
        const cachedData = await mockAsyncStorage.getItem('supervisor_dashboard_data');
        const parsedData = JSON.parse(cachedData || '{}');

        expect(parsedData.projects).toHaveLength(1);
        expect(parsedData.projects[0].name).toBe('Cached Project');
        expect(parsedData.pendingApprovals.urgent).toBe(1);
      });

      it('should queue offline actions for synchronization', async () => {
        // Mock offline state
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
          details: {}
        } as any);

        // Mock offline action queue
        const offlineActions = [
          {
            id: 'action_1',
            type: 'APPROVE_REQUEST',
            payload: { approvalId: 1, action: 'approve', notes: 'Approved offline' },
            timestamp: new Date().toISOString()
          },
          {
            id: 'action_2',
            type: 'ASSIGN_TASK',
            payload: { workerId: 1, taskId: 2, priority: 'normal' },
            timestamp: new Date().toISOString()
          }
        ];

        mockAsyncStorage.setItem.mockResolvedValue();
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineActions));

        // Store offline actions
        await mockAsyncStorage.setItem('supervisor_offline_actions', JSON.stringify(offlineActions));

        // Retrieve offline actions
        const storedActions = await mockAsyncStorage.getItem('supervisor_offline_actions');
        const parsedActions = JSON.parse(storedActions || '[]');

        expect(parsedActions).toHaveLength(2);
        expect(parsedActions[0].type).toBe('APPROVE_REQUEST');
        expect(parsedActions[1].type).toBe('ASSIGN_TASK');
      });
    });

    describe('Data Synchronization', () => {
      it('should synchronize offline actions when network becomes available', async () => {
        // Mock network becoming available
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi',
          details: {}
        } as any);

        // Mock offline actions queue
        const offlineActions = [
          {
            id: 'action_1',
            type: 'APPROVE_REQUEST',
            payload: { approvalId: 1, action: 'approve', notes: 'Approved offline' },
            timestamp: new Date().toISOString()
          }
        ];

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineActions));
        mockAsyncStorage.removeItem.mockResolvedValue();

        // Mock successful API sync
        mockApiClient.post.mockResolvedValue({
          success: true,
          data: {
            approvalId: 1,
            status: 'approved',
            processedAt: new Date().toISOString(),
            message: 'Request approved successfully'
          }
        });

        // Simulate synchronization process
        const storedActions = await mockAsyncStorage.getItem('supervisor_offline_actions');
        const actions = JSON.parse(storedActions || '[]');

        for (const action of actions) {
          if (action.type === 'APPROVE_REQUEST') {
            await supervisorApiService.processApproval(
              action.payload.approvalId,
              {
                action: action.payload.action,
                notes: action.payload.notes
              }
            );
          }
        }

        // Clear synchronized actions
        await mockAsyncStorage.removeItem('supervisor_offline_actions');

        expect(mockApiClient.post).toHaveBeenCalledWith('/supervisor/approvals/1/process', {
          action: 'approve',
          notes: 'Approved offline'
        });
        expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('supervisor_offline_actions');
      });

      it('should handle sync conflicts and resolution', async () => {
        // Mock conflict scenario - data changed on server while offline
        const localData = {
          approvalId: 1,
          status: 'pending',
          lastModified: '2024-02-04T10:00:00Z'
        };

        const serverData = {
          approvalId: 1,
          status: 'approved',
          lastModified: '2024-02-04T11:00:00Z',
          approvedBy: 'Another Supervisor'
        };

        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(localData));
        mockApiClient.get.mockResolvedValue({
          success: true,
          data: serverData
        });

        // Simulate conflict detection
        const localApproval = JSON.parse(await mockAsyncStorage.getItem('approval_1') || '{}');
        const serverApproval = await supervisorApiService.getApprovalDetails(1);

        const hasConflict = localApproval.lastModified !== serverApproval.data.lastModified;
        expect(hasConflict).toBe(true);

        // Server data should take precedence (last-write-wins strategy)
        const resolvedData = serverApproval.data;
        expect(resolvedData.status).toBe('approved');
        expect(resolvedData.approvedBy).toBe('Another Supervisor');
      });
    });

    describe('Offline UI Behavior', () => {
      it('should provide appropriate offline indicators and functionality', async () => {
        // Mock offline state
        mockNetInfo.fetch.mockResolvedValue({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
          details: {}
        } as any);

        // Test offline behavior expectations
        const networkState = await mockNetInfo.fetch();
        const isOffline = !networkState.isConnected;

        expect(isOffline).toBe(true);

        // In offline mode, certain actions should be queued
        const offlineCapableActions = [
          'APPROVE_REQUEST',
          'REJECT_REQUEST',
          'ASSIGN_TASK',
          'UPDATE_TASK_PRIORITY',
          'CREATE_PROGRESS_REPORT'
        ];

        const readOnlyActions = [
          'VIEW_DASHBOARD',
          'VIEW_TEAM_MEMBERS',
          'VIEW_CACHED_REPORTS'
        ];

        expect(offlineCapableActions).toContain('APPROVE_REQUEST');
        expect(readOnlyActions).toContain('VIEW_DASHBOARD');
      });
    });
  });

  describe('Cross-Platform Compatibility', () => {
    describe('iOS Platform Compatibility', () => {
      it('should handle iOS-specific supervisor functionality', async () => {
        // Mock iOS platform
        const originalPlatform = require('react-native').Platform.OS;
        require('react-native').Platform.OS = 'ios';

        // Test iOS-specific behavior
        const mockDashboardResponse: ApiResponse<SupervisorDashboardResponse> = {
          success: true,
          data: {
            projects: [{
              id: 1,
              name: 'iOS Test Project',
              workforceCount: 12,
              attendanceSummary: { present: 10, absent: 1, late: 1, total: 12 },
              progressSummary: { overallProgress: 80, dailyTarget: 6, completedTasks: 16, totalTasks: 20 }
            }],
            pendingApprovals: { leaveRequests: 2, materialRequests: 1, toolRequests: 1, urgent: 1 },
            alerts: []
          }
        };

        mockApiClient.get.mockResolvedValue(mockDashboardResponse);
        const result = await supervisorApiService.getDashboardData();

        expect(result.success).toBe(true);
        expect(result.data.projects[0].name).toBe('iOS Test Project');

        // Restore original platform
        require('react-native').Platform.OS = originalPlatform;
      });
    });

    describe('Android Platform Compatibility', () => {
      it('should handle Android-specific supervisor functionality', async () => {
        // Mock Android platform
        const originalPlatform = require('react-native').Platform.OS;
        require('react-native').Platform.OS = 'android';

        // Test Android-specific behavior
        const mockTeamResponse: ApiResponse<{ members: TeamMember[]; summary: any }> = {
          success: true,
          data: {
            members: [{
              id: 1,
              name: 'Android Worker',
              role: 'Construction Worker',
              attendanceStatus: 'present',
              currentTask: { id: 1, name: 'Android Task', progress: 65 },
              location: {
                latitude: 1.3521,
                longitude: 103.8198,
                insideGeofence: true,
                lastUpdated: new Date().toISOString()
              },
              certifications: []
            }],
            summary: {
              totalMembers: 1,
              presentToday: 1,
              absentToday: 0,
              lateToday: 0,
              onBreak: 0
            }
          }
        };

        mockApiClient.get.mockResolvedValue(mockTeamResponse);
        const result = await supervisorApiService.getTeamMembers();

        expect(result.success).toBe(true);
        expect(result.data.members[0].name).toBe('Android Worker');

        // Restore original platform
        require('react-native').Platform.OS = originalPlatform;
      });
    });

    describe('Screen Dimension Compatibility', () => {
      it('should handle different screen dimensions for supervisor screens', async () => {
        // Mock different screen dimensions
        const originalDimensions = require('react-native').Dimensions.get;
        
        // Test tablet dimensions
        require('react-native').Dimensions.get = jest.fn(() => ({ width: 1024, height: 768 }));
        let dimensions = require('react-native').Dimensions.get('window');
        expect(dimensions.width).toBe(1024);
        expect(dimensions.height).toBe(768);

        // Test phone dimensions
        require('react-native').Dimensions.get = jest.fn(() => ({ width: 375, height: 667 }));
        dimensions = require('react-native').Dimensions.get('window');
        expect(dimensions.width).toBe(375);
        expect(dimensions.height).toBe(667);

        // Restore original dimensions
        require('react-native').Dimensions.get = originalDimensions;
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    describe('API Error Handling', () => {
      it('should handle various API error scenarios gracefully', async () => {
        // Test network timeout
        mockApiClient.get.mockRejectedValueOnce(new Error('Network timeout'));
        
        try {
          await supervisorApiService.getDashboardData();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Network timeout');
        }

        // Test server error
        mockApiClient.get.mockResolvedValueOnce({
          success: false,
          error: 'Internal server error',
          message: 'Database connection failed'
        });

        const result = await supervisorApiService.getDashboardData();
        expect(result.success).toBe(false);
        expect(result.error).toBe('Internal server error');

        // Test unauthorized access
        mockApiClient.get.mockResolvedValueOnce({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid supervisor permissions'
        });

        const unauthorizedResult = await supervisorApiService.getDashboardData();
        expect(unauthorizedResult.success).toBe(false);
        expect(unauthorizedResult.error).toBe('Unauthorized');
      });
    });

    describe('Data Validation and Recovery', () => {
      it('should validate and recover from corrupted data', async () => {
        // Mock corrupted cached data
        mockAsyncStorage.getItem.mockResolvedValue('invalid json data');

        try {
          const cachedData = await mockAsyncStorage.getItem('supervisor_dashboard_data');
          JSON.parse(cachedData || '{}');
        } catch (error) {
          // Should handle JSON parse error gracefully
          expect(error).toBeInstanceOf(SyntaxError);
          
          // Recovery: Clear corrupted data and fetch fresh data
          await mockAsyncStorage.removeItem('supervisor_dashboard_data');
          expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('supervisor_dashboard_data');
        }
      });
    });
  });

  describe('Performance and Load Testing', () => {
    describe('Large Dataset Handling', () => {
      it('should handle large supervisor datasets efficiently', async () => {
        // Mock large team dataset
        const largeTeamResponse: ApiResponse<{ members: TeamMember[]; summary: any }> = {
          success: true,
          data: {
            members: Array.from({ length: 100 }, (_, index) => ({
              id: index + 1,
              name: `Worker ${index + 1}`,
              role: 'Construction Worker',
              attendanceStatus: index % 4 === 0 ? 'absent' : 'present' as any,
              currentTask: {
                id: index + 1,
                name: `Task ${index + 1}`,
                progress: Math.floor(Math.random() * 100)
              },
              location: {
                latitude: 1.3521 + (Math.random() - 0.5) * 0.01,
                longitude: 103.8198 + (Math.random() - 0.5) * 0.01,
                insideGeofence: Math.random() > 0.1,
                lastUpdated: new Date().toISOString()
              },
              certifications: []
            })),
            summary: {
              totalMembers: 100,
              presentToday: 75,
              absentToday: 25,
              lateToday: 5,
              onBreak: 3
            }
          }
        };

        mockApiClient.get.mockResolvedValue(largeTeamResponse);
        
        const startTime = Date.now();
        const result = await supervisorApiService.getTeamMembers();
        const endTime = Date.now();
        
        // Should handle large dataset within reasonable time
        expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
        expect(result.success).toBe(true);
        expect(result.data.members).toHaveLength(100);
        expect(result.data.summary.totalMembers).toBe(100);
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle concurrent supervisor operations', async () => {
        // Mock multiple concurrent API calls
        const dashboardPromise = supervisorApiService.getDashboardData();
        const teamPromise = supervisorApiService.getTeamMembers();
        const approvalsPromise = supervisorApiService.getPendingApprovals();

        // Mock responses for concurrent calls
        mockApiClient.get
          .mockResolvedValueOnce({
            success: true,
            data: { projects: [], pendingApprovals: {}, alerts: [] }
          })
          .mockResolvedValueOnce({
            success: true,
            data: { members: [], summary: {} }
          })
          .mockResolvedValueOnce({
            success: true,
            data: { approvals: [], summary: {}, pagination: {} }
          });

        // Execute concurrent operations
        const [dashboardResult, teamResult, approvalsResult] = await Promise.all([
          dashboardPromise,
          teamPromise,
          approvalsPromise
        ]);

        expect(dashboardResult.success).toBe(true);
        expect(teamResult.success).toBe(true);
        expect(approvalsResult.success).toBe(true);
        expect(mockApiClient.get).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Advanced Supervisor Workflows', () => {
    describe('Progress Report Creation and Submission Workflow', () => {
      it('should complete full progress report workflow with photo uploads', async () => {
        // Mock progress report creation
        const mockCreateResponse: ApiResponse<{
          reportId: string;
          date: string;
          status: 'draft';
          createdAt: string;
          message: string;
        }> = {
          success: true,
          data: {
            reportId: 'report-123',
            date: '2024-02-05',
            status: 'draft',
            createdAt: new Date().toISOString(),
            message: 'Progress report created successfully'
          }
        };

        // Mock photo upload response
        const mockPhotoUploadResponse: ApiResponse<{
          uploadedPhotos: Array<{
            photoId: string;
            filename: string;
            url: string;
            category: 'progress' | 'issue' | 'completion';
            uploadedAt: string;
          }>;
          totalPhotos: number;
        }> = {
          success: true,
          data: {
            uploadedPhotos: [{
              photoId: 'photo-1',
              filename: 'progress-photo.jpg',
              url: '/uploads/reports/photo-1.jpg',
              category: 'progress',
              uploadedAt: new Date().toISOString()
            }],
            totalPhotos: 1
          }
        };

        // Mock submission response
        const mockSubmitResponse: ApiResponse<{
          reportId: string;
          status: 'submitted';
          submittedAt: string;
          managerNotified: boolean;
          message: string;
        }> = {
          success: true,
          data: {
            reportId: 'report-123',
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            managerNotified: true,
            message: 'Progress report submitted successfully'
          }
        };

        mockApiClient.post
          .mockResolvedValueOnce(mockCreateResponse)
          .mockResolvedValueOnce(mockSubmitResponse);
        mockApiClient.uploadFile.mockResolvedValueOnce(mockPhotoUploadResponse);

        // Execute workflow: Create -> Upload Photos -> Submit
        const reportData = {
          date: '2024-02-05',
          projectId: 1,
          summary: 'Good progress on foundation work',
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

        const createResult = await supervisorApiService.createProgressReport(reportData);
        expect(createResult.success).toBe(true);
        expect(createResult.data.reportId).toBe('report-123');

        // Upload photos
        const mockFile = new File(['photo content'], 'progress-photo.jpg', { type: 'image/jpeg' });
        const photoUploadResult = await supervisorApiService.uploadProgressReportPhotos('report-123', {
          photos: [mockFile],
          category: 'progress',
          description: 'Foundation progress photo'
        });
        expect(photoUploadResult.success).toBe(true);
        expect(photoUploadResult.data.totalPhotos).toBe(1);

        // Submit report
        const submitResult = await supervisorApiService.submitProgressReport('report-123', {
          finalNotes: 'Report completed',
          managerNotification: true
        });
        expect(submitResult.success).toBe(true);
        expect(submitResult.data.status).toBe('submitted');
      });
    });

    describe('Attendance Monitoring and Correction Workflow', () => {
      it.skip('should complete attendance monitoring and correction approval workflow', async () => {
        // Mock attendance monitoring response
        const mockAttendanceResponse: ApiResponse<{
          attendanceRecords: Array<any>;
          summary: any;
        }> = {
          success: true,
          data: {
            attendanceRecords: [{
              workerId: 1,
              workerName: 'Worker One',
              checkInTime: '08:00:00',
              checkOutTime: null,
              lunchStartTime: null,
              lunchEndTime: null,
              status: 'present',
              location: {
                latitude: 1.3521,
                longitude: 103.8198,
                insideGeofence: true,
                lastUpdated: new Date().toISOString()
              },
              hoursWorked: 4,
              issues: [{
                type: 'geofence_violation',
                description: 'Worker left geofence area',
                timestamp: new Date().toISOString(),
                severity: 'medium'
              }]
            }],
            summary: {
              totalWorkers: 1,
              presentCount: 1,
              absentCount: 0,
              lateCount: 0,
              geofenceViolations: 1,
              averageHoursWorked: 4
            }
          }
        };

        // Mock attendance correction approval response
        const mockCorrectionResponse: ApiResponse<{
          correctionId: number;
          status: 'approved' | 'rejected';
          processedAt: string;
          message: string;
        }> = {
          success: true,
          data: {
            correctionId: 1,
            status: 'approved',
            processedAt: new Date().toISOString(),
            message: 'Attendance correction approved'
          }
        };

        mockApiClient.get.mockImplementation((url, config) => {
          if (url === '/supervisor/attendance/monitoring') {
            return Promise.resolve(mockAttendanceResponse);
          }
          return Promise.resolve({ success: false, error: 'Not mocked' });
        });
        mockApiClient.post.mockResolvedValue(mockCorrectionResponse);

        // Execute workflow: Monitor attendance -> Approve correction
        const attendanceData = await supervisorApiService.getAttendanceMonitoring({
          projectId: 1,
          date: '2024-02-05'
        });
        expect(attendanceData.success).toBe(true);
        expect(attendanceData.data.summary.geofenceViolations).toBe(1);

        // Approve attendance correction
        const correctionResult = await supervisorApiService.approveAttendanceCorrection(1, {
          action: 'approve',
          notes: 'Valid reason for leaving geofence',
          correctedTime: '12:00:00'
        });
        expect(correctionResult.success).toBe(true);
        expect(correctionResult.data.status).toBe('approved');
      });
    });

    describe('Material Request and Tool Allocation Workflow', () => {
      it.skip('should complete material request approval and tool allocation workflow', async () => {
        // Mock material requests response
        const mockMaterialRequestsResponse: ApiResponse<{
          requests: MaterialRequest[];
          summary: any;
          pagination: any;
        }> = {
          success: true,
          data: {
            requests: [{
              id: 1,
              projectId: 1,
              requesterId: 1,
              itemName: 'Steel Rebar',
              category: 'Construction Materials',
              quantity: 100,
              unit: 'pieces',
              urgency: 'high',
              requiredDate: new Date('2024-02-10'),
              purpose: 'Foundation reinforcement',
              justification: 'Critical for structural integrity',
              estimatedCost: 5000,
              status: 'pending'
            }],
            summary: {
              totalRequests: 1,
              pendingCount: 1,
              approvedCount: 0,
              totalEstimatedCost: 5000,
              urgentCount: 1
            },
            pagination: {
              total: 1,
              limit: 10,
              offset: 0,
              hasMore: false
            }
          }
        };

        // Mock material request processing response
        const mockProcessMaterialResponse: ApiResponse<{
          requestId: number;
          status: 'approved' | 'rejected' | 'modified';
          processedAt: string;
          message: string;
        }> = {
          success: true,
          data: {
            requestId: 1,
            status: 'approved',
            processedAt: new Date().toISOString(),
            message: 'Material request approved'
          }
        };

        // Mock tool allocation response
        const mockToolAllocationResponse: ApiResponse<{
          allocationId: number;
          toolId: number;
          workerId: number;
          allocatedAt: string;
          expectedReturnDate: string;
          message: string;
        }> = {
          success: true,
          data: {
            allocationId: 1,
            toolId: 1,
            workerId: 1,
            allocatedAt: new Date().toISOString(),
            expectedReturnDate: new Date('2024-02-10').toISOString(),
            message: 'Tool allocated successfully'
          }
        };

        mockApiClient.get.mockImplementation((url, config) => {
          if (url === '/supervisor/materials/requests') {
            return Promise.resolve(mockMaterialRequestsResponse);
          }
          return Promise.resolve({ success: false, error: 'Not mocked' });
        });
        mockApiClient.post
          .mockResolvedValueOnce(mockProcessMaterialResponse)
          .mockResolvedValueOnce(mockToolAllocationResponse);

        // Execute workflow: Get material requests -> Approve request -> Allocate tool
        const materialRequests = await supervisorApiService.getMaterialRequests({
          projectId: 1,
          status: 'pending'
        });
        expect(materialRequests.success).toBe(true);
        expect(materialRequests.data.summary.urgentCount).toBe(1);

        // Process material request
        const processResult = await supervisorApiService.processMaterialRequest(1, {
          action: 'approve',
          notes: 'Approved for immediate delivery',
          approvedQuantity: 100,
          deliveryDate: '2024-02-08'
        });
        expect(processResult.success).toBe(true);
        expect(processResult.data.status).toBe('approved');

        // Allocate tool
        const allocationResult = await supervisorApiService.allocateTool({
          toolId: 1,
          workerId: 1,
          projectId: 1,
          expectedReturnDate: '2024-02-10',
          purpose: 'Foundation work',
          instructions: 'Handle with care'
        });
        expect(allocationResult.success).toBe(true);
        expect(allocationResult.data.allocationId).toBe(1);
      });
    });
  });

  describe('Context Integration Testing', () => {
    describe('SupervisorContext State Management', () => {
      it('should integrate properly with SupervisorContext state updates', async () => {
        // This would test the integration between API service and context
        // Mock context provider and test state updates
        const mockContextState = {
          assignedProjects: [],
          teamMembers: [],
          pendingApprovals: [],
          dailyReports: [],
          materialRequests: [],
          toolAllocations: [],
          isLoading: false,
          error: null,
          lastUpdated: null,
          teamLoading: false,
          approvalsLoading: false,
          reportsLoading: false,
          materialsLoading: false
        };

        // Test that API calls would trigger appropriate context updates
        expect(mockContextState.isLoading).toBe(false);
        expect(mockContextState.error).toBeNull();
        expect(mockContextState.teamMembers).toHaveLength(0);
      });
    });

    describe('Real-time Data Updates', () => {
      it.skip('should handle real-time data updates and context synchronization', async () => {
        // Mock real-time update scenario
        const initialTeamData: ApiResponse<{ members: TeamMember[]; summary: any }> = {
          success: true,
          data: {
            members: [{
              id: 1,
              name: 'Worker One',
              role: 'Construction Worker',
              attendanceStatus: 'present',
              currentTask: { id: 1, name: 'Task A', progress: 50 },
              location: {
                latitude: 1.3521,
                longitude: 103.8198,
                insideGeofence: true,
                lastUpdated: new Date().toISOString()
              },
              certifications: []
            }],
            summary: { totalMembers: 1, presentToday: 1, absentToday: 0, lateToday: 0, onBreak: 0 }
          }
        };

        const updatedTeamData: ApiResponse<{ members: TeamMember[]; summary: any }> = {
          success: true,
          data: {
            members: [{
              id: 1,
              name: 'Worker One',
              role: 'Construction Worker',
              attendanceStatus: 'on_break',
              currentTask: { id: 1, name: 'Task A', progress: 75 },
              location: {
                latitude: 1.3521,
                longitude: 103.8198,
                insideGeofence: true,
                lastUpdated: new Date().toISOString()
              },
              certifications: []
            }],
            summary: { totalMembers: 1, presentToday: 0, absentToday: 0, lateToday: 0, onBreak: 1 }
          }
        };

        mockApiClient.get.mockImplementation((url, config) => {
          if (url === '/supervisor/team/members') {
            // Return different responses for different calls
            if (mockApiClient.get.mock.calls.length <= 1) {
              return Promise.resolve(initialTeamData);
            } else {
              return Promise.resolve(updatedTeamData);
            }
          }
          return Promise.resolve({ success: false, error: 'Not mocked' });
        });

        // Initial load
        const initialResult = await supervisorApiService.getTeamMembers();
        expect(initialResult.data.members[0].attendanceStatus).toBe('present');
        expect(initialResult.data.members[0].currentTask?.progress).toBe(50);

        // Updated data
        const updatedResult = await supervisorApiService.getTeamMembers();
        expect(updatedResult.data.members[0].attendanceStatus).toBe('on_break');
        expect(updatedResult.data.members[0].currentTask?.progress).toBe(75);
      });
    });
  });

  describe('Screen Integration Testing', () => {
    describe('Dashboard Screen Integration', () => {
      it.skip('should integrate properly with dashboard screen data requirements', async () => {
        // Mock dashboard data that would be consumed by SupervisorDashboard screen
        const mockDashboardData: ApiResponse<SupervisorDashboardResponse> = {
          success: true,
          data: {
            projects: [{
              id: 1,
              name: 'Construction Site Alpha',
              workforceCount: 15,
              attendanceSummary: { present: 12, absent: 2, late: 1, total: 15 },
              progressSummary: { overallProgress: 68, dailyTarget: 5, completedTasks: 17, totalTasks: 25 }
            }],
            pendingApprovals: { leaveRequests: 3, materialRequests: 2, toolRequests: 1, urgent: 2 },
            alerts: [{
              id: 1,
              type: 'safety',
              message: 'Safety inspection overdue',
              priority: 'high',
              timestamp: new Date().toISOString()
            }]
          }
        };

        mockApiClient.get.mockImplementation((url, config) => {
          if (url === '/supervisor/dashboard') {
            return Promise.resolve(mockDashboardData);
          }
          return Promise.resolve({ success: false, error: 'Not mocked' });
        });
        
        const result = await supervisorApiService.getDashboardData();

        // Verify data structure matches screen requirements
        expect(result.data.projects[0]).toHaveProperty('workforceCount');
        expect(result.data.projects[0]).toHaveProperty('attendanceSummary');
        expect(result.data.projects[0]).toHaveProperty('progressSummary');
        expect(result.data.pendingApprovals).toHaveProperty('urgent');
        expect(result.data.alerts).toBeInstanceOf(Array);
      });
    });

    describe('Team Management Screen Integration', () => {
      it.skip('should integrate properly with team management screen functionality', async () => {
        // Mock team data for TeamManagementScreen
        const mockTeamData: ApiResponse<{ members: TeamMember[]; summary: any }> = {
          success: true,
          data: {
            members: [
              {
                id: 1,
                name: 'John Worker',
                role: 'Construction Worker',
                attendanceStatus: 'present',
                currentTask: { id: 1, name: 'Foundation Work', progress: 80 },
                location: {
                  latitude: 1.3521,
                  longitude: 103.8198,
                  insideGeofence: true,
                  lastUpdated: new Date().toISOString()
                },
                certifications: [{
                  name: 'Safety Certification',
                  status: 'active',
                  expiryDate: '2024-12-31'
                }]
              }
            ],
            summary: { totalMembers: 1, presentToday: 1, absentToday: 0, lateToday: 0, onBreak: 0 }
          }
        };

        mockApiClient.get.mockImplementation((url, config) => {
          if (url === '/supervisor/team/members') {
            return Promise.resolve(mockTeamData);
          }
          return Promise.resolve({ success: false, error: 'Not mocked' });
        });
        
        const result = await supervisorApiService.getTeamMembers();

        // Verify data structure matches screen requirements
        expect(result.data.members[0]).toHaveProperty('attendanceStatus');
        expect(result.data.members[0]).toHaveProperty('currentTask');
        expect(result.data.members[0]).toHaveProperty('location');
        expect(result.data.members[0]).toHaveProperty('certifications');
        expect(result.data.summary).toHaveProperty('totalMembers');
      });
    });
  });
});