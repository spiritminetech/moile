// Unit tests for WorkerApiService
// Tests core functionality and API integration

import { workerApiService } from '../WorkerApiService';
import { apiClient } from '../client';
import { attendanceApiService } from '../AttendanceApiService';
import { GeoLocation } from '../../../types';

// Mock the API client
jest.mock('../client');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Add uploadFile mock
(mockApiClient as any).uploadFile = jest.fn();

// Mock AttendanceApiService
jest.mock('../AttendanceApiService', () => ({
  attendanceApiService: {
    validateGeofence: jest.fn(),
  },
}));

const mockAttendanceApiService = attendanceApiService as jest.Mocked<typeof attendanceApiService>;

describe('WorkerApiService', () => {
  const mockLocation: GeoLocation = {
    latitude: 1.3521,
    longitude: 103.8198,
    accuracy: 5,
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard APIs', () => {
    it('should get dashboard data', async () => {
      const mockResponse = {
        success: true,
        data: {
          project: { id: 1, name: 'Test Project' },
          todaysTasks: [],
          attendanceStatus: null,
          notifications: [],
          workingHours: { currentSessionDuration: 0, totalHours: 8 },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await workerApiService.getDashboardData();

      expect(mockApiClient.get).toHaveBeenCalledWith('/worker/tasks/today', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('should get project info', async () => {
      const mockResponse = {
        success: true,
        data: { id: 1, name: 'Test Project' },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await workerApiService.getProjectInfo(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/project/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Task Management APIs', () => {
    it('should get today\'s tasks', async () => {
      const mockResponse = {
        success: true,
        data: [{ assignmentId: 1, taskName: 'Test Task' }],
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await workerApiService.getTodaysTasks();

      expect(mockApiClient.get).toHaveBeenCalledWith('/worker/tasks/today', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('should start task with location data', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Task started successfully',
          task: { assignmentId: 1, status: 'in_progress' },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await workerApiService.startTask(1, mockLocation);

      expect(mockApiClient.post).toHaveBeenCalledWith('/worker/tasks/1/start', {
        location: {
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          accuracy: mockLocation.accuracy,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should update task progress with location', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Progress updated',
          task: { assignmentId: 1, status: 'in_progress' },
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await workerApiService.updateTaskProgress(
        1,
        50,
        'Half completed',
        mockLocation
      );

      expect(mockApiClient.put).toHaveBeenCalledWith('/worker/tasks/1/progress', {
        progressPercent: 50,
        description: 'Half completed',
        notes: undefined,
        location: {
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          timestamp: mockLocation.timestamp.toISOString(),
        },
        completedQuantity: undefined,
        issuesEncountered: [],
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Attendance Management APIs', () => {
    it('should validate geofence with project ID and location', async () => {
      const mockResponse = {
        success: true,
        data: {
          insideGeofence: true,
          distance: 0,
          canProceed: true,
          message: 'Location valid',
          accuracy: 5,
        },
      };

      // Mock the attendanceApiService method
      const mockValidateGeofence = jest.fn().mockResolvedValue(mockResponse);
      require('../AttendanceApiService').attendanceApiService.validateGeofence = mockValidateGeofence;

      const result = await workerApiService.validateGeofence({
        projectId: '1',
        location: mockLocation
      });

      expect(mockValidateGeofence).toHaveBeenCalledWith({
        projectId: '1',
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        accuracy: mockLocation.accuracy,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should clock in with project ID and location', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Check-in successful',
        },
      };

      // Mock the attendanceApiService method
      const mockClockIn = jest.fn().mockResolvedValue(mockResponse);
      require('../AttendanceApiService').attendanceApiService.clockIn = mockClockIn;

      const result = await workerApiService.clockIn({
        projectId: '1',
        location: mockLocation
      });

      expect(mockClockIn).toHaveBeenCalledWith('1', mockLocation);
      expect(result).toEqual(mockResponse);
    });

    it('should get attendance history with project filter', async () => {
      const mockResponse = {
        success: true,
        data: {
          records: [{
            employeeId: '1',
            projectId: '1',
            date: '2024-01-01',
            checkIn: '2024-01-01T10:00:00Z',
            checkOut: '2024-01-01T18:00:00Z',
            lunchStartTime: null,
            lunchEndTime: null,
            overtimeStartTime: null,
            insideGeofenceAtCheckin: true,
            insideGeofenceAtCheckout: true,
            pendingCheckout: false,
          }]
        },
      };

      // Mock the attendanceApiService method
      const mockGetAttendanceHistory = jest.fn().mockResolvedValue(mockResponse);
      require('../AttendanceApiService').attendanceApiService.getAttendanceHistory = mockGetAttendanceHistory;

      const result = await workerApiService.getAttendanceHistory({
        projectId: '1'
      });

      expect(mockGetAttendanceHistory).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Daily Job Reporting APIs', () => {
    it('should create daily report with correct API specification', async () => {
      const reportData = {
        date: '2024-02-01',
        projectId: 1,
        workArea: 'Zone A',
        floor: 'Floor 3',
        summary: 'Completed installation of ceiling panels',
        tasksCompleted: [{
          taskId: 123,
          description: 'Install ceiling panels',
          quantityCompleted: 45,
          unit: 'panels',
          progressPercent: 90,
          notes: 'Good progress, minor delay due to material delivery'
        }],
        issues: [{
          type: 'material_shortage',
          description: 'Ran out of screws for panel installation',
          severity: 'medium' as const,
          reportedAt: '2024-02-01T14:30:00Z'
        }],
        materialUsed: [{
          materialId: 456,
          name: 'Ceiling Panels',
          quantityUsed: 45,
          unit: 'pieces'
        }],
        workingHours: {
          startTime: '08:00:00',
          endTime: '17:00:00',
          breakDuration: 60,
          overtimeHours: 0
        }
      };

      const mockResponse = {
        success: true,
        data: {
          reportId: 'DR_20240201_123',
          date: '2024-02-01',
          status: 'draft',
          createdAt: '2024-02-01T17:30:00Z',
          summary: {
            totalTasks: 1,
            completedTasks: 0,
            inProgressTasks: 1,
            overallProgress: 90
          }
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await workerApiService.createDailyReport(reportData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/worker/reports/daily', reportData);
      expect(result).toEqual(mockResponse);
    });

    it('should upload report photos with correct format', async () => {
      const reportId = 'DR_20240201_123';
      const photosData = {
        photos: [new File([], 'test1.jpg'), new File([], 'test2.jpg')],
        category: 'progress' as const,
        description: 'Progress photos for ceiling installation',
        taskId: 123
      };

      const mockResponse = {
        success: true,
        data: {
          uploadedPhotos: [
            {
              photoId: 'PH_001',
              filename: 'task_123_1738567735192.png',
              url: '/uploads/reports/task_123_1738567735192.png',
              category: 'progress',
              uploadedAt: '2024-02-01T15:30:00Z'
            }
          ],
          totalPhotos: 2
        }
      };

      mockApiClient.uploadFile.mockResolvedValue(mockResponse);

      const result = await workerApiService.uploadReportPhotos(reportId, photosData);

      expect(mockApiClient.uploadFile).toHaveBeenCalledWith(
        `/api/worker/reports/${reportId}/photos`,
        expect.any(FormData)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete report photo', async () => {
      const reportId = 'DR_20240201_123';
      const photoId = 'PH_001';

      const mockResponse = {
        success: true,
        data: {
          deletedPhotoId: 'PH_001',
          remainingPhotos: 1
        }
      };

      mockApiClient.delete.mockResolvedValue(mockResponse);

      const result = await workerApiService.deleteReportPhoto(reportId, photoId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/worker/reports/${reportId}/photos/${photoId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should submit daily report', async () => {
      const reportId = 'DR_20240201_123';
      const submitData = {
        finalNotes: 'All tasks completed as planned. Ready for next phase.',
        supervisorNotification: true
      };

      const mockResponse = {
        success: true,
        data: {
          reportId: 'DR_20240201_123',
          status: 'submitted',
          submittedAt: '2024-02-01T17:45:00Z',
          supervisorNotified: true,
          nextSteps: 'Report sent to supervisor for review'
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await workerApiService.submitDailyReport(reportId, submitData);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/api/worker/reports/${reportId}/submit`, submitData);
      expect(result).toEqual(mockResponse);
    });

    it('should get daily reports with pagination', async () => {
      const params = {
        date: '2024-02-01',
        status: 'submitted' as const,
        limit: 10,
        offset: 0
      };

      const mockResponse = {
        success: true,
        data: {
          reports: [{
            reportId: 'DR_20240201_123',
            date: '2024-02-01',
            status: 'submitted',
            projectName: 'Office Building Construction',
            workArea: 'Zone A',
            summary: {
              totalTasks: 3,
              completedTasks: 2,
              overallProgress: 85
            },
            createdAt: '2024-02-01T17:30:00Z',
            submittedAt: '2024-02-01T17:45:00Z'
          }],
          pagination: {
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false
          }
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await workerApiService.getDailyReports(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/worker/reports/daily', { params });
      expect(result).toEqual(mockResponse);
    });

    it('should get specific daily report', async () => {
      const reportId = 'DR_20240201_123';

      const mockResponse = {
        success: true,
        data: {
          reportId: 'DR_20240201_123',
          date: '2024-02-01',
          status: 'submitted',
          projectId: 1,
          projectName: 'Office Building Construction',
          workArea: 'Zone A',
          floor: 'Floor 3',
          summary: 'Completed installation of ceiling panels in Zone A',
          tasksCompleted: [{
            taskId: 123,
            description: 'Install ceiling panels',
            quantityCompleted: 45,
            unit: 'panels',
            progressPercent: 90,
            notes: 'Good progress, minor delay due to material delivery'
          }],
          issues: [{
            type: 'material_shortage',
            description: 'Ran out of screws for panel installation',
            severity: 'medium',
            reportedAt: '2024-02-01T14:30:00Z'
          }],
          photos: [{
            photoId: 'PH_002',
            filename: 'task_123_1738567735193.png',
            url: '/uploads/reports/task_123_1738567735193.png',
            category: 'progress',
            uploadedAt: '2024-02-01T15:30:00Z'
          }],
          workingHours: {
            startTime: '08:00:00',
            endTime: '17:00:00',
            breakDuration: 60,
            overtimeHours: 0
          },
          materialUsed: [{
            materialId: 456,
            name: 'Ceiling Panels',
            quantityUsed: 45,
            unit: 'pieces'
          }],
          createdAt: '2024-02-01T17:30:00Z',
          submittedAt: '2024-02-01T17:45:00Z'
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await workerApiService.getDailyReport(reportId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/worker/reports/daily/${reportId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Request Management APIs', () => {
    it('should submit leave request with date formatting', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Leave request submitted',
          request: { id: 1, type: 'leave' },
        },
      };

      mockApiClient.uploadFile.mockResolvedValue(mockResponse);

      const requestData = {
        leaveType: 'ANNUAL' as const,
        fromDate: new Date('2024-02-01'),
        toDate: new Date('2024-02-05'),
        reason: 'Family vacation',
      };

      const result = await workerApiService.submitLeaveRequest(requestData);

      expect(mockApiClient.uploadFile).toHaveBeenCalledWith('/worker/requests/leave', expect.any(FormData));
      expect(result).toEqual(mockResponse);
    });

    it('should submit material request with items array', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Material request submitted',
          request: { id: 1, type: 'material' },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const requestData = {
        projectId: 1,
        itemName: 'Cement',
        itemCategory: 'concrete' as const,
        quantity: 10,
        unit: 'bags',
        urgency: 'HIGH' as const,
        requiredDate: new Date('2024-02-01'),
        purpose: 'Foundation work',
        justification: 'Materials needed for foundation',
      };

      mockApiClient.uploadFile.mockResolvedValue(mockResponse);

      const result = await workerApiService.submitMaterialRequest(requestData);

      expect(mockApiClient.uploadFile).toHaveBeenCalledWith('/worker/requests/material', expect.any(FormData));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should propagate API client errors', async () => {
      const mockError = new Error('Network error');
      mockApiClient.get.mockRejectedValue(mockError);

      await expect(workerApiService.getDashboardData()).rejects.toThrow('Network error');
    });

    it('should handle location data formatting consistently', async () => {
      mockAttendanceApiService.validateGeofence.mockResolvedValue({ 
        success: true, 
        data: { insideGeofence: true, distance: 0, canProceed: true, message: 'Valid', accuracy: 5 } 
      });

      await workerApiService.validateGeofence({
        projectId: '1',
        location: mockLocation,
      });

      expect(mockAttendanceApiService.validateGeofence).toHaveBeenCalledWith({
        projectId: '1',
        latitude: mockLocation.latitude,
        longitude: mockLocation.longitude,
        accuracy: mockLocation.accuracy,
      });
    });
  });
});