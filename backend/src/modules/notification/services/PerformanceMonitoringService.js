import WorkerNotification from '../models/Notification.js';
import NotificationAudit from '../models/NotificationAudit.js';
import DeviceToken from '../models/DeviceToken.js';
import appConfig from '../../../config/app.config.js';

/**
 * Performance Monitoring Service
 * Implements Requirements 11.1, 11.2, 11.3, 11.4
 * - Notification delivery time tracking
 * - System load monitoring for 1000+ concurrent workers
 * - Uptime monitoring for business hours
 * - Performance optimization and alerting
 */
class PerformanceMonitoringService {
  constructor() {
    this.config = appConfig.notification;
    this.metrics = {
      deliveryTimes: new Map(), // notificationId -> { startTime, endTime, duration }
      systemLoad: {
        activeWorkers: 0,
        pendingNotifications: 0,
        deliveryQueue: 0,
        lastUpdated: new Date()
      },
      uptime: {
        startTime: new Date(),
        lastHealthCheck: new Date(),
        businessHoursUptime: 0,
        totalDowntime: 0
      },
      performance: {
        averageDeliveryTime: 0,
        deliverySuccessRate: 0,
        systemThroughput: 0,
        lastCalculated: new Date()
      }
    };
    
    // Start monitoring intervals
    this.startMonitoring();
  }

