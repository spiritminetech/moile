import NotificationService from './NotificationService.js';
import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';

// Mock dependencies
jest.mock('../models/Notification.js');
jest.mock('../models/NotificationAudit.js');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateNotificationData', () => {
    test('should validate required fields', () => {
      const invalidData = {};
      const result = NotificationService.validateNotificationData(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notification type is required');
      expect(result.errors).toContain('Notification title is required and must be a string');
      expect(result.errors).toContain('Notification message is required and must be a string');
      expect(result.errors).toContain('Sender ID is required and must be a number');
      expect(result.errors).toContain('Recipients are required');
    });

    test('should validate notification type', () => {
      const data = {
        type: 'INVALID_TYPE',
        title: 'Test',
        message: 'Test message',
        senderId: 1,
        recipients: [1]
      };
      
      const result = NotificationService.validateNotificationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid notification type');
    });

    test('should validate title length', () => {
      const data = {
        type: 'TASK_UPDATE',
        title: 'A'.repeat(101), // 101 characters
        message: 'Test message',
        senderId: 1,
        recipients: [1]
      };
      
      const result = NotificationService.validateNotificationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notification title cannot exceed 100 characters');
    });

    test('should validate message length', () => {
      const data = {
        type: 'TASK_UPDATE',
        title: 'Test title',
        message: 'A'.repeat(501), // 501 characters
        senderId: 1,
        recipients: [1]
      };
      
      const result = NotificationService.validateNotificationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notification message cannot exceed 500 characters');
    });

    test('should validate recipients array', () => {
      const data = {
        type: 'TASK_UPDATE',
        title: 'Test title',
        message: 'Test message',
        senderId: 1,
        recipients: []
      };
      
      const result = NotificationService.validateNotificationData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one recipient is required');
    });

    test('should accept valid notification data', () => {
      const data = {
        type: 'TASK_UPDATE',
        title: 'Test title',
        message: 'Test message',
        senderId: 1,
        recipients: [1, 2],
        actionData: {
          taskId: 'task-123',
          projectId: 'project-456',
          supervisorContact: 'supervisor@example.com'
        }
      };
      
      const result = NotificationService.validateNotificationData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateContentCompleteness', () => {
    test('should validate TASK_UPDATE content requirements', () => {
      const result = NotificationService.validateContentCompleteness('TASK_UPDATE', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task notifications must include taskId in actionData');
      expect(result.errors).toContain('Task notifications must include projectId in actionData');
      expect(result.errors).toContain('Task notifications must include supervisorContact in actionData');
    });

    test('should validate SITE_CHANGE content requirements', () => {
      const result = NotificationService.validateContentCompleteness('SITE_CHANGE', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Site change notifications must include newLocation in actionData');
      expect(result.errors).toContain('Site change notifications must include GPS coordinates in actionData');
      expect(result.errors).toContain('Site change notifications must include supervisorContact in actionData');
    });

    test('should validate ATTENDANCE_ALERT content requirements', () => {
      const result = NotificationService.validateContentCompleteness('ATTENDANCE_ALERT', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Attendance alerts must include alertType in actionData');
      expect(result.errors).toContain('Attendance alerts must include timestamp in actionData');
    });

    test('should validate APPROVAL_STATUS content requirements', () => {
      const result = NotificationService.validateContentCompleteness('APPROVAL_STATUS', {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Approval status notifications must include referenceNumber in actionData');
      expect(result.errors).toContain('Approval status notifications must include approvalType in actionData');
      expect(result.errors).toContain('Approval status notifications must include status in actionData');
    });

    test('should accept complete TASK_UPDATE content', () => {
      const actionData = {
        taskId: 'task-123',
        projectId: 'project-456',
        supervisorContact: 'supervisor@example.com'
      };
      
      const result = NotificationService.validateContentCompleteness('TASK_UPDATE', actionData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept complete SITE_CHANGE content', () => {
      const actionData = {
        newLocation: 'New Construction Site A',
        coordinates: { latitude: 1.3521, longitude: 103.8198 },
        supervisorContact: 'supervisor@example.com'
      };
      
      const result = NotificationService.validateContentCompleteness('SITE_CHANGE', actionData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('classifyPriority', () => {
    test('should return explicit priority if valid', () => {
      const data = { type: 'TASK_UPDATE', priority: 'HIGH' };
      const result = NotificationService.classifyPriority(data);
      expect(result).toBe('HIGH');
    });

    test('should classify SITE_CHANGE as CRITICAL', () => {
      const data = { type: 'SITE_CHANGE' };
      const result = NotificationService.classifyPriority(data);
      expect(result).toBe('CRITICAL');
    });

    test('should classify geofence violations as HIGH', () => {
      const data = { 
        type: 'ATTENDANCE_ALERT',
        actionData: { alertType: 'GEOFENCE_VIOLATION' }
      };
      const result = NotificationService.classifyPriority(data);
      expect(result).toBe('HIGH');
    });

    test('should classify overtime tasks as HIGH', () => {
      const data = { 
        type: 'TASK_UPDATE',
        message: 'Overtime work required for project completion'
      };
      const result = NotificationService.classifyPriority(data);
      expect(result).toBe('HIGH');
    });

    test('should classify rejected approvals as HIGH', () => {
      const data = { 
        type: 'APPROVAL_STATUS',
        actionData: { status: 'REJECTED' }
      };
      const result = NotificationService.classifyPriority(data);
      expect(result).toBe('HIGH');
    });

    test('should default to NORMAL for regular notifications', () => {
      const data = { type: 'TASK_UPDATE', message: 'Regular task update' };
      const result = NotificationService.classifyPriority(data);
      expect(result).toBe('NORMAL');
    });
  });

  describe('formatNotificationContent', () => {
    test('should trim and limit title length', () => {
      const title = '  ' + 'A'.repeat(105) + '  ';
      const message = 'Test message';
      
      const result = NotificationService.formatNotificationContent(title, message);
      
      expect(result.title).toHaveLength(100);
      expect(result.title).not.toMatch(/^\s|\s$/); // No leading/trailing spaces
    });

    test('should trim and limit message length', () => {
      const title = 'Test title';
      const message = '  ' + 'A'.repeat(505) + '  ';
      
      const result = NotificationService.formatNotificationContent(title, message);
      
      expect(result.message).toHaveLength(500);
      expect(result.message).not.toMatch(/^\s|\s$/); // No leading/trailing spaces
    });

    test('should preserve language setting', () => {
      const result = NotificationService.formatNotificationContent('Title', 'Message', 'zh');
      expect(result.language).toBe('zh');
    });
  });

  describe('createNotification', () => {
    beforeEach(() => {
      WorkerNotification.countDailyNotifications = jest.fn().mockResolvedValue(5);
      WorkerNotification.prototype.save = jest.fn().mockResolvedValue();
      NotificationAudit.createAuditRecord = jest.fn().mockResolvedValue({ id: 'audit-123' });
    });

    test('should create notification successfully', async () => {
      const notificationData = {
        type: 'TASK_UPDATE',
        title: 'New task assigned',
        message: 'You have been assigned a new task',
        senderId: 1,
        recipients: [2],
        actionData: {
          taskId: 'task-123',
          projectId: 'project-456',
          supervisorContact: 'supervisor@example.com'
        }
      };

      const result = await NotificationService.createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('TASK_UPDATE');
      expect(result.notifications[0].priority).toBe('NORMAL');
    });

    test('should skip recipients who exceed daily limit', async () => {
      WorkerNotification.countDailyNotifications = jest.fn().mockResolvedValue(10); // At limit

      const notificationData = {
        type: 'TASK_UPDATE',
        title: 'New task assigned',
        message: 'You have been assigned a new task',
        senderId: 1,
        recipients: [2],
        actionData: {
          taskId: 'task-123',
          projectId: 'project-456',
          supervisorContact: 'supervisor@example.com'
        }
      };

      const result = await NotificationService.createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.skippedRecipients[0].reason).toBe('DAILY_LIMIT_EXCEEDED');
    });

    test('should allow critical notifications even when at daily limit', async () => {
      WorkerNotification.countDailyNotifications = jest.fn().mockResolvedValue(10); // At limit

      const notificationData = {
        type: 'SITE_CHANGE',
        title: 'Emergency site change',
        message: 'Report to new location immediately',
        senderId: 1,
        recipients: [2],
        actionData: {
          newLocation: 'Emergency Site B',
          coordinates: { latitude: 1.3521, longitude: 103.8198 },
          supervisorContact: 'supervisor@example.com'
        }
      };

      const result = await NotificationService.createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.notifications[0].priority).toBe('CRITICAL');
    });

    test('should handle multiple recipients', async () => {
      const notificationData = {
        type: 'TASK_UPDATE',
        title: 'Team task assigned',
        message: 'New team task requires your attention',
        senderId: 1,
        recipients: [2, 3, 4],
        actionData: {
          taskId: 'task-123',
          projectId: 'project-456',
          supervisorContact: 'supervisor@example.com'
        }
      };

      const result = await NotificationService.createNotification(notificationData);

      expect(result.success).toBe(true);
      expect(result.created).toBe(3);
      expect(result.notifications).toHaveLength(3);
      expect(result.auditRecords).toHaveLength(3);
    });

    test('should throw error for invalid data', async () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        title: '',
        message: '',
        senderId: 'invalid',
        recipients: []
      };

      await expect(NotificationService.createNotification(invalidData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('checkNotificationAvailability', () => {
    test('should return availability for normal priority', async () => {
      WorkerNotification.countDailyNotifications = jest.fn().mockResolvedValue(5);

      const result = await NotificationService.checkNotificationAvailability(1, 'NORMAL');

      expect(result.canReceive).toBe(true);
      expect(result.todayCount).toBe(5);
      expect(result.remainingToday).toBe(5);
    });

    test('should return unavailable when at daily limit', async () => {
      WorkerNotification.countDailyNotifications = jest.fn().mockResolvedValue(10);

      const result = await NotificationService.checkNotificationAvailability(1, 'NORMAL');

      expect(result.canReceive).toBe(false);
      expect(result.todayCount).toBe(10);
      expect(result.remainingToday).toBe(0);
    });

    test('should always allow critical notifications', async () => {
      WorkerNotification.countDailyNotifications = jest.fn().mockResolvedValue(10);

      const result = await NotificationService.checkNotificationAvailability(1, 'CRITICAL');

      expect(result.canReceive).toBe(true);
      expect(result.todayCount).toBe(10);
      expect(result.priority).toBe('CRITICAL');
    });
  });
});