import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';
import NotificationService from './NotificationService.js';
import appConfig from '../../../config/app.config.js';

/**
 * NotificationEscalationService
 * Handles escalation of critical notifications that remain unread after timeout
 * Implements Requirements 5.5, 6.2 (daily notification limits, critical notification escalation)
 */
class NotificationEscalationService {
  constructor() {
    this.config = appConfig.notification;
    this.escalationTimeoutMs = this.config.escalationTimeoutHours * 60 * 60 * 1000; // Convert hours to milliseconds
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the escalation monitoring service
   * Runs periodic checks for notifications that need escalation
   */
  start() {
    if (this.isRunning) {
      console.log('NotificationEscalationService is already running');
      return;
    }

    console.log('Starting NotificationEscalationService...');
    this.isRunning = true;

    // Run escalation check every 15 minutes
    this.intervalId = setInterval(() => {
      this.processEscalations().catch(error => {
        console.error('Error in escalation processing:', error);
      });
    }, 15 * 60 * 1000); // 15 minutes

    // Run initial check
    this.processEscalations().catch(error => {
      console.error('Error in initial escalation processing:', error);
    });

    console.log(`NotificationEscalationService started with ${this.config.escalationTimeoutHours}h timeout`);
  }

  /**
   * Stop the escalation monitoring service
   */
  stop() {
    if (!this.isRunning) {
      console.log('NotificationEscalationService is not running');
      return;
    }

    console.log('Stopping NotificationEscalationService...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('NotificationEscalationService stopped');
  }

  /**
   * Process all notifications that need escalation
   * Implements Requirement 6.2 (critical notification escalation after 2 hours)
   */
  async processEscalations() {
    try {
      console.log('Processing notification escalations...');

      // Find critical notifications that are unread and past escalation timeout
      const escalationCutoff = new Date(Date.now() - this.escalationTimeoutMs);
      
      const notificationsToEscalate = await WorkerNotification.find({
        priority: 'CRITICAL',
        status: { $in: ['SENT', 'DELIVERED'] }, // Only escalate delivered notifications that are unread
        createdAt: { $lt: escalationCutoff },
        // Ensure we haven't already escalated this notification
        $or: [
          { escalated: { $exists: false } },
          { escalated: false }
        ]
      });

      if (notificationsToEscalate.length === 0) {
        console.log('No notifications require escalation at this time');
        return { escalated: 0, errors: [] };
      }

      console.log(`Found ${notificationsToEscalate.length} notifications requiring escalation`);

      const results = {
        escalated: 0,
        errors: []
      };

      // Process each notification for escalation
      for (const notification of notificationsToEscalate) {
        try {
          await this.escalateNotification(notification);
          results.escalated++;
        } catch (error) {
          console.error(`Failed to escalate notification ${notification.id}:`, error);
          results.errors.push({
            notificationId: notification.id,
            error: error.message
          });
        }
      }

      console.log(`Escalation processing complete: ${results.escalated} escalated, ${results.errors.length} errors`);
      return results;

    } catch (error) {
      console.error('Error in processEscalations:', error);
      throw error;
    }
  }

  /**
   * Escalate a specific notification to supervisor
   * @param {Object} notification - Notification to escalate
   */
  async escalateNotification(notification) {
    try {
      // Get worker information to find supervisor
      const workerInfo = await this.getWorkerSupervisorInfo(notification.recipientId);
      
      if (!workerInfo.supervisorId) {
        console.warn(`No supervisor found for worker ${notification.recipientId}, skipping escalation`);
        
        // Mark as escalated but failed
        await this.markNotificationAsEscalated(notification, false, 'NO_SUPERVISOR');
        return;
      }

      // Create escalation notification for supervisor
      const escalationData = {
        type: 'ATTENDANCE_ALERT', // Escalations are treated as attendance alerts
        title: `ESCALATION: Unread Critical Notification`,
        message: `Worker ${workerInfo.workerName} has not read critical notification: "${notification.title}". Original message: ${notification.message}`,
        senderId: 1, // System sender
        recipients: [workerInfo.supervisorId],
        actionData: {
          originalNotificationId: notification.id,
          workerId: notification.recipientId,
          workerName: workerInfo.workerName,
          escalationType: 'UNREAD_CRITICAL',
          originalCreatedAt: notification.createdAt,
          hoursUnread: Math.floor((Date.now() - notification.createdAt.getTime()) / (1000 * 60 * 60))
        },
        requiresAcknowledgment: true,
        language: 'en'
      };

      // Create the escalation notification
      const escalationResult = await NotificationService.createNotification(escalationData);

      if (escalationResult.success && escalationResult.created > 0) {
        // Mark original notification as escalated
        await this.markNotificationAsEscalated(notification, true, 'ESCALATED_TO_SUPERVISOR');

        // Create audit record for escalation
        await NotificationAudit.createAuditRecord({
          notificationId: notification.id,
          workerId: notification.recipientId,
          event: 'ESCALATED',
          metadata: {
            escalatedTo: workerInfo.supervisorId,
            escalationNotificationId: escalationResult.notifications[0]?.id,
            hoursUnread: Math.floor((Date.now() - notification.createdAt.getTime()) / (1000 * 60 * 60)),
            escalationType: 'UNREAD_CRITICAL'
          }
        });

        console.log(`Successfully escalated notification ${notification.id} to supervisor ${workerInfo.supervisorId}`);
      } else {
        throw new Error('Failed to create escalation notification');
      }

    } catch (error) {
      console.error(`Error escalating notification ${notification.id}:`, error);
      
      // Mark as escalated but failed
      await this.markNotificationAsEscalated(notification, false, 'ESCALATION_FAILED');
      throw error;
    }
  }

  /**
   * Mark notification as escalated
   * @param {Object} notification - Notification to mark
   * @param {boolean} success - Whether escalation was successful
   * @param {string} reason - Reason for escalation status
   */
  async markNotificationAsEscalated(notification, success, reason) {
    try {
      notification.escalated = true;
      notification.escalatedAt = new Date();
      notification.escalationStatus = success ? 'SUCCESS' : 'FAILED';
      notification.escalationReason = reason;
      
      await notification.save();
    } catch (error) {
      console.error(`Error marking notification ${notification.id} as escalated:`, error);
    }
  }

  /**
   * Get worker and supervisor information
   * @param {number} workerId - Worker ID
   * @returns {Object} Worker and supervisor information
   */
  async getWorkerSupervisorInfo(workerId) {
    try {
      // This would need to be adapted based on your actual user/employee schema
      // For now, I'll create a basic implementation that you can customize
      
      // Import the necessary models
      const User = (await import('../../user/User.js')).default;
      const Employee = (await import('../../employee/Employee.js')).default;
      
      // Find the user
      const user = await User.findOne({ id: workerId });
      if (!user) {
        return { supervisorId: null, workerName: 'Unknown Worker' };
      }

      // Find the employee record
      const employee = await Employee.findOne({ userId: workerId });
      const workerName = employee?.fullName || user.username || 'Unknown Worker';

      // Find supervisor - this logic may need to be adapted based on your schema
      let supervisorId = null;
      
      if (employee?.supervisorId) {
        supervisorId = employee.supervisorId;
      } else if (user.companyId) {
        // Fallback: find a supervisor in the same company
        const supervisor = await User.findOne({
          companyId: user.companyId,
          role: { $in: ['supervisor', 'admin', 'company_admin'] }
        });
        supervisorId = supervisor?.id;
      }

      return {
        supervisorId,
        workerName,
        companyId: user.companyId
      };

    } catch (error) {
      console.error(`Error getting worker supervisor info for ${workerId}:`, error);
      return { supervisorId: null, workerName: 'Unknown Worker' };
    }
  }

  /**
   * Get escalation statistics
   * @param {number} days - Number of days to look back
   * @returns {Object} Escalation statistics
   */
  async getEscalationStats(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'ESCALATED',
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const totalEscalations = await NotificationAudit.countDocuments({
        event: 'ESCALATED',
        timestamp: { $gte: startDate }
      });

      const uniqueWorkers = await NotificationAudit.distinct('workerId', {
        event: 'ESCALATED',
        timestamp: { $gte: startDate }
      });

      return {
        totalEscalations,
        uniqueWorkersEscalated: uniqueWorkers.length,
        dailyBreakdown: stats,
        period: `${days} days`,
        escalationTimeoutHours: this.config.escalationTimeoutHours
      };

    } catch (error) {
      console.error('Error getting escalation stats:', error);
      throw error;
    }
  }

  /**
   * Manually trigger escalation check (for testing or admin use)
   * @returns {Object} Escalation results
   */
  async triggerEscalationCheck() {
    console.log('Manually triggering escalation check...');
    return await this.processEscalations();
  }

  /**
   * Force escalation of a specific notification (for testing)
   * @param {number} notificationId - Notification ID to escalate
   * @returns {Object} Escalation result
   */
  async forceEscalateNotification(notificationId) {
    try {
      const notification = await WorkerNotification.findOne({ id: notificationId });
      
      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      if (notification.escalated) {
        throw new Error(`Notification ${notificationId} has already been escalated`);
      }

      console.log(`Force escalating notification ${notificationId}...`);
      await this.escalateNotification(notification);
      
      return {
        success: true,
        notificationId,
        message: 'Notification escalated successfully'
      };

    } catch (error) {
      console.error(`Error force escalating notification ${notificationId}:`, error);
      return {
        success: false,
        notificationId,
        error: error.message
      };
    }
  }

  /**
   * Check if service is running
   * @returns {boolean} Service status
   */
  isServiceRunning() {
    return this.isRunning;
  }

  /**
   * Get service configuration
   * @returns {Object} Service configuration
   */
  getConfiguration() {
    return {
      escalationTimeoutHours: this.config.escalationTimeoutHours,
      checkIntervalMinutes: 15,
      isRunning: this.isRunning,
      dailyLimit: this.config.dailyLimit
    };
  }
}

export default new NotificationEscalationService();