  /**
   * Start performance monitoring intervals
   */
  startMonitoring() {
    // Update system load every 30 seconds
    this.systemLoadInterval = setInterval(() => {
      this.updateSystemLoadMetrics().catch(error => {
        console.error('Error updating system load metrics:', error);
      });
    }, 30000);

    // Update performance metrics every 5 minutes
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics().catch(error => {
        console.error('Error updating performance metrics:', error);
      });
    }, 300000);

    // Health check every minute
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('Error performing health check:', error);
      });
    }, 60000);

    // Business hours uptime tracking every hour
    this.uptimeInterval = setInterval(() => {
      this.updateUptimeMetrics().catch(error => {
        console.error('Error updating uptime metrics:', error);
      });
    }, 3600000);

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.systemLoadInterval) clearInterval(this.systemLoadInterval);
    if (this.performanceInterval) clearInterval(this.performanceInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Track notification delivery start time
   * Implements Requirement 11.1 (delivery time tracking)
   * @param {number} notificationId - Notification ID
   */
  trackDeliveryStart(notificationId) {
    this.metrics.deliveryTimes.set(notificationId, {
      startTime: new Date(),
      endTime: null,
      duration: null
    });
  }

  /**
   * Track notification delivery completion and calculate duration
   * Implements Requirement 11.1 (delivery time tracking)
   * @param {number} notificationId - Notification ID
   * @param {boolean} success - Whether delivery was successful
   * @returns {number} Delivery duration in milliseconds
   */
  trackDeliveryEnd(notificationId, success = true) {
    const deliveryData = this.metrics.deliveryTimes.get(notificationId);
    if (!deliveryData) {
      console.warn(`No delivery start time found for notification ${notificationId}`);
      return null;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - deliveryData.startTime.getTime();

    // Update delivery data
    deliveryData.endTime = endTime;
    deliveryData.duration = duration;
    deliveryData.success = success;

    // Store in database for historical analysis
    this.storeDeliveryMetrics(notificationId, deliveryData).catch(error => {
      console.error('Error storing delivery metrics:', error);
    });

    // Clean up memory after storing
    setTimeout(() => {
      this.metrics.deliveryTimes.delete(notificationId);
    }, 60000); // Keep in memory for 1 minute

    return duration;
  }

  /**
   * Store delivery metrics in database
   * @param {number} notificationId - Notification ID
   * @param {Object} deliveryData - Delivery timing data
   */
  async storeDeliveryMetrics(notificationId, deliveryData) {
    try {
      await NotificationAudit.createAuditRecord({
        notificationId,
        workerId: 0, // System event
        event: 'PERFORMANCE_METRIC',
        metadata: {
          deliveryDuration: deliveryData.duration,
          deliverySuccess: deliveryData.success,
          startTime: deliveryData.startTime.toISOString(),
          endTime: deliveryData.endTime.toISOString(),
          metricType: 'DELIVERY_TIME'
        }
      });
    } catch (error) {
      console.error('Error storing delivery metrics:', error);
    }
  }

  /**
   * Update system load metrics
   * Implements Requirement 11.3 (system load monitoring for 1000+ concurrent workers)
   */
  async updateSystemLoadMetrics() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Count active workers (workers with recent activity)
      const activeWorkers = await DeviceToken.countDocuments({
        isActive: true,
        lastSeenAt: { $gte: fiveMinutesAgo }
      });

      // Count pending notifications
      const pendingNotifications = await WorkerNotification.countDocuments({
        status: { $in: ['PENDING', 'SENT'] },
        createdAt: { $gte: fiveMinutesAgo }
      });

      // Count notifications in delivery queue (failed deliveries awaiting retry)
      const deliveryQueue = await WorkerNotification.countDocuments({
        status: 'FAILED',
        deliveryAttempts: { $lt: 3 },
        lastAttemptAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000) } // Last 30 minutes
      });

      // Update metrics
      this.metrics.systemLoad = {
        activeWorkers,
        pendingNotifications,
        deliveryQueue,
        lastUpdated: now,
        loadPercentage: Math.min(100, (activeWorkers / 1000) * 100), // Based on 1000 worker capacity
        queueHealth: deliveryQueue < 100 ? 'HEALTHY' : deliveryQueue < 500 ? 'WARNING' : 'CRITICAL'
      };

      // Alert if system load is high
      if (activeWorkers > 800) {
        console.warn(`High system load: ${activeWorkers} active workers (80% of capacity)`);
        await this.createPerformanceAlert('HIGH_LOAD', {
          activeWorkers,
          capacity: 1000,
          loadPercentage: this.metrics.systemLoad.loadPercentage
        });
      }

      // Alert if delivery queue is backing up
      if (deliveryQueue > 200) {
        console.warn(`High delivery queue: ${deliveryQueue} notifications pending retry`);
        await this.createPerformanceAlert('HIGH_QUEUE', {
          queueSize: deliveryQueue,
          threshold: 200
        });
      }

    } catch (error) {
      console.error('Error updating system load metrics:', error);
    }
  }

  /**
   * Update performance metrics
   * Implements Requirement 11.2 (performance tracking)
   */
  async updatePerformanceMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Calculate average delivery time from recent audit records
      const deliveryMetrics = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'PERFORMANCE_METRIC',
            'metadata.metricType': 'DELIVERY_TIME',
            timestamp: { $gte: oneHourAgo }
          }
        },
        {
          $group: {
            _id: null,
            avgDeliveryTime: { $avg: '$metadata.deliveryDuration' },
            totalDeliveries: { $sum: 1 },
            successfulDeliveries: {
              $sum: { $cond: ['$metadata.deliverySuccess', 1, 0] }
            }
          }
        }
      ]);

      const metrics = deliveryMetrics[0] || {
        avgDeliveryTime: 0,
        totalDeliveries: 0,
        successfulDeliveries: 0
      };

      // Calculate system throughput (notifications per minute)
      const totalNotificationsLastHour = await WorkerNotification.countDocuments({
        createdAt: { $gte: oneHourAgo }
      });

      this.metrics.performance = {
        averageDeliveryTime: Math.round(metrics.avgDeliveryTime || 0),
        deliverySuccessRate: metrics.totalDeliveries > 0 
          ? Math.round((metrics.successfulDeliveries / metrics.totalDeliveries) * 100)
          : 100,
        systemThroughput: Math.round(totalNotificationsLastHour / 60), // per minute
        totalDeliveries: metrics.totalDeliveries,
        lastCalculated: now
      };

      // Performance alerts
      if (this.metrics.performance.averageDeliveryTime > 60000) { // > 1 minute
        await this.createPerformanceAlert('SLOW_DELIVERY', {
          averageTime: this.metrics.performance.averageDeliveryTime,
          threshold: 60000
        });
      }

      if (this.metrics.performance.deliverySuccessRate < 95) {
        await this.createPerformanceAlert('LOW_SUCCESS_RATE', {
          successRate: this.metrics.performance.deliverySuccessRate,
          threshold: 95
        });
      }

    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  /**
   * Perform health check
   * Implements Requirement 11.4 (uptime monitoring)
   */
  async performHealthCheck() {
    try {
      const now = new Date();
      
      // Test database connectivity
      const dbHealthy = await this.testDatabaseHealth();
      
      // Test notification service health
      const notificationHealthy = await this.testNotificationServiceHealth();
      
      // Update health status
      const isHealthy = dbHealthy && notificationHealthy;
      
      this.metrics.uptime.lastHealthCheck = now;
      
      if (!isHealthy) {
        console.error('Health check failed:', { dbHealthy, notificationHealthy });
        await this.createPerformanceAlert('HEALTH_CHECK_FAILED', {
          database: dbHealthy,
          notificationService: notificationHealthy,
          timestamp: now.toISOString()
        });
      }

      return {
        healthy: isHealthy,
        database: dbHealthy,
        notificationService: notificationHealthy,
        timestamp: now
      };

    } catch (error) {
      console.error('Error performing health check:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Test database health
   * @returns {Promise<boolean>} Database health status
   */
  async testDatabaseHealth() {
    try {
      // Simple query to test database connectivity
      await WorkerNotification.findOne().limit(1);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Test notification service health
   * @returns {Promise<boolean>} Notification service health status
   */
  async testNotificationServiceHealth() {
    try {
      // Test if we can create a test notification (without sending)
      const testNotification = new WorkerNotification({
        type: 'HEALTH_CHECK',
        priority: 'LOW',
        title: 'Health Check',
        message: 'System health check notification',
        senderId: 0,
        recipientId: 0,
        status: 'PENDING'
      });

      // Validate without saving
      await testNotification.validate();
      return true;
    } catch (error) {
      console.error('Notification service health check failed:', error);
      return false;
    }
  }

  /**
   * Update uptime metrics
   * Implements Requirement 11.4 (business hours uptime monitoring)
   */
  async updateUptimeMetrics() {
    try {
      const now = new Date();
      const isBusinessHours = this.isBusinessHours(now);
      
      if (isBusinessHours) {
        // Perform health check during business hours
        const healthStatus = await this.performHealthCheck();
        
        if (healthStatus.healthy) {
          this.metrics.uptime.businessHoursUptime += 1; // 1 hour of uptime
        } else {
          this.metrics.uptime.totalDowntime += 1; // 1 hour of downtime
        }
      }

      // Store uptime metrics
      await NotificationAudit.createAuditRecord({
        notificationId: 0,
        workerId: 0,
        event: 'PERFORMANCE_METRIC',
        metadata: {
          metricType: 'UPTIME',
          businessHours: isBusinessHours,
          healthy: this.metrics.uptime.lastHealthCheck ? true : false,
          uptimeHours: this.metrics.uptime.businessHoursUptime,
          downtimeHours: this.metrics.uptime.totalDowntime
        }
      });

    } catch (error) {
      console.error('Error updating uptime metrics:', error);
    }
  }

  /**
   * Check if current time is within business hours (7 AM to 7 PM Singapore time)
   * @param {Date} date - Date to check
   * @returns {boolean} Whether it's business hours
   */
  isBusinessHours(date = new Date()) {
    // Convert to Singapore time (UTC+8)
    const singaporeTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    const hour = singaporeTime.getUTCHours();
    const day = singaporeTime.getUTCDay();
    
    // Business hours: 7 AM to 7 PM, Monday to Saturday
    return day >= 1 && day <= 6 && hour >= 7 && hour < 19;
  }

  /**
   * Create performance alert
   * @param {string} alertType - Type of alert
   * @param {Object} data - Alert data
   */
  async createPerformanceAlert(alertType, data) {
    try {
      await NotificationAudit.createAuditRecord({
        notificationId: 0,
        workerId: 0,
        event: 'PERFORMANCE_ALERT',
        metadata: {
          alertType,
          alertData: data,
          severity: this.getAlertSeverity(alertType),
          timestamp: new Date().toISOString()
        }
      });

      // In production, this would also send alerts to administrators
      console.warn(`Performance Alert [${alertType}]:`, data);

    } catch (error) {
      console.error('Error creating performance alert:', error);
    }
  }

  /**
   * Get alert severity level
   * @param {string} alertType - Alert type
   * @returns {string} Severity level
   */
  getAlertSeverity(alertType) {
    const severityMap = {
      'HIGH_LOAD': 'WARNING',
      'HIGH_QUEUE': 'WARNING',
      'SLOW_DELIVERY': 'WARNING',
      'LOW_SUCCESS_RATE': 'CRITICAL',
      'HEALTH_CHECK_FAILED': 'CRITICAL'
    };
    
    return severityMap[alertType] || 'INFO';
  }

  /**
   * Get current performance metrics
   * @returns {Object} Current performance metrics
   */
  getMetrics() {
    return {
      systemLoad: { ...this.metrics.systemLoad },
      performance: { ...this.metrics.performance },
      uptime: {
        ...this.metrics.uptime,
        totalUptimeHours: Math.floor((new Date() - this.metrics.uptime.startTime) / (1000 * 60 * 60)),
        uptimePercentage: this.metrics.uptime.businessHoursUptime > 0 
          ? Math.round((this.metrics.uptime.businessHoursUptime / (this.metrics.uptime.businessHoursUptime + this.metrics.uptime.totalDowntime)) * 100)
          : 100
      },
      deliveryTracking: {
        activeTracking: this.metrics.deliveryTimes.size,
        trackingEnabled: true
      }
    };
  }

  /**
   * Get performance statistics for a time period
   * @param {number} hours - Number of hours to look back
   * @returns {Promise<Object>} Performance statistics
   */
  async getPerformanceStats(hours = 24) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

      // Get delivery time statistics
      const deliveryStats = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'PERFORMANCE_METRIC',
            'metadata.metricType': 'DELIVERY_TIME',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            avgDeliveryTime: { $avg: '$metadata.deliveryDuration' },
            minDeliveryTime: { $min: '$metadata.deliveryDuration' },
            maxDeliveryTime: { $max: '$metadata.deliveryDuration' },
            totalDeliveries: { $sum: 1 },
            successfulDeliveries: {
              $sum: { $cond: ['$metadata.deliverySuccess', 1, 0] }
            }
          }
        }
      ]);

      // Get alert statistics
      const alertStats = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'PERFORMANCE_ALERT',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: '$metadata.alertType',
            count: { $sum: 1 },
            severity: { $first: '$metadata.severity' }
          }
        }
      ]);

      // Get uptime statistics
      const uptimeStats = await NotificationAudit.aggregate([
        {
          $match: {
            event: 'PERFORMANCE_METRIC',
            'metadata.metricType': 'UPTIME',
            timestamp: { $gte: startTime }
          }
        },
        {
          $group: {
            _id: null,
            totalChecks: { $sum: 1 },
            healthyChecks: {
              $sum: { $cond: ['$metadata.healthy', 1, 0] }
            },
            businessHourChecks: {
              $sum: { $cond: ['$metadata.businessHours', 1, 0] }
            }
          }
        }
      ]);

      const delivery = deliveryStats[0] || {};
      const uptime = uptimeStats[0] || {};

      return {
        period: `${hours} hours`,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        delivery: {
          averageTime: Math.round(delivery.avgDeliveryTime || 0),
          minTime: delivery.minDeliveryTime || 0,
          maxTime: delivery.maxDeliveryTime || 0,
          totalDeliveries: delivery.totalDeliveries || 0,
          successRate: delivery.totalDeliveries > 0 
            ? Math.round((delivery.successfulDeliveries / delivery.totalDeliveries) * 100)
            : 100
        },
        alerts: alertStats.map(alert => ({
          type: alert._id,
          count: alert.count,
          severity: alert.severity
        })),
        uptime: {
          totalChecks: uptime.totalChecks || 0,
          healthyChecks: uptime.healthyChecks || 0,
          businessHourChecks: uptime.businessHourChecks || 0,
          uptimePercentage: uptime.totalChecks > 0 
            ? Math.round((uptime.healthyChecks / uptime.totalChecks) * 100)
            : 100
        },
        currentMetrics: this.getMetrics()
      };

    } catch (error) {
      console.error('Error getting performance stats:', error);
      throw error;
    }
  }

  /**
   * Optimize system performance based on current metrics
   * @returns {Promise<Object>} Optimization results
   */
  async optimizePerformance() {
    try {
      const optimizations = [];
      const metrics = this.getMetrics();

      // Optimize delivery queue if backed up
      if (metrics.systemLoad.deliveryQueue > 50) {
        const queueOptimization = await this.optimizeDeliveryQueue();
        optimizations.push(queueOptimization);
      }

      // Optimize database queries if performance is slow
      if (metrics.performance.averageDeliveryTime > 30000) { // > 30 seconds
        const dbOptimization = await this.optimizeDatabaseQueries();
        optimizations.push(dbOptimization);
      }

      // Clean up old metrics data
      const cleanupResult = await this.cleanupOldMetrics();
      optimizations.push(cleanupResult);

      return {
        success: true,
        optimizations,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error optimizing performance:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Optimize delivery queue by processing failed notifications
   * @returns {Promise<Object>} Queue optimization result
   */
  async optimizeDeliveryQueue() {
    try {
      // Find notifications that can be retried
      const retryableNotifications = await WorkerNotification.find({
        status: 'FAILED',
        deliveryAttempts: { $lt: 3 },
        lastAttemptAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes ago
      }).limit(100);

      let processed = 0;
      for (const notification of retryableNotifications) {
        // Reset status for retry
        notification.status = 'PENDING';
        await notification.save();
        processed++;
      }

      return {
        type: 'DELIVERY_QUEUE_OPTIMIZATION',
        processed,
        message: `Requeued ${processed} notifications for retry`
      };

    } catch (error) {
      console.error('Error optimizing delivery queue:', error);
      return {
        type: 'DELIVERY_QUEUE_OPTIMIZATION',
        processed: 0,
        error: error.message
      };
    }
  }

  /**
   * Optimize database queries by cleaning up old data
   * @returns {Promise<Object>} Database optimization result
   */
  async optimizeDatabaseQueries() {
    try {
      // Clean up old delivery tracking data from memory
      const now = new Date();
      let cleaned = 0;
      
      for (const [notificationId, data] of this.metrics.deliveryTimes.entries()) {
        if (now - data.startTime > 5 * 60 * 1000) { // 5 minutes old
          this.metrics.deliveryTimes.delete(notificationId);
          cleaned++;
        }
      }

      return {
        type: 'DATABASE_OPTIMIZATION',
        cleaned,
        message: `Cleaned up ${cleaned} old delivery tracking records from memory`
      };

    } catch (error) {
      console.error('Error optimizing database queries:', error);
      return {
        type: 'DATABASE_OPTIMIZATION',
        cleaned: 0,
        error: error.message
      };
    }
  }

  /**
   * Clean up old performance metrics
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldMetrics() {
    try {
      // Remove performance metrics older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await NotificationAudit.deleteMany({
        event: 'PERFORMANCE_METRIC',
        timestamp: { $lt: sevenDaysAgo }
      });

      return {
        type: 'METRICS_CLEANUP',
        deleted: result.deletedCount,
        message: `Cleaned up ${result.deletedCount} old performance metrics`
      };

    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
      return {
        type: 'METRICS_CLEANUP',
        deleted: 0,
        error: error.message
      };
    }
  }
}

export default new PerformanceMonitoringService();