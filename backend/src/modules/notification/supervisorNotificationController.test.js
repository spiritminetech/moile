/**
 * Unit tests for Supervisor Notification Controller
 * Tests the core functionality of task 10.3
 */

import supervisorNotificationController from './supervisorNotificationController.js';

// Mock dependencies
const mockRequest = (overrides = {}) => ({
  user: { id: 1, role: 'supervisor', companyId: 1 },
  query: {},
  params: {},
  body: {},
  ip: '127.0.0.1',
  get: () => 'test-user-agent',
  ...overrides
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock models and services
jest.mock('./models/Notification.js', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('./models/NotificationAudit.js', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  createAuditRecord: jest.fn()
}));

jest.mock('../employee/Employee.js', () => ({
  find: jest.fn()
}));

jest.mock('../project/models/Project.js', () => ({
  find: jest.fn()
}));

describe('SupervisorNotificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationOverview', () => {
    test('should return notification overview for supervisor', async () => {
      const req = mockRequest({
        query: { days: 7 }
      });
      const res = mockResponse();

      // Mock the helper methods
      supervisorNotificationController.getSupervisorProjects = jest.fn().mockResolvedValue([
        { id: 1, projectName: 'Test Project', supervisorId: 1 }
      ]);
      supervisorNotificationController.getSupervisorWorkers = jest.fn().mockResolvedValue([1, 2, 3]);
      supervisorNotificationController.getTotalNotifications = jest.fn().mockResolvedValue(10);
      supervisorNotificationController.getEscalatedNotifications = jest.fn().mockResolvedValue(2);
      supervisorNotificationController.getUnreadNotifications = jest.fn().mockResolvedValue(5);
      supervisorNotificationController.getCriticalNotifications = jest.fn().mockResolvedValue(1);
      supervisorNotificationController.getRecentNotifications = jest.fn().mockResolvedValue([]);
      supervisorNotificationController.getEscalationQueue = jest.fn().mockResolvedValue([]);
      supervisorNotificationController.getWorkerNotificationSummary = jest.fn().mockResolvedValue([]);

      await supervisorNotificationController.getNotificationOverview(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        overview: expect.objectContaining({
          totalNotifications: 10,
          escalatedNotifications: 2,
          unreadNotifications: 5,
          criticalNotifications: 1
        }),
        projects: expect.arrayContaining([
          expect.objectContaining({ id: 1, projectName: 'Test Project' })
        ]),
        permissions: expect.objectContaining({
          canCreateNotifications: true,
          canViewAuditReports: true,
          canHandleEscalations: true
        })
      });
    });

    test('should handle case with no workers assigned', async () => {
      const req = mockRequest();
      const res = mockResponse();

      supervisorNotificationController.getSupervisorProjects = jest.fn().mockResolvedValue([]);
      supervisorNotificationController.getSupervisorWorkers = jest.fn().mockResolvedValue([]);

      await supervisorNotificationController.getNotificationOverview(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        overview: expect.objectContaining({
          totalNotifications: 0,
          escalatedNotifications: 0,
          unreadNotifications: 0,
          criticalNotifications: 0
        }),
        projects: [],
        message: 'No workers assigned to your projects'
      });
    });
  });

  describe('getEscalatedNotifications', () => {
    test('should return escalated notifications with pagination', async () => {
      const req = mockRequest({
        query: { status: 'pending', limit: 20, offset: 0 }
      });
      const res = mockResponse();

      supervisorNotificationController.getSupervisorProjects = jest.fn().mockResolvedValue([
        { id: 1, projectName: 'Test Project' }
      ]);
      supervisorNotificationController.getSupervisorWorkers = jest.fn().mockResolvedValue([1, 2]);
      supervisorNotificationController.getEscalationSummary = jest.fn().mockResolvedValue({
        pending: 3,
        resolved: 1,
        failed: 0
      });
      supervisorNotificationController.enhanceNotificationsWithContext = jest.fn().mockResolvedValue([
        {
          id: 1,
          title: 'Test Notification',
          workerName: 'John Doe',
          escalationAge: 2
        }
      ]);

      // Mock WorkerNotification.find
      const WorkerNotification = require('./models/Notification.js');
      WorkerNotification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                  { id: 1, title: 'Test Notification', escalated: true }
                ])
              })
            })
          })
        })
      });
      WorkerNotification.countDocuments.mockResolvedValue(3);

      await supervisorNotificationController.getEscalatedNotifications(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        escalatedNotifications: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            title: 'Test Notification',
            workerName: 'John Doe'
          })
        ]),
        pagination: expect.objectContaining({
          total: 3,
          limit: 20,
          offset: 0,
          hasMore: false
        }),
        summary: expect.objectContaining({
          pending: 3,
          resolved: 1,
          failed: 0
        })
      });
    });
  });

  describe('generateAuditReport', () => {
    test('should generate summary audit report', async () => {
      const req = mockRequest({
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          reportType: 'summary',
          format: 'json'
        }
      });
      const res = mockResponse();

      supervisorNotificationController.getSupervisorProjects = jest.fn().mockResolvedValue([
        { id: 1, projectName: 'Test Project' }
      ]);
      supervisorNotificationController.getSupervisorWorkers = jest.fn().mockResolvedValue([1, 2]);
      supervisorNotificationController.generateSummaryReport = jest.fn().mockResolvedValue({
        reportType: 'summary',
        totalNotifications: 10,
        byType: { TASK_UPDATE: 5, SITE_CHANGE: 3, ATTENDANCE_ALERT: 2 },
        byPriority: { CRITICAL: 1, HIGH: 3, NORMAL: 6 },
        escalationSummary: { total: 2, resolved: 1, pending: 1 }
      });

      await supervisorNotificationController.generateAuditReport(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        report: expect.objectContaining({
          reportType: 'summary',
          totalNotifications: 10,
          metadata: expect.objectContaining({
            generatedBy: 1,
            reportType: 'summary',
            workerCount: 2
          })
        })
      });
    });

    test('should validate required date range', async () => {
      const req = mockRequest({
        query: { reportType: 'summary' } // Missing dates
      });
      const res = mockResponse();

      await supervisorNotificationController.generateAuditReport(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'MISSING_DATE_RANGE',
        message: 'Start date and end date are required'
      });
    });
  });

  describe('getNotificationStatistics', () => {
    test('should return comprehensive notification statistics', async () => {
      const req = mockRequest({
        query: { period: '7d' }
      });
      const res = mockResponse();

      supervisorNotificationController.getSupervisorProjects = jest.fn().mockResolvedValue([
        { id: 1, projectName: 'Test Project' }
      ]);
      supervisorNotificationController.getSupervisorWorkers = jest.fn().mockResolvedValue([1, 2, 3]);
      supervisorNotificationController.getComprehensiveStatistics = jest.fn().mockResolvedValue({
        totalWorkers: 3,
        notificationMetrics: {
          total: 15,
          byType: { TASK_UPDATE: 8, SITE_CHANGE: 4, ATTENDANCE_ALERT: 3 },
          byPriority: { CRITICAL: 2, HIGH: 5, NORMAL: 8 }
        },
        trends: {
          dailyAverage: 2.1,
          escalationRate: '13.33',
          readRate: '86.67'
        }
      });

      await supervisorNotificationController.getNotificationStatistics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statistics: expect.objectContaining({
          totalWorkers: 3,
          notificationMetrics: expect.objectContaining({
            total: 15
          }),
          trends: expect.objectContaining({
            dailyAverage: 2.1,
            escalationRate: '13.33',
            readRate: '86.67'
          })
        }),
        period: expect.objectContaining({
          days: 7
        }),
        projects: expect.arrayContaining([
          expect.objectContaining({ id: 1, projectName: 'Test Project' })
        ])
      });
    });
  });

  describe('Helper Methods', () => {
    test('parsePeriod should correctly parse period strings', () => {
      expect(supervisorNotificationController.parsePeriod('7d')).toBe(7);
      expect(supervisorNotificationController.parsePeriod('2w')).toBe(14);
      expect(supervisorNotificationController.parsePeriod('1m')).toBe(30);
      expect(supervisorNotificationController.parsePeriod('1y')).toBe(365);
      expect(supervisorNotificationController.parsePeriod('invalid')).toBe(7); // default
    });

    test('groupBy should correctly group array items', () => {
      const testData = [
        { type: 'TASK_UPDATE', priority: 'HIGH' },
        { type: 'TASK_UPDATE', priority: 'NORMAL' },
        { type: 'SITE_CHANGE', priority: 'HIGH' }
      ];

      const groupedByType = supervisorNotificationController.groupBy(testData, 'type');
      expect(groupedByType).toEqual({
        'TASK_UPDATE': 2,
        'SITE_CHANGE': 1
      });

      const groupedByPriority = supervisorNotificationController.groupBy(testData, 'priority');
      expect(groupedByPriority).toEqual({
        'HIGH': 2,
        'NORMAL': 1
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const req = mockRequest();
      const res = mockResponse();

      supervisorNotificationController.getSupervisorProjects = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      await supervisorNotificationController.getNotificationOverview(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'OVERVIEW_ERROR',
        message: 'Failed to get notification overview',
        details: 'Database connection failed'
      });
    });
  });
});

// Test the controller methods are properly exported
describe('Controller Export', () => {
  test('should export all required methods', () => {
    expect(typeof supervisorNotificationController.getNotificationOverview).toBe('function');
    expect(typeof supervisorNotificationController.getEscalatedNotifications).toBe('function');
    expect(typeof supervisorNotificationController.handleEscalatedNotification).toBe('function');
    expect(typeof supervisorNotificationController.generateAuditReport).toBe('function');
    expect(typeof supervisorNotificationController.getNotificationStatistics).toBe('function');
  });
});