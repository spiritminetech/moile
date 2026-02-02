import { AttendanceApiService } from '../AttendanceApiService';
import { apiClient } from '../client';

// Mock the API client
jest.mock('../client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AttendanceApiService', () => {
  let attendanceService: AttendanceApiService;

  beforeEach(() => {
    attendanceService = new AttendanceApiService();
    jest.clearAllMocks();
  });

  describe('validateGeofence', () => {
    it('should validate geofence with correct payload', async () => {
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

      mockApiClient.post.mockResolvedValue(mockResponse);

      const request = {
        projectId: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
      };

      const result = await attendanceService.validateGeofence(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/validate-geofence', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitAttendance', () => {
    it('should submit check-in attendance', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Check-in successful',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const request = {
        projectId: '1',
        session: 'checkin' as const,
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const result = await attendanceService.submitAttendance(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/submit', request);
      expect(result).toEqual(mockResponse);
    });

    it('should submit check-out attendance', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Check-out successful',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const request = {
        projectId: '1',
        session: 'checkout' as const,
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const result = await attendanceService.submitAttendance(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/submit', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTodaysAttendance', () => {
    it('should get today\'s attendance records', async () => {
      const mockResponse = {
        success: true,
        data: {
          session: 'CHECKED_IN',
          checkInTime: '2024-01-01T10:00:00Z',
          checkOutTime: null,
          lunchStartTime: null,
          lunchEndTime: null,
          overtimeStartTime: null,
          date: '2024-01-01',
          projectId: '1',
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getTodaysAttendance();

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/today');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendLunchReminder', () => {
    it('should send lunch reminder', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Lunch break reminder sent',
          result: {},
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const request = {
        workerId: '1',
        projectId: '1',
      };

      const result = await attendanceService.sendLunchReminder(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/send-lunch-reminder', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('sendOvertimeAlert', () => {
    it('should send overtime start alert', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Overtime start alert sent',
          result: {},
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const request = {
        workerId: '1',
        overtimeInfo: { type: 'overtime_start' },
        overtimeType: 'START' as const,
      };

      const result = await attendanceService.sendOvertimeAlert(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/send-overtime-alert', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAttendanceStatus', () => {
    it('should get current attendance status', async () => {
      const mockResponse = {
        success: true,
        data: {
          session: 'NOT_LOGGED_IN',
          checkInTime: null,
          checkOutTime: null,
          lunchStartTime: null,
          lunchEndTime: null,
          overtimeStartTime: null,
          date: '2024-01-01',
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getAttendanceStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/status');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAttendanceHistory', () => {
    it('should get attendance history without project filter', async () => {
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
          }],
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getAttendanceHistory();

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/history', { params: {} });
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
          }],
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getAttendanceHistory('1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/attendance/history', { 
        params: { projectId: '1' } 
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logLocation', () => {
    it('should log location', async () => {
      const mockResponse = {
        success: true,
        data: {
          insideGeofence: true,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const request = {
        projectId: '1',
        latitude: 40.7128,
        longitude: -74.0060,
      };

      const result = await attendanceService.logLocation(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/log-location', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkAlerts', () => {
    it('should check attendance alerts', async () => {
      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Attendance alerts checked and processed',
          results: {},
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.checkAlerts();

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/check-alerts');
      expect(result).toEqual(mockResponse);
    });
  });

  // New dedicated worker attendance endpoints tests
  describe('workerClockIn', () => {
    it('should clock in worker with dedicated endpoint', async () => {
      const request = {
        projectId: 1,
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      };

      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Clock-in successful',
          checkInTime: '2026-02-02T08:00:00.000Z',
          session: 'CHECKED_IN' as const
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.workerClockIn(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/worker/attendance/clock-in', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('workerClockOut', () => {
    it('should clock out worker with dedicated endpoint', async () => {
      const request = {
        projectId: 1,
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      };

      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Clock-out successful',
          checkOutTime: '2026-02-02T17:00:00.000Z',
          session: 'CHECKED_OUT' as const,
          totalHours: 9.0
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.workerClockOut(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/worker/attendance/clock-out', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('startLunchBreak', () => {
    it('should start lunch break', async () => {
      const request = {
        projectId: 1,
        latitude: 40.7128,
        longitude: -74.0060
      };

      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Lunch break started',
          lunchStartTime: '2026-02-02T12:00:00.000Z'
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.startLunchBreak(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/worker/attendance/lunch-start', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('endLunchBreak', () => {
    it('should end lunch break', async () => {
      const request = {
        projectId: 1,
        latitude: 40.7128,
        longitude: -74.0060
      };

      const mockResponse = {
        success: true,
        data: {
          success: true,
          message: 'Lunch break ended',
          lunchEndTime: '2026-02-02T13:00:00.000Z',
          lunchDuration: 60
        }
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await attendanceService.endLunchBreak(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/worker/attendance/lunch-end', request);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getWorkerAttendanceStatus', () => {
    it('should get worker attendance status', async () => {
      const mockResponse = {
        success: true,
        data: {
          currentStatus: 'CHECKED_IN' as const,
          checkInTime: '2026-02-02T08:00:00.000Z',
          checkOutTime: null,
          lunchStartTime: null,
          lunchEndTime: null,
          isOnLunchBreak: false,
          hoursWorked: 4.5,
          projectId: 1,
          date: '2026-02-02'
        }
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await attendanceService.getWorkerAttendanceStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith('/worker/attendance/status');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('convenience methods', () => {
    it('should clock in using convenience method', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Check-in successful',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        timestamp: new Date(),
      };

      const result = await attendanceService.clockIn('1', location);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/submit', {
        projectId: '1',
        session: 'checkin',
        latitude: 40.7128,
        longitude: -74.0060,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should clock out using convenience method', async () => {
      const mockResponse = {
        success: true,
        data: {
          message: 'Check-out successful',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const location = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 5,
        timestamp: new Date(),
      };

      const result = await attendanceService.clockOut('1', location);

      expect(mockApiClient.post).toHaveBeenCalledWith('/attendance/submit', {
        projectId: '1',
        session: 'checkout',
        latitude: 40.7128,
        longitude: -74.0060,
      });
      expect(result).toEqual(mockResponse);
    });
  });
});