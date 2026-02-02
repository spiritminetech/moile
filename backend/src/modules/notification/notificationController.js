import WorkerNotification from './models/Notification.js';
import NotificationAudit from './models/NotificationAudit.js';
import DeviceToken from './models/DeviceToken.js';
import FCMService from './services/FirebaseService.js';
import NotificationService from './services/NotificationService.js';
import NotificationSyncService from './services/NotificationSyncService.js';
import PerformanceMonitoringService from './services/PerformanceMonitoringService.js';
import appConfig from '../../config/app.config.js';

/**
 * Notification Controller
 * Handles all notification-related HTTP requests
 */
class NotificationController {
  /**
   * Create a new notification
   * POST /api/notifications
   */
  async createNotification(req, res) {
    try {
      const notificationData = {
        ...req.body,
        senderId: req.user.id
      };

      // Use NotificationService for creation and validation
      const result = await NotificationService.createNotification(notificationData);

      res.status(201).json({
        success: true,
        message: `Created ${result.created} notifications`,
        created: result.created,
        skipped: result.skipped,
        notifications: result.notifications,
        skippedRecipients: result.skippedRecipients
      });

      // Trigger async delivery (don't wait for completion)
      if (result.notifications.length > 0) {
        this.triggerNotificationDelivery(result.notifications).catch(error => {
          console.error('Error in async notification delivery:', error);
        });
      }

    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        error: 'Failed to create notification',
        details: error.message
      });
    }
  }

  /**
   * Get notifications for a worker with permission-based filtering
   * GET /api/notifications
   * Implements Requirements 9.2, 9.4 (permission-based notification filtering, access control)
   */
  async getNotifications(req, res) {
    try {
      const { user, notificationPermissions } = req;
      const {
        status,
        type,
        priority,
        limit = 50,
        offset = 0,
        startDate,
        endDate
      } = req.query;

      // Build query filters with permission-based restrictions
      let filters = {};

      // Apply permission-based filtering
      if (notificationPermissions?.restrictToRecipient) {
        // Workers can only see their own notifications
        filters.recipientId = notificationPermissions.restrictToRecipient;
      } else if (notificationPermissions?.companyId) {
        // Supervisors and admins can see notifications for their company
        // This would require a company-based filtering mechanism
        // For now, we'll implement basic recipient filtering
        filters.recipientId = user.id; // Fallback to user's own notifications
      }
      
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (priority) filters.priority = priority;
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }

      const notifications = await WorkerNotification.find(filters)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await WorkerNotification.countDocuments(filters);

      // Convert to secure JSON format (handles decryption if needed)
      const secureNotifications = notifications.map(notification => 
        notification.toSecureJSON ? notification.toSecureJSON() : notification.toObject()
      );

      res.json({
        success: true,
        notifications: secureNotifications,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        },
        permissions: {
          canReadAll: notificationPermissions?.canReadAll || false,
          companyId: notificationPermissions?.companyId
        }
      });

    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_NOTIFICATIONS_ERROR',
        message: 'Failed to fetch notifications'
      });
    }
  }

  /**
   * Get notification history for a worker with enhanced filtering and search
   * GET /api/notifications/history
   * Implements Requirements 6.3, 6.4, 6.5, 10.4 (90-day history, search/filtering, read/unread status, audit records)
   */
  async getNotificationHistory(req, res) {
    try {
      const { user, notificationPermissions } = req;
      const {
        workerId,
        status,
        type,
        priority,
        limit = 50,
        offset = 0,
        startDate,
        endDate,
        readStatus, // 'read', 'unread', 'all'
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query filters with permission-based restrictions
      let filters = {};

      // Determine target worker ID with permission checks
      let targetWorkerId = user.id;
      if (workerId && notificationPermissions?.canReadAll) {
        // Supervisors/admins can query other workers
        targetWorkerId = parseInt(workerId);
      } else if (workerId && workerId !== user.id.toString()) {
        // Workers can only access their own history
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'You can only access your own notification history'
        });
      }

      filters.recipientId = targetWorkerId;

      // Apply 90-day retention filter (Requirement 6.3)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
          const requestedStartDate = new Date(startDate);
          // Ensure we don't go beyond 90-day retention
          filters.createdAt.$gte = requestedStartDate > ninetyDaysAgo ? requestedStartDate : ninetyDaysAgo;
        } else {
          filters.createdAt.$gte = ninetyDaysAgo;
        }
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      } else {
        // Default to 90-day window
        filters.createdAt = { $gte: ninetyDaysAgo };
      }

      // Apply filters (Requirement 6.4)
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (priority) filters.priority = priority;

      // Apply read/unread status filter (Requirement 6.5)
      if (readStatus === 'read') {
        filters.status = { $in: ['READ', 'ACKNOWLEDGED'] };
      } else if (readStatus === 'unread') {
        filters.status = { $in: ['PENDING', 'SENT', 'DELIVERED'] };
      }

      // Apply text search if provided
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filters.$or = [
          { title: searchRegex },
          { message: searchRegex },
          { type: searchRegex }
        ];
      }

      // Build sort criteria
      const sortCriteria = {};
      sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const notifications = await WorkerNotification.find(filters)
        .sort(sortCriteria)
        .limit(parseInt(limit))
        .skip(parseInt(offset)); // Remove .lean() to keep Mongoose document methods

      const total = await WorkerNotification.countDocuments(filters);

      // Get read/unread counts for summary
      const readCount = await WorkerNotification.countDocuments({
        ...filters,
        status: { $in: ['READ', 'ACKNOWLEDGED'] }
      });
      const unreadCount = total - readCount;

      // Convert to secure JSON format and add read status indicators
      const secureNotifications = notifications.map(notification => {
        // Use toSecureJSON to properly handle decryption
        const safeNotification = notification.toSecureJSON ? notification.toSecureJSON() : notification.toObject();
        
        // Remove any remaining sensitive fields (in case toSecureJSON doesn't exist)
        delete safeNotification.encryptedTitle;
        delete safeNotification.encryptedMessage;
        delete safeNotification.contentHash;
        
        // Add read status indicators
        safeNotification.isRead = ['READ', 'ACKNOWLEDGED'].includes(notification.status);
        safeNotification.isAcknowledged = notification.status === 'ACKNOWLEDGED';
        safeNotification.requiresAction = notification.requiresAcknowledgment && !safeNotification.isAcknowledged;
        
        return safeNotification;
      });

      res.json({
        success: true,
        notifications: secureNotifications,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        },
        summary: {
          totalNotifications: total,
          readCount,
          unreadCount,
          retentionPeriod: '90 days',
          oldestNotification: ninetyDaysAgo.toISOString()
        },
        filters: {
          workerId: targetWorkerId,
          dateRange: {
            start: filters.createdAt?.$gte?.toISOString(),
            end: filters.createdAt?.$lte?.toISOString()
          },
          status,
          type,
          priority,
          readStatus,
          search
        },
        permissions: {
          canReadAll: notificationPermissions?.canReadAll || false,
          canAccessOtherWorkers: notificationPermissions?.canReadAll || false
        }
      });

    } catch (error) {
      console.error('Error fetching notification history:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_HISTORY_ERROR',
        message: 'Failed to fetch notification history',
        details: error.message
      });
    }
  }

  /**
   * Get notification audit records with search and filtering
   * GET /api/notifications/audit
   * Implements Requirement 10.4 (searchable audit records by worker, date range, and notification type)
   */
  async getNotificationAudit(req, res) {
    try {
      const { user, notificationPermissions } = req;
      const {
        workerId,
        notificationId,
        event,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query;

      // Check permissions for audit access
      if (!notificationPermissions?.canReadAll && user.role !== 'admin' && user.role !== 'supervisor') {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access audit records'
        });
      }

      // Build query filters
      let filters = {};

      // Apply company-based filtering if not admin
      if (user.role !== 'admin' && notificationPermissions?.companyId) {
        // This would need to be implemented based on your company structure
        // For now, we'll allow supervisors to see their company's audit records
      }

      if (workerId) filters.workerId = parseInt(workerId);
      if (notificationId) filters.notificationId = parseInt(notificationId);
      if (event) filters.event = event;

      // Apply date range filter
      if (startDate || endDate) {
        filters.timestamp = {};
        if (startDate) filters.timestamp.$gte = new Date(startDate);
        if (endDate) filters.timestamp.$lte = new Date(endDate);
      }

      // Build sort criteria
      const sortCriteria = {};
      sortCriteria[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const auditRecords = await NotificationAudit.find(filters)
        .sort(sortCriteria)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('notificationId', 'type priority title')
        .lean();

      const total = await NotificationAudit.countDocuments(filters);

      // Get event type summary
      const eventSummary = await NotificationAudit.aggregate([
        { $match: filters },
        { $group: { _id: '$event', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        auditRecords,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        },
        summary: {
          totalRecords: total,
          eventTypes: eventSummary,
          retentionPeriod: '7 years'
        },
        filters: {
          workerId: workerId ? parseInt(workerId) : undefined,
          notificationId: notificationId ? parseInt(notificationId) : undefined,
          event,
          dateRange: {
            start: filters.timestamp?.$gte?.toISOString(),
            end: filters.timestamp?.$lte?.toISOString()
          }
        },
        permissions: {
          canReadAll: notificationPermissions?.canReadAll || false,
          userRole: user.role
        }
      });

    } catch (error) {
      console.error('Error fetching notification audit records:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_AUDIT_ERROR',
        message: 'Failed to fetch audit records',
        details: error.message
      });
    }
  }

  /**
   * Mark notification as read with enhanced access control
   * PUT /api/notifications/:id/read
   * Implements Requirements 9.2, 9.4 (permission-based access control)
   */
  async markAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const { user, accessValidation } = req;

      // Build query with access validation
      const query = { id: notificationId };
      
      if (accessValidation?.restrictToRecipient) {
        query.recipientId = accessValidation.restrictToRecipient;
      }

      const notification = await WorkerNotification.findOne(query);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found or access denied'
        });
      }

      await notification.markAsRead();

      // Create audit record with enhanced security
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: user.id,
        event: 'READ',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          accessMethod: 'API',
          userRole: user.role,
          companyId: user.companyId
        }
      });

      res.json({
        success: true,
        message: 'Notification marked as read',
        notification: {
          id: notification.id,
          status: notification.status,
          readAt: notification.readAt
        }
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'MARK_READ_ERROR',
        message: 'Failed to mark notification as read'
      });
    }
  }

  /**
   * Acknowledge notification with enhanced access control
   * PUT /api/notifications/:id/acknowledge
   * Implements Requirements 9.2, 9.4 (permission-based access control)
   */
  async acknowledgeNotification(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const { user, accessValidation } = req;

      // Build query with access validation
      const query = { id: notificationId };
      
      if (accessValidation?.restrictToRecipient) {
        query.recipientId = accessValidation.restrictToRecipient;
      }

      const notification = await WorkerNotification.findOne(query);

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found or access denied'
        });
      }

      if (!notification.requiresAcknowledgment) {
        return res.status(400).json({
          success: false,
          error: 'ACKNOWLEDGMENT_NOT_REQUIRED',
          message: 'This notification does not require acknowledgment'
        });
      }

      await notification.markAsAcknowledged();

      // Create audit record with enhanced security
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: user.id,
        event: 'ACKNOWLEDGED',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        metadata: {
          accessMethod: 'API',
          userRole: user.role,
          companyId: user.companyId
        }
      });

      res.json({
        success: true,
        message: 'Notification acknowledged',
        notification: {
          id: notification.id,
          status: notification.status,
          acknowledgedAt: notification.acknowledgedAt
        }
      });

    } catch (error) {
      console.error('Error acknowledging notification:', error);
      res.status(500).json({
        success: false,
        error: 'ACKNOWLEDGE_ERROR',
        message: 'Failed to acknowledge notification'
      });
    }
  }

  /**
   * Register device token for push notifications with enhanced validation
   * POST /api/notifications/register-device
   * Implements device token management (Requirement 5.2)
   */
  async registerDevice(req, res) {
    try {
      const {
        deviceToken,
        platform,
        appVersion,
        osVersion,
        deviceId,
        notificationSettings
      } = req.body;

      const workerId = req.user.id;

      // Use FCM service for registration with enhanced validation
      const tokenData = {
        workerId,
        deviceToken,
        platform,
        appVersion,
        osVersion,
        deviceId: deviceId || `${platform}-${workerId}-${Date.now()}`,
        notificationSettings: notificationSettings || {}
      };

      const result = await FCMService.registerDeviceToken(tokenData);

      res.json({
        success: true,
        message: 'Device registered successfully',
        deviceToken: {
          id: result.deviceTokenId,
          platform: result.platform,
          isNewRegistration: result.isNewRegistration,
          notificationSettings: result.notificationSettings
        }
      });

    } catch (error) {
      console.error('Error registering device:', error);
      
      // Handle validation errors specifically
      if (error.message.includes('validation failed')) {
        return res.status(400).json({
          error: 'Device registration validation failed',
          details: error.message
        });
      }

      res.status(500).json({
        error: 'Failed to register device',
        details: error.message
      });
    }
  }

  /**
   * Get notification statistics
   * GET /api/notifications/stats
   */
  async getNotificationStats(req, res) {
    try {
      const workerId = req.user.id;
      const { days = 7 } = req.query;

      const stats = await NotificationService.getNotificationStats(workerId, parseInt(days));

      res.json(stats);

    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        error: 'Failed to fetch notification statistics',
        details: error.message
      });
    }
  }

  /**
   * Check notification availability for a worker
   * GET /api/notifications/availability
   */
  async checkNotificationAvailability(req, res) {
    try {
      const workerId = req.user.id;
      const { priority = 'NORMAL' } = req.query;

      const availability = await NotificationService.checkNotificationAvailability(workerId, priority);

      res.json({
        success: true,
        ...availability
      });

    } catch (error) {
      console.error('Error checking notification availability:', error);
      res.status(500).json({
        error: 'Failed to check notification availability',
        details: error.message
      });
    }
  }

  /**
   * Get daily notification limit statistics
   * GET /api/notifications/limits/stats
   */
  async getDailyLimitStats(req, res) {
    try {
      const { workerIds } = req.query;
      
      // Parse worker IDs if provided
      let workerIdArray = [];
      if (workerIds) {
        workerIdArray = Array.isArray(workerIds) 
          ? workerIds.map(id => parseInt(id))
          : workerIds.split(',').map(id => parseInt(id));
      }

      const stats = await NotificationService.getDailyLimitStats(workerIdArray);

      res.json(stats);

    } catch (error) {
      console.error('Error fetching daily limit stats:', error);
      res.status(500).json({
        error: 'Failed to fetch daily limit statistics',
        details: error.message
      });
    }
  }

  /**
   * Check daily limit enforcement for a specific worker
   * GET /api/notifications/limits/enforcement/:workerId
   */
  async checkDailyLimitEnforcement(req, res) {
    try {
      const workerId = parseInt(req.params.workerId) || req.user.id;
      
      // Ensure users can only check their own limits unless they're supervisors/admins
      if (workerId !== req.user.id && !['supervisor', 'admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'You can only check your own notification limits'
        });
      }

      const enforcement = await NotificationService.checkDailyLimitEnforcement(workerId);

      res.json({
        success: true,
        ...enforcement
      });

    } catch (error) {
      console.error('Error checking daily limit enforcement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check daily limit enforcement',
        details: error.message
      });
    }
  }

  /**
   * Trigger notification delivery with enhanced FCM service and retry logic
   * Implements delivery with retry logic (Requirements 5.3, 12.1)
   */
  async triggerNotificationDelivery(notifications) {
    for (const notification of notifications) {
      try {
        // Start performance tracking
        PerformanceMonitoringService.trackDeliveryStart(notification.id);

        // Get active device tokens for recipient
        const deviceTokens = await DeviceToken.findActiveByWorker(notification.recipientId);
        
        if (deviceTokens.length === 0) {
          console.warn(`No active device tokens found for worker ${notification.recipientId}`);
          await notification.markAsFailed();
          
          // End performance tracking with failure
          PerformanceMonitoringService.trackDeliveryEnd(notification.id, false);
          
          // Create audit record for no devices
          await NotificationAudit.createAuditRecord({
            notificationId: notification.id,
            workerId: notification.recipientId,
            event: 'FAILED',
            metadata: {
              deliveryMethod: 'PUSH',
              errorCode: 'NO_DEVICES',
              errorMessage: 'No active device tokens found'
            }
          });
          continue;
        }

        // Filter tokens based on notification settings and quiet hours
        const eligibleTokens = deviceTokens.filter(token => 
          token.canReceiveNotification(notification.priority)
        );

        if (eligibleTokens.length === 0) {
          console.warn(`No eligible device tokens for worker ${notification.recipientId} (quiet hours or disabled)`);
          
          // For non-critical notifications, just skip during quiet hours
          if (notification.priority !== 'CRITICAL') {
            continue;
          }
          
          // For critical notifications, try to send anyway
          console.log(`Sending critical notification despite quiet hours for worker ${notification.recipientId}`);
        }

        const tokensToUse = eligibleTokens.length > 0 ? eligibleTokens : deviceTokens;

        // Use enhanced FCM service for delivery
        if (tokensToUse.length === 1) {
          // Single device delivery with retry logic
          const token = tokensToUse[0];
          const result = await FCMService.sendToDevice(token.deviceToken, notification);
          
          if (result.success) {
            await notification.markAsDelivered();
            await token.recordDeliverySuccess();
            
            // End performance tracking with success
            PerformanceMonitoringService.trackDeliveryEnd(notification.id, true);
            
            // Create audit record for successful delivery
            await NotificationAudit.createAuditRecord({
              notificationId: notification.id,
              workerId: notification.recipientId,
              event: 'DELIVERED',
              metadata: {
                deliveryMethod: 'PUSH',
                platform: result.platform,
                messageId: result.messageId,
                attemptNumber: result.attemptNumber || 1
              }
            });
          } else {
            // End performance tracking with failure
            PerformanceMonitoringService.trackDeliveryEnd(notification.id, false);
            await this.handleDeliveryFailure(notification, result, token);
          }
        } else {
          // Multiple device delivery
          const tokenStrings = tokensToUse.map(token => token.deviceToken);
          const result = await FCMService.sendToMultipleDevices(tokenStrings, notification);

          if (result.success && result.successCount > 0) {
            await notification.markAsDelivered();
            
            // End performance tracking with success
            PerformanceMonitoringService.trackDeliveryEnd(notification.id, true);
            
            // Update delivery stats for successful deliveries
            const successfulTokens = tokensToUse.filter((token, index) => {
              return !result.failedTokens.some(failed => failed.token === token.deviceToken) &&
                     !result.expiredTokens.includes(token.deviceToken);
            });
            
            for (const token of successfulTokens) {
              await token.recordDeliverySuccess();
            }

            // Create audit record for multicast delivery
            await NotificationAudit.createAuditRecord({
              notificationId: notification.id,
              workerId: notification.recipientId,
              event: 'DELIVERED',
              metadata: {
                deliveryMethod: 'PUSH_MULTICAST',
                totalTokens: result.totalTokens,
                successCount: result.successCount,
                failureCount: result.failureCount,
                blockedCount: result.blockedCount,
                invalidCount: result.invalidCount
              }
            });
          } else {
            // End performance tracking with failure
            PerformanceMonitoringService.trackDeliveryEnd(notification.id, false);
            await notification.incrementDeliveryAttempt();
          }

          // Handle failed and expired tokens
          await this.handleMulticastFailures(result, tokensToUse, notification);
        }

      } catch (error) {
        console.error(`Error delivering notification ${notification.id}:`, error);
        
        // End performance tracking with failure
        PerformanceMonitoringService.trackDeliveryEnd(notification.id, false);
        
        await notification.incrementDeliveryAttempt();
        
        // Create audit record for delivery error
        await NotificationAudit.createAuditRecord({
          notificationId: notification.id,
          workerId: notification.recipientId,
          event: 'FAILED',
          metadata: {
            deliveryMethod: 'PUSH',
            errorCode: error.code || 'DELIVERY_ERROR',
            errorMessage: error.message,
            circuitBreakerOpen: error.message.includes('circuit breaker')
          }
        });
      }
    }
  }

  /**
   * Handle delivery failure for single device
   */
  async handleDeliveryFailure(notification, result, deviceToken) {
    await notification.incrementDeliveryAttempt();
    
    // Handle token deactivation if needed
    if (result.shouldDeactivateToken) {
      deviceToken.isActive = false;
      await deviceToken.save();
      console.log(`Deactivated invalid device token for worker ${notification.recipientId}`);
    } else {
      await deviceToken.recordDeliveryFailure();
    }

    // Create audit record for failure
    await NotificationAudit.createAuditRecord({
      notificationId: notification.id,
      workerId: notification.recipientId,
      event: 'FAILED',
      metadata: {
        deliveryMethod: 'PUSH',
        errorCode: result.error,
        errorMessage: result.message,
        shouldRetry: result.shouldRetry,
        shouldDeactivateToken: result.shouldDeactivateToken,
        attemptNumber: result.attemptNumber || 1,
        finalAttempt: result.finalAttempt || false
      }
    });
  }

  /**
   * Handle failures in multicast delivery
   */
  async handleMulticastFailures(result, deviceTokens, notification) {
    // Handle expired tokens
    if (result.expiredTokens && result.expiredTokens.length > 0) {
      for (const expiredToken of result.expiredTokens) {
        const tokenRecord = deviceTokens.find(t => t.deviceToken === expiredToken);
        if (tokenRecord) {
          tokenRecord.isActive = false;
          await tokenRecord.save();
        }
      }
      console.log(`Deactivated ${result.expiredTokens.length} expired tokens for notification ${notification.id}`);
    }

    // Handle failed tokens
    if (result.failedTokens && result.failedTokens.length > 0) {
      for (const failedToken of result.failedTokens) {
        const tokenRecord = deviceTokens.find(t => t.deviceToken === failedToken.token);
        if (tokenRecord) {
          await tokenRecord.recordDeliveryFailure();
        }
      }
    }

    // Create audit record for multicast failures
    if (result.failureCount > 0) {
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: notification.recipientId,
        event: 'PARTIAL_FAILURE',
        metadata: {
          deliveryMethod: 'PUSH_MULTICAST',
          failureCount: result.failureCount,
          expiredTokenCount: result.expiredTokens?.length || 0,
          failedTokenCount: result.failedTokens?.length || 0
        }
      });
    }
  }

  /**
   * Get FCM service health status
   * GET /api/notifications/health
   */
  async getServiceHealth(req, res) {
    try {
      const healthStatus = await FCMService.getHealthStatus();
      
      res.json({
        success: true,
        ...healthStatus
      });

    } catch (error) {
      console.error('Error getting service health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service health',
        details: error.message
      });
    }
  }

  /**
   * Get worker device tokens
   * GET /api/notifications/devices
   */
  async getWorkerDevices(req, res) {
    try {
      const workerId = req.user.id;
      const devices = await FCMService.getWorkerDeviceTokens(workerId);
      
      res.json({
        success: true,
        devices,
        count: devices.length
      });

    } catch (error) {
      console.error('Error getting worker devices:', error);
      res.status(500).json({
        error: 'Failed to get worker devices',
        details: error.message
      });
    }
  }

  /**
   * Deactivate a device token
   * DELETE /api/notifications/devices/:token
   */
  async deactivateDevice(req, res) {
    try {
      const { token } = req.params;
      const workerId = req.user.id;

      // Verify the token belongs to the requesting worker
      const deviceToken = await DeviceToken.findByToken(token);
      if (!deviceToken || deviceToken.workerId !== workerId) {
        return res.status(404).json({
          error: 'Device token not found or access denied'
        });
      }

      const result = await FCMService.deactivateDeviceToken(token);
      
      res.json(result);

    } catch (error) {
      console.error('Error deactivating device:', error);
      res.status(500).json({
        error: 'Failed to deactivate device',
        details: error.message
      });
    }
  }

  /**
   * Synchronize notification status updates from offline queue
   * POST /api/notifications/sync/status
   * Implements Requirements 8.5 - Read receipt and status synchronization with conflict resolution
   */
  async synchronizeStatusUpdates(req, res) {
    try {
      const workerId = req.user.id;
      const { statusUpdates, lastSyncTimestamp } = req.body;

      if (!Array.isArray(statusUpdates)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'statusUpdates must be an array'
        });
      }

      // Validate status updates
      const validationErrors = this.validateStatusUpdates(statusUpdates);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid status updates',
          errors: validationErrors
        });
      }

      // Perform synchronization
      const syncResults = await NotificationSyncService.synchronizeStatusUpdates(workerId, statusUpdates);

      // Get updated notifications for client
      const updatedNotifications = await this.getUpdatedNotificationsForSync(
        workerId, 
        lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0)
      );

      res.json({
        success: true,
        message: 'Status synchronization completed',
        syncResults,
        updatedNotifications,
        serverTimestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error synchronizing status updates:', error);
      res.status(500).json({
        success: false,
        error: 'SYNC_ERROR',
        message: 'Failed to synchronize status updates',
        details: error.message
      });
    }
  }

  /**
   * Synchronize read receipts from offline queue
   * POST /api/notifications/sync/read-receipts
   * Implements Requirements 8.5 - Read receipt synchronization
   */
  async synchronizeReadReceipts(req, res) {
    try {
      const workerId = req.user.id;
      const { readReceipts } = req.body;

      if (!Array.isArray(readReceipts)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'readReceipts must be an array'
        });
      }

      // Validate read receipts
      const validationErrors = this.validateReadReceipts(readReceipts);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid read receipts',
          errors: validationErrors
        });
      }

      // Perform synchronization
      const syncResults = await NotificationSyncService.synchronizeReadReceipts(workerId, readReceipts);

      res.json({
        success: true,
        message: 'Read receipt synchronization completed',
        syncResults,
        serverTimestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error synchronizing read receipts:', error);
      res.status(500).json({
        success: false,
        error: 'SYNC_ERROR',
        message: 'Failed to synchronize read receipts',
        details: error.message
      });
    }
  }

  /**
   * Get notifications updated since last sync
   * GET /api/notifications/sync/updates
   * Implements Requirements 8.5 - Notification synchronization
   */
  async getNotificationUpdates(req, res) {
    try {
      const workerId = req.user.id;
      const { lastSyncTimestamp } = req.query;

      if (!lastSyncTimestamp) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_PARAMETER',
          message: 'lastSyncTimestamp is required'
        });
      }

      const lastSync = new Date(lastSyncTimestamp);
      if (isNaN(lastSync.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_TIMESTAMP',
          message: 'Invalid lastSyncTimestamp format'
        });
      }

      // Get notifications that changed since last sync
      const updatedNotifications = await NotificationSyncService.getNotificationsForSync(workerId, lastSync);

      res.json({
        success: true,
        notifications: updatedNotifications,
        count: updatedNotifications.length,
        serverTimestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting notification updates:', error);
      res.status(500).json({
        success: false,
        error: 'SYNC_ERROR',
        message: 'Failed to get notification updates',
        details: error.message
      });
    }
  }

  /**
   * Validate status updates array
   * @param {Array} statusUpdates - Array of status update objects
   * @returns {Array} Array of validation errors
   */
  validateStatusUpdates(statusUpdates) {
    const errors = [];

    statusUpdates.forEach((update, index) => {
      if (!update.notificationId || typeof update.notificationId !== 'number') {
        errors.push(`Update ${index}: notificationId is required and must be a number`);
      }

      if (!update.status || typeof update.status !== 'string') {
        errors.push(`Update ${index}: status is required and must be a string`);
      }

      if (!update.timestamp) {
        errors.push(`Update ${index}: timestamp is required`);
      } else {
        const timestamp = new Date(update.timestamp);
        if (isNaN(timestamp.getTime())) {
          errors.push(`Update ${index}: invalid timestamp format`);
        }
      }

      if (!update.updateType || !['READ', 'ACKNOWLEDGED', 'STATUS_CHANGE'].includes(update.updateType)) {
        errors.push(`Update ${index}: updateType must be one of: READ, ACKNOWLEDGED, STATUS_CHANGE`);
      }
    });

    return errors;
  }

  /**
   * Validate read receipts array
   * @param {Array} readReceipts - Array of read receipt objects
   * @returns {Array} Array of validation errors
   */
  validateReadReceipts(readReceipts) {
    const errors = [];

    readReceipts.forEach((receipt, index) => {
      if (!receipt.notificationId || typeof receipt.notificationId !== 'number') {
        errors.push(`Receipt ${index}: notificationId is required and must be a number`);
      }

      if (!receipt.readAt) {
        errors.push(`Receipt ${index}: readAt timestamp is required`);
      } else {
        const readAt = new Date(receipt.readAt);
        if (isNaN(readAt.getTime())) {
          errors.push(`Receipt ${index}: invalid readAt timestamp format`);
        }
      }
    });

    return errors;
  }

  /**
   * Get escalation statistics
   * GET /api/notifications/escalation/stats
   */
  async getEscalationStats(req, res) {
    try {
      const { days = 7 } = req.query;
      
      // Import escalation service
      const NotificationEscalationService = (await import('./services/NotificationEscalationService.js')).default;
      
      const stats = await NotificationEscalationService.getEscalationStats(parseInt(days));

      res.json({
        success: true,
        ...stats
      });

    } catch (error) {
      console.error('Error fetching escalation stats:', error);
      res.status(500).json({
        error: 'Failed to fetch escalation statistics',
        details: error.message
      });
    }
  }

  /**
   * Trigger manual escalation check
   * POST /api/notifications/escalation/trigger
   */
  async triggerEscalationCheck(req, res) {
    try {
      // Import escalation service
      const NotificationEscalationService = (await import('./services/NotificationEscalationService.js')).default;
      
      const results = await NotificationEscalationService.triggerEscalationCheck();

      res.json({
        success: true,
        message: 'Escalation check completed',
        ...results
      });

    } catch (error) {
      console.error('Error triggering escalation check:', error);
      res.status(500).json({
        error: 'Failed to trigger escalation check',
        details: error.message
      });
    }
  }

  /**
   * Force escalation of a specific notification
   * POST /api/notifications/escalation/force/:id
   */
  async forceEscalateNotification(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (!notificationId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_NOTIFICATION_ID',
          message: 'Valid notification ID is required'
        });
      }

      // Import escalation service
      const NotificationEscalationService = (await import('./services/NotificationEscalationService.js')).default;
      
      const result = await NotificationEscalationService.forceEscalateNotification(notificationId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Notification escalated successfully',
          notificationId: result.notificationId
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'ESCALATION_FAILED',
          message: result.error,
          notificationId: result.notificationId
        });
      }

    } catch (error) {
      console.error('Error force escalating notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to force escalate notification',
        details: error.message
      });
    }
  }

  /**
   * Get escalation service status
   * GET /api/notifications/escalation/status
   */
  async getEscalationServiceStatus(req, res) {
    try {
      // Import escalation service
      const NotificationEscalationService = (await import('./services/NotificationEscalationService.js')).default;
      
      const config = NotificationEscalationService.getConfiguration();
      const isRunning = NotificationEscalationService.isServiceRunning();

      res.json({
        success: true,
        isRunning,
        configuration: config,
        status: isRunning ? 'ACTIVE' : 'STOPPED'
      });

    } catch (error) {
      console.error('Error getting escalation service status:', error);
      res.status(500).json({
        error: 'Failed to get escalation service status',
        details: error.message
      });
    }
  }

  /**
   * Get updated notifications for synchronization response
   * @param {number} workerId - Worker ID
   * @param {Date} lastSyncTimestamp - Last sync timestamp
   * @returns {Promise<Array>} Updated notifications
   */
  async getUpdatedNotificationsForSync(workerId, lastSyncTimestamp) {
    try {
      const notifications = await WorkerNotification.find({
        recipientId: workerId,
        updatedAt: { $gt: lastSyncTimestamp }
      })
      .sort({ updatedAt: 1 })
      .limit(50);

      return notifications.map(notification => ({
        id: notification.id,
        status: notification.status,
        readAt: notification.readAt,
        acknowledgedAt: notification.acknowledgedAt,
        updatedAt: notification.updatedAt,
        version: notification.__v
      }));

    } catch (error) {
      console.error('Error getting updated notifications for sync:', error);
      return [];
    }
  }

  /**
   * Get performance metrics and system status
   * GET /api/notifications/performance/metrics
   * Implements Requirements 11.1, 11.2, 11.3, 11.4 (performance monitoring)
   */
  async getPerformanceMetrics(req, res) {
    try {
      const { hours = 24 } = req.query;
      
      // Check permissions - only admins and supervisors can access performance metrics
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access performance metrics'
        });
      }

      const metrics = PerformanceMonitoringService.getMetrics();
      const stats = await PerformanceMonitoringService.getPerformanceStats(parseInt(hours));

      res.json({
        success: true,
        currentMetrics: metrics,
        statistics: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'PERFORMANCE_METRICS_ERROR',
        message: 'Failed to get performance metrics',
        details: error.message
      });
    }
  }

  /**
   * Get system load status
   * GET /api/notifications/performance/load
   * Implements Requirement 11.3 (system load monitoring for 1000+ concurrent workers)
   */
  async getSystemLoad(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access system load metrics'
        });
      }

      const metrics = PerformanceMonitoringService.getMetrics();
      const systemLoad = metrics.systemLoad;

      // Add additional load calculations
      const loadAnalysis = {
        ...systemLoad,
        capacityUtilization: Math.round((systemLoad.activeWorkers / 1000) * 100),
        recommendedAction: this.getLoadRecommendation(systemLoad),
        thresholds: {
          warning: 800, // 80% of 1000 worker capacity
          critical: 950, // 95% of 1000 worker capacity
          maxCapacity: 1000
        }
      };

      res.json({
        success: true,
        systemLoad: loadAnalysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting system load:', error);
      res.status(500).json({
        success: false,
        error: 'SYSTEM_LOAD_ERROR',
        message: 'Failed to get system load metrics',
        details: error.message
      });
    }
  }

  /**
   * Get uptime statistics
   * GET /api/notifications/performance/uptime
   * Implements Requirement 11.4 (uptime monitoring for business hours)
   */
  async getUptimeStats(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access uptime statistics'
        });
      }

      const { days = 7 } = req.query;
      const metrics = PerformanceMonitoringService.getMetrics();
      
      // Get detailed uptime statistics
      const uptimeStats = await this.getDetailedUptimeStats(parseInt(days));
      
      res.json({
        success: true,
        uptime: {
          current: metrics.uptime,
          detailed: uptimeStats,
          businessHours: {
            start: '07:00 SGT',
            end: '19:00 SGT',
            timezone: 'Asia/Singapore',
            days: 'Monday - Saturday'
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting uptime stats:', error);
      res.status(500).json({
        success: false,
        error: 'UPTIME_STATS_ERROR',
        message: 'Failed to get uptime statistics',
        details: error.message
      });
    }
  }

  /**
   * Get delivery time analytics
   * GET /api/notifications/performance/delivery-times
   * Implements Requirement 11.1 (notification delivery time tracking)
   */
  async getDeliveryTimeAnalytics(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access delivery analytics'
        });
      }

      const { hours = 24, priority, type } = req.query;
      const hoursInt = parseInt(hours);
      
      // Build query filters
      const startTime = new Date(Date.now() - hoursInt * 60 * 60 * 1000);
      const matchFilters = {
        event: 'PERFORMANCE_METRIC',
        'metadata.metricType': 'DELIVERY_TIME',
        timestamp: { $gte: startTime }
      };

      // Add optional filters
      if (priority) {
        matchFilters['metadata.priority'] = priority;
      }
      if (type) {
        matchFilters['metadata.notificationType'] = type;
      }

      // Get delivery time analytics
      const analytics = await NotificationAudit.aggregate([
        { $match: matchFilters },
        {
          $group: {
            _id: {
              hour: { $hour: '$timestamp' },
              priority: '$metadata.priority'
            },
            avgDeliveryTime: { $avg: '$metadata.deliveryDuration' },
            minDeliveryTime: { $min: '$metadata.deliveryDuration' },
            maxDeliveryTime: { $max: '$metadata.deliveryDuration' },
            totalDeliveries: { $sum: 1 },
            successfulDeliveries: {
              $sum: { $cond: ['$metadata.deliverySuccess', 1, 0] }
            }
          }
        },
        {
          $group: {
            _id: '$_id.priority',
            hourlyStats: {
              $push: {
                hour: '$_id.hour',
                avgTime: '$avgDeliveryTime',
                minTime: '$minDeliveryTime',
                maxTime: '$maxDeliveryTime',
                count: '$totalDeliveries',
                successRate: {
                  $multiply: [
                    { $divide: ['$successfulDeliveries', '$totalDeliveries'] },
                    100
                  ]
                }
              }
            },
            overallAvg: { $avg: '$avgDeliveryTime' },
            totalDeliveries: { $sum: '$totalDeliveries' }
          }
        }
      ]);

      // Get SLA compliance
      const slaCompliance = await this.calculateSLACompliance(startTime);

      res.json({
        success: true,
        period: `${hoursInt} hours`,
        analytics: analytics.map(stat => ({
          priority: stat._id,
          overallAverage: Math.round(stat.overallAvg),
          totalDeliveries: stat.totalDeliveries,
          hourlyBreakdown: stat.hourlyStats
        })),
        slaCompliance,
        requirements: {
          critical: '30 seconds',
          high: '2 minutes',
          normal: '5 minutes',
          low: '10 minutes'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting delivery time analytics:', error);
      res.status(500).json({
        success: false,
        error: 'DELIVERY_ANALYTICS_ERROR',
        message: 'Failed to get delivery time analytics',
        details: error.message
      });
    }
  }

  /**
   * Trigger performance optimization
   * POST /api/notifications/performance/optimize
   * Implements performance optimization based on current metrics
   */
  async triggerPerformanceOptimization(req, res) {
    try {
      // Check permissions - only admins can trigger optimization
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Only administrators can trigger performance optimization'
        });
      }

      const optimizationResult = await PerformanceMonitoringService.optimizePerformance();

      res.json({
        success: optimizationResult.success,
        message: 'Performance optimization completed',
        results: optimizationResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error triggering performance optimization:', error);
      res.status(500).json({
        success: false,
        error: 'OPTIMIZATION_ERROR',
        message: 'Failed to trigger performance optimization',
        details: error.message
      });
    }
  }

  /**
   * Get performance alerts
   * GET /api/notifications/performance/alerts
   * Get recent performance alerts and system warnings
   */
  async getPerformanceAlerts(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access performance alerts'
        });
      }

      const { hours = 24, severity } = req.query;
      const startTime = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

      // Build query
      const query = {
        event: 'PERFORMANCE_ALERT',
        timestamp: { $gte: startTime }
      };

      if (severity) {
        query['metadata.severity'] = severity;
      }

      // Get alerts
      const alerts = await NotificationAudit.find(query)
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();

      // Group by alert type
      const alertSummary = await NotificationAudit.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              alertType: '$metadata.alertType',
              severity: '$metadata.severity'
            },
            count: { $sum: 1 },
            latestAlert: { $max: '$timestamp' }
          }
        },
        {
          $sort: { latestAlert: -1 }
        }
      ]);

      res.json({
        success: true,
        alerts: alerts.map(alert => ({
          id: alert._id,
          type: alert.metadata.alertType,
          severity: alert.metadata.severity,
          data: alert.metadata.alertData,
          timestamp: alert.timestamp
        })),
        summary: alertSummary.map(summary => ({
          type: summary._id.alertType,
          severity: summary._id.severity,
          count: summary.count,
          latestAlert: summary.latestAlert
        })),
        period: `${hours} hours`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting performance alerts:', error);
      res.status(500).json({
        success: false,
        error: 'PERFORMANCE_ALERTS_ERROR',
        message: 'Failed to get performance alerts',
        details: error.message
      });
    }
  }

  /**
   * Get load recommendation based on current system load
   * @param {Object} systemLoad - Current system load metrics
   * @returns {string} Recommended action
   */
  getLoadRecommendation(systemLoad) {
    const { activeWorkers, deliveryQueue, queueHealth } = systemLoad;

    if (activeWorkers > 950) {
      return 'CRITICAL: Scale up immediately - approaching maximum capacity';
    } else if (activeWorkers > 800) {
      return 'WARNING: Consider scaling up - high load detected';
    } else if (deliveryQueue > 200) {
      return 'WARNING: High delivery queue - check notification service health';
    } else if (queueHealth === 'CRITICAL') {
      return 'CRITICAL: Delivery queue critical - immediate attention required';
    } else if (queueHealth === 'WARNING') {
      return 'WARNING: Monitor delivery queue - potential bottleneck';
    } else {
      return 'HEALTHY: System operating within normal parameters';
    }
  }

  /**
   * Get detailed uptime statistics
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Detailed uptime statistics
   */
  async getDetailedUptimeStats(days) {
    try {
      const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const uptimeData = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'PERFORMANCE_METRIC',
            'metadata.metricType': 'UPTIME',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              businessHours: '$metadata.businessHours'
            },
            totalChecks: { $sum: 1 },
            healthyChecks: {
              $sum: { $cond: ['$metadata.healthy', 1, 0] }
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            businessHoursChecks: {
              $sum: { $cond: ['$_id.businessHours', '$totalChecks', 0] }
            },
            businessHoursHealthy: {
              $sum: { $cond: ['$_id.businessHours', '$healthyChecks', 0] }
            },
            totalChecks: { $sum: '$totalChecks' },
            totalHealthy: { $sum: '$healthyChecks' }
          }
        },
        {
          $project: {
            date: '$_id',
            businessHoursUptime: {
              $cond: [
                { $gt: ['$businessHoursChecks', 0] },
                { $multiply: [{ $divide: ['$businessHoursHealthy', '$businessHoursChecks'] }, 100] },
                100
              ]
            },
            overallUptime: {
              $cond: [
                { $gt: ['$totalChecks', 0] },
                { $multiply: [{ $divide: ['$totalHealthy', '$totalChecks'] }, 100] },
                100
              ]
            },
            businessHoursChecks: 1,
            totalChecks: 1
          }
        },
        {
          $sort: { date: 1 }
        }
      ]);

      return {
        dailyStats: uptimeData,
        period: `${days} days`,
        averageBusinessHoursUptime: uptimeData.length > 0 
          ? Math.round(uptimeData.reduce((sum, day) => sum + day.businessHoursUptime, 0) / uptimeData.length)
          : 100,
        averageOverallUptime: uptimeData.length > 0
          ? Math.round(uptimeData.reduce((sum, day) => sum + day.overallUptime, 0) / uptimeData.length)
          : 100
      };

    } catch (error) {
      console.error('Error getting detailed uptime stats:', error);
      return {
        dailyStats: [],
        period: `${days} days`,
        averageBusinessHoursUptime: 0,
        averageOverallUptime: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate SLA compliance based on delivery times
   * @param {Date} startTime - Start time for analysis
   * @returns {Promise<Object>} SLA compliance statistics
   */
  async calculateSLACompliance(startTime) {
    try {
      const slaThresholds = {
        CRITICAL: 30000, // 30 seconds
        HIGH: 120000,    // 2 minutes
        NORMAL: 300000,  // 5 minutes
        LOW: 600000      // 10 minutes
      };

      const complianceData = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'PERFORMANCE_METRIC',
            'metadata.metricType': 'DELIVERY_TIME',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$metadata.priority',
            totalDeliveries: { $sum: 1 },
            withinSLA: {
              $sum: {
                $cond: [
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$metadata.priority', 'CRITICAL'] }, then: { $lte: ['$metadata.deliveryDuration', slaThresholds.CRITICAL] } },
                        { case: { $eq: ['$metadata.priority', 'HIGH'] }, then: { $lte: ['$metadata.deliveryDuration', slaThresholds.HIGH] } },
                        { case: { $eq: ['$metadata.priority', 'NORMAL'] }, then: { $lte: ['$metadata.deliveryDuration', slaThresholds.NORMAL] } },
                        { case: { $eq: ['$metadata.priority', 'LOW'] }, then: { $lte: ['$metadata.deliveryDuration', slaThresholds.LOW] } }
                      ],
                      default: false
                    }
                  },
                  1,
                  0
                ]
              }
            },
            averageDeliveryTime: { $avg: '$metadata.deliveryDuration' }
          }
        },
        {
          $project: {
            priority: '$_id',
            totalDeliveries: 1,
            withinSLA: 1,
            compliancePercentage: {
              $multiply: [{ $divide: ['$withinSLA', '$totalDeliveries'] }, 100]
            },
            averageDeliveryTime: { $round: '$averageDeliveryTime' },
            slaThreshold: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 'CRITICAL'] }, then: slaThresholds.CRITICAL },
                  { case: { $eq: ['$_id', 'HIGH'] }, then: slaThresholds.HIGH },
                  { case: { $eq: ['$_id', 'NORMAL'] }, then: slaThresholds.NORMAL },
                  { case: { $eq: ['$_id', 'LOW'] }, then: slaThresholds.LOW }
                ],
                default: slaThresholds.NORMAL
              }
            }
          }
        }
      ]);

      return {
        byPriority: complianceData,
        overall: complianceData.length > 0 ? {
          totalDeliveries: complianceData.reduce((sum, p) => sum + p.totalDeliveries, 0),
          totalWithinSLA: complianceData.reduce((sum, p) => sum + p.withinSLA, 0),
          overallCompliance: Math.round(
            (complianceData.reduce((sum, p) => sum + p.withinSLA, 0) / 
             complianceData.reduce((sum, p) => sum + p.totalDeliveries, 0)) * 100
          )
        } : { totalDeliveries: 0, totalWithinSLA: 0, overallCompliance: 100 }
      };

    } catch (error) {
      console.error('Error calculating SLA compliance:', error);
      return {
        byPriority: [],
        overall: { totalDeliveries: 0, totalWithinSLA: 0, overallCompliance: 0 },
        error: error.message
      };
    }
  }

  /**
   * Get error handling system status and statistics
   * GET /api/notifications/error-handling/status
   * Implements Requirements 12.4: Detailed error logging and admin alerts
   */
  async getErrorHandlingStatus(req, res) {
    try {
      // Check permissions - only admins and supervisors can access error handling status
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access error handling status'
        });
      }

      // Import error handling service
      const ErrorHandlingService = (await import('./services/ErrorHandlingService.js')).default;
      
      const { hours = 24 } = req.query;
      
      // Get comprehensive error statistics
      const errorStats = await ErrorHandlingService.getErrorStatistics(parseInt(hours));
      const healthSummary = ErrorHandlingService.getHealthSummary();

      res.json({
        success: true,
        errorHandling: {
          healthSummary,
          statistics: errorStats,
          period: `${hours} hours`
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting error handling status:', error);
      res.status(500).json({
        success: false,
        error: 'ERROR_HANDLING_STATUS_ERROR',
        message: 'Failed to get error handling status',
        details: error.message
      });
    }
  }

  /**
   * Get circuit breaker statuses for all services
   * GET /api/notifications/error-handling/circuit-breakers
   * Implements Requirement 12.1: Circuit breaker pattern monitoring
   */
  async getCircuitBreakerStatus(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access circuit breaker status'
        });
      }

      // Import error handling service
      const ErrorHandlingService = (await import('./services/ErrorHandlingService.js')).default;
      
      const circuitBreakers = ErrorHandlingService.getAllCircuitBreakerStatuses();

      res.json({
        success: true,
        ...circuitBreakers
      });

    } catch (error) {
      console.error('Error getting circuit breaker status:', error);
      res.status(500).json({
        success: false,
        error: 'CIRCUIT_BREAKER_STATUS_ERROR',
        message: 'Failed to get circuit breaker status',
        details: error.message
      });
    }
  }

  /**
   * Reset circuit breaker for a specific service
   * POST /api/notifications/error-handling/circuit-breakers/:serviceName/reset
   * Implements admin control over circuit breakers
   */
  async resetCircuitBreaker(req, res) {
    try {
      // Check permissions - only admins can reset circuit breakers
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Only administrators can reset circuit breakers'
        });
      }

      const { serviceName } = req.params;
      
      if (!serviceName) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SERVICE_NAME',
          message: 'Service name is required'
        });
      }

      // Import error handling service
      const ErrorHandlingService = (await import('./services/ErrorHandlingService.js')).default;
      
      const resetSuccess = ErrorHandlingService.resetCircuitBreaker(serviceName.toUpperCase());

      if (resetSuccess) {
        res.json({
          success: true,
          message: `Circuit breaker for ${serviceName} has been reset`,
          serviceName,
          resetBy: req.user.id,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'SERVICE_NOT_FOUND',
          message: `Circuit breaker for service '${serviceName}' not found`
        });
      }

    } catch (error) {
      console.error('Error resetting circuit breaker:', error);
      res.status(500).json({
        success: false,
        error: 'CIRCUIT_BREAKER_RESET_ERROR',
        message: 'Failed to reset circuit breaker',
        details: error.message
      });
    }
  }

  /**
   * Get admin alerts
   * GET /api/notifications/error-handling/admin-alerts
   * Implements Requirements 12.4: Admin alerts system
   */
  async getAdminAlerts(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to access admin alerts'
        });
      }

      const { limit = 50, severity } = req.query;

      // Import error handling service
      const ErrorHandlingService = (await import('./services/ErrorHandlingService.js')).default;
      
      let alerts = ErrorHandlingService.getRecentAdminAlerts(parseInt(limit));

      // Filter by severity if specified
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity.toUpperCase());
      }

      const summary = {
        total: alerts.length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length,
        bySeverity: {
          critical: alerts.filter(a => a.severity === 'CRITICAL').length,
          high: alerts.filter(a => a.severity === 'HIGH').length,
          medium: alerts.filter(a => a.severity === 'MEDIUM').length,
          low: alerts.filter(a => a.severity === 'LOW').length
        }
      };

      res.json({
        success: true,
        alerts,
        summary,
        filters: {
          limit: parseInt(limit),
          severity: severity || 'all'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting admin alerts:', error);
      res.status(500).json({
        success: false,
        error: 'ADMIN_ALERTS_ERROR',
        message: 'Failed to get admin alerts',
        details: error.message
      });
    }
  }

  /**
   * Acknowledge admin alert
   * PUT /api/notifications/error-handling/admin-alerts/:alertId/acknowledge
   * Implements alert acknowledgment system
   */
  async acknowledgeAdminAlert(req, res) {
    try {
      // Check permissions
      if (!['admin', 'supervisor', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Insufficient permissions to acknowledge admin alerts'
        });
      }

      const { alertId } = req.params;
      
      if (!alertId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_ALERT_ID',
          message: 'Alert ID is required'
        });
      }

      // Import error handling service
      const ErrorHandlingService = (await import('./services/ErrorHandlingService.js')).default;
      
      const acknowledged = ErrorHandlingService.acknowledgeAdminAlert(alertId);

      if (acknowledged) {
        res.json({
          success: true,
          message: 'Admin alert acknowledged successfully',
          alertId,
          acknowledgedBy: req.user.id,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'ALERT_NOT_FOUND',
          message: `Admin alert with ID '${alertId}' not found`
        });
      }

    } catch (error) {
      console.error('Error acknowledging admin alert:', error);
      res.status(500).json({
        success: false,
        error: 'ACKNOWLEDGE_ALERT_ERROR',
        message: 'Failed to acknowledge admin alert',
        details: error.message
      });
    }
  }
}

export default new NotificationController();