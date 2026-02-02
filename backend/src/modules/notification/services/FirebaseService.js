import admin from 'firebase-admin';
import appConfig from '../../../config/app.config.js';
import DeviceToken from '../models/DeviceToken.js';
import NotificationAudit from '../models/NotificationAudit.js';
import ErrorHandlingService from './ErrorHandlingService.js';

/**
 * FCMService for Push Notification Delivery
 * Enhanced Firebase Cloud Messaging service with device token management,
 * validation, and retry logic for failed deliveries.
 * Implements requirements 5.2, 5.3, 12.1
 */
class FCMService {
  constructor() {
    this.initialized = false;
    this.app = null;
    this.config = appConfig.notification;
  }

  /**
   * Initialize Firebase Admin SDK with enhanced error handling
   */
  async initialize() {
    if (this.initialized) {
      return this.app;
    }

    try {
      const firebaseConfig = appConfig.firebase;
      
      // Check if required Firebase config is available
      if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
        console.warn('⚠️ Firebase configuration incomplete. Push notifications will be disabled.');
        return null;
      }

      // Initialize Firebase Admin SDK
      const serviceAccount = {
        type: 'service_account',
        project_id: firebaseConfig.projectId,
        private_key_id: firebaseConfig.privateKeyId,
        private_key: firebaseConfig.privateKey,
        client_email: firebaseConfig.clientEmail,
        client_id: firebaseConfig.clientId,
        auth_uri: firebaseConfig.authUri,
        token_uri: firebaseConfig.tokenUri,
        auth_provider_x509_cert_url: firebaseConfig.authProviderX509CertUrl,
        client_x509_cert_url: firebaseConfig.clientX509CertUrl
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: firebaseConfig.databaseURL
      }, 'fcm-notification-service');

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully');
      
      return this.app;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      
      // Log error using error handling service
      await ErrorHandlingService.logError(error, {
        serviceName: 'FCM',
        operation: 'initialize'
      }, 'CRITICAL');
      
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  /**
   * Register or update device token with validation
   * Implements device token management (Requirement 5.2)
   * @param {Object} tokenData - Device token registration data
   * @returns {Promise<Object>} Registration result
   */
  async registerDeviceToken(tokenData) {
    try {
      // Validate token data
      const validation = this.validateTokenRegistrationData(tokenData);
      if (!validation.isValid) {
        throw new Error(`Token registration validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate FCM token format
      if (!this.validateDeviceToken(tokenData.deviceToken)) {
        throw new Error('Invalid FCM token format');
      }

      // Deactivate old tokens for this worker
      await DeviceToken.deactivateOldTokensForWorker(tokenData.workerId, tokenData.deviceToken);

      // Register or update the token
      const deviceToken = await DeviceToken.registerOrUpdateToken({
        workerId: tokenData.workerId,
        deviceToken: tokenData.deviceToken,
        platform: tokenData.platform,
        appVersion: tokenData.appVersion,
        osVersion: tokenData.osVersion,
        deviceId: tokenData.deviceId || `${tokenData.platform}-${Date.now()}`,
        notificationSettings: tokenData.notificationSettings || {}
      });

      // Create audit record
      await NotificationAudit.createAuditRecord({
        notificationId: null,
        workerId: tokenData.workerId,
        event: 'DEVICE_REGISTERED',
        metadata: {
          deviceToken: tokenData.deviceToken.substring(0, 20) + '...',
          platform: tokenData.platform,
          appVersion: tokenData.appVersion,
          osVersion: tokenData.osVersion
        }
      });

      console.log(`✅ Device token registered for worker ${tokenData.workerId}`);

      return {
        success: true,
        deviceTokenId: deviceToken.id,
        isNewRegistration: deviceToken.createdAt === deviceToken.updatedAt,
        platform: deviceToken.platform,
        notificationSettings: deviceToken.notificationSettings
      };

    } catch (error) {
      console.error('❌ Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Validate token registration data
   * @param {Object} data - Token registration data
   * @returns {Object} Validation result
   */
  validateTokenRegistrationData(data) {
    const errors = [];

    if (!data.workerId || typeof data.workerId !== 'number') {
      errors.push('Worker ID is required and must be a number');
    }

    if (!data.deviceToken || typeof data.deviceToken !== 'string') {
      errors.push('Device token is required and must be a string');
    }

    if (!data.platform || !['ios', 'android'].includes(data.platform)) {
      errors.push('Platform is required and must be either "ios" or "android"');
    }

    if (!data.appVersion || typeof data.appVersion !== 'string') {
      errors.push('App version is required and must be a string');
    }

    if (!data.osVersion || typeof data.osVersion !== 'string') {
      errors.push('OS version is required and must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Send push notification to a single device with enhanced error handling
   * Implements delivery with retry logic and circuit breaker pattern
   * Requirements 5.3, 12.1, 12.2, 12.3
   * @param {string} deviceToken - FCM device token
   * @param {Object} notification - Notification object
   * @param {Object} data - Additional data payload
   * @param {number} attemptNumber - Current attempt number (for retry logic)
   * @returns {Promise<Object>} Delivery result
   */
  async sendToDevice(deviceToken, notification, data = {}, attemptNumber = 1) {
    const context = {
      serviceName: 'FCM',
      operation: 'sendToDevice',
      notificationId: notification.id,
      attemptNumber
    };

    try {
      // Use error handling service with circuit breaker and retry logic
      const result = await ErrorHandlingService.executeWithRetry(
        async (attempt) => {
          return await this._sendToDeviceInternal(deviceToken, notification, data, attempt);
        },
        'FCM',
        {
          maxAttempts: this.config.retryAttempts[notification.priority?.toLowerCase()] || 3
        }
      );

      return result;

    } catch (error) {
      // Log comprehensive error information
      await ErrorHandlingService.logError(error, context, 'ERROR');
      throw error;
    }
  }

  /**
   * Internal method for sending to device (used by retry logic)
   * @private
   */
  async _sendToDeviceInternal(deviceToken, notification, data = {}, attemptNumber = 1) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.app) {
      const error = new Error('Firebase not initialized. Push notifications unavailable.');
      error.code = 'SERVICE_UNAVAILABLE';
      throw error;
    }

    // Get device token record for validation and settings
    const deviceTokenRecord = await DeviceToken.findByToken(deviceToken);
    if (!deviceTokenRecord) {
      const error = new Error('Device token not found in database');
      error.code = 'DEVICE_TOKEN_NOT_FOUND';
      error.shouldDeactivateToken = true;
      throw error;
    }

    // Check if device can receive notifications
    if (!deviceTokenRecord.canReceiveNotification(notification.priority)) {
      const error = new Error('Device cannot receive notifications (quiet hours or disabled)');
      error.code = 'NOTIFICATION_BLOCKED';
      error.shouldRetry = false;
      throw error;
    }

    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        notificationId: String(notification.id),
        type: notification.type,
        priority: notification.priority,
        timestamp: new Date().toISOString(),
        ...data
      },
      android: {
        priority: this.getAndroidPriority(notification.priority),
        notification: {
          channelId: this.getNotificationChannel(notification.type),
          priority: this.getAndroidNotificationPriority(notification.priority),
          defaultSound: true,
          defaultVibrateTimings: true,
          color: this.getNotificationColor(notification.priority)
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.message
            },
            sound: 'default',
            badge: 1,
            'content-available': 1,
            category: this.getNotificationCategory(notification.type)
          }
        },
        headers: {
          'apns-priority': this.getApnsPriority(notification.priority),
          'apns-push-type': 'alert'
        }
      }
    };

    try {
      const response = await this.app.messaging().send(message);
      
      // Record successful delivery
      await deviceTokenRecord.recordDeliverySuccess();
      
      // Create audit record
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: deviceTokenRecord.workerId,
        event: 'DELIVERED',
        metadata: {
          messageId: response,
          platform: deviceTokenRecord.platform,
          attemptNumber,
          deliveryTime: new Date()
        }
      });

      console.log(`✅ Push notification sent successfully to ${deviceTokenRecord.platform} device:`, response);
      
      return {
        success: true,
        messageId: response,
        platform: deviceTokenRecord.platform,
        attemptNumber,
        timestamp: new Date()
      };

    } catch (error) {
      // Record delivery failure
      await deviceTokenRecord.recordDeliveryFailure();

      // Handle specific FCM errors and map to standard error codes
      const mappedError = this.mapFCMError(error);
      
      // Create audit record for failure
      await NotificationAudit.createAuditRecord({
        notificationId: notification.id,
        workerId: deviceTokenRecord.workerId,
        event: 'FAILED',
        metadata: {
          error: mappedError.code,
          message: mappedError.message,
          originalError: error.code,
          attemptNumber,
          shouldRetry: mappedError.temporary,
          shouldDeactivateToken: mappedError.shouldDeactivateToken
        }
      });

      throw mappedError;
    }
  }

  /**
   * Map FCM errors to standard error codes for error handling service
   * @param {Error} error - FCM error
   * @returns {Error} Mapped error with standard codes
   */
  mapFCMError(error) {
    const mappedError = new Error(error.message);
    mappedError.originalCode = error.code;
    mappedError.shouldDeactivateToken = false;
    mappedError.temporary = false;

    switch (error.code) {
      case 'messaging/registration-token-not-registered':
        mappedError.code = 'INVALID_TOKEN';
        mappedError.message = 'Device token is no longer valid';
        mappedError.shouldDeactivateToken = true;
        break;
      
      case 'messaging/invalid-registration-token':
        mappedError.code = 'MALFORMED_TOKEN';
        mappedError.message = 'Device token format is invalid';
        mappedError.shouldDeactivateToken = true;
        break;

      case 'messaging/internal-error':
        mappedError.code = 'INTERNAL_ERROR';
        mappedError.message = 'FCM internal error';
        mappedError.temporary = true;
        break;

      case 'messaging/server-unavailable':
        mappedError.code = 'SERVER_UNAVAILABLE';
        mappedError.message = 'FCM server unavailable';
        mappedError.temporary = true;
        break;

      case 'messaging/timeout':
        mappedError.code = 'TIMEOUT';
        mappedError.message = 'FCM request timeout';
        mappedError.temporary = true;
        break;

      case 'messaging/quota-exceeded':
        mappedError.code = 'QUOTA_EXCEEDED';
        mappedError.message = 'FCM quota exceeded';
        mappedError.temporary = true;
        break;

      case 'messaging/sender-id-mismatch':
        mappedError.code = 'SENDER_ID_MISMATCH';
        mappedError.message = 'Token belongs to different sender';
        mappedError.shouldDeactivateToken = true;
        break;

      default:
        mappedError.code = 'UNKNOWN_ERROR';
        mappedError.message = error.message || 'Unknown FCM error';
        mappedError.temporary = true; // Default to retryable for unknown errors
    }

    return mappedError;
  }

  /**
   * Send push notification to multiple devices with enhanced error handling
   * @param {string[]} deviceTokens - Array of FCM device tokens
   * @param {Object} notification - Notification object
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} Multicast delivery result
   */
  async sendToMultipleDevices(deviceTokens, notification, data = {}) {
    const context = {
      serviceName: 'FCM',
      operation: 'sendToMultipleDevices',
      notificationId: notification.id,
      deviceCount: deviceTokens.length
    };

    try {
      // Use error handling service with circuit breaker
      const result = await ErrorHandlingService.executeWithRetry(
        async (attempt) => {
          return await this._sendToMultipleDevicesInternal(deviceTokens, notification, data, attempt);
        },
        'FCM',
        {
          maxAttempts: 2 // Multicast has less retry attempts
        }
      );

      return result;

    } catch (error) {
      // Log comprehensive error information
      await ErrorHandlingService.logError(error, context, 'ERROR');
      throw error;
    }
  }

  /**
   * Internal method for sending to multiple devices (used by retry logic)
   * @private
   */
  async _sendToMultipleDevicesInternal(deviceTokens, notification, data = {}, attemptNumber = 1) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.app) {
      const error = new Error('Firebase not initialized. Push notifications unavailable.');
      error.code = 'SERVICE_UNAVAILABLE';
      throw error;
    }

    if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      const error = new Error('Device tokens array is required and cannot be empty');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Filter tokens based on device settings and validation
    const validTokens = [];
    const blockedTokens = [];
    const invalidTokens = [];

    for (const token of deviceTokens) {
      const deviceTokenRecord = await DeviceToken.findByToken(token);
      if (!deviceTokenRecord) {
        invalidTokens.push({ token, reason: 'NOT_FOUND' });
        continue;
      }

      if (!deviceTokenRecord.canReceiveNotification(notification.priority)) {
        blockedTokens.push({ 
          token, 
          workerId: deviceTokenRecord.workerId,
          reason: 'QUIET_HOURS_OR_DISABLED' 
        });
        continue;
      }

      validTokens.push(token);
    }

    if (validTokens.length === 0) {
      const error = new Error('No valid tokens available for delivery');
      error.code = 'NO_VALID_TOKENS';
      throw error;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        notificationId: String(notification.id),
        type: notification.type,
        priority: notification.priority,
        timestamp: new Date().toISOString(),
        ...data
      },
      tokens: validTokens,
      android: {
        priority: this.getAndroidPriority(notification.priority),
        notification: {
          channelId: this.getNotificationChannel(notification.type),
          priority: this.getAndroidNotificationPriority(notification.priority),
          defaultSound: true,
          defaultVibrateTimings: true,
          color: this.getNotificationColor(notification.priority)
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.message
            },
            sound: 'default',
            badge: 1,
            'content-available': 1,
            category: this.getNotificationCategory(notification.type)
          }
        },
        headers: {
          'apns-priority': this.getApnsPriority(notification.priority),
          'apns-push-type': 'alert'
        }
      }
    };

    const response = await this.app.messaging().sendEachForMulticast(message);
    
    console.log(`✅ Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`);
    
    // Process results and update device token records
    const failedTokens = [];
    const expiredTokens = [];
    
    if (response.failureCount > 0) {
      for (let i = 0; i < response.responses.length; i++) {
        const resp = response.responses[i];
        const token = validTokens[i];
        
        if (!resp.success) {
          const deviceTokenRecord = await DeviceToken.findByToken(token);
          
          if (resp.error.code === 'messaging/registration-token-not-registered' ||
              resp.error.code === 'messaging/invalid-registration-token') {
            expiredTokens.push(token);
            if (deviceTokenRecord) {
              deviceTokenRecord.isActive = false;
              await deviceTokenRecord.save();
            }
          } else {
            failedTokens.push({ token, error: resp.error });
            if (deviceTokenRecord) {
              await deviceTokenRecord.recordDeliveryFailure();
            }
          }
        } else {
          // Record successful delivery
          const deviceTokenRecord = await DeviceToken.findByToken(token);
          if (deviceTokenRecord) {
            await deviceTokenRecord.recordDeliverySuccess();
          }
        }
      }
    } else {
      // All successful - update all device records
      for (const token of validTokens) {
        const deviceTokenRecord = await DeviceToken.findByToken(token);
        if (deviceTokenRecord) {
          await deviceTokenRecord.recordDeliverySuccess();
        }
      }
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      blockedCount: blockedTokens.length,
      invalidCount: invalidTokens.length,
      totalTokens: deviceTokens.length,
      validTokens: validTokens.length,
      failedTokens,
      expiredTokens,
      blockedTokens,
      invalidTokens,
      timestamp: new Date()
    };
  }

  /**
   * Enhanced device token validation with format checking
   * @param {string} token - FCM device token
   * @returns {boolean} Whether token is valid
   */
  validateDeviceToken(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Enhanced validation for FCM token format
    // FCM tokens are typically 152+ characters long and contain specific patterns
    if (token.length < 140) {
      return false;
    }

    // Check for valid FCM token characters (base64url safe characters)
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      return false;
    }

    // Additional validation for known FCM token patterns
    // FCM tokens usually start with specific prefixes
    const validPrefixes = ['c', 'd', 'e', 'f'];
    const firstChar = token.charAt(0).toLowerCase();
    
    return validPrefixes.includes(firstChar) || token.includes(':');
  }

  /**
   * Get notification color based on priority for Android
   * @param {string} priority - Notification priority
   * @returns {string} Color code
   */
  getNotificationColor(priority) {
    switch (priority) {
      case 'CRITICAL':
        return '#FF0000'; // Red
      case 'HIGH':
        return '#FF8C00'; // Orange
      case 'NORMAL':
        return '#1890FF'; // Blue
      case 'LOW':
        return '#8C8C8C'; // Gray
      default:
        return '#1890FF';
    }
  }

  /**
   * Get notification category for iOS
   * @param {string} type - Notification type
   * @returns {string} Category identifier
   */
  getNotificationCategory(type) {
    switch (type) {
      case 'TASK_UPDATE':
        return 'TASK_CATEGORY';
      case 'SITE_CHANGE':
        return 'SITE_CATEGORY';
      case 'ATTENDANCE_ALERT':
        return 'ATTENDANCE_CATEGORY';
      case 'APPROVAL_STATUS':
        return 'APPROVAL_CATEGORY';
      default:
        return 'GENERAL_CATEGORY';
    }
  }

  /**
   * Get Android priority based on notification priority
   */
  getAndroidPriority(priority) {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return 'high';
      default:
        return 'normal';
    }
  }

  /**
   * Get Android notification priority
   */
  getAndroidNotificationPriority(priority) {
    switch (priority) {
      case 'CRITICAL':
        return 'max';
      case 'HIGH':
        return 'high';
      case 'NORMAL':
        return 'default';
      case 'LOW':
        return 'low';
      default:
        return 'default';
    }
  }

  /**
   * Get APNS priority
   */
  getApnsPriority(priority) {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return '10'; // High priority
      default:
        return '5'; // Normal priority
    }
  }

  /**
   * Get notification channel based on type
   */
  getNotificationChannel(type) {
    switch (type) {
      case 'TASK_UPDATE':
        return 'task_updates';
      case 'SITE_CHANGE':
        return 'site_changes';
      case 'ATTENDANCE_ALERT':
        return 'attendance_alerts';
      case 'APPROVAL_STATUS':
        return 'approval_status';
      default:
        return 'general';
    }
  }

  /**
   * Determine if error should trigger retry
   */
  shouldRetryError(error) {
    const retryableCodes = [
      'messaging/internal-error',
      'messaging/server-unavailable',
      'messaging/timeout'
    ];
    
    return retryableCodes.includes(error.code);
  }

  /**
   * Get comprehensive service health status
   * @returns {Promise<Object>} Health status with detailed metrics
   */
  async getHealthStatus() {
    try {
      const status = {
        service: 'FCMService',
        timestamp: new Date().toISOString(),
        initialized: this.initialized,
        healthy: false
      };

      if (!this.initialized) {
        return { ...status, status: 'not_initialized', message: 'Service not initialized' };
      }

      if (!this.app) {
        return { ...status, status: 'not_configured', message: 'Firebase not configured' };
      }

      // Get circuit breaker status from error handling service
      const circuitBreakerStatus = ErrorHandlingService.getCircuitBreakerStatus('FCM');
      
      if (circuitBreakerStatus.exists && circuitBreakerStatus.state === 'OPEN') {
        return { 
          ...status, 
          status: 'circuit_breaker_open', 
          message: 'Service temporarily unavailable due to failures',
          circuitBreaker: circuitBreakerStatus
        };
      }

      // Test Firebase connection
      const app = this.app;
      
      // Get device token statistics
      const deviceStats = await DeviceToken.getDeliveryStatistics();
      const activeTokenCount = await DeviceToken.countDocuments({ isActive: true });
      const totalTokenCount = await DeviceToken.countDocuments();

      return {
        ...status,
        status: 'healthy',
        healthy: true,
        projectId: app.options.projectId,
        deviceTokens: {
          active: activeTokenCount,
          total: totalTokenCount,
          statistics: deviceStats
        },
        circuitBreaker: circuitBreakerStatus,
        config: {
          retryAttempts: this.config.retryAttempts,
          deliveryTimeouts: this.config.deliveryTimeouts,
          dailyLimit: this.config.dailyLimit
        }
      };

    } catch (error) {
      // Log error using error handling service
      await ErrorHandlingService.logError(error, {
        serviceName: 'FCM',
        operation: 'getHealthStatus'
      }, 'ERROR');

      return {
        service: 'FCMService',
        status: 'error',
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get active device tokens for a worker
   * @param {number} workerId - Worker ID
   * @returns {Promise<Array>} Active device tokens
   */
  async getWorkerDeviceTokens(workerId) {
    try {
      const tokens = await DeviceToken.findActiveByWorker(workerId);
      return tokens.map(token => ({
        id: token.id,
        platform: token.platform,
        appVersion: token.appVersion,
        osVersion: token.osVersion,
        lastSeenAt: token.lastSeenAt,
        notificationSettings: token.notificationSettings,
        deliveryStats: token.deliveryStats
      }));
    } catch (error) {
      console.error('Error getting worker device tokens:', error);
      throw error;
    }
  }

  /**
   * Deactivate a specific device token
   * @param {string} deviceToken - Device token to deactivate
   * @returns {Promise<Object>} Deactivation result
   */
  async deactivateDeviceToken(deviceToken) {
    try {
      const tokenRecord = await DeviceToken.findByToken(deviceToken);
      if (!tokenRecord) {
        return {
          success: false,
          error: 'TOKEN_NOT_FOUND',
          message: 'Device token not found'
        };
      }

      tokenRecord.isActive = false;
      await tokenRecord.save();

      // Create audit record
      await NotificationAudit.createAuditRecord({
        notificationId: null,
        workerId: tokenRecord.workerId,
        event: 'DEVICE_DEACTIVATED',
        metadata: {
          deviceToken: deviceToken.substring(0, 20) + '...',
          platform: tokenRecord.platform,
          reason: 'MANUAL_DEACTIVATION'
        }
      });

      return {
        success: true,
        message: 'Device token deactivated successfully'
      };

    } catch (error) {
      console.error('Error deactivating device token:', error);
      throw error;
    }
  }

  /**
   * Clean up inactive and expired device tokens
   * @param {number} daysInactive - Days of inactivity before cleanup
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupInactiveTokens(daysInactive = 30) {
    try {
      const result = await DeviceToken.cleanupInactiveTokens(daysInactive);
      
      console.log(`✅ Cleaned up ${result.deletedCount} inactive device tokens`);
      
      return {
        success: true,
        deletedCount: result.deletedCount,
        daysInactive
      };

    } catch (error) {
      console.error('Error cleaning up inactive tokens:', error);
      throw error;
    }
  }
}

// Export singleton instance
const fcmService = new FCMService();

export default fcmService;