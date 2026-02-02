// workerAttendanceController.test.js
import { jest } from '@jest/globals';

// Mock dependencies
const mockAttendance = {
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn()
};

const mockProject = {
  findOne: jest.fn()
};

const mockEmployee = {
  findOne: jest.fn()
};

const mockLocationLog = {
  findOne: jest.fn(),
  create: jest.fn()
};

const mockWorkerTaskAssignment = {
  findOne: jest.fn()
};

const mockValidateGeofence = jest.fn();

// Mock modules
jest.unstable_mockModule('../attendance/Attendance.js', () => ({
  default: mockAttendance
}));

jest.unstable_mockModule('../project/models/Project.js', () => ({
  default: mockProject
}));

jest.unstable_mockModule('../employee/Employee.js', () => ({
  default: mockEmployee
}));

jest.unstable_mockModule('../attendance/LocationLog.js', () => ({
  default: mockLocationLog
}));

jest.unstable_mockModule('../worker/models/WorkerTaskAssignment.js', () => ({
  default: mockWorkerTaskAssignment
}));

jest.unstable_mockModule('../../../utils/geofenceUtil.js', () => ({
  validateGeofence: mockValidateGeofence
}));

// Import the controller after mocking
const { 
  validateLocation,
  clockIn,
  clockOut,
  lunchStart,
  lunchEnd,
  getAttendanceStatus,
  getTodayAttendance
} = await import('./workerAttendanceController.js');

