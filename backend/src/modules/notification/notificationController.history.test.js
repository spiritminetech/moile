import NotificationController from './notificationController.js';
import WorkerNotification from './models/Notification.js';
import NotificationAudit from './models/NotificationAudit.js';

// Mock the models
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockAggregate = jest.fn();

WorkerNotification.find = mockFind;
WorkerNotification.countDocuments = mockCountDocuments;
NotificationAudit.find = mockFind;
NotificationAudit.countDocuments = mockCountDocuments;
NotificationAudit.aggregate = mockAggregate;

describe('NotificationController - History Endpoints', () => {
  let req, res;

    beforeEach(() => {
      req = {
        user: { id: 1, role: 'worker' },
        notificationPermissions: { restrictToRecipient: 1 },
        query: {}
      };
      res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      // Reset mocks
      mockFind.mockClear();
      mockCountDocuments.mockClear();
      mockAggregate.mockClear();
    });

  describe('getNotificationHistory', () => {
    it('should return notification history with 90-day retention', async () => {
      const mockNotifications = [
        {
          id: 1,
          type: 'TASK_UPDATE',
          priority: 'HIGH',
          title: 'Task assigned',
          message: 'New task assigned to you',
          status: 'READ',
          createdAt: new Date(),
          readAt: new Date()
        },
        {
          id: 2,
          type: 'SITE_CHANGE',
          priority: 'CRITICAL',
          title: 'Site change',
          message: 'Report to new location',
          status: 'DELIVERED',
          createdAt: new Date()
        }
      ];

      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockNotifications)
            })
          })
        })
      });

      mockCountDocuments.mockResolvedValueOnce(2); // total count
      mockCountDocuments.mockResolvedValueOnce(1); // read count

      await NotificationController.getNotificationHistory(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        notifications: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            isRead: true,
            isAcknowledged: false,
            requiresAction: false
          }),
          expect.objectContaining({
            id: 2,
            isRead: false,
            isAcknowledged: false,
            requiresAction: false
          })
        ]),
        pagination: {
          total: 2,
          limit: 50,
          offset: 0,
          hasMore: false
        },
        summary: {
          totalNotifications: 2,
          readCount: 1,
          unreadCount: 1,
          retentionPeriod: '90 days',
          oldestNotification: expect.any(String)
        },
        filters: expect.any(Object),
        permissions: expect.any(Object)
      });
    });

    it('should filter by read status', async () => {
      req.query = { readStatus: 'unread' };

      WorkerNotification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      WorkerNotification.countDocuments.mockResolvedValue(0);

      await NotificationController.getNotificationHistory(req, res);

      expect(WorkerNotification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['PENDING', 'SENT', 'DELIVERED'] }
        })
      );
    });

    it('should apply text search filter', async () => {
      req.query = { search: 'task' };

      WorkerNotification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      WorkerNotification.countDocuments.mockResolvedValue(0);

      await NotificationController.getNotificationHistory(req, res);

      expect(WorkerNotification.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            { title: expect.any(RegExp) },
            { message: expect.any(RegExp) },
            { type: expect.any(RegExp) }
          ])
        })
      );
    });

    it('should enforce 90-day retention limit', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago
      req.query = { startDate: oldDate.toISOString() };

      WorkerNotification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      WorkerNotification.countDocuments.mockResolvedValue(0);

      await NotificationController.getNotificationHistory(req, res);

      const callArgs = WorkerNotification.find.mock.calls[0][0];
      const actualStartDate = callArgs.createdAt.$gte;
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // Should use 90-day limit instead of requested older date
      expect(actualStartDate.getTime()).toBeGreaterThan(ninetyDaysAgo.getTime() - 1000);
    });

    it('should deny access to other workers history for regular workers', async () => {
      req.query = { workerId: '2' }; // Different worker ID
      req.notificationPermissions = { restrictToRecipient: 1 }; // No canReadAll permission

      await NotificationController.getNotificationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'You can only access your own notification history'
      });
    });

    it('should handle errors gracefully', async () => {
      WorkerNotification.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await NotificationController.getNotificationHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'FETCH_HISTORY_ERROR',
        message: 'Failed to fetch notification history',
        details: 'Database error'
      });
    });
  });

  describe('getNotificationAudit', () => {
    beforeEach(() => {
      req.user.role = 'supervisor';
      req.notificationPermissions = { canReadAll: true };
    });

    it('should return audit records for supervisors', async () => {
      const mockAuditRecords = [
        {
          id: 1,
          notificationId: 1,
          workerId: 1,
          event: 'DELIVERED',
          timestamp: new Date(),
          metadata: { deliveryMethod: 'PUSH' }
        }
      ];

      NotificationAudit.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockAuditRecords)
              })
            })
          })
        })
      });

      NotificationAudit.countDocuments.mockResolvedValue(1);
      NotificationAudit.aggregate.mockResolvedValue([
        { _id: 'DELIVERED', count: 1 }
      ]);

      await NotificationController.getNotificationAudit(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        auditRecords: mockAuditRecords,
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false
        },
        summary: {
          totalRecords: 1,
          eventTypes: [{ _id: 'DELIVERED', count: 1 }],
          retentionPeriod: '7 years'
        },
        filters: expect.any(Object),
        permissions: expect.any(Object)
      });
    });

    it('should deny access to regular workers', async () => {
      req.user.role = 'worker';
      req.notificationPermissions = { restrictToRecipient: 1 };

      await NotificationController.getNotificationAudit(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Insufficient permissions to access audit records'
      });
    });

    it('should filter by worker ID', async () => {
      req.query = { workerId: '1' };

      NotificationAudit.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      NotificationAudit.countDocuments.mockResolvedValue(0);
      NotificationAudit.aggregate.mockResolvedValue([]);

      await NotificationController.getNotificationAudit(req, res);

      expect(NotificationAudit.find).toHaveBeenCalledWith(
        expect.objectContaining({
          workerId: 1
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      req.query = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      NotificationAudit.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      NotificationAudit.countDocuments.mockResolvedValue(0);
      NotificationAudit.aggregate.mockResolvedValue([]);

      await NotificationController.getNotificationAudit(req, res);

      expect(NotificationAudit.find).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        })
      );
    });

    it('should handle errors gracefully', async () => {
      NotificationAudit.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await NotificationController.getNotificationAudit(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'FETCH_AUDIT_ERROR',
        message: 'Failed to fetch audit records',
        details: 'Database error'
      });
    });
  });
});