import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';
import DeviceToken from '../models/DeviceToken.js';
import FCMService from './FirebaseService.js';
import appConfig from '../../../config/app.config.js';

/**
 * NotificationService
 * Core service for notification management, creation, validation, and delivery
 * Implements requirements 1.1, 1.2, 1.3, 5.1
 */
class NotificationService {
  constructor() {
    this.fcmService = FCMService;
    this.config = appConfig.notification;
  }

  /**
   * Create a new notification with priority classification and validation
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {number} notificationData.senderId - Sender user ID
   * @param {number|number[]} notificationData.recipients - Recipient worker ID(s)
   * @param {Object} notificationData.actionData - Action data for notification
   * @param {string} notificationData.language - Language preference
   * @param {Date} notificationData.expiresAt - Expiration date
   * @param {boolean} notificationData.requiresAcknowledgment - Requires acknowledgment
   * @returns {Promise<Object>} Creation result with notifications and audit records
   */
  async createNotification(notificationData) {
    try {
      // Validate input data
      const validationResult = this.validateNotificationData(notificationData);
      if (!validationResult.isValid) {
        throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Normalize recipients to array
      const recipients = Array.isArray(notificationData.recipients) 
        ? notificationData.recipients 
        : [notificationData.recipients];

      // Classify priority based on type and content
      const priority = this.classifyPriority(notificationData);

      // Format and validate content
      const formattedContent = this.formatNotificationContent(
        notificationData.title,
        notificationData.message,
        notificationData.language || 'en'
      );

      const notifications = [];
      const auditRecords = [];
      const skippedRecipients = [];

      // Create notification for each recipient
      for (const recipientId of recipients) {
        // Check daily notification limit (except for critical notifications)
        // Implements Requirement 5.5 (daily notification limits)
        if (priority !== 'CRITICAL') {
          const dailyCount = await WorkerNotification.countDailyNotifications(recipientId);
          if (dailyCount >= this.config.dailyLimit) {
            skippedRecipients.push({
              recipientId,
              reason: 'DAILY_LIMIT_EXCEEDED',
              dailyCount,
              dailyLimit: this.config.dailyLimit
            });
            
            // Create audit record for limit enforcement
            await NotificationAudit.createAuditRecord({
              notificationId: 0, // Use 0 for system events without specific notification
              workerId: recipientId,
              event: 'FAILED',
              metadata: {
                reason: 'DAILY_LIMIT_EXCEEDED',
                dailyCount,
                dailyLimit: this.config.dailyLimit,
                notificationType: notificationData.type,
                priority: priority
              }
            });
            
            console.log(`Daily notification limit exceeded for worker ${recipientId}: ${dailyCount}/${this.config.dailyLimit}`);
            continue;
          }
        }

        // Create notification instance
        const notification = new WorkerNotification({
          type: notificationData.type,
          priority,
          title: formattedContent.title,
          message: formattedContent.message,
          senderId: notificationData.senderId,
          recipientId,
          actionData: notificationData.actionData || {},
          expiresAt: notificationData.expiresAt ? new Date(notificationData.expiresAt) : null,
          requiresAcknowledgment: notificationData.requiresAcknowledgment || false,
          language: notificationData.language || 'en',
          status: 'SENT' // Set to SENT for immediate delivery simulation
        });

        await notification.save();
        notifications.push(notification);

        // Create audit record for notification creation
        const auditRecord = await NotificationAudit.createAuditRecord({
          notificationId: notification.id,
          workerId: recipientId,
          event: 'CREATED',
          metadata: {
            originalPriority: notificationData.priority || 'AUTO_CLASSIFIED',
            classifiedPriority: priority,
            contentLength: {
              title: formattedContent.title.length,
              message: formattedContent.message.length
            }
          }
        });
        auditRecords.push(auditRecord);
      }

      return {
        success: true,
        created: notifications.length,
        skipped: skippedRecipients.length,
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          priority: n.priority,
          recipientId: n.recipientId,
          status: n.status,
          createdAt: n.createdAt,
          expiresAt: n.expiresAt
        })),
        skippedRecipients,
        auditRecords: auditRecords.map(a => a.id)
      };

    } catch (error) {
      console.error('Error in NotificationService.createNotification:', error);
      throw error;
    }
  }

  /**
   * Validate notification data according to requirements
   * @param {Object} data - Notification data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateNotificationData(data) {
    const errors = [];

    // Required fields validation
    if (!data.type) {
      errors.push('Notification type is required');
    } else if (!['TASK_UPDATE', 'SITE_CHANGE', 'ATTENDANCE_ALERT', 'APPROVAL_STATUS'].includes(data.type)) {
      errors.push('Invalid notification type');
    }

    if (!data.title || typeof data.title !== 'string') {
      errors.push('Notification title is required and must be a string');
    } else if (data.title.trim().length === 0) {
      errors.push('Notification title cannot be empty');
    } else if (data.title.length > 100) {
      errors.push('Notification title cannot exceed 100 characters');
    }

    if (!data.message || typeof data.message !== 'string') {
      errors.push('Notification message is required and must be a string');
    } else if (data.message.trim().length === 0) {
      errors.push('Notification message cannot be empty');
    } else if (data.message.length > 500) {
      errors.push('Notification message cannot exceed 500 characters');
    }

    if (!data.senderId || typeof data.senderId !== 'number') {
      errors.push('Sender ID is required and must be a number');
    }

    if (!data.recipients) {
      errors.push('Recipients are required');
    } else {
      const recipients = Array.isArray(data.recipients) ? data.recipients : [data.recipients];
      if (recipients.length === 0) {
        errors.push('At least one recipient is required');
      } else if (!recipients.every(id => typeof id === 'number' && id > 0)) {
        errors.push('All recipient IDs must be positive numbers');
      }
    }

    // Content completeness validation based on type (Requirement 1.5, 2.1, 2.2, 2.3, 4.4, 4.5)
    const contentValidation = this.validateContentCompleteness(data.type, data.actionData);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
    }

    // Language validation
    if (data.language && !['en', 'zh', 'ms', 'ta'].includes(data.language)) {
      errors.push('Invalid language code. Supported: en, zh, ms, ta');
    }

    // Expiration date validation
    if (data.expiresAt) {
      const expirationDate = new Date(data.expiresAt);
      if (isNaN(expirationDate.getTime())) {
        errors.push('Invalid expiration date format');
      } else if (expirationDate <= new Date()) {
        errors.push('Expiration date must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate content completeness based on notification type
   * Implements requirement for type-specific required fields
   * @param {string} type - Notification type
   * @param {Object} actionData - Action data to validate
   * @returns {Object} Validation result
   */
  validateContentCompleteness(type, actionData = {}) {
    const errors = [];

    switch (type) {
      case 'TASK_UPDATE':
        // Task notifications must include task ID, location, and supervisor contact
        // Exception: Overtime instructions may not have a specific taskId
        if (!actionData.taskId && !actionData.overtimeDetails) {
          errors.push('Task notifications must include taskId in actionData');
        }
        if (!actionData.projectId) {
          errors.push('Task notifications must include projectId in actionData');
        }
        if (!actionData.supervisorContact) {
          errors.push('Task notifications must include supervisorContact in actionData');
        }
        break;

      case 'SITE_CHANGE':
        // Site change notifications must include GPS coordinates and new location details
        if (!actionData.newLocation) {
          errors.push('Site change notifications must include newLocation in actionData');
        }
        if (!actionData.coordinates || !actionData.coordinates.latitude || !actionData.coordinates.longitude) {
          errors.push('Site change notifications must include GPS coordinates in actionData');
        }
        if (!actionData.supervisorContact) {
          errors.push('Site change notifications must include supervisorContact in actionData');
        }
        break;

      case 'ATTENDANCE_ALERT':
        // Attendance alerts must include location details and timing information
        if (!actionData.alertType) {
          errors.push('Attendance alerts must include alertType in actionData');
        }
        if (!actionData.timestamp) {
          errors.push('Attendance alerts must include timestamp in actionData');
        }
        if (actionData.alertType === 'GEOFENCE_VIOLATION' && !actionData.currentLocation) {
          errors.push('Geofence violation alerts must include currentLocation in actionData');
        }
        break;

      case 'APPROVAL_STATUS':
        // Approval notifications must include reference numbers and next steps
        if (!actionData.referenceNumber) {
          errors.push('Approval status notifications must include referenceNumber in actionData');
        }
        if (!actionData.approvalType) {
          errors.push('Approval status notifications must include approvalType in actionData');
        }
        if (!actionData.status) {
          errors.push('Approval status notifications must include status in actionData');
        }
        if (actionData.status === 'APPROVED' && !actionData.nextSteps) {
          errors.push('Approved notifications must include nextSteps in actionData');
        }
        break;

      default:
        errors.push(`Unknown notification type: ${type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Classify notification priority based on type and content
   * Implements automatic priority classification (Requirement 5.1)
   * @param {Object} data - Notification data
   * @returns {string} Priority level (CRITICAL, HIGH, NORMAL, LOW)
   */
  classifyPriority(data) {
    // If priority is explicitly set and valid, use it
    if (data.priority && ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'].includes(data.priority)) {
      return data.priority;
    }

    // Auto-classify based on type and content
    switch (data.type) {
      case 'SITE_CHANGE':
        // Site changes are always critical due to safety implications
        return 'CRITICAL';

      case 'ATTENDANCE_ALERT':
        // Geofence violations and missed login/logout are high priority
        if (data.actionData?.alertType === 'GEOFENCE_VIOLATION' || 
            data.actionData?.alertType === 'MISSED_LOGIN' ||
            data.actionData?.alertType === 'MISSED_LOGOUT') {
          return 'HIGH';
        }
        // Break reminders are normal priority
        return 'NORMAL';

      case 'TASK_UPDATE':
        // Overtime instructions and urgent task changes are high priority
        if (data.message?.toLowerCase().includes('overtime') ||
            data.message?.toLowerCase().includes('urgent') ||
            data.message?.toLowerCase().includes('emergency')) {
          return 'HIGH';
        }
        // Regular task updates are normal priority
        return 'NORMAL';

      case 'APPROVAL_STATUS':
        // Rejected approvals are high priority for immediate attention
        if (data.actionData?.status === 'REJECTED') {
          return 'HIGH';
        }
        // Approved requests are normal priority
        return 'NORMAL';

      default:
        return 'NORMAL';
    }
  }

  /**
   * Format and validate notification content
   * Implements content formatting and length validation
   * @param {string} title - Original title
   * @param {string} message - Original message
   * @param {string} language - Language code
   * @returns {Object} Formatted content
   */
  formatNotificationContent(title, message, language = 'en') {
    // Trim and enforce length limits
    const formattedTitle = title.trim().substring(0, 100);
    const formattedMessage = message.trim().substring(0, 500);

    // Basic localization support (can be extended)
    const localizedContent = this.localizeContent(formattedTitle, formattedMessage, language);

    return {
      title: localizedContent.title,
      message: localizedContent.message,
      language
    };
  }

  /**
   * Basic content localization
   * @param {string} title - Title to localize
   * @param {string} message - Message to localize
   * @param {string} language - Target language
   * @returns {Object} Localized content
   */
  localizeContent(title, message, language) {
    // For now, return as-is. In production, this would integrate with translation service
    // This is a placeholder for future localization implementation
    return {
      title,
      message
    };
  }

  /**
   * Get notification statistics for a worker
   * @param {number} workerId - Worker ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} Notification statistics
   */
  async getNotificationStats(workerId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await WorkerNotification.aggregate([
        {
          $match: {
            recipientId: workerId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              status: '$status',
              type: '$type',
              priority: '$priority'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: '$count' },
            byStatus: {
              $push: {
                status: '$_id.status',
                count: '$count'
              }
            },
            byType: {
              $push: {
                type: '$_id.type',
                count: '$count'
              }
            },
            byPriority: {
              $push: {
                priority: '$_id.priority',
                count: '$count'
              }
            }
          }
        }
      ]);

      const unreadCount = await WorkerNotification.countDocuments({
        recipientId: workerId,
        status: { $in: ['SENT', 'DELIVERED'] }
      });

      const todayCount = await WorkerNotification.countDailyNotifications(workerId);

      return {
        success: true,
        stats: stats[0] || {
          totalNotifications: 0,
          byStatus: [],
          byType: [],
          byPriority: []
        },
        unreadCount,
        todayCount,
        dailyLimit: this.config.dailyLimit,
        period: `${days} days`
      };

    } catch (error) {
      console.error('Error in NotificationService.getNotificationStats:', error);
      throw error;
    }
  }

  /**
   * Check if a worker can receive more notifications today
   * @param {number} workerId - Worker ID
   * @param {string} priority - Notification priority
   * @returns {Promise<Object>} Availability check result
   */
  async checkNotificationAvailability(workerId, priority = 'NORMAL') {
    try {
      const todayCount = await WorkerNotification.countDailyNotifications(workerId);
      const canReceive = priority === 'CRITICAL' || todayCount < this.config.dailyLimit;

      return {
        canReceive,
        todayCount,
        dailyLimit: this.config.dailyLimit,
        remainingToday: Math.max(0, this.config.dailyLimit - todayCount),
        priority
      };

    } catch (error) {
      console.error('Error in NotificationService.checkNotificationAvailability:', error);
      throw error;
    }
  }

  /**
   * Get daily notification limit statistics for multiple workers
   * @param {number[]} workerIds - Array of worker IDs
   * @returns {Promise<Object>} Daily limit statistics
   */
  async getDailyLimitStats(workerIds = []) {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get notification counts for today
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            ...(workerIds.length > 0 ? { recipientId: { $in: workerIds } } : {})
          }
        },
        {
          $group: {
            _id: '$recipientId',
            count: { $sum: 1 },
            criticalCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'CRITICAL'] }, 1, 0] }
            },
            highCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] }
            },
            normalCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'NORMAL'] }, 1, 0] }
            },
            lowCount: {
              $sum: { $cond: [{ $eq: ['$priority', 'LOW'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            workerId: '$_id',
            totalCount: '$count',
            criticalCount: 1,
            highCount: 1,
            normalCount: 1,
            lowCount: 1,
            isAtLimit: { $gte: ['$count', this.config.dailyLimit] },
            remainingToday: { 
              $max: [0, { $subtract: [this.config.dailyLimit, '$count'] }] 
            }
          }
        },
        {
          $sort: { totalCount: -1 }
        }
      ];

      const workerStats = await WorkerNotification.aggregate(pipeline);

      // Get overall statistics
      const totalNotificationsToday = await WorkerNotification.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const workersAtLimit = workerStats.filter(stat => stat.isAtLimit).length;
      const workersNearLimit = workerStats.filter(stat => 
        stat.totalCount >= this.config.dailyLimit * 0.8 && !stat.isAtLimit
      ).length;

      return {
        success: true,
        date: today.toISOString().split('T')[0],
        dailyLimit: this.config.dailyLimit,
        totalNotificationsToday,
        workersAtLimit,
        workersNearLimit,
        totalWorkersWithNotifications: workerStats.length,
        workerBreakdown: workerStats,
        summary: {
          averageNotificationsPerWorker: workerStats.length > 0 
            ? Math.round(totalNotificationsToday / workerStats.length * 100) / 100 
            : 0,
          limitUtilization: Math.round((totalNotificationsToday / (workerStats.length * this.config.dailyLimit)) * 100) || 0
        }
      };

    } catch (error) {
      console.error('Error in NotificationService.getDailyLimitStats:', error);
      throw error;
    }
  }

  /**
   * Check if daily limit enforcement is working correctly
   * @param {number} workerId - Worker ID to check
   * @returns {Promise<Object>} Limit enforcement status
   */
  async checkDailyLimitEnforcement(workerId) {
    try {
      const todayCount = await WorkerNotification.countDailyNotifications(workerId);
      const isAtLimit = todayCount >= this.config.dailyLimit;
      
      // Get recent limit violations (notifications that were blocked)
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const limitViolations = await NotificationAudit.countDocuments({
        workerId,
        event: 'FAILED',
        'metadata.reason': 'DAILY_LIMIT_EXCEEDED',
        timestamp: { $gte: startOfDay }
      });

      return {
        workerId,
        todayCount,
        dailyLimit: this.config.dailyLimit,
        isAtLimit,
        limitViolationsToday: limitViolations,
        canReceiveNormal: !isAtLimit,
        canReceiveCritical: true, // Critical notifications always bypass limits
        status: isAtLimit ? 'AT_LIMIT' : 'WITHIN_LIMIT'
      };

    } catch (error) {
      console.error('Error checking daily limit enforcement:', error);
      throw error;
    }
  }
}

export default new NotificationService();