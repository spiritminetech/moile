import NotificationSyncService from './NotificationSyncService.js';
import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';

/**
 * Basic tests for NotificationSyncService
 * Tests core synchronization functionality and conflict resolution
 */

describe('NotificationSyncService', () => {
  let mockNotification;
  let mockWorkerId;

  beforeEach(() => {
    mockWorkerId = 123;
    mockNotification = {
      id: 1,
      recipientId: mockWorkerId,
      status: 'DELIVERED',
      readAt: null,
      acknowledgedAt: null,
      requiresAcknowledgment: false,
      updatedAt: new Date(),
      __v: 0,
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock database methods
    WorkerNotification.findOne = jest.fn();
    NotificationAudit.createAuditRecord = jest.fn().mockResolvedValue({ id: 1 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('synchronizeStatusUpdates', () => {
    test('should process status updates without conflicts', async () => {
      // Arrange
      const statusUpdates = [
        {
          notificationId: 1,
          status: 'READ',
          timestamp: new Date().toISOString(),
          updateType: 'READ',
          deviceInfo: { platform: 'web' }
        }
      ];

      WorkerNotification.findOne.mockResolvedValue(mockNotification);

      // Act
      const result = await NotificationSyncService.synchronizeStatusUpdates(mockWorkerId, statusUpdates);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.conflicts).toBe(0);
      expect(mockNotification.save).toHaveBeenCalled();
      expect(NotificationAudit.createAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 0, // Special ID for sync operations
          workerId: mockWorkerId,
          event: 'SYNC_COMPLETED'
        })
      );
    });

    test('should handle notification not found', async () => {
      // Arrange
      const statusUpdates = [
        {
          notificationId: 999,
          status: 'READ',
          timestamp: new Date().toISOString(),
          updateType: 'READ'
        }
      ];

      WorkerNotification.findOne.mockResolvedValue(null);

      // Act
      const result = await NotificationSyncService.synchronizeStatusUpdates(mockWorkerId, statusUpdates);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('not found');
    });

    test('should resolve timestamp conflicts', async () => {
      // Arrange
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      const pastTime = new Date(Date.now() - 60000); // 1 minute in past
      
      mockNotification.readAt = futureTime; // Server has newer timestamp
      
      const statusUpdates = [
        {
          notificationId: 1,
          status: 'READ',
          timestamp: pastTime.toISOString(), // Client has older timestamp
          updateType: 'READ',
          deviceInfo: { platform: 'web' }
        }
      ];

      WorkerNotification.findOne.mockResolvedValue(mockNotification);

      // Act
      const result = await NotificationSyncService.synchronizeStatusUpdates(mockWorkerId, statusUpdates);

      // Assert
      expect(result.success).toBe(true);
      expect(result.conflicts).toBe(1);
      expect(result.resolved).toBe(1);
      // Should keep server state due to newer timestamp
      expect(mockNotification.readAt).toEqual(futureTime);
    });
  });

  describe('analyzeConflict', () => {
    test('should detect no conflict for valid update', () => {
      // Arrange
      const notification = {
        status: 'DELIVERED',
        readAt: null,
        updatedAt: new Date(Date.now() - 60000)
      };
      
      const update = {
        status: 'READ',
        timestamp: new Date().toISOString(),
        updateType: 'READ'
      };

      // Act
      const analysis = NotificationSyncService.analyzeConflict(notification, update);

      // Assert
      expect(analysis.hasConflict).toBe(false);
    });

    test('should detect timestamp conflict', () => {
      // Arrange
      const serverTime = new Date();
      const clientTime = new Date(Date.now() - 60000); // 1 minute ago
      
      const notification = {
        status: 'READ',
        readAt: serverTime,
        updatedAt: serverTime
      };
      
      const update = {
        status: 'READ',
        timestamp: clientTime.toISOString(),
        updateType: 'READ'
      };

      // Act
      const analysis = NotificationSyncService.analyzeConflict(notification, update);

      // Assert
      expect(analysis.hasConflict).toBe(true);
      expect(analysis.conflictType).toBe('TIMESTAMP_CONFLICT');
    });

    test('should detect invalid status transition', () => {
      // Arrange
      const notification = {
        status: 'ACKNOWLEDGED', // Terminal state
        readAt: new Date(),
        acknowledgedAt: new Date(),
        updatedAt: new Date()
      };
      
      const update = {
        status: 'READ', // Cannot go back from ACKNOWLEDGED to READ
        timestamp: new Date().toISOString(),
        updateType: 'READ'
      };

      // Act
      const analysis = NotificationSyncService.analyzeConflict(notification, update);

      // Assert
      expect(analysis.hasConflict).toBe(true);
      expect(analysis.conflictType).toBe('INVALID_STATUS_TRANSITION');
      expect(analysis.canResolve).toBe(false);
    });
  });

  describe('isValidStatusTransition', () => {
    test('should allow valid transitions', () => {
      expect(NotificationSyncService.isValidStatusTransition('DELIVERED', 'READ')).toBe(true);
      expect(NotificationSyncService.isValidStatusTransition('READ', 'ACKNOWLEDGED')).toBe(true);
      expect(NotificationSyncService.isValidStatusTransition('SENT', 'DELIVERED')).toBe(true);
    });

    test('should reject invalid transitions', () => {
      expect(NotificationSyncService.isValidStatusTransition('ACKNOWLEDGED', 'READ')).toBe(false);
      expect(NotificationSyncService.isValidStatusTransition('EXPIRED', 'READ')).toBe(false);
      expect(NotificationSyncService.isValidStatusTransition('READ', 'SENT')).toBe(false);
    });
  });

  describe('synchronizeReadReceipts', () => {
    test('should process read receipts successfully', async () => {
      // Arrange
      const readReceipts = [
        {
          notificationId: 1,
          readAt: new Date().toISOString(),
          deviceInfo: { platform: 'web' }
        }
      ];

      WorkerNotification.findOne.mockResolvedValue(mockNotification);

      // Act
      const result = await NotificationSyncService.synchronizeReadReceipts(mockWorkerId, readReceipts);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.duplicates).toBe(0);
      expect(mockNotification.save).toHaveBeenCalled();
    });

    test('should detect duplicate read receipts', async () => {
      // Arrange
      const existingReadTime = new Date();
      const olderReadTime = new Date(Date.now() - 60000);
      
      mockNotification.readAt = existingReadTime;
      
      const readReceipts = [
        {
          notificationId: 1,
          readAt: olderReadTime.toISOString(), // Older than existing
          deviceInfo: { platform: 'web' }
        }
      ];

      WorkerNotification.findOne.mockResolvedValue(mockNotification);

      // Act
      const result = await NotificationSyncService.synchronizeReadReceipts(mockWorkerId, readReceipts);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.duplicates).toBe(1);
      expect(mockNotification.save).not.toHaveBeenCalled();
    });
  });

  describe('getNotificationsForSync', () => {
    test('should return notifications updated since last sync', async () => {
      // Arrange
      const lastSync = new Date(Date.now() - 3600000); // 1 hour ago
      const mockNotifications = [
        {
          id: 1,
          status: 'READ',
          readAt: new Date(),
          updatedAt: new Date(),
          __v: 1
        }
      ];

      WorkerNotification.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(mockNotifications)
        })
      });

      // Act
      const result = await NotificationSyncService.getNotificationsForSync(mockWorkerId, lastSync);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        status: 'READ',
        readAt: mockNotifications[0].readAt,
        acknowledgedAt: undefined,
        updatedAt: mockNotifications[0].updatedAt,
        version: 1
      });
    });
  });
});