describe('Worker Attendance Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1, companyId: 1 },
      body: {},
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('validateLocation', () => {
    it('should validate location successfully when inside geofence', async () => {
      req.body = {
        projectId: 1,
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10
      };

      mockProject.findOne.mockResolvedValue({
        id: 1,
        latitude: 1.3521,
        longitude: 103.8198,
        geofenceRadius: 100,
        geofence: {
          center: { latitude: 1.3521, longitude: 103.8198 },
          radius: 100,
          strictMode: true,
          allowedVariance: 10
        }
      });

      mockValidateGeofence.mockReturnValue({
        isValid: true,
        insideGeofence: true,
        distance: 25.5,
        message: 'Location validated successfully'
      });

      await validateLocation(req, res);

      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        insideGeofence: true,
        distance: 25.5,
        canProceed: true,
        message: 'Location validated successfully',
        accuracy: 10,
        projectGeofence: {
          center: { latitude: 1.3521, longitude: 103.8198 },
          radius: 100
        }
      });
    });

    it('should return 404 when project not found', async () => {
      req.body = { projectId: 999, latitude: 1.3521, longitude: 103.8198 };
      mockProject.findOne.mockResolvedValue(null);

      await validateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Project not found" });
    });
  });

  describe('clockIn', () => {
    it('should clock in successfully when conditions are met', async () => {
      req.body = {
        projectId: 1,
        latitude: 1.3521,
        longitude: 103.8198,
        accuracy: 10
      };

      const mockEmployee = { id: 1 };
      const mockProject = {
        id: 1,
        latitude: 1.3521,
        longitude: 103.8198,
        geofenceRadius: 100
      };
      const mockAssignment = { employeeId: 1, projectId: 1 };
      const mockAttendanceRecord = {
        save: jest.fn().mockResolvedValue(true),
        checkIn: new Date()
      };

      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockProject.findOne.mockResolvedValue(mockProject);
      mockWorkerTaskAssignment.findOne.mockResolvedValue(mockAssignment);
      mockAttendance.findOne.mockResolvedValue(null);
      mockAttendance.mockImplementation(() => mockAttendanceRecord);
      mockLocationLog.findOne.mockResolvedValue({ id: 1 });

      await clockIn(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Clock-in successful",
          projectId: 1,
          location: {
            latitude: 1.3521,
            longitude: 103.8198,
            accuracy: 10
          }
        })
      );
    });

    it('should return error when employee not found', async () => {
      req.body = { projectId: 1, latitude: 1.3521, longitude: 103.8198 };
      mockEmployee.findOne.mockResolvedValue(null);

      await clockIn(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized employee" });
    });

    it('should return error when outside geofence', async () => {
      req.body = {
        projectId: 1,
        latitude: 40.7128, // New York coordinates
        longitude: -74.0060
      };

      const mockEmployee = { id: 1 };
      const mockProject = {
        id: 1,
        latitude: 1.3521,
        longitude: 103.8198,
        geofenceRadius: 100
      };
      const mockAssignment = { employeeId: 1, projectId: 1 };

      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockProject.findOne.mockResolvedValue(mockProject);
      mockWorkerTaskAssignment.findOne.mockResolvedValue(mockAssignment);

      await clockIn(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Outside project geofence"
        })
      );
    });
  });

  describe('lunchStart', () => {
    it('should start lunch break successfully', async () => {
      req.body = { projectId: 1, latitude: 1.3521, longitude: 103.8198 };

      const mockEmployee = { id: 1 };
      const mockAttendanceRecord = {
        checkIn: new Date(),
        checkOut: null,
        lunchStartTime: null,
        save: jest.fn().mockResolvedValue(true)
      };

      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockAttendance.findOne.mockResolvedValue(mockAttendanceRecord);
      mockLocationLog.findOne.mockResolvedValue({ id: 1 });

      await lunchStart(req, res);

      expect(mockAttendanceRecord.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Lunch break started",
          projectId: 1
        })
      );
    });

    it('should return error when not clocked in', async () => {
      req.body = { projectId: 1 };

      const mockEmployee = { id: 1 };
      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockAttendance.findOne.mockResolvedValue(null);

      await lunchStart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Must be clocked in to start lunch break"
      });
    });
  });

  describe('getAttendanceStatus', () => {
    it('should return correct status for clocked in worker', async () => {
      req.query = { projectId: '1' };

      const mockEmployee = { id: 1 };
      const mockAttendanceRecord = {
        checkIn: new Date('2024-01-15T08:00:00.000Z'),
        checkOut: null,
        lunchStartTime: null,
        lunchEndTime: null,
        date: '2024-01-15',
        projectId: 1,
        pendingCheckout: true
      };

      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockAttendance.findOne.mockResolvedValue(mockAttendanceRecord);

      await getAttendanceStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'CLOCKED_IN',
          session: 'CHECKED_IN',
          projectId: 1,
          isOnLunchBreak: false
        })
      );
    });

    it('should return correct status for worker on lunch break', async () => {
      req.query = { projectId: '1' };

      const mockEmployee = { id: 1 };
      const mockAttendanceRecord = {
        checkIn: new Date('2024-01-15T08:00:00.000Z'),
        checkOut: null,
        lunchStartTime: new Date('2024-01-15T12:00:00.000Z'),
        lunchEndTime: null,
        date: '2024-01-15',
        projectId: 1
      };

      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockAttendance.findOne.mockResolvedValue(mockAttendanceRecord);

      await getAttendanceStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ON_LUNCH_BREAK',
          session: 'ON_LUNCH',
          isOnLunchBreak: true
        })
      );
    });

    it('should return not clocked in status when no attendance record', async () => {
      req.query = { projectId: '1' };

      const mockEmployee = { id: 1 };
      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockAttendance.findOne.mockResolvedValue(null);

      await getAttendanceStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'NOT_CLOCKED_IN',
          session: 'NOT_LOGGED_IN',
          workDuration: 0,
          isOnLunchBreak: false
        })
      );
    });
  });

  describe('getTodayAttendance', () => {
    it('should return today\'s attendance record', async () => {
      req.query = { projectId: '1' };

      const mockEmployee = { id: 1 };
      const mockAttendanceRecord = {
        checkIn: new Date('2024-01-15T08:00:00.000Z'),
        checkOut: new Date('2024-01-15T17:00:00.000Z'),
        lunchStartTime: new Date('2024-01-15T12:00:00.000Z'),
        lunchEndTime: new Date('2024-01-15T13:00:00.000Z'),
        date: '2024-01-15',
        projectId: 1
      };

      mockEmployee.findOne.mockResolvedValue(mockEmployee);
      mockAttendance.findOne.mockResolvedValue(mockAttendanceRecord);

      await getTodayAttendance(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          session: 'CHECKED_OUT',
          projectId: 1,
          workDuration: expect.any(Number),
          lunchDuration: expect.any(Number)
        })
      );
    });
  });
});

describe('Error Handling', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { userId: 1, companyId: 1 },
      body: { projectId: 1, latitude: 1.3521, longitude: 103.8198 },
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  it('should handle database errors gracefully in validateLocation', async () => {
    mockProject.findOne.mockRejectedValue(new Error('Database error'));

    await validateLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Location validation failed" });
  });

  it('should handle database errors gracefully in clockIn', async () => {
    mockEmployee.findOne.mockRejectedValue(new Error('Database error'));

    await clockIn(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Clock-in failed" });
  });

  it('should handle database errors gracefully in getAttendanceStatus', async () => {
    mockEmployee.findOne.mockRejectedValue(new Error('Database error'));

    await getAttendanceStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch attendance status" });
  });